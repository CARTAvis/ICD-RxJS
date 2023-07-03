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
    catalogFilterRequest: CARTA.ICatalogFilterRequest;
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    resumeSession:
    {
        images:
            [
                {
                    directory: testSubdirectory,
                    file: "model.fits",
                    fileId: 0,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                },
            ],
        catalogFiles: [
            {
                directory: testSubdirectory,
                name: "test_fk4.xml",
                fileId: 1,
                previewDataSize: 10,
            },
        ],
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    catalogFilterRequest: {
        fileId: 1,
        columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        subsetStartIndex: 0,
        subsetDataSize: 6,
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
            assertItem.resumeSession.catalogFiles[0].directory = basepath + "/" + assertItem.resumeSession.catalogFiles[0].directory;
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
                console.log(`RESUME_SESSION_ACK error message: 
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

            test(`Assert the CATALOG_FILTER_RESPONSE.columns.length = ${assertItem.catalogFilterRequest.columnIndices.length}`, async () => {
                msgController.setCatalogFilterRequest(assertItem.catalogFilterRequest);
                let ack = await Stream(CARTA.CatalogFilterResponse, 1);
                expect(Object.keys(ack[0].columns).length).toEqual(assertItem.catalogFilterRequest.columnIndices.length);
            });
        })

        afterAll(() => msgController.closeConnection());
    });
})