import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import { take } from 'rxjs/operators';
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;
let renderTimeout = config.timeout.renderImages;

interface AssertItem {
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    addRequiredTiles?: CARTA.IAddRequiredTiles[];
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
                },
                {
                    directory: testSubdirectory,
                    file: "M17_SWex.image",
                    fileId: 1,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                },
            ]
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    addRequiredTiles: [
        {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
}

let basepath: string;
describe("RESUME IMAGE: Test to resume images", () => {
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

            assertItem.resumeSession.images.map((image, index) => {
                test(`Try to render file ID ${image.fileId}`, async () => {
                    msgController.addRequiredTiles(assertItem.addRequiredTiles[index]);
                    let RasterTileDataResponse = await Stream(CARTA.RasterTileData, assertItem.addRequiredTiles[index].tiles.length + 2);
                }, renderTimeout);
            });
        })

        afterAll(() => msgController.closeConnection());
    });
})