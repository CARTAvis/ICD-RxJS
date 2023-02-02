import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController, ConnectionStatus } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let momentTimeout = config.timeout.moment;
const setFileId = 200;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
        hdu: "",
        fileId: setFileId,
        renderMode: CARTA.RenderMode.RASTER,
    },
    momentRequest: {
        fileId: setFileId,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
};

let basepath: string;
describe("MOMENTS_GENERATOR_CANCEL: Testing to cancel a moment generator for an image", () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Preparation`, () => {
            test(`Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            }, readFileTimeout);
        });

        describe(`Moment generator cancel`, () => {
            let momentProgressArray = [];
            let momentProgressReponse : any;
            let momentResponse : any;
            let count = 0;
            test(`Request a moment progress but cancel after receiving 5 MomentProgress`, async () => {
                let momentProgressPromise = new Promise((resolve)=>{
                    msgController.momentProgressStream.subscribe({
                        next: (data) => {
                            count++;
                            momentProgressArray.push(data);
                            if (count == 5) {
                                msgController.cancelRequestingMoment(setFileId);
                                resolve(momentProgressArray)
                            }
                        }
                    })
                })
                momentResponse = await msgController.requestMoment(assertItem.momentRequest);
                momentProgressReponse = await momentProgressPromise;
            }, momentTimeout)

            test(`Assert MomentProgress.progress < 1.0`, () => {
                momentProgressReponse.map(ack => {
                    expect(ack.progress).toBeLessThan(1.0);
                });
            });

            test(`Receive no MomentProgress till 500 ms`, done => {
                let receiveNumberCurrent = msgController.messageReceiving();
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter);
                    let checkConnectionStatus = msgController.checkConnectionStatus();
                    expect(checkConnectionStatus).toEqual(ConnectionStatus.ACTIVE);
                    done();
                }, 500)
            });

            test(`Assert MomentResponse.success = true`, () => {
                expect(momentResponse.success).toBe(true);
            });
    
            test(`Assert MomentResponse.cancel = true`, () => {
                expect(momentResponse.cancel).toBe(true);
            });
    
            test(`Assert openFileAcks[] is empty`, () => {
                expect(momentResponse.openFileAcks.length).toBe(0);
            });
        });

        describe(`Moment generator`, () => {
            let momentResponse : any;
            test(`Receive a series of moment progress`, async () => {
                momentResponse = await msgController.requestMoment({
                    ...assertItem.momentRequest,
                    moments: [12],
                });
            }, momentTimeout); 

            test(`Assert MomentResponse.success = true`, () => {
                expect(momentResponse.success).toBe(true);
            });

            test(`Assert openFileAcks[].fileInfo.name = "HD163296_CO_2_1.fits.moment.minimum_coord"`, () => {
                expect(momentResponse.openFileAcks[0].fileInfo.name).toEqual("HD163296_CO_2_1.fits.moment.minimum_coord");
            });

            test(`Assert openFileAcks[].fileInfoExtended`, () => {
                momentResponse.openFileAcks.map(ack => {
                    expect(ack.fileInfoExtended.height).toEqual(432);
                    expect(ack.fileInfoExtended.width).toEqual(432);
                    expect(ack.fileInfoExtended.dimensions).toEqual(4);
                    expect(ack.fileInfoExtended.depth).toEqual(1);
                    expect(ack.fileInfoExtended.stokes).toEqual(1);
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});