import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spectralProfile;

interface AssertItem {
    precisionDigits: number;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor[];
    setRegion: CARTA.ISetRegion[];
    setStatsRequirements: CARTA.ISetStatsRequirements[][];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            fileId: 101,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: [
        {
            fileId: 100,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
        },
    ],
    setRegion: [
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 250, y: 200 }, { x: 300, y: 300 }],
            },
        },
        {
            fileId: 100,
            regionId: 2,
            regionInfo: {
                regionType: 3,
                rotation: 25,
                controlPoints: [{ x: 350, y: 350 }, { x: 100, y: 150 }],
            },
        },
        {
            fileId: 100,
            regionId: 3,
            regionInfo: {
                regionType: 4,
                rotation: 25,
                controlPoints: [{ x: 150, y: 150 }, { x: 60, y: 100 }],
            },
        },
        {
            fileId: 100,
            regionId: 4,
            regionInfo: {
                regionType: 6,
                controlPoints: [{ x: 100, y: 150 }, { x: 400, y: 400 }, { x: 300, y: 30 }],
            },
        },
    ],
    setStatsRequirements: [
        [
            {
                fileId: 100,
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
                    ]}
                ],
            },
            {
                fileId: 100,
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
                    ]}
                ],
            },
            {
                fileId: 100,
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
                    ]}
                ],
            },
            {
                fileId: 100,
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
                    ]}
                ],
            },
        ],
        [
            {
                fileId: 101,
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
                    ]}
                ],
            },
            {
                fileId: 101,
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
                    ]}
                ],
            },
            {
                fileId: 101,
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
                    ]}
                ],
            },
            {
                fileId: 101,
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
                    ]}
                ],
            },
        ],
    ]
};

let basepath: string;
describe("MATCH_STATS: Testing region stats with spatially and spectrally matched images", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let index = 0; index < assertItem.openFile.length; index++) {
                assertItem.openFile[index].directory = basepath + "/" + assertItem.openFile[index].directory;
            }
        });

        describe(`Prepare images`, () => {
            msgController.closeFile(-1);
            for (const file of assertItem.openFile) {
                test(`Should open image ${file.file} as file_id: ${file.fileId}`, async () => {
                    let OpenFileResponse = await msgController.loadFile(file);
                    expect(OpenFileResponse.success).toEqual(true);
                    let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
                }, openFileTimeout);
            }

            for (const [index, cursor] of assertItem.setCursor.entries()) {
                test(`Should set cursor ${index}`, async () => {
                    await msgController.setCursor(cursor.fileId, cursor.point.x, cursor.point.y);
                    let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
                }, cursorTimeout);
            }

            for (const [index, region] of assertItem.setRegion.entries()) {
                test(`Should set region ${region.regionId}`, async () => {
                    let SetRegionAckResponse = await msgController.setRegion(region.fileId, region.regionId, region.regionInfo);
                }, regionTimeout);
            }
        });

        describe(`Test if the stats results are equal`, () => {
            let RegionStatsData: CARTA.RegionStatsData[] = [];
            for (const [fileIdx, file] of assertItem.openFile.entries()) {
                test(`Should receive 4 RegionStatsData for file_id: ${file.fileId}`, async () => {
                    for (const [statsIdx, statsReq] of assertItem.setStatsRequirements[fileIdx].entries()) {
                        await msgController.setStatsRequirements({
                            fileId: file.fileId,
                            regionId: statsReq.regionId,
                            stats: [],
                        })
                        await msgController.setStatsRequirements(statsReq);
                        RegionStatsData.push(await Stream(CARTA.RegionStatsData,1));
                    }
                }, profileTimeout);

                test(`Assert region_id for file_id: ${file.fileId}`, () => {
                    for (const [regionIdx, region] of assertItem.setRegion.entries()) {
                        expect(RegionStatsData.find(data => data[0].fileId == file.fileId && data[0].regionId == region.regionId)[0].statistics.length).toBeGreaterThan(0);
                    }
                });
            }
            for (const [regionIdx, region] of assertItem.setRegion.entries()) {
                for (const [statsIdx, statsType] of assertItem.setStatsRequirements[0][regionIdx].statsConfigs[0].statsTypes.entries()) {
                    test(`Assert the ${CARTA.StatsType[statsType]} of region ${region.regionId} for first image equal to that for the second image`, () => {
                        const left = RegionStatsData.find(data => data[0].fileId == assertItem.openFile[0].fileId && data[0].regionId == region.regionId)[0].statistics.find(data => data.statsType == statsType).value;
                        const right = RegionStatsData.find(data => data[0].fileId == assertItem.openFile[1].fileId && data[0].regionId == region.regionId)[0].statistics.find(data => data.statsType == statsType).value;
                        if (isNaN(left) || isNaN(right)) {
                            expect(Object.is(left, right)).toBe(true);
                        } else {
                            expect(left).toBeCloseTo(right, assertItem.precisionDigits);
                        }
                    });
                }
            }
        });

        afterAll(() => msgController.closeConnection());
    });
})