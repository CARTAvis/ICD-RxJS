import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    openFile: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    setStatsRequirements: CARTA.ISetStatsRequirements[];
    regionStatsData: CARTA.IRegionStatsData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    openFile:
        [
            {
                directory: testSubdirectory,
                file: "M17_SWex.fits",
                fileId: 0,
                hdu: "0",
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                fileId: 0,
                hdu: "0",
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
    addRequiredTiles: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 155, y: 552 }, { x: 134, y: 498 }, { x: 185, y: 509 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 116, y: 604 }, { x: 106, y: 574 }, { x: 137, y: 577 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 556, y: 167 }, { x: 547, y: 130 }, { x: 577, y: 139 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 65, y: 688 }, { x: 69, y: 36 }, { x: 602, y: 77 }, { x: 562, y: 735 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 300.2, y: 300.2 }, { x: 300.2, y: 301.0 }, { x: 300.7, y: 300.2 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 299.5, y: 300.5 }, { x: 299.5, y: 299.5 }, { x: 300.5, y: 299.5 }, { x: 300.5, y: 300.5 }],
                rotation: 0.0,
            },
        },
    ],
    regionAck: [
        {
            success: true,
            regionId: 1,
        },
        {
            success: true,
            regionId: 2,
        },
        {
            success: true,
            regionId: 3,
        },
        {
            success: true,
            regionId: 4,
        },
        {
            success: true,
            regionId: 5,
        },
        {
            success: true,
            regionId: 6,
        },
    ],
    setStatsRequirements: [
        {
            fileId: 0,
            regionId: 1,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.Sum,
                    CARTA.StatsType.FluxDensity,
                    CARTA.StatsType.Mean,
                    CARTA.StatsType.RMS,
                    CARTA.StatsType.Sigma,
                    CARTA.StatsType.SumSq,
                    CARTA.StatsType.Min,
                    CARTA.StatsType.Max,
                    CARTA.StatsType.Extrema
                ]}
            ],
        },
        {
            fileId: 0,
            regionId: 2,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.Sum,
                    CARTA.StatsType.FluxDensity,
                    CARTA.StatsType.Mean,
                    CARTA.StatsType.RMS,
                    CARTA.StatsType.Sigma,
                    CARTA.StatsType.SumSq,
                    CARTA.StatsType.Min,
                    CARTA.StatsType.Max,
                    CARTA.StatsType.Extrema
                ]}
            ],
        },
        {
            fileId: 0,
            regionId: 3,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.Sum,
                    CARTA.StatsType.FluxDensity,
                    CARTA.StatsType.Mean,
                    CARTA.StatsType.RMS,
                    CARTA.StatsType.Sigma,
                    CARTA.StatsType.SumSq,
                    CARTA.StatsType.Min,
                    CARTA.StatsType.Max,
                    CARTA.StatsType.Extrema
                ]}
            ],
        },
        {
            fileId: 0,
            regionId: 4,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.Sum,
                    CARTA.StatsType.FluxDensity,
                    CARTA.StatsType.Mean,
                    CARTA.StatsType.RMS,
                    CARTA.StatsType.Sigma,
                    CARTA.StatsType.SumSq,
                    CARTA.StatsType.Min,
                    CARTA.StatsType.Max,
                    CARTA.StatsType.Extrema
                ]}
            ],
        },
        {
            fileId: 0,
            regionId: 5,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.Sum,
                    CARTA.StatsType.FluxDensity,
                    CARTA.StatsType.Mean,
                    CARTA.StatsType.RMS,
                    CARTA.StatsType.Sigma,
                    CARTA.StatsType.SumSq,
                    CARTA.StatsType.Min,
                    CARTA.StatsType.Max,
                    CARTA.StatsType.Extrema
                ]}
            ],
        },
        {
            fileId: 0,
            regionId: 6,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.Sum,
                    CARTA.StatsType.FluxDensity,
                    CARTA.StatsType.Mean,
                    CARTA.StatsType.RMS,
                    CARTA.StatsType.Sigma,
                    CARTA.StatsType.SumSq,
                    CARTA.StatsType.Min,
                    CARTA.StatsType.Max,
                    CARTA.StatsType.Extrema
                ]}
            ],
        },
    ],
    regionStatsData: [
        {
            regionId: 1,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 1265 },
                { statsType: CARTA.StatsType.Sum, value: 1.2024647 },
                { statsType: CARTA.StatsType.FluxDensity, value: 0.05524418 },
                { statsType: CARTA.StatsType.Mean, value: 0.00095056 },
                { statsType: CARTA.StatsType.RMS, value: 0.00372206 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00360005 },
                { statsType: CARTA.StatsType.SumSq, value: 0.01752493 },
                { statsType: CARTA.StatsType.Min, value: -0.01051447 },
                { statsType: CARTA.StatsType.Max, value: 0.01217441 },
                { statsType: CARTA.StatsType.Extrema, value: 0.01217440 },
            ]
        },
        {
            regionId: 2,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 132 },
                { statsType: CARTA.StatsType.Sum, value: -0.09657376 },
                { statsType: CARTA.StatsType.FluxDensity, value: -0.00443684 },
                { statsType: CARTA.StatsType.Mean, value: -0.00073162 },
                { statsType: CARTA.StatsType.RMS, value: 0.00945348 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00946103 },
                { statsType: CARTA.StatsType.SumSq, value: 0.01179662 },
                { statsType: CARTA.StatsType.Min, value: -0.01994896 },
                { statsType: CARTA.StatsType.Max, value: 0.0235076 },
                { statsType: CARTA.StatsType.Extrema, value: 0.02350760 },
            ]
        },
        {
            regionId: 3,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 0 },
                { statsType: CARTA.StatsType.Sum, value: NaN },
                { statsType: CARTA.StatsType.FluxDensity, value: NaN },
                { statsType: CARTA.StatsType.Mean, value: NaN },
                { statsType: CARTA.StatsType.RMS, value: NaN },
                { statsType: CARTA.StatsType.Sigma, value: NaN },
                { statsType: CARTA.StatsType.SumSq, value: NaN },
                { statsType: CARTA.StatsType.Min, value: NaN },
                { statsType: CARTA.StatsType.Max, value: NaN },
                { statsType: CARTA.StatsType.Extrema, value: NaN },
            ]
        },
        {
            regionId: 4,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 216248 },
                { statsType: CARTA.StatsType.Sum, value: -7.6253559 },
                { statsType: CARTA.StatsType.FluxDensity, value: -0.35032758 },
                { statsType: CARTA.StatsType.Mean, value: -3.52620875e-05 },
                { statsType: CARTA.StatsType.RMS, value: 0.00473442 },
                { statsType: CARTA.StatsType.Sigma, value: 0.0047343 },
                { statsType: CARTA.StatsType.SumSq, value: 4.84713562 },
                { statsType: CARTA.StatsType.Min, value: -0.03958673 },
                { statsType: CARTA.StatsType.Max, value: 0.04523611 },
                { statsType: CARTA.StatsType.Extrema, value: 0.04523611 },
            ]
        },
        {
            regionId: 5,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 0 },
                { statsType: CARTA.StatsType.Sum, value: NaN },
                { statsType: CARTA.StatsType.FluxDensity, value: NaN },
                { statsType: CARTA.StatsType.Mean, value: NaN },
                { statsType: CARTA.StatsType.RMS, value: NaN },
                { statsType: CARTA.StatsType.Sigma, value: NaN },
                { statsType: CARTA.StatsType.SumSq, value: NaN },
                { statsType: CARTA.StatsType.Min, value: NaN },
                { statsType: CARTA.StatsType.Max, value: NaN },
                { statsType: CARTA.StatsType.Extrema, value: NaN },
            ]
        },
        {
            regionId: 6,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 1 },
                { statsType: CARTA.StatsType.Sum, value: -0.00115214 },
                { statsType: CARTA.StatsType.FluxDensity, value: -5.29322955e-05 },
                { statsType: CARTA.StatsType.Mean, value: -0.00115214 },
                { statsType: CARTA.StatsType.RMS, value: 0.00115214 },
                { statsType: CARTA.StatsType.Sigma, value: 0 },
                { statsType: CARTA.StatsType.SumSq, value: 1.32743435e-06 },
                { statsType: CARTA.StatsType.Min, value: -0.00115214 },
                { statsType: CARTA.StatsType.Max, value: -0.00115214 },
                { statsType: CARTA.StatsType.Extrema, value: -0.00115214 },
            ]
        },
    ],
    precisionDigits: 4,
};

let basepath: string;
describe("REGION_STATISTICS_POLYGON: Testing statistics with polygon regions", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile[0].directory = basepath + "/" + assertItem.openFile[0].directory;
            assertItem.openFile[1].directory = basepath + "/" + assertItem.openFile[1].directory;
        });

        assertItem.openFile.map(openFile => {
            describe(`Open image "${openFile.file}" to set image view`, () => {
                test(`Preparation: Open image`,async () => {
                    msgController.closeFile(-1);
                    let OpenFileResponse = await msgController.loadFile(openFile);
                    expect(OpenFileResponse.success).toEqual(true);
                    let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);

                    msgController.addRequiredTiles(assertItem.addRequiredTiles);
                    let RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);
                    msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                    let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
                });

                assertItem.setRegion.map((region, index) => {
                    if (region.regionId) {
                        describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId} on ${JSON.stringify(region.regionInfo.controlPoints)}`, () => {
                            let SetRegionAck: any;
                            test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                                SetRegionAck = await msgController.setRegion(region.fileId, region.regionId, region.regionInfo);
                            }, regionTimeout);
    
                            test(`SET_REGION_ACK.success = ${assertItem.regionAck[index].success}`, () => {
                                expect(SetRegionAck.success).toBe(assertItem.regionAck[index].success);
                            });
    
                            test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[index].regionId}`, () => {
                                expect(SetRegionAck.regionId).toEqual(assertItem.regionAck[index].regionId);
                            });
    
                        });
                    };
    
                    describe(`SET STATS REQUIREMENTS on ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId}`, () => {
                        let RegionStatsData: any;
                        test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                            await msgController.setStatsRequirements(assertItem.setStatsRequirements[index]);
                            RegionStatsData = await Stream(CARTA.RegionStatsData,1);
                        }, regionTimeout);
    
                        test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsData[index].regionId}`, () => {
                            expect(RegionStatsData[0].regionId).toEqual(assertItem.regionStatsData[index].regionId);
                        });
    
                        test("Assert & Check REGION_STATS_DATA.statistics", () => {
                            assertItem.regionStatsData[index].statistics.map(stats => {
                                if (isNaN(stats.value)) {
                                    expect(isNaN(RegionStatsData[0].statistics.find(f => f.statsType === stats.statsType).value)).toBe(true);
                                } else {
                                    expect(RegionStatsData[0].statistics.find(f => f.statsType === stats.statsType).value).toBeCloseTo(stats.value, assertItem.precisionDigits);
                                }
                            });
                        });
                    });
                });
            });
        });
        afterAll(() => msgController.closeConnection());
    });
})