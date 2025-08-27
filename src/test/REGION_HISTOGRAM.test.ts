import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/MyClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    cursor?: CARTA.ISetCursor;
    regionGroup: CARTA.ISetRegion[];
    spatial?: CARTA.ISetSpatialRequirements;
    stats?: CARTA.ISetStatsRequirements;
    histogram: CARTA.ISetHistogramRequirements[];
    histogramData: CARTA.IRegionHistogramData[];
}

let assertItem: AssertItem = {
    openFile: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex.image',
            fileId: 0,
            hdu: '',
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex.hdf5',
            fileId: 0,
            hdu: '',
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    addTilesRequire: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 4,
    regionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 98, y: 541 },
                    { x: 7, y: 7 },
                ],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 98, y: 541 },
                    { x: 7, y: 7 },
                ],
                rotation: 90,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 0, y: 524 },
                    { x: 7, y: 7 },
                ],
                rotation: 45,
            },
        },
    ],
    histogram: [
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 3,
            histograms: [{ channel: -1, numBins: -1 }],
        },
    ],
    histogramData: [
        {
            regionId: 1,
            histograms: {
                numBins: 7,
                binWidth: 0.0033473593648523092,
                firstBinCenter: -0.0075361598283052444,
                bins: [5, 2, 1, 0, 4, 1, 3],
            },
            progress: 1,
        },
        {
            regionId: 2,
            histograms: {
                numBins: 7,
                binWidth: 0.0033473593648523092,
                firstBinCenter: -0.0075361598283052444,
                bins: [5, 2, 1, 0, 4, 1, 3],
            },
            progress: 1,
        },
        {
            regionId: 3,
            histograms: {
                numBins: 1,
                bins: [0],
            },
            progress: 1,
        },
    ],
};

let basepath: string;
describe('REGION_HISTOGRAM test: Testing histogram with rectangle regions', () => {
    assertItem.openFile.map((openFile, index) => {
        const msgController = MessageController.Instance;
        describe(`Register a session`, () => {
            beforeAll(async () => {
                await msgController.connect(testServerUrl);
            }, connectTimeout);

            checkConnection();
            test(`Get basepath and modify the directory path`, async () => {
                msgController.closeFile(-1);
                let fileListResponse = await msgController.getFileList('$BASE', 0);
                basepath = fileListResponse.directory;
                assertItem.openFile[index].directory = basepath + '/' + assertItem.openFile[index].directory;
            });

            let regionHistogramData = [];
            test(
                `Open file of "${openFile.file}" and Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
                async () => {
                    let regionHistogramDataPromise = new Promise((resolve) => {
                        msgController.histogramStream.subscribe({
                            next: (data) => {
                                regionHistogramData.push(data);
                                resolve(regionHistogramData);
                            },
                        });
                    });
                    let OpenFileResponse = await msgController.loadFile(openFile);
                    let RegionHistogramData = await regionHistogramDataPromise;

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(openFile.file);
                },
                openFileTimeout
            );

            test(
                `Return RASTER_TILE_DATA(Stream) and check total length | `,
                async () => {
                    msgController.addRequiredTiles(assertItem.addTilesRequire);
                    let RasterTileDataResponse = await Stream(
                        CARTA.RasterTileData,
                        assertItem.addTilesRequire.tiles.length + 2
                    );

                    msgController.setCursor(
                        assertItem.setCursor.fileId,
                        assertItem.setCursor.point.x,
                        assertItem.setCursor.point.y
                    );
                    let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);

                    expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
                },
                readFileTimeout
            );

            assertItem.histogramData.map((histogramData, index) => {
                describe(`SET REGION #${histogramData.regionId}`, () => {
                    let SetRegionAck: any;
                    test(
                        `SET_REGION_ACK should arrive within ${regionTimeout} ms`,
                        async () => {
                            SetRegionAck = await msgController.setRegion(
                                assertItem.regionGroup[index].fileId,
                                assertItem.regionGroup[index].regionId,
                                assertItem.regionGroup[index].regionInfo
                            );
                        },
                        regionTimeout
                    );

                    test('SET_REGION_ACK.success = true', () => {
                        expect(SetRegionAck.success).toBe(true);
                    });

                    test(`SET_REGION_ACK.region_id = ${histogramData.regionId}`, () => {
                        expect(SetRegionAck.regionId).toEqual(histogramData.regionId);
                    });
                });

                describe(`SET HISTOGRAM REQUIREMENTS on region #${histogramData.regionId}`, () => {
                    let RegionHistogramData: any;
                    test(
                        `REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`,
                        async () => {
                            await msgController.setHistogramRequirements(assertItem.histogram[index]);
                            RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
                        },
                        regionTimeout
                    );

                    test(`REGION_HISTOGRAM_DATA.region_id = ${histogramData.regionId}`, () => {
                        expect(RegionHistogramData[0].regionId).toEqual(histogramData.regionId);
                    });

                    test(`REGION_HISTOGRAM_DATA.progress = ${histogramData.progress}`, () => {
                        expect(RegionHistogramData[0].progress).toEqual(histogramData.progress);
                    });

                    test('Assert REGION_HISTOGRAM_DATA.histograms', () => {
                        if (RegionHistogramData[0].histograms.binWidth !== 0) {
                            expect(RegionHistogramData[0].histograms.binWidth).toBeCloseTo(
                                histogramData.histograms.binWidth,
                                assertItem.precisionDigits
                            );
                        }
                        if (RegionHistogramData[0].histograms.firstBinCenter !== 0) {
                            expect(RegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(
                                histogramData.histograms.firstBinCenter,
                                assertItem.precisionDigits
                            );
                        }

                        let filterZero = RegionHistogramData[0].histograms.bins.filter((value) => value === 0);
                        if (filterZero.length === RegionHistogramData[0].histograms.bins.length) {
                            expect(RegionHistogramData[0].histograms.bins.length).toEqual(
                                histogramData.histograms.numBins
                            );
                        } else {
                            expect(RegionHistogramData[0].histograms.numBins).toEqual(histogramData.histograms.numBins);
                        }
                        expect(RegionHistogramData[0].histograms.bins).toEqual(histogramData.histograms.bins);
                    });
                });
            });

            afterAll(() => msgController.closeConnection());
        });
    });
});
