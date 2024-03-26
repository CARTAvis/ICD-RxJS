import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spectralProfile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setRegion: CARTA.ISetRegion[];
    setCursor: CARTA.ISetCursor[];
    setStatsRequirements: CARTA.ISetStatsRequirements[][];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "casa_wideField.fits",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "casa_wideField.image",
            fileId: 1,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 1,
            point: { x: 200.0, y: 200.0 },
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 300, y: 200 }, { x: 400, y: 400 }],
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: 3,
                rotation: 25,
                controlPoints: [{ x: 1800, y: 659.2 }, { x: 1000, y: 1000 }],
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: 4,
                rotation: 330,
                controlPoints: [{ x: 1800, y: 1200 }, { x: 800, y: 2000 }],
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: 6,
                controlPoints: [{ x: 3500, y: 1300 }, { x: 3599, y: -1.5 }, { x: 2200, y: 100 }],
            },
        },
    ],
    setStatsRequirements: [
        [
            {
                fileId: 0,
                regionId: 1,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
            {
                fileId: 0,
                regionId: 2,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
            {
                fileId: 0,
                regionId: 3,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
            {
                fileId: 0,
                regionId: 4,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
        ],
        [
            {
                fileId: 1,
                regionId: 1,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
            {
                fileId: 1,
                regionId: 2,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
            {
                fileId: 1,
                regionId: 3,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
            {
                fileId: 1,
                regionId: 4,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
            },
        ],
    ]
};

let basepath: string;
describe("MATCH_STATS_WIDE_BORDERLINE: Testing region stats with spatially and spectrally matched wide field images over the image boundary", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let i = 0; i < assertItem.openFile.length; i++) {
                assertItem.openFile[i].directory = basepath + "/" + assertItem.openFile[i].directory;
            }
        });

        describe(`Preparation`, () => {
            msgController.closeFile(-1);
            for (let index = 0; index < assertItem.openFile.length; index++) {
                test(`(Step 1): Should open image ${assertItem.openFile[index].file} as file_id: ${assertItem.openFile[index].fileId}`, async () => {
                    let OpenFileResponse = await msgController.loadFile(assertItem.openFile[index]);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[index].file);
                }, openFileTimeout);
            }

            for (let index = 0; index < assertItem.setCursor.length; index++) {
                test(`(Step 2): Should set cursor for file_id: ${assertItem.setCursor[index].fileId}`, async () => {
                    msgController.setCursor(assertItem.setCursor[index].fileId, assertItem.setCursor[index].point.x, assertItem.setCursor[index].point.y);
                    let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);
                });
            }

            for (const [index, region] of assertItem.setRegion.entries()) {
                test(`(Step 3): Should set regionId of ${index+1} for file_id: 0`, async () => {
                    let setRegionAckResponse = await msgController.setRegion(region.fileId, region.regionId, region.regionInfo);
                }, regionTimeout);
            }
        });

        describe(`Test if the stats results are equal`, () => {
            let RegionStatsDataArray: CARTA.RegionStatsData[] = [];
            for (const [fileIdx, file] of assertItem.openFile.entries()) {
                test(`Should receive 4 RegionStatsData for file_id: ${file.fileId}`, async () => {
                    for (const [statsIdx, statsReq] of assertItem.setStatsRequirements[fileIdx].entries()) {
                        msgController.setStatsRequirements({
                            fileId: file.fileId,
                            regionId: statsReq.regionId,
                            statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                        })
                        RegionStatsDataArray.push(await Stream(CARTA.RegionStatsData, 1));
                    }
                }, profileTimeout);

                test(`Assert region_id for file_id: ${file.fileId}`, () => {
                    for (const [regionIdx, region] of assertItem.setRegion.entries()) {
                        let RegionStatsData = RegionStatsDataArray.find(data => data[0]?.fileId == file.fileId && data[0].regionId == regionIdx + 1)
                        expect(RegionStatsData[0].statistics.length).toBeGreaterThan(0);
                    }
                });
            }

            for (const [regionIdx, region] of assertItem.setRegion.entries()) {
                for (const [statsIdx, statsType] of assertItem.setStatsRequirements[0][regionIdx].statsConfigs[0].statsTypes.entries()) {
                    test(`Assert the ${CARTA.StatsType[statsType]} of region ${regionIdx+1} for first image equal to that for the second image`, () => {
                        const left = RegionStatsDataArray.find(data => data[0].fileId == assertItem.openFile[0].fileId && data[0].regionId == regionIdx+1)[0].statistics.find(data => data.statsType == statsType).value;
                        const right = RegionStatsDataArray.find(data => data[0].fileId == assertItem.openFile[1].fileId && data[0].regionId == regionIdx+1)[0].statistics.find(data => data.statsType == statsType).value;
                        if (isNaN(left) || isNaN(right)) {
                            expect(Object.is(left, right)).toBe(true);
                        } else {
                            if (CARTA.StatsType[statsType] === "NumPixels") {
                                let difference: Number = Math.abs(left - right);
                                expect(difference).toBeLessThanOrEqual(1);
                            } else {
                                expect(left).toBeCloseTo(right, assertItem.precisionDigits);
                            }
                        }
                    });
                }
            }
        });
        afterAll(() => msgController.closeConnection());
    });
});