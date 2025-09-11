import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    rasterTileDataGroup: CARTA.IRasterTileData[];
}
let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex_pv.fits',
            hdu: '',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex_pv.image',
            hdu: '',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: [
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
    rasterTileDataGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 241,
                    height: 13,
                },
            ],
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 241,
                    height: 13,
                },
            ],
        },
    ],
};

let basepath: string;
describe('OPEN_IMAGE_PV: Testing the case of opening multiple images one by one without closing former ones', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            for (let i = 0; i < assertItem.fileOpen.length; i++) {
                assertItem.fileOpen[i].directory = basepath + '/' + assertItem.fileOpen[i].directory;
            }
        });

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            assertItem.fileOpen.map((input, index) => {
                describe(`Open ${input.file}`, () => {
                    let OpenFileAck: any;
                    let RegionHistogramData: any;
                    test(
                        `OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,
                        async () => {
                            let regionHistogramData = [];
                            let regionHistogramDataPromise = new Promise((resolve) => {
                                msgController.histogramStream.subscribe({
                                    next: (data) => {
                                        regionHistogramData.push(data);
                                        resolve(regionHistogramData);
                                    },
                                });
                            });
                            OpenFileAck = await msgController.loadFile(input);
                            RegionHistogramData = await regionHistogramDataPromise;

                            expect(OpenFileAck.success).toBe(true);
                            expect(OpenFileAck.fileInfo.name).toEqual(input.file);
                            expect(RegionHistogramData[0].histograms.numBins).toEqual(109);
                        },
                        openFileTimeout
                    );

                    describe(`set image channel for the file "${assertItem.fileOpen[index].file}"`, () => {
                        let RasterTileDataTemp: any;
                        test(
                            `RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`,
                            async () => {
                                msgController.setChannels(assertItem.setImageChannel[index]);
                                RasterTileDataTemp = await Stream(
                                    CARTA.RasterTileData,
                                    assertItem.setImageChannel[index].requiredTiles.tiles.length + 2
                                );
                            },
                            readFileTimeout
                        );

                        test(`RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                            expect(RasterTileDataTemp[1].fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                        });

                        test(`RASTER_TILE_DATA.channel = ${assertItem.rasterTileDataGroup[index].channel}`, () => {
                            expect(RasterTileDataTemp[1].channel).toEqual(
                                assertItem.rasterTileDataGroup[index].channel
                            );
                        });

                        test(`RASTER_TILE_DATA.stokes = ${assertItem.rasterTileDataGroup[index].stokes}`, () => {
                            expect(RasterTileDataTemp[1].stokes).toEqual(assertItem.rasterTileDataGroup[index].stokes);
                        });

                        test(`RASTER_TILE_DATA.compression_quality = ${assertItem.rasterTileDataGroup[index].compressionQuality}`, () => {
                            expect(RasterTileDataTemp[1].compressionQuality).toEqual(
                                assertItem.rasterTileDataGroup[index].compressionQuality
                            );
                        });

                        test(`RASTER_TILE_DATA.compression_type = ${assertItem.rasterTileDataGroup[index].compressionType}`, () => {
                            expect(RasterTileDataTemp[1].compressionType).toEqual(
                                assertItem.rasterTileDataGroup[index].compressionType
                            );
                        });

                        test(`RASTER_TILE_DATA.tiles.length = ${assertItem.rasterTileDataGroup[index].compressionQuality}`, () => {
                            expect(RasterTileDataTemp[1].compressionQuality).toEqual(
                                assertItem.rasterTileDataGroup[index].compressionQuality
                            );
                        });

                        test(`RASTER_TILE_DATA.tiles[0].width = ${assertItem.rasterTileDataGroup[index].tiles[0].width}`, () => {
                            expect(RasterTileDataTemp[1].tiles[0].width).toEqual(
                                assertItem.rasterTileDataGroup[index].tiles[0].width
                            );
                        });

                        test(`RASTER_TILE_DATA.tiles[0].height = ${assertItem.rasterTileDataGroup[index].tiles[0].height}`, () => {
                            expect(RasterTileDataTemp[1].tiles[0].height).toEqual(
                                assertItem.rasterTileDataGroup[index].tiles[0].height
                            );
                        });

                        test(`RASTER_TILE_DATA.tiles[0].image_data.length > 0`, () => {
                            expect(RasterTileDataTemp[1].tiles[0].imageData.length).toBeGreaterThan(0);
                        });

                        test(`RASTER_TILE_DATA.tiles[0].nan_encodings.length > 0`, () => {
                            expect(RasterTileDataTemp[1].tiles[0].nanEncodings.length).toBeGreaterThan(0);
                        });
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
