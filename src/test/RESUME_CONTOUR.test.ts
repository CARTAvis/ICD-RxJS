import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import { take } from 'rxjs/operators';
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;

interface AssertItem {
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    setImageChannels: CARTA.ISetImageChannels;
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
                    contourSettings: {
                        fileId: 0,
                        referenceFileId: 0,
                        imageBounds: { xMin: 0, xMax: 800, yMin: 0, yMax: 800 },
                        levels: [
                            1.5, 2.0, 2.5, 3.0,
                            3.5, 4.0, 4.5, 5.0,
                            5.5, 6.0, 6.5, 7.0,
                        ],
                        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
                        smoothingFactor: 4,
                        decimationFactor: 4,
                        compressionLevel: 8,
                        contourChunkSize: 100000,
                    },
                },
            ]
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    setImageChannels: {
        fileId: 0,
        channel: 1,
        stokes: 0,
    },
}

let basepath: string;
describe("RESUME CONTOUR: Test to resume contour lines", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the assertItem.resumeSession.image.directory`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.resumeSession.images[0].directory = basepath + "/" + assertItem.resumeSession.images[0].directory;
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

            test(`Receive ${assertItem.resumeSession.images[0].contourSettings.levels.length} set of contour lines`, async () => {
                msgController.setChannels(assertItem.setImageChannels);
                let ContourImageResponse = await Stream(CARTA.ContourImageData, 12);
            });
        })

        afterAll(() => msgController.closeConnection());
    });
})