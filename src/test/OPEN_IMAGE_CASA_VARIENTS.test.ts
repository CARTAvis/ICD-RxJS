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
    regionHistogramDataGroup: CARTA.IRegionHistogramData[];
    setImageChannel: CARTA.ISetImageChannels[];
    rasterTileDataGroup: CARTA.IRasterTileData[];
}
let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: 'componentlist.image',
            hdu: '',
            fileId: 200,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'concatenated.image',
            hdu: '',
            fileId: 201,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'pVimage.image',
            hdu: '',
            fileId: 202,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'UVamp.image',
            hdu: '',
            fileId: 203,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'UVphase.image',
            hdu: '',
            fileId: 204,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    regionHistogramDataGroup: [
        {
            fileId: 200,
            histograms: { numBins: 512 },
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 201,
            histograms: { numBins: 378 },
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 202,
            histograms: { numBins: 91 },
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 203,
            histograms: { numBins: 300 },
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 204,
            histograms: { numBins: 300 },
            regionId: -1,
            progress: 1,
        },
    ],
    setImageChannel: [
        {
            fileId: 200,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 200,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 201,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 201,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 202,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 202,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 203,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 203,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 204,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 204,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    rasterTileDataGroup: [
        {
            fileId: 200,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 256,
                    height: 256,
                },
            ],
        },
        {
            fileId: 201,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 189,
                    height: 189,
                },
            ],
        },
        {
            fileId: 202,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 160,
                    height: 52,
                },
            ],
        },
        {
            fileId: 203,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 150,
                    height: 150,
                },
            ],
        },
        {
            fileId: 204,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                {
                    width: 150,
                    height: 150,
                },
            ],
        },
    ],
};

let basepath: string;
describe('OPEN_IMAGE_CASA_VARIENTS: Testing the case of opening variant casa images', () => {
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
                        },
                        openFileTimeout
                    );

                    test(`REGION_HISTOGRAM_DATA.file_id = ${assertItem.regionHistogramDataGroup[index].fileId}`, () => {
                        expect(RegionHistogramData[0].fileId).toEqual(
                            assertItem.regionHistogramDataGroup[index].fileId
                        );
                    });

                    test(`REGION_HISTOGRAM_DATA.histograms.numBins = ${assertItem.regionHistogramDataGroup[index].histograms.numBins}`, () => {
                        expect(RegionHistogramData[0].histograms.numBins).toEqual(
                            assertItem.regionHistogramDataGroup[index].histograms.numBins
                        );
                    });

                    test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramDataGroup[index].regionId}`, () => {
                        expect(RegionHistogramData[0].regionId).toEqual(
                            assertItem.regionHistogramDataGroup[index].regionId
                        );
                    });

                    test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramDataGroup[index].progress}`, () => {
                        expect(RegionHistogramData[0].progress).toEqual(
                            assertItem.regionHistogramDataGroup[index].progress
                        );
                    });
                });

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
                        expect(RasterTileDataTemp[1].channel).toEqual(assertItem.rasterTileDataGroup[index].channel);
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

        afterAll(() => msgController.closeConnection());
    });
});
