import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

interface IRasterTileDataExt extends CARTA.IRasterTileData {
    assert?: {
        lengthTiles: number,
        index: {
            x: number,
            y: number
        },
        value: number,
    };
    imageData?: {
        length: number,
        index: number[],
        value: number[],
    }
}
interface AssertItem {
    precisionDigit: number;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialReq: CARTA.ISetSpatialRequirements;
    setImageChannel: CARTA.ISetImageChannels;
    rasterTileData: IRasterTileDataExt;
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: IRasterTileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigit: 4,
    fileOpen: {
        directory: testSubdirectory,
        file: "cluster_04096.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    fileOpenAck: {
        success: true,
        fileFeatureFlags: 0,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.NONE,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    setImageChannel: {
        fileId: 0,
        channel: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
    },
    rasterTileData: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        compressionType: CARTA.CompressionType.NONE,
        tiles: [
            {
                x: 0,
                y: 0,
                layer: 0,
                height: 256,
                width: 256,
            },
        ],
        assert: {
            lengthTiles: 1,
            index: { x: 256, y: 256 },
            value: 2.72519,
        }
    },
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [16781313], // Hex1001001
            compressionType: CARTA.CompressionType.ZFP,
        },
        {
            fileId: 0,
            tiles: [33566723], // Hex2003003
            compressionType: CARTA.CompressionType.ZFP,
        },
        {
            fileId: 0,
            tiles: [50360327], // Hex3007007
            compressionType: CARTA.CompressionType.ZFP,
        },
        {
            fileId: 0,
            tiles: [67170319], // Hex400F00F
            compressionType: CARTA.CompressionType.ZFP,
        },
    ],
    rasterTileDataGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [
                {
                    x: 1,
                    y: 1,
                    layer: 1,
                    height: 256,
                    width: 256,
                },
            ],
            imageData: {
                length: 215608,
                index: [0, 50000, 100000, 150000, 200000],
                value: [9, 56, 75, 120, 216],
            }
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [
                {
                    x: 3,
                    y: 3,
                    layer: 2,
                    height: 256,
                    width: 256,
                },
            ],
            imageData: {
                length: 225896,
                index: [0, 50000, 100000, 150000, 200000],
                value: [5, 193, 250, 96, 18],
            }
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [
                {
                    x: 7,
                    y: 7,
                    layer: 3,
                    height: 256,
                    width: 256,
                },
            ],
            imageData: {
                length: 233272,
                index: [0, 50000, 100000, 150000, 200000],
                value: [5, 150, 140, 21, 199],
            }
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [
                {
                    x: 15,
                    y: 15,
                    layer: 4,
                    height: 256,
                    width: 256,
                },
            ],
            imageData: {
                length: 237208,
                index: [0, 50000, 100000, 150000, 200000],
                value: [5, 66, 31, 93, 39],
            }
        },
    ],
};

let basepath: string;
describe("CHECK_RASTER_TILE_DATA: Testing data values at different layers in RASTER_TILE_DATA", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + "/" + assertItem.fileOpen.directory;
        });

        test(`Preparation: Open image`,async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
            expect(OpenFileResponse.success).toEqual(true);
            let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
        });

        let RasterTileDataTemp: CARTA.RasterTileData;
        test(`RasterTileData * 1 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)?`, async () => {
            await msgController.addRequiredTiles(assertItem.initTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);

            await msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            await msgController.setSpatialRequirements(assertItem.initSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);
        }, readFileTimeout);

        describe(`SET_IMAGE_CHANNELS on the file "${assertItem.fileOpen.file}"`, () => {
            let RasterTileDataTemp: CARTA.RasterTileData;
            test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                await msgController.setChannels(assertItem.setImageChannel);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData, assertItem.setImageChannel.requiredTiles.tiles.length + 2);
                RasterTileDataTemp = RasterTileDataResponse[1];
            }, readFileTimeout);

            test(`RASTER_TILE_DATA.file_id = ${assertItem.rasterTileData.fileId}`, () => {
                expect(RasterTileDataTemp.fileId).toEqual(assertItem.rasterTileData.fileId);
            });

            test(`RASTER_TILE_DATA.channel = ${assertItem.rasterTileData.channel}`, () => {
                expect(RasterTileDataTemp.channel).toEqual(assertItem.rasterTileData.channel);
            });

            test(`RASTER_TILE_DATA.stokes = ${assertItem.rasterTileData.stokes}`, () => {
                expect(RasterTileDataTemp.stokes).toEqual(assertItem.rasterTileData.stokes);
            });

            test(`RASTER_TILE_DATA.compression_type = ${assertItem.rasterTileData.compressionType}`, () => {
                expect(RasterTileDataTemp.compressionType).toEqual(assertItem.rasterTileData.compressionType);
            });

            test(`RASTER_TILE_DATA.tiles.length = ${assertItem.rasterTileData.assert.lengthTiles}`, () => {
                expect(RasterTileDataTemp.tiles.length).toEqual(assertItem.rasterTileData.assert.lengthTiles);
            });

            test(`RASTER_TILE_DATA.tiles[0].x = ${assertItem.rasterTileData.tiles[0].x}`, () => {
                expect(RasterTileDataTemp.tiles[0].x).toEqual(assertItem.rasterTileData.tiles[0].x);
            });

            test(`RASTER_TILE_DATA.tiles[0].y = ${assertItem.rasterTileData.tiles[0].y}`, () => {
                expect(RasterTileDataTemp.tiles[0].y).toEqual(assertItem.rasterTileData.tiles[0].y);
            });

            test(`RASTER_TILE_DATA.tiles[0].layer = ${assertItem.rasterTileData.tiles[0].layer}`, () => {
                expect(RasterTileDataTemp.tiles[0].layer).toEqual(assertItem.rasterTileData.tiles[0].layer);
            });

            test(`RASTER_TILE_DATA.tiles[0].height = ${assertItem.rasterTileData.tiles[0].height}`, () => {
                expect(RasterTileDataTemp.tiles[0].height).toEqual(assertItem.rasterTileData.tiles[0].height);
            });

            test(`RASTER_TILE_DATA.tiles[0].width = ${assertItem.rasterTileData.tiles[0].width}`, () => {
                expect(RasterTileDataTemp.tiles[0].width).toEqual(assertItem.rasterTileData.tiles[0].width);
            });

            test(`RASTER_TILE_DATA.tiles[0].image_data${JSON.stringify(assertItem.rasterTileData.assert.index)} = ${assertItem.rasterTileData.assert.value}`, () => {
                const _x = assertItem.rasterTileData.assert.index.x;
                const _y = assertItem.rasterTileData.assert.index.y;
                const _dataView = new DataView(RasterTileDataTemp.tiles[0].imageData.slice((_x * _y - 1) * 4, _x * _y * 4).buffer);
                expect(_dataView.getFloat32(0, true)).toBeCloseTo(assertItem.rasterTileData.assert.value, assertItem.precisionDigit);
            });
        });

        assertItem.rasterTileDataGroup.map((rasterTileData, index) => {
            describe(`ADD_REQUIRED_TILES [${assertItem.addRequiredTilesGroup[index].tiles}]`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await msgController.addRequiredTiles(assertItem.addRequiredTilesGroup[index]);
                    let RasterTileDataResponse = await Stream(CARTA.RasterTileData, assertItem.addRequiredTilesGroup[index].tiles.length + 2);
                    RasterTileDataTemp = RasterTileDataResponse[1];
                }, readFileTimeout);

                test(`RASTER_TILE_DATA.file_id = ${rasterTileData.fileId}`, () => {
                    expect(RasterTileDataTemp.fileId).toEqual(rasterTileData.fileId);
                });

                test(`RASTER_TILE_DATA.channel = ${rasterTileData.channel}`, () => {
                    expect(RasterTileDataTemp.channel).toEqual(rasterTileData.channel);
                });

                test(`RASTER_TILE_DATA.stokes = ${rasterTileData.stokes}`, () => {
                    expect(RasterTileDataTemp.stokes).toEqual(rasterTileData.stokes);
                });

                test(`RASTER_TILE_DATA.compression_type = ${rasterTileData.compressionType}`, () => {
                    expect(RasterTileDataTemp.compressionType).toEqual(rasterTileData.compressionType);
                });

                test(`RASTER_TILE_DATA.tiles[0].x = ${rasterTileData.tiles[0].x}`, () => {
                    expect(RasterTileDataTemp.tiles[0].x).toEqual(rasterTileData.tiles[0].x);
                });

                test(`RASTER_TILE_DATA.tiles[0].y = ${rasterTileData.tiles[0].y}`, () => {
                    expect(RasterTileDataTemp.tiles[0].y).toEqual(rasterTileData.tiles[0].y);
                });

                test(`RASTER_TILE_DATA.tiles[0].layer = ${rasterTileData.tiles[0].layer}`, () => {
                    expect(RasterTileDataTemp.tiles[0].layer).toEqual(rasterTileData.tiles[0].layer);
                });

                test(`RASTER_TILE_DATA.tiles[0].height = ${rasterTileData.tiles[0].height}`, () => {
                    expect(RasterTileDataTemp.tiles[0].height).toEqual(rasterTileData.tiles[0].height);
                });

                test(`RASTER_TILE_DATA.tiles[0].width = ${rasterTileData.tiles[0].width}`, () => {
                    expect(RasterTileDataTemp.tiles[0].width).toEqual(rasterTileData.tiles[0].width);
                });

                test(`RASTER_TILE_DATA.tiles[0].imageData.length = ${rasterTileData.imageData.length}`, () => {
                    expect(RasterTileDataTemp.tiles[0].imageData.length).toEqual(rasterTileData.imageData.length);
                });

                test(`RASTER_TILE_DATA.tiles[0].image_data${JSON.stringify(rasterTileData.imageData.index)} = [${rasterTileData.imageData.value}]`, () => {
                    for (let i = 0; i < rasterTileData.imageData.index.length; i++) {
                        expect(RasterTileDataTemp.tiles[0].imageData[rasterTileData.imageData.index[i]]).toEqual(rasterTileData.imageData.value[i])
                    }
                });

            });
        });


        afterAll(() => msgController.closeConnection());
    });
})