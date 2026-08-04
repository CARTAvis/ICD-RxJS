import { CARTA } from 'carta-protobuf';
import * as Long from 'long';
import { Subscription } from 'rxjs';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let connectTimeout = config.timeout.connection;
let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playAnimatorTimeout: number = config.timeout.playAnimator;
let changeChannelTimeout: number = config.timeout.changeChannel;
let messageReturnTimeout: number = config.timeout.messageEvent;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles[];
    setContour: CARTA.ISetContourParameters[];
    startAnimation: CARTA.IStartAnimation;
    matchedTilesReq: CARTA.IAddRequiredTiles;
    hiddenTilesReq: CARTA.IAddRequiredTiles;
    stopAnimation: CARTA.IStopAnimation;
    setImageChannel: CARTA.ISetImageChannels[];
    milestone: {
        requestMatchedTiles: number;
        hideMatchedImage: number;
        restoreMatchedImage: number;
        stop: number;
    };
}

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex.fits',
            hdu: '',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex.image',
            hdu: '',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setContour: [
        {
            fileId: 0,
            referenceFileId: 1,
            imageBounds: {
                xMin: 0,
                xMax: 640,
                yMin: 0,
                yMax: 800,
            },
            levels: [-0.01, 0.01],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 1,
            referenceFileId: 1,
            imageBounds: {
                xMin: 0,
                xMax: 640,
                yMin: 0,
                yMax: 800,
            },
            levels: [-0.01, 0.01],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
    startAnimation: {
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: 24, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
        looping: false,
        reverse: false,
        frameRate: 5,
        matchedFrames: {
            [1]: {
                frameNumbers: [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
                ],
            },
        },
    },
    // Sent while the animation is running. This is the only way the matched image can acquire
    // animation view settings: outside an animation ADD_REQUIRED_TILES returns tile data instead.
    matchedTilesReq: {
        fileId: 1,
        tiles: [0],
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 9,
    },
    // What the frontend sends when a matched image scrolls out of view during animation:
    // AppStore's view autorun pushes a view update with an empty tile list for it.
    hiddenTilesReq: {
        fileId: 1,
        tiles: [],
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 9,
    },
    stopAnimation: {
        fileId: 0,
        endFrame: { channel: 21, stokes: 0 },
    },
    setImageChannel: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    // The active file's channel at which each client message is sent.
    milestone: {
        requestMatchedTiles: 3,
        hideMatchedImage: 9,
        restoreMatchedImage: 15,
        stop: 21,
    },
};

/**
 * The backend runs at most one animation frame ahead of the last flow-control ack, and a client
 * message queued mid-frame lands a frame or two later. Each phase is therefore asserted over the
 * last three channels before the next milestone, which leaves the three channels right after a
 * milestone as an unasserted settling band.
 */
const WINDOW_CHANNELS = 3;

function assertedChannels(milestone: number): number[] {
    let channels: number[] = [];
    for (let channel = milestone - WINDOW_CHANNELS + 1; channel <= milestone; channel++) {
        channels.push(channel);
    }
    return channels;
}

interface AnimationRecord {
    sync: CARTA.RasterTileSync[];
    tile: CARTA.RasterTileData[];
    contour: CARTA.ContourImageData[];
    histogram: CARTA.RegionHistogramData[];
}

/**
 * Subscribe to every animation stream for the whole playback rather than per frame.
 *
 * The RxJS subjects do not buffer, so a per-frame subscribe/await loop can drop messages of the
 * frame the backend is already working on. Subscribing once up front also removes any assumption
 * about the order in which the active and the matched image are served within a frame.
 *
 * Flow control is acknowledged from the active file's tile, which is what paces the animation.
 */
function collectAnimation(activeFileId: number) {
    const msgController = MessageController.Instance;
    const record: AnimationRecord = { sync: [], tile: [], contour: [], histogram: [] };
    let lastActiveChannel = -1;
    let waiters: { channel: number; resolve: () => void }[] = [];

    const settle = () => {
        waiters = waiters.filter((waiter) => {
            if (lastActiveChannel >= waiter.channel) {
                waiter.resolve();
                return false;
            }
            return true;
        });
    };

    const subscriptions: Subscription[] = [
        msgController.rasterSyncStream.subscribe((data) => record.sync.push(data)),
        msgController.rasterTileStream.subscribe((data) => {
            record.tile.push(data);
            if (data.fileId === activeFileId) {
                lastActiveChannel = data.channel;
                msgController.sendAnimationFlowControl({
                    fileId: activeFileId,
                    animationId: 0,
                    receivedFrame: { channel: data.channel, stokes: data.stokes },
                    timestamp: Long.fromNumber(Date.now()),
                });
                settle();
            }
        }),
        msgController.contourStream.subscribe((data) => record.contour.push(data)),
        msgController.histogramStream.subscribe((data) => record.histogram.push(data)),
    ];

    return {
        record,
        // Resolves once the active file has delivered the tile of the given channel.
        reached: (channel: number) =>
            new Promise<void>((resolve) => {
                if (lastActiveChannel >= channel) {
                    resolve();
                } else {
                    waiters.push({ channel, resolve });
                }
            }),
        stop: () => subscriptions.forEach((subscription) => subscription.unsubscribe()),
    };
}

let basepath: string;
describe('ANIMATOR_CONTOUR_MATCH: Testing animation playback of a spectrally matched image', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
        });

        describe(`Open two images:`, () => {
            test(
                `Check open successful`,
                async () => {
                    assertItem.fileOpen[0].directory = basepath + '/' + assertItem.filelist.directory;
                    assertItem.fileOpen[1].directory = basepath + '/' + assertItem.filelist.directory;

                    let OpenFileResponse1 = await msgController.loadFile(assertItem.fileOpen[0]);
                    expect(OpenFileResponse1.success).toEqual(true);

                    let RegionHistrogramDataResponse1 = await Stream(CARTA.RegionHistogramData, 1);

                    let OpenFileResponse2 = await msgController.loadFile(assertItem.fileOpen[1]);
                    expect(OpenFileResponse2.success).toEqual(true);

                    let RegionHistrogramDataResponse2 = await Stream(CARTA.RegionHistogramData, 1);
                },
                openFileTimeout
            );
        });

        describe(`Preparation`, () => {
            test(
                `Render both images and set matched contours`,
                async () => {
                    for (let i = 0; i < assertItem.initTilesReq.length; i++) {
                        let rasterResponse = Stream(CARTA.RasterTileData, assertItem.initTilesReq[i].tiles!.length + 2);
                        msgController.addRequiredTiles(assertItem.initTilesReq[i]);
                        await rasterResponse;
                    }

                    for (let i = 0; i < assertItem.setContour.length; i++) {
                        let contourResponse = Stream(CARTA.ContourImageData, assertItem.setContour[i].levels!.length);
                        msgController.setContourParameters(assertItem.setContour[i]);
                        await contourResponse;
                    }
                },
                readFileTimeout * 2
            );
        });

        describe(`Play the animation of the reference image`, () => {
            let record: AnimationRecord;

            test(
                `Play up to channel ${assertItem.milestone.stop}, hiding and restoring the matched image`,
                async () => {
                    const collector = collectAnimation(assertItem.startAnimation.fileId!);
                    record = collector.record;

                    let StartAnimationResponse = await msgController.startAnimation(assertItem.startAnimation);
                    expect(StartAnimationResponse.success).toEqual(true);

                    // The matched image has no animation view settings yet, so it is not tiled.
                    await collector.reached(assertItem.milestone.requestMatchedTiles);
                    msgController.addRequiredTiles(assertItem.matchedTilesReq);

                    // The matched image goes out of view: an empty tile list stops its tiles.
                    await collector.reached(assertItem.milestone.hideMatchedImage);
                    msgController.addRequiredTiles(assertItem.hiddenTilesReq);

                    // The matched image comes back into view.
                    await collector.reached(assertItem.milestone.restoreMatchedImage);
                    msgController.addRequiredTiles(assertItem.matchedTilesReq);

                    await collector.reached(assertItem.milestone.stop);
                    // The matched image is served after the reference image within a frame, so let
                    // the rest of the last asserted frame arrive before unsubscribing.
                    await new Promise((resolve) => setTimeout(resolve, messageReturnTimeout));
                    msgController.stopAnimation(assertItem.stopAnimation);
                    collector.stop();
                },
                playAnimatorTimeout
            );

            test(`START_ANIMATION_ACK.success = True and the reference channels are in sequence`, () => {
                let channels = record.tile
                    .filter((data) => data.fileId === assertItem.startAnimation.fileId)
                    .map((data) => data.channel);
                channels.map((channel, index) => {
                    expect(channel).toEqual(assertItem.startAnimation.startFrame!.channel! + index);
                });
                expect(channels.length).toBeGreaterThanOrEqual(assertItem.milestone.stop);
            });

            describe(`Before ADD_REQUIRED_TILES of the matched image`, () => {
                assertedChannels(assertItem.milestone.requestMatchedTiles).map((channel) => {
                    test(`Channel ${channel}: only the reference image is tiled`, () => {
                        expect(
                            record.tile.filter((data) => data.fileId === 0 && data.channel === channel).length
                        ).toEqual(1);
                        expect(
                            record.tile.filter((data) => data.fileId === 1 && data.channel === channel).length
                        ).toEqual(0);
                        expect(
                            record.sync.filter((data) => data.fileId === 1 && data.channel === channel).length
                        ).toEqual(0);
                    });
                });
            });

            describe(`After ADD_REQUIRED_TILES of the matched image`, () => {
                assertedChannels(assertItem.milestone.hideMatchedImage).map((channel) => {
                    test(`Channel ${channel}: both images are tiled`, () => {
                        assertItem.fileOpen.map((file) => {
                            let tiles = record.tile.filter(
                                (data) => data.fileId === file.fileId && data.channel === channel
                            );
                            expect(tiles.length).toEqual(1);
                            expect(tiles[0].stokes).toEqual(0);

                            let syncs = record.sync.filter(
                                (data) => data.fileId === file.fileId && data.channel === channel
                            );
                            expect(syncs.length).toEqual(2);
                            expect(syncs.filter((data) => data.endSync).length).toEqual(1);
                            expect(syncs.filter((data) => data.tileCount === 1).length).toEqual(2);
                        });
                    });
                });
            });

            describe(`After ADD_REQUIRED_TILES of the matched image with an empty tile list`, () => {
                assertedChannels(assertItem.milestone.restoreMatchedImage).map((channel) => {
                    test(`Channel ${channel}: only the reference image is tiled`, () => {
                        expect(
                            record.tile.filter((data) => data.fileId === 0 && data.channel === channel).length
                        ).toEqual(1);
                        expect(
                            record.tile.filter((data) => data.fileId === 1 && data.channel === channel).length
                        ).toEqual(0);
                        expect(
                            record.sync.filter((data) => data.fileId === 1 && data.channel === channel).length
                        ).toEqual(0);
                    });
                });
            });

            describe(`After the matched image is restored`, () => {
                assertedChannels(assertItem.milestone.stop).map((channel) => {
                    test(`Channel ${channel}: both images are tiled`, () => {
                        assertItem.fileOpen.map((file) => {
                            expect(
                                record.tile.filter((data) => data.fileId === file.fileId && data.channel === channel)
                                    .length
                            ).toEqual(1);
                            expect(
                                record.sync.filter((data) => data.fileId === file.fileId && data.channel === channel)
                                    .length
                            ).toEqual(2);
                        });
                    });
                });
            });

            describe(`Contours and histograms of the matched image`, () => {
                // The matched image keeps stepping through its own channels even while it is not
                // tiled, so its contours and histograms arrive in every phase.
                let allChannels = [
                    ...assertedChannels(assertItem.milestone.requestMatchedTiles),
                    ...assertedChannels(assertItem.milestone.hideMatchedImage),
                    ...assertedChannels(assertItem.milestone.restoreMatchedImage),
                    ...assertedChannels(assertItem.milestone.stop),
                ];

                allChannels.map((channel) => {
                    test(`Channel ${channel}: both images return contours and a histogram`, () => {
                        assertItem.setContour.map((contour) => {
                            let contours = record.contour.filter(
                                (data) =>
                                    data.fileId === contour.fileId && data.channel === channel && data.progress === 1
                            );
                            expect(contours.length).toEqual(contour.levels!.length);
                            contours.map((data) => {
                                expect(data.referenceFileId).toEqual(contour.referenceFileId);
                            });

                            expect(
                                record.histogram.filter(
                                    (data) => data.fileId === contour.fileId && data.channel === channel
                                ).length
                            ).toEqual(1);
                        });
                    });
                });
            });
        });

        describe(`Set the channel of each image after STOP_ANIMATION`, () => {
            assertItem.setImageChannel.map((setImageChannel) => {
                let rasterTileData: CARTA.RasterTileData[];

                test(
                    `File ${setImageChannel.fileId}: SET_IMAGE_CHANNELS returns RASTER_TILE_DATA`,
                    async () => {
                        let rasterResponse = Stream(
                            CARTA.RasterTileData,
                            setImageChannel.requiredTiles!.tiles!.length + 2
                        );
                        msgController.setChannels(setImageChannel);
                        rasterTileData = (await rasterResponse).filter(
                            (data: any) => data instanceof CARTA.RasterTileData
                        );
                    },
                    changeChannelTimeout
                );

                test(`File ${setImageChannel.fileId}: RASTER_TILE_DATA.channel = ${setImageChannel.channel}`, () => {
                    expect(rasterTileData.length).toEqual(1);
                    expect(rasterTileData[0].fileId).toEqual(setImageChannel.fileId);
                    expect(rasterTileData[0].channel).toEqual(setImageChannel.channel);
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
