import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    openFile: CARTA.IOpenFile;
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
    openFile: {
        directory: testSubdirectory,
        file: 'supermosaic.10.fits',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },

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
                    { x: 303, y: 607 },
                    { x: 5, y: 10 },
                ],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 5, y: 10 },
                ],
                rotation: 25,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 5, y: 10 },
                ],
                rotation: 50,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 5, y: 10 },
                ],
                rotation: 75,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 5, y: 10 },
                ],
                rotation: 100,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 3, y: 7 },
                ],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 3, y: 7 },
                ],
                rotation: 25,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 3, y: 7 },
                ],
                rotation: 50,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 3, y: 7 },
                ],
                rotation: 75,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 303, y: 607 },
                    { x: 3, y: 7 },
                ],
                rotation: 100,
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
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
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
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
    ],
    histogramData: [
        {
            regionId: 1,
            histograms: {
                numBins: 7,
                binWidth: 1.5208303928375244,
                firstBinCenter: -4.034262657165527,
                mean: 0.4041082208806818,
                stdDev: 2.6764579920150386,
                bins: [3, 12, 7, 13, 8, 7, 5],
            },
            progress: 1,
        },
        {
            regionId: 1,
            histograms: {
                numBins: 9,
                binWidth: 1.3602973222732544,
                firstBinCenter: -5.711391925811768,
                mean: -0.12993427351409315,
                stdDev: 2.871427649275705,
                bins: [1, 1, 11, 9, 10, 6, 4, 5, 4],
            },
            progress: 1,
        },
        {
            regionId: 1,
            histograms: {
                numBins: 9,
                binWidth: 1.4611884355545044,
                firstBinCenter: -6.568966388702393,
                mean: -0.07283528645833333,
                stdDev: 3.357136753999045,
                bins: [2, 2, 6, 11, 9, 5, 3, 6, 7],
            },
            progress: 1,
        },
        {
            regionId: 1,
            histograms: {
                numBins: 8,
                binWidth: 1.6125259399414062,
                firstBinCenter: -6.242809295654297,
                mean: 0.4907681334252451,
                stdDev: 3.439834023587806,
                bins: [2, 3, 9, 9, 3, 8, 8, 9],
            },
            progress: 1,
        },
        {
            regionId: 1,
            histograms: {
                numBins: 8,
                binWidth: 1.7416839599609375,
                firstBinCenter: -6.428718566894531,
                mean: 1.2446935317095589,
                stdDev: 3.603033922567316,
                bins: [3, 1, 8, 5, 5, 10, 9, 10],
            },
            progress: 1,
        },
        {
            regionId: 2,
            histograms: {
                numBins: 9,
                binWidth: 1.4611884355545044,
                firstBinCenter: -6.568966388702393,
                mean: 0.6847772598266602,
                stdDev: 3.803558083723265,
                bins: [4, 4, 5, 8, 6, 5, 8, 11, 13],
            },
            progress: 1,
        },
        {
            regionId: 2,
            histograms: {
                numBins: 15,
                binWidth: 0.9121989011764526,
                firstBinCenter: -6.592972755432129,
                mean: 1.120794040053638,
                stdDev: 3.263444231613786,
                bins: [1, 1, 2, 2, 5, 6, 3, 5, 3, 9, 7, 9, 1, 11, 2],
            },
            progress: 1,
        },
        {
            regionId: 2,
            histograms: {
                numBins: 15,
                binWidth: 0.6742350459098816,
                firstBinCenter: -3.1424968242645264,
                mean: 1.4638134401236007,
                stdDev: 2.541942356604781,
                bins: [3, 4, 5, 2, 4, 6, 5, 7, 6, 8, 6, 1, 6, 3, 1],
            },
            progress: 1,
        },
        {
            regionId: 2,
            histograms: {
                numBins: 15,
                binWidth: 0.6721476316452026,
                firstBinCenter: -3.112229347229004,
                mean: 0.8817129826200181,
                stdDev: 2.629250474696574,
                bins: [5, 6, 8, 3, 5, 6, 6, 4, 7, 5, 5, 1, 5, 2, 1],
            },
            progress: 1,
        },
        {
            regionId: 2,
            histograms: {
                numBins: 15,
                binWidth: 0.8161783814430237,
                firstBinCenter: -5.9834513664245605,
                mean: 0.05106820633162314,
                stdDev: 2.7907663401523517,
                bins: [1, 1, 1, 4, 7, 10, 6, 8, 7, 5, 3, 2, 5, 4, 3],
            },
            progress: 1,
        },
    ],
};

let basepath: string;
describe('REGION_HISTOGRAM_ITERATION test: Testing histogram with different rotation for rectangle & ellipse regions', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + '/' + assertItem.openFile.directory;
        });

        describe(`Prepare image data ${assertItem.openFile.file}`, () => {
            let regionHistogramData = [];
            test(
                `Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
                async () => {
                    msgController.closeFile(-1);
                    let regionHistogramDataPromise = new Promise((resolve) => {
                        msgController.histogramStream.subscribe({
                            next: (data) => {
                                regionHistogramData.push(data);
                                resolve(regionHistogramData);
                            },
                        });
                    });
                    let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                    let RegionHistogramData = await regionHistogramDataPromise;

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
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
                describe(`SET REGION #${histogramData.regionId} with degree = ${assertItem.regionGroup[index].regionInfo.rotation}`, () => {
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

                    describe(`SET HISTOGRAM REQUIREMENTS on region #${histogramData.regionId} with degree = ${assertItem.regionGroup[index].regionInfo.rotation}`, () => {
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
                                expect(RegionHistogramData[0].histograms.numBins).toEqual(
                                    histogramData.histograms.numBins
                                );
                            }
                            expect(RegionHistogramData[0].histograms.bins).toEqual(histogramData.histograms.bins);
                        });
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
