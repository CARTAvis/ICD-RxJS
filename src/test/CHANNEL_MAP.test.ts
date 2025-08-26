import {CARTA} from "carta-protobuf";
import {checkConnection, Stream, ChannelMapStream} from './myClient';
import {MessageController} from "./MessageController";
import config from "./config.json";

const testServerUrl: string = config.serverURL0;
const testSubdirectory: string = config.path.QA;
const connectTimeout: number = config.timeout.connection;
const openFileTimeout: number = config.timeout.openFile;
const readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    fileList: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    fileOpenAckGroup: CARTA.IOpenFileAck[];
    setImageChannelGroup: CARTA.ISetImageChannels[];
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: CARTA.IRasterTileData[];
}

const requiredTiles =
    [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722];
const tiles =
    [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434];
const currentTiles =
    [33554432, 33558528, 33562624, 33554433, 33558529, 33562625, 33554434, 33558530, 33562626];

const assertItem: AssertItem = {
    fileList: {directory: testSubdirectory},
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.miriad",
            hdu: "",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "",
            fileId: 3,
            renderMode: CARTA.RenderMode.RASTER
        },
    ],
    fileOpenAckGroup: [
        {
            success: true,
            fileId: 0
        },
        {
            success: true,
            fileId: 1
        },
        {
            success: true,
            fileId: 2
        },
        {
            success: true,
            fileId: 3
        },
    ],
    setImageChannelGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: tiles,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                currentTiles: currentTiles
            },
            channelRange: {min: 1, max: 3},
            currentRange: {min: 0, max: 3},
            channelMapEnabled: true
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: tiles,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                currentTiles: currentTiles
            },
            channelRange: {min: 1, max: 3},
            currentRange: {min: 0, max: 3},
            channelMapEnabled: true
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: tiles,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                currentTiles: currentTiles
            },
            channelRange: {min: 1, max: 3},
            currentRange: {min: 0, max: 3},
            channelMapEnabled: true
        },
        {
            fileId: 3,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: tiles,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                currentTiles: currentTiles
            },
            channelRange: {min: 1, max: 3},
            currentRange: {min: 0, max: 3},
            channelMapEnabled: true
        },
    ],
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: requiredTiles,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11
        },
        {
            fileId: 1,
            tiles: requiredTiles,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11
        },
        {
            fileId: 2,
            tiles: requiredTiles,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11
        },
        {
            fileId: 3,
            tiles: requiredTiles,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11
        },
    ],
    rasterTileDataGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0
        },
        {
            fileId: 3,
            channel: 0,
            stokes: 0
        },
    ],
}

describe("CHANNEL_MAP: Test loading multiple images and generating their channel maps", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get the base path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE", 0);
            let basepath = fileListResponse.directory;
            for (let i = 0; i < assertItem.fileOpenGroup.length; i++) {
                assertItem.fileOpenGroup[i].directory = basepath + "/" + assertItem.fileOpenGroup[i].directory;
            }
        });

        describe(`Go to "${assertItem.fileList.directory}" folder`, () => {
            assertItem.fileOpenGroup.map((input, index) => {
                describe(`Open ${input.file}`, () => {
                    let OpenFileAck: any;
                    test(`OPEN_FILE_ACK should arrive within ${openFileTimeout} ms`, async () => {
                        OpenFileAck = await msgController.loadFile(input);
                        let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
                    }, openFileTimeout);

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
                    test(`Check RASTER_TILE_DATA (Stream) and check total length`, async () => {
                        msgController.addRequiredTiles(assertItem.addRequiredTilesGroup[index]);
                        let RasterTileDataResponse = await Stream(CARTA.RasterTileData, assertItem.addRequiredTilesGroup[index].tiles.length + 2);
                        // RasterTileSync: Start + End + # Tiles returned
                        expect(RasterTileDataResponse.length).toEqual(assertItem.addRequiredTilesGroup[index].tiles.length + 2);
                    }, readFileTimeout);
                });

                describe(`Set image channel map for the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                    let RasterTileDataTemp: any;
                    const rasterTileDataLen = assertItem.setImageChannelGroup[index].requiredTiles.tiles.length;
                    const resterTileMsgLen = rasterTileDataLen + 2;

                    test(`Three RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                        msgController.setChannels(assertItem.setImageChannelGroup[index]);
                        const maxChan = assertItem.setImageChannelGroup[index].channelRange.max;
                        const minChan = assertItem.setImageChannelGroup[index].channelRange.min;
                        const channels = maxChan - minChan + 1;
                        RasterTileDataTemp = await ChannelMapStream(rasterTileDataLen, channels);
                    }, readFileTimeout);

                    // check file Ids
                    test(`1st RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                        expect(RasterTileDataTemp[1].fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                    });
                    test(`2nd RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                        expect(RasterTileDataTemp[resterTileMsgLen + 1].fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                    });
                    test(`3rd RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                        expect(RasterTileDataTemp[2 * resterTileMsgLen + 1].fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                    });

                    // Check channels
                    test(`1st RASTER_TILE_DATA.channel = ${assertItem.rasterTileDataGroup[index].channel + 1}`, () => {
                        expect(RasterTileDataTemp[1].channel).toEqual(assertItem.rasterTileDataGroup[index].channel + 1);
                    });
                    test(`2nd RASTER_TILE_DATA.channel = ${assertItem.rasterTileDataGroup[index].channel + 2}`, () => {
                        expect(RasterTileDataTemp[resterTileMsgLen + 1].channel).toEqual(assertItem.rasterTileDataGroup[index].channel + 2);
                    });
                    test(`3rd RASTER_TILE_DATA.channel = ${assertItem.rasterTileDataGroup[index].channel + 3}`, () => {
                        expect(RasterTileDataTemp[2 * resterTileMsgLen + 1].channel).toEqual(assertItem.rasterTileDataGroup[index].channel + 3);
                    });

                    // Check stokes
                    test(`1st RASTER_TILE_DATA.stokes = ${assertItem.rasterTileDataGroup[index].stokes}`, () => {
                        expect(RasterTileDataTemp[1].stokes).toEqual(assertItem.rasterTileDataGroup[index].stokes);
                    });
                    test(`2nd RASTER_TILE_DATA.stokes = ${assertItem.rasterTileDataGroup[index].stokes}`, () => {
                        expect(RasterTileDataTemp[resterTileMsgLen + 1].stokes).toEqual(assertItem.rasterTileDataGroup[index].stokes);
                    });
                    test(`3rd RASTER_TILE_DATA.stokes = ${assertItem.rasterTileDataGroup[index].stokes}`, () => {
                        expect(RasterTileDataTemp[2 * resterTileMsgLen + 1].stokes).toEqual(assertItem.rasterTileDataGroup[index].stokes);
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});