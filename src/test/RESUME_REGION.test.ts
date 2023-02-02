import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import { take } from 'rxjs/operators';
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;
let regionTimeout = config.timeout.region;

interface AssertItem {
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    setStatsRequirements: CARTA.ISetStatsRequirements[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    resumeSession:
    {
        images:
            [
                {
                    directory: testSubdirectory,
                    file: "M17_SWex.fits",
                    fileId: 0,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                    regions: {
                        "1": {
                            regionType: CARTA.RegionType.RECTANGLE,
                            controlPoints: [{ x: 250, y: 350 }, { x: 80, y: 60 }],
                            rotation: 0,
                        },
                    },
                },
                {
                    directory: testSubdirectory,
                    file: "M17_SWex.image",
                    fileId: 1,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                    regions: {
                        "2": {
                            regionType: CARTA.RegionType.RECTANGLE,
                            controlPoints: [{ x: 350, y: 250 }, { x: 60, y: 80 }],
                            rotation: 0,
                        },
                    },
                },
            ]
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    setStatsRequirements: [
        {
            fileId: 0,
            regionId: 1,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.NanCount,
                    CARTA.StatsType.Sum,
                ]}
            ],
        },
        {
            fileId: 1,
            regionId: 2,
            statsConfigs:[
                {coordinate:"z", statsTypes:[
                    CARTA.StatsType.NumPixels,
                    CARTA.StatsType.NanCount,
                    CARTA.StatsType.Sum,
                ]}
            ],
        },
    ],
}

let basepath: string;
describe("RESUME REGION: Test to resume regions", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the assertItem.resumeSession.image.directory`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let i = 0; i < 2; i++) {
                assertItem.resumeSession.images[i].directory = basepath + "/" + assertItem.resumeSession.images[i].directory;
            }
        });

        let RegionHistogramData = [];
        test(`Resume Image: 2 REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
            msgController.histogramStream.pipe(take(2)).subscribe({
                next: (data) => {RegionHistogramData.push(data)},
                complete: () => {
                    expect(RegionHistogramData.length).toEqual(2)
                }
            });
            let ResumeAck = await msgController.resumeSession(assertItem.resumeSession);
            expect(ResumeAck.success).toBe(assertItem.resumeSessionAck.success);
            if (ResumeAck.message) {
                console.warn(`RESUME_SESSION_ACK error message: 
                        ${ResumeAck.message}`);
            }
        }, resumeTimeout);

        describe(`Register another session`, () => {
            let RegionHistogramData2 = [];
            test(`Resume Images again: 2 REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async ()=> {
                await msgController.connect(testServerUrl);
                msgController.histogramStream.pipe(take(2)).subscribe({
                    next: (data) => {RegionHistogramData2.push(data)},
                    complete: () => {
                        expect(RegionHistogramData2.length).toEqual(2)
                    }
                });
                let ResumeAck = await msgController.resumeSession(assertItem.resumeSession);
                expect(ResumeAck.success).toBe(assertItem.resumeSessionAck.success);
            }, resumeTimeout);


            assertItem.setStatsRequirements.map(stats => {
                test(`Try to request stats of region ${stats.regionId}`, async () => {
                    msgController.setStatsRequirements(stats);
                    let RegionStatsDataResponse = await Stream(CARTA.RegionStatsData, 1);
                }, regionTimeout);
            });
        })

        afterAll(() => msgController.closeConnection());
    });
})