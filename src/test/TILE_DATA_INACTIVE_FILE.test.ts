import { CARTA } from 'carta-protobuf';
import { take } from 'rxjs/operators';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let changeChannelTimeout = config.timeout.changeChannel;
let messageReturnTimeout = config.timeout.messageEvent;

interface AssertItem {
    fileOpens: CARTA.IOpenFile[];
    initSetImageChannels: CARTA.ISetImageChannels[];
    hiddenSetImageChannels: CARTA.ISetImageChannels;
    hiddenHistogram: CARTA.IRegionHistogramData;
    reReadTiles: CARTA.IAddRequiredTiles[];
    reReadRasterTileData: CARTA.IRasterTileData[];
    pairedSetImageChannels: CARTA.ISetImageChannels[];
    pairedRasterTileData: CARTA.IRasterTileData[];
}

let assertItem: AssertItem = {
    fileOpens: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex.hdf5',
            fileId: 0,
            hdu: '0',
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            // The inactive file. Carries both a spectral and a Stokes axis so that
            // channel and stokes can be changed together.
            directory: testSubdirectory,
            file: 'HH211_IQU.hdf5',
            fileId: 1,
            hdu: '0',
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initSetImageChannels: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    // What the frontend sends for a frame that is not visible: TileService.updateHiddenFileChannels()
    // calls setChannels(fileId, channel, stokes, {}) — an empty required-tiles field.
    hiddenSetImageChannels: {
        fileId: 1,
        channel: 2,
        stokes: 1,
        requiredTiles: {},
    },
    hiddenHistogram: {
        fileId: 1,
        regionId: -1,
        channel: 2,
        stokes: 1,
        progress: 1,
    },
    reReadTiles: [
        {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    ],
    reReadRasterTileData: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
        },
        {
            fileId: 1,
            channel: 2,
            stokes: 1,
        },
    ],
    pairedSetImageChannels: [
        {
            fileId: 0,
            channel: 12,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 1,
            channel: 1,
            stokes: 2,
            requiredTiles: {
                fileId: 1,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    pairedRasterTileData: [
        {
            fileId: 0,
            channel: 12,
            stokes: 0,
        },
        {
            fileId: 1,
            channel: 1,
            stokes: 2,
        },
    ],
};

/**
 * Collect an exact number of RASTER_TILE_SYNC and RASTER_TILE_DATA messages.
 *
 * Stream(CARTA.RasterTileData, n) assumes a single sync group and resolves on the
 * end sync; two back-to-back SET_IMAGE_CHANNELS produce two groups, so count the
 * two streams separately instead. Must be called *before* the request is sent —
 * the RxJS subjects do not buffer.
 */
function RasterStream(syncCount: number, tileCount: number) {
    const msgController = MessageController.Instance;
    return new Promise<{ sync: CARTA.RasterTileSync[]; tile: CARTA.RasterTileData[] }>((resolve) => {
        let sync: CARTA.RasterTileSync[] = [];
        let tile: CARTA.RasterTileData[] = [];
        const settle = () => {
            if (sync.length === syncCount && tile.length === tileCount) {
                resolve({ sync, tile });
            }
        };
        msgController.rasterSyncStream.pipe(take(syncCount)).subscribe((data) => {
            sync.push(data);
            settle();
        });
        msgController.rasterTileStream.pipe(take(tileCount)).subscribe((data) => {
            tile.push(data);
            settle();
        });
    });
}

/**
 * Collect whatever raster traffic arrives in a fixed window, then resolve regardless.
 * Used for the negative assertion — Stream() would simply hang when nothing arrives.
 */
function RasterSilence(durationMs: number) {
    const msgController = MessageController.Instance;
    return new Promise<{ sync: CARTA.RasterTileSync[]; tile: CARTA.RasterTileData[] }>((resolve) => {
        let sync: CARTA.RasterTileSync[] = [];
        let tile: CARTA.RasterTileData[] = [];
        const syncSub = msgController.rasterSyncStream.subscribe((data) => sync.push(data));
        const tileSub = msgController.rasterTileStream.subscribe((data) => tile.push(data));
        setTimeout(() => {
            syncSub.unsubscribe();
            tileSub.unsubscribe();
            resolve({ sync, tile });
        }, durationMs);
    });
}

let basepath: string;
describe('TILE_DATA_INACTIVE_FILE: Testing SET_IMAGE_CHANNELS against a second, inactive file', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.fileOpens.map((fileOpen) => {
                fileOpen.directory = basepath + '/' + testSubdirectory;
            });
        });

        describe(`Preparation: open two images and prime their tiles`, () => {
            test(
                `Both OPEN_FILE_ACK should succeed and both images should render channel 0, stokes 0`,
                async () => {
                    msgController.closeFile(-1);
                    for (let i = 0; i < assertItem.fileOpens.length; i++) {
                        // Subscribe before sending: the histogram follows the ack closely and
                        // the RxJS subject does not buffer.
                        const histogram = Stream(CARTA.RegionHistogramData, 1);
                        const OpenFileResponse = await msgController.loadFile(assertItem.fileOpens[i]);
                        expect(OpenFileResponse.success).toEqual(true);
                        await histogram;

                        const raster = RasterStream(2, 1);
                        msgController.setChannels(assertItem.initSetImageChannels[i]);
                        const { tile } = await raster;
                        expect(tile[0].fileId).toEqual(assertItem.fileOpens[i].fileId);
                        expect(tile[0].channel).toEqual(0);
                        expect(tile[0].stokes).toEqual(0);
                    }
                },
                openFileTimeout * 2 + readFileTimeout * 2
            );
        });

        describe(`(Step 1) SET_IMAGE_CHANNELS on the inactive file with an empty required-tiles field`, () => {
            let hiddenHistogram: CARTA.RegionHistogramData;
            let silence: { sync: CARTA.RasterTileSync[]; tile: CARTA.RasterTileData[] };

            test(
                `REGION_HISTOGRAM_DATA should arrive within ${changeChannelTimeout} ms`,
                async () => {
                    const histogram = Stream(CARTA.RegionHistogramData, 1);
                    const quiet = RasterSilence(messageReturnTimeout * 2);
                    msgController.setChannels(assertItem.hiddenSetImageChannels);
                    hiddenHistogram = (await histogram)[0];
                    silence = await quiet;
                },
                changeChannelTimeout + messageReturnTimeout * 2
            );

            test(`REGION_HISTOGRAM_DATA.file_id = ${assertItem.hiddenHistogram.fileId}`, () => {
                expect(hiddenHistogram.fileId).toEqual(assertItem.hiddenHistogram.fileId);
            });

            test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.hiddenHistogram.regionId}`, () => {
                expect(hiddenHistogram.regionId).toEqual(assertItem.hiddenHistogram.regionId);
            });

            test(`REGION_HISTOGRAM_DATA.channel = ${assertItem.hiddenHistogram.channel}`, () => {
                expect(hiddenHistogram.channel).toEqual(assertItem.hiddenHistogram.channel);
            });

            test(`REGION_HISTOGRAM_DATA.stokes = ${assertItem.hiddenHistogram.stokes}`, () => {
                expect(hiddenHistogram.stokes).toEqual(assertItem.hiddenHistogram.stokes);
            });

            test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.hiddenHistogram.progress}`, () => {
                expect(hiddenHistogram.progress).toEqual(assertItem.hiddenHistogram.progress);
            });

            test(`RASTER_TILE_SYNC should not arrive`, () => {
                expect(silence.sync.length).toEqual(0);
            });

            test(`RASTER_TILE_DATA should not arrive`, () => {
                expect(silence.tile.length).toEqual(0);
            });
        });

        describe(`(Step 2) The other file keeps its own channel and stokes`, () => {
            let tile: CARTA.RasterTileData[];
            let sync: CARTA.RasterTileSync[];

            test(
                `ADD_REQUIRED_TILES on file 0 should return RASTER_TILE_DATA within ${readFileTimeout} ms`,
                async () => {
                    const raster = RasterStream(2, 1);
                    msgController.addRequiredTiles(assertItem.reReadTiles[0]);
                    ({ sync, tile } = await raster);
                },
                readFileTimeout
            );

            test(`RASTER_TILE_SYNC should bracket the group with tile_count = 1`, () => {
                expect(sync[0].endSync).toEqual(false);
                expect(sync[0].tileCount).toEqual(1);
                expect(sync[1].endSync).toEqual(true);
            });

            test(`RASTER_TILE_DATA.file_id = ${assertItem.reReadRasterTileData[0].fileId}`, () => {
                expect(tile[0].fileId).toEqual(assertItem.reReadRasterTileData[0].fileId);
            });

            test(`RASTER_TILE_DATA.channel = ${assertItem.reReadRasterTileData[0].channel} (unchanged by the update to file 1)`, () => {
                expect(tile[0].channel).toEqual(assertItem.reReadRasterTileData[0].channel);
            });

            test(`RASTER_TILE_DATA.stokes = ${assertItem.reReadRasterTileData[0].stokes} (unchanged by the update to file 1)`, () => {
                expect(tile[0].stokes).toEqual(assertItem.reReadRasterTileData[0].stokes);
            });
        });

        describe(`(Step 3) The inactive file serves tiles at its new channel and stokes`, () => {
            let tile: CARTA.RasterTileData[];

            test(
                `ADD_REQUIRED_TILES on file 1 should return RASTER_TILE_DATA within ${readFileTimeout} ms`,
                async () => {
                    // No further SET_IMAGE_CHANNELS is sent, so the channel and stokes below can
                    // only come from the empty-tiles update in step 1.
                    const raster = RasterStream(2, 1);
                    msgController.addRequiredTiles(assertItem.reReadTiles[1]);
                    ({ tile } = await raster);
                },
                readFileTimeout
            );

            test(`RASTER_TILE_DATA.file_id = ${assertItem.reReadRasterTileData[1].fileId}`, () => {
                expect(tile[0].fileId).toEqual(assertItem.reReadRasterTileData[1].fileId);
            });

            test(`RASTER_TILE_DATA.channel = ${assertItem.reReadRasterTileData[1].channel}`, () => {
                expect(tile[0].channel).toEqual(assertItem.reReadRasterTileData[1].channel);
            });

            test(`RASTER_TILE_DATA.stokes = ${assertItem.reReadRasterTileData[1].stokes}`, () => {
                expect(tile[0].stokes).toEqual(assertItem.reReadRasterTileData[1].stokes);
            });
        });

        describe(`(Step 4) Both files updated back to back without waiting`, () => {
            let tile: CARTA.RasterTileData[];
            let sync: CARTA.RasterTileSync[];

            test(
                `Two SET_IMAGE_CHANNELS should return two complete tile groups within ${changeChannelTimeout} ms`,
                async () => {
                    // AppStore's channel autorun collects one ChannelUpdate per visible frame and
                    // hands them to updateChannels() in a single pass, so both messages can leave
                    // in one tick with neither waiting for the other.
                    const raster = RasterStream(4, 2);
                    msgController.setChannels(assertItem.pairedSetImageChannels[0]);
                    msgController.setChannels(assertItem.pairedSetImageChannels[1]);
                    ({ sync, tile } = await raster);
                },
                changeChannelTimeout * 2
            );

            assertItem.pairedRasterTileData.map((expected: CARTA.IRasterTileData) => {
                // Asserted per file rather than by arrival order: the backend happens to serialise
                // the two handlers under _frame_mutex, but that is not part of the contract.
                describe(`File ${expected.fileId}`, () => {
                    test(`should receive exactly one start and one end RASTER_TILE_SYNC`, () => {
                        const group = sync.filter((message) => message.fileId === expected.fileId);
                        expect(group.length).toEqual(2);
                        expect(group.filter((message) => message.endSync).length).toEqual(1);
                    });

                    test(`RASTER_TILE_DATA.channel = ${expected.channel}`, () => {
                        const data = tile.find((message) => message.fileId === expected.fileId)!;
                        expect(data.channel).toEqual(expected.channel);
                    });

                    test(`RASTER_TILE_DATA.stokes = ${expected.stokes}`, () => {
                        const data = tile.find((message) => message.fileId === expected.fileId)!;
                        expect(data.stokes).toEqual(expected.stokes);
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
