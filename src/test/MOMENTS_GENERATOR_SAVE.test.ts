import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let saveSubdirectory = config.path.save;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let saveFileTimeout = config.timeout.saveFile;
let momentTimeout = config.timeout.moment;

interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest;
    saveFile: CARTA.ISaveFile[][];
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
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1,],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
    saveFile: [
        [
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.average.fits',
                outputFileType: CARTA.FileType.FITS,
            },
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.integrated.fits',
                outputFileType: CARTA.FileType.FITS,
            },
        ],
        [
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.average.image',
                outputFileType: CARTA.FileType.CASA,
            },
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.integrated.image',
                outputFileType: CARTA.FileType.CASA,
            },
        ],
    ],
};

let basepath: string;
describe("MOMENTS_GENERATOR_FITS: Testing moments generator for a given region on a fits image", () => {
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

        let FileId: number[] = [];
        let regionHistogramDataArray = [];
        let momentResponse: any;
        let regionHistogramDataResponse: any;
        describe(`Moment generator`, () => {
            test(`Receive a series of moment progress`, async () => {
                await sleep(200);
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramDataArray.push(data)
                            resolve(regionHistogramDataArray)
                        }
                    })
                });
                momentResponse = await msgController.requestMoment(assertItem.momentRequest);
                regionHistogramDataResponse = await regionHistogramDataPromise;
                FileId = regionHistogramDataResponse.map(data => data.fileId);
            }, momentTimeout);

            test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, () => {
                expect(regionHistogramDataResponse.length).toEqual(assertItem.momentRequest.moments.length);
            });

            test(`Assert MomentResponse.success = true`, () => {
                expect(momentResponse.success).toBe(true);
            });

            test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`, () => {
                expect(momentResponse.openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
            });

            test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
                momentResponse.openFileAcks.map(ack => {
                    expect(ack.success).toBe(true);
                });
            });
        });

        describe(`Save images`, () => {
            let saveFileAck: any[] = [];
            for (let i = 0; i < assertItem.saveFile.length; i++) {
                for (let j = 0; j < assertItem.saveFile[i].length; j++) {
                    test(`Save moment generated image ${assertItem.saveFile[i][j].outputFileName}`, async () => {
                        assertItem.saveFile[i][j].outputFileDirectory = basepath + "/" + assertItem.saveFile[i][j].outputFileDirectory
                        let saveFileResponse = await msgController.saveFile(FileId[j], assertItem.saveFile[i][j].outputFileDirectory, assertItem.saveFile[i][j].outputFileName, assertItem.saveFile[i][j].outputFileType);
                        saveFileAck.push(saveFileResponse);
                        await sleep(200);
                        expect(saveFileAck.slice(-1)[0].fileId).toEqual(FileId[j]);
                    }, saveFileTimeout);
                }
            }
    
            test(`Assert all message.success = true`, () => {
                saveFileAck.map((ack, index) => {
                    expect(ack.success).toBe(true);
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});