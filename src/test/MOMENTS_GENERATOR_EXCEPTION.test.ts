import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController, ConnectionStatus } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let momentTimeout = config.timeout.moment;

interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest[];
    setCursor: CARTA.ISetCursor;
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
    momentRequest: [
        {
            fileId: 0,
            regionId: -1,
            axis: CARTA.MomentAxis.SPECTRAL,
            keep: false,
            mask: CARTA.MomentMask.Include,
            moments: [1, 0, 2],
            pixelRange: { min: 0.1, max: 1.0 },
            spectralRange: { min: 73, max: 114 },
        },
        {
            fileId: 0,
            regionId: -1,
            axis: CARTA.MomentAxis.SPECTRAL,
            keep: false,
            mask: CARTA.MomentMask.Include,
            moments: [0, 1],
            pixelRange: { min: 0.1, max: 1.0 },
            spectralRange: { min: 73, max: 114 },
        },
    ],
    setCursor: {
        point: { x: 218, y: 218 },
    },
};

let basepath: string;
describe("MOMENTS_GENERATOR_EXCEPTION: Testing moments generator for exception", () => {
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

            let regionHistogramDataArray = [];
            let RegionHistogramResponse: any = [];
            let momentResponse: any;
            test(`Request 3 moment images`, async () => {
                await sleep(200);
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramDataArray.push(data)
                            resolve(regionHistogramDataArray)
                        }
                    })
                });
                momentResponse = await msgController.requestMoment(assertItem.momentRequest[0]);
                RegionHistogramResponse = await regionHistogramDataPromise;
                expect(RegionHistogramResponse.length).toEqual(assertItem.momentRequest[0].moments.length);
            });
        });

        let FileId: number[] = [];
        describe(`Moment generator again`, () => {
            let regionHistogramDataArray = [];
            let regionHistogramDataResponse: any = [];
            let momentResponse: any;
            let momentProgressArray = [];
            let momentProgressReponse: any;
            test(`Receive a series of moment progress & MomentProgress.progress < 1`, async () => {
                await sleep(200);
                let momentProgressPromise = new Promise((resolve)=>{
                    msgController.momentProgressStream.subscribe({
                        next: (data) => {
                            momentProgressArray.push(data);
                            resolve(momentProgressArray)
                        }
                    })
                })
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramDataArray.push(data)
                            resolve(regionHistogramDataArray)
                        }
                    })
                });
                momentResponse = await msgController.requestMoment(assertItem.momentRequest[1]);
                regionHistogramDataResponse = await regionHistogramDataPromise;
                expect(regionHistogramDataResponse.length).toEqual(assertItem.momentRequest[1].moments.length);
                momentProgressReponse = await momentProgressPromise;
                FileId = regionHistogramDataResponse.map(data => data.fileId);
                expect(momentProgressReponse.length).toBeGreaterThan(0);
            }, momentTimeout);

            test(`Receive ${assertItem.momentRequest[1].moments.length} REGION_HISTOGRAM_DATA`, () => {
                expect(FileId.length).toEqual(assertItem.momentRequest[1].moments.length);
            });

            test(`Assert MomentResponse.success = true`, () => {
                expect(momentResponse.success).toBe(true);
            });
    
            test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest[1].moments.length}`, () => {
                expect(momentResponse.openFileAcks.length).toEqual(assertItem.momentRequest[1].moments.length);
            });
    
            test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
                momentResponse.openFileAcks.map(ack => {
                    expect(ack.success).toBe(true);
                });
            });
        });

        describe(`Requset moment image`, () => {
            let SpatialProfileData: any;
            test(`Receive the image data until RasterTileSync.endSync = true`, async () => {
                msgController.addRequiredTiles({
                    fileId: FileId[1],
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                })
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData, 3);
            });

            test(`Receive SpatialProfileData`, async () => {
                msgController.setCursor(FileId[1], assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                SpatialProfileData = await Stream(CARTA.SpatialProfileData, 1);
            });

            test(`Assert SpatialProfileData[0].value`, () => {
                expect(SpatialProfileData[0].value).toBeCloseTo(1.8132938, assertItem.precisionDigit);
            });

            test(`Assert backend is still alive`, () => {
                let checkConnectionStatus = msgController.checkConnectionStatus();
                expect(checkConnectionStatus).toEqual(ConnectionStatus.ACTIVE);
            })

        });
        afterAll(() => msgController.closeConnection());
    });
});