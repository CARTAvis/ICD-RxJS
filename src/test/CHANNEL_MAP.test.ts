import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream, ChannelMapStream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

const testServerUrl: string = config.serverURL0;
const testSubdirectory: string = config.path.QA;
const connectTimeout: number = config.timeout.connection;
const openFileTimeout: number = config.timeout.openFile;
const readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    fileList: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    fileOpenAckGroup: CARTA.IOpenFileAck[];
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: CARTA.IRasterTileData[];
    // The channels rendered, one request at a time, for the first channel map view
    channelMapView: number[];
    // A subsequent single channel jump within the channel map view
    channelMapJump: number;
    tileData: {
        layer: number;
        x: number[];
        y: number[];
        width: number[];
        height: number;
    };
}

const requiredTiles = [
    33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720,
    33566722,
];
const tiles = [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434];

const assertItem: AssertItem = {
    fileList: { directory: testSubdirectory },
    fileOpenGroup: [
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
        {
            directory: testSubdirectory,
            file: 'M17_SWex.miriad',
            hdu: '',
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex.hdf5',
            hdu: '',
            fileId: 3,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    fileOpenAckGroup: [
        { success: true, fileId: 0 },
        { success: true, fileId: 1 },
        { success: true, fileId: 2 },
        { success: true, fileId: 3 },
    ],
    addRequiredTilesGroup: [
        { fileId: 0, tiles: requiredTiles, compressionType: CARTA.CompressionType.ZFP, compressionQuality: 11 },
        { fileId: 1, tiles: requiredTiles, compressionType: CARTA.CompressionType.ZFP, compressionQuality: 11 },
        { fileId: 2, tiles: requiredTiles, compressionType: CARTA.CompressionType.ZFP, compressionQuality: 11 },
        { fileId: 3, tiles: requiredTiles, compressionType: CARTA.CompressionType.ZFP, compressionQuality: 11 },
    ],
    rasterTileDataGroup: [
        { fileId: 0, channel: 0, stokes: 0 },
        { fileId: 1, channel: 0, stokes: 0 },
        { fileId: 2, channel: 0, stokes: 0 },
        { fileId: 3, channel: 0, stokes: 0 },
    ],
    channelMapView: [1, 2, 3],
    channelMapJump: 4,
    tileData: {
        layer: 2,
        x: [0, 1, 2],
        y: [0, 1, 2],
        width: [128, 256],
        height: 256,
    },
};

// Build a single-channel SET_IMAGE_CHANNELS request for the channel map view.
// Since the refactor, the backend processes one channel per request and acknowledges each
// with a CHANNEL_MAP_FLOW_CONTROL message; the frontend sends the next channel only after the
// previous one completes.
function channelMapRequest(fileId: number, channel: number): CARTA.ISetImageChannels {
    return {
        fileId,
        channel,
        stokes: 0,
        requiredTiles: {
            fileId,
            tiles,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        channelMapEnabled: true,
    };
}

describe('CHANNEL_MAP: Test loading multiple images and generating their channel maps', () => {
    const msgController = MessageController.Instance;
    const rasterTileDataLen = tiles.length; // one RasterTileData per tile
    const rasterTileMsgLen = rasterTileDataLen + 2; // + RasterTileSync start & end

    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get the base path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            let basepath = fileListResponse.directory;
            for (let i = 0; i < assertItem.fileOpenGroup.length; i++) {
                assertItem.fileOpenGroup[i].directory = basepath + '/' + assertItem.fileOpenGroup[i].directory;
            }
        });

        describe(`Go to "${assertItem.fileList.directory}" folder`, () => {
            assertItem.fileOpenGroup.map((input, index) => {
                const fileId = assertItem.fileOpenAckGroup[index].fileId as number;

                describe(`Open ${input.file}`, () => {
                    let OpenFileAck: any;
                    test(
                        `OPEN_FILE_ACK should arrive within ${openFileTimeout} ms`,
                        async () => {
                            OpenFileAck = await msgController.loadFile(input);
                            let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
                        },
                        openFileTimeout
                    );

                    test(`OPEN_FILE_ACK.file = ${assertItem.fileOpenGroup[index].file}`, () => {
                        expect(OpenFileAck.fileInfo.name).toEqual(input.file);
                    });
                    test(`OPEN_FILE_ACK.success = ${assertItem.fileOpenAckGroup[index].success}`, () => {
                        expect(OpenFileAck.success).toBe(assertItem.fileOpenAckGroup[index].success);
                    });
                    test(`OPEN_FILE_ACK.file_id = ${assertItem.fileOpenAckGroup[index].fileId}`, () => {
                        expect(OpenFileAck.fileId).toEqual(assertItem.fileOpenAckGroup[index].fileId);
                    });
                });

                describe(`Add required tiles for the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                    let RasterTileDataResponse: any;
                    test(
                        `Check RASTER_TILE_DATA (Stream) and check total length`,
                        async () => {
                            msgController.addRequiredTiles(assertItem.addRequiredTilesGroup[index]);
                            RasterTileDataResponse = await Stream(
                                CARTA.RasterTileData,
                                assertItem.addRequiredTilesGroup[index].tiles.length + 2
                            );
                            // RasterTileSync: Start + End + # Tiles returned
                            expect(RasterTileDataResponse.length).toEqual(
                                assertItem.addRequiredTilesGroup[index].tiles.length + 2
                            );
                        },
                        readFileTimeout
                    );

                    // Check file Ids
                    test(`RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                        expect(RasterTileDataResponse[1].fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                    });
                    // Check channels
                    test(`RASTER_TILE_DATA.channel = ${assertItem.rasterTileDataGroup[index].channel}`, () => {
                        expect(RasterTileDataResponse[1].channel).toEqual(
                            assertItem.rasterTileDataGroup[index].channel
                        );
                    });
                    // Check stokes
                    test(`RASTER_TILE_DATA.stokes = ${assertItem.rasterTileDataGroup[index].stokes}`, () => {
                        expect(RasterTileDataResponse[1].stokes).toEqual(assertItem.rasterTileDataGroup[index].stokes);
                    });
                });

                // Render the channel map view one channel at a time. Each request is answered by
                // that channel's raster tiles followed by a CHANNEL_MAP_FLOW_CONTROL ack; the next
                // request is only sent after the previous channel completes.
                const channelMapSequence = [...assertItem.channelMapView, assertItem.channelMapJump];

                channelMapSequence.forEach((channel, seq) => {
                    const label = seq < assertItem.channelMapView.length ? `view channel ${channel}` : `jump to channel ${channel}`;

                    describe(`Channel map (${label}) for the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                        let response: { rasterTileMsgs: any[]; flowControl: any };

                        test(
                            `RASTER_TILE_DATA and CHANNEL_MAP_FLOW_CONTROL should arrive within ${readFileTimeout} ms`,
                            async () => {
                                msgController.setChannels(channelMapRequest(fileId, channel));
                                response = await ChannelMapStream(rasterTileDataLen);
                                // one channel = # tiles + 2 RasterTileSync
                                expect(response.rasterTileMsgs.length).toEqual(rasterTileMsgLen);
                            },
                            readFileTimeout
                        );

                        // Check the flow control acknowledgment
                        test(`CHANNEL_MAP_FLOW_CONTROL.file_id = ${fileId}`, () => {
                            expect(response.flowControl.fileId).toEqual(fileId);
                        });
                        test(`CHANNEL_MAP_FLOW_CONTROL.completed_channel = ${channel}`, () => {
                            expect(response.flowControl.completedChannel).toEqual(channel);
                        });
                        test(`CHANNEL_MAP_FLOW_CONTROL.status = COMPLETED`, () => {
                            expect(response.flowControl.status).toEqual(CARTA.ChannelMapFlowControl.Status.COMPLETED);
                        });

                        // Check channel / stokes of the raster tiles (first RasterTileData follows the sync start)
                        test(`RASTER_TILE_DATA.file_id = ${fileId}`, () => {
                            expect(response.rasterTileMsgs[1].fileId).toEqual(fileId);
                        });
                        test(`RASTER_TILE_DATA.channel = ${channel}`, () => {
                            expect(response.rasterTileMsgs[1].channel).toEqual(channel);
                        });
                        test(`RASTER_TILE_DATA.stokes = 0`, () => {
                            expect(response.rasterTileMsgs[1].stokes).toEqual(0);
                        });

                        // Check tiles (RasterTileData occupy indices 1 .. rasterTileDataLen)
                        test(`each RASTER_TILE_DATA.tiles.length = 1`, () => {
                            for (let i = 1; i <= rasterTileDataLen; i++) {
                                expect(response.rasterTileMsgs[i].tiles.length).toEqual(1);
                            }
                        });
                        test(`each RASTER_TILE_DATA.tiles.layer = ${assertItem.tileData.layer}`, () => {
                            for (let i = 1; i <= rasterTileDataLen; i++) {
                                expect(response.rasterTileMsgs[i].tiles[0].layer).toEqual(assertItem.tileData.layer);
                            }
                        });
                        test(`each RASTER_TILE_DATA.tiles.x in ${assertItem.tileData.x}`, () => {
                            for (let i = 1; i <= rasterTileDataLen; i++) {
                                expect(assertItem.tileData.x).toContain(response.rasterTileMsgs[i].tiles[0].x);
                            }
                        });
                        test(`each RASTER_TILE_DATA.tiles.y in ${assertItem.tileData.y}`, () => {
                            for (let i = 1; i <= rasterTileDataLen; i++) {
                                expect(assertItem.tileData.y).toContain(response.rasterTileMsgs[i].tiles[0].y);
                            }
                        });
                        test(`each RASTER_TILE_DATA.tiles.width in ${assertItem.tileData.width}`, () => {
                            for (let i = 1; i <= rasterTileDataLen; i++) {
                                expect(assertItem.tileData.width).toContain(response.rasterTileMsgs[i].tiles[0].width);
                            }
                        });
                        test(`each RASTER_TILE_DATA.tiles.height = ${assertItem.tileData.height}`, () => {
                            for (let i = 1; i <= rasterTileDataLen; i++) {
                                expect(response.rasterTileMsgs[i].tiles[0].height).toEqual(assertItem.tileData.height);
                            }
                        });
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
