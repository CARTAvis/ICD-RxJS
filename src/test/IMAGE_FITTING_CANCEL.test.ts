import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let imageFittingTimeout: number = config.timeout.imageFitting;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    fittingRequest: CARTA.IFittingRequest[];
    fittingResponse: CARTA.IFittingResponse[];
    stopFittingRequest: CARTA.IStopFitting;
    precisionDigits: number;
    imageFittingCancelMessage: string;
    setRegion: CARTA.ISetRegion;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex-channel0-addOneGaussian.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],    
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    fittingRequest: [
        {
            fileId: 0,
            createModelImage: false,
            createResidualImage: false,
            fixedParams: [false, false, false, false, false, false, true],
            fovInfo: null,
            regionId: 1, 
            initialValues: [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}],
            solver: 1,
            offset: 0,
        },
    ],
    fittingResponse: [
        {
            resultValues: [
                {
                    center: {x: 319.4995814506346, y: 399.4997816490029}, 
                    amp: 9.999559472737332,
                    fwhm: {x: 170.63727122575295, y: 41.48182201673784},
                    pa: 142.16266600131718
                }
            ],
            resultErrors: [
                {
                    center: {x: 0.03177656071417453, y: 0.039755818910110687},
                    amp: 0.008664186974964344,
                    fwhm: {x: 0.11652345959114739, y: 0.028032438027312902},
                    pa: 0.01804504831105634
                }
            ],
            success: true,
            log: 'Gaussian fitting with 1 component'
        },
    ],
    stopFittingRequest: {
        fileId: 0,
    },
    precisionDigits: 2,
    imageFittingCancelMessage: 'task cancelled',
    setRegion: {
        fileId: 0,
        regionId: 1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 324, y: 398 }, { x: 270, y: 270 }],
            rotation: 0,
        }
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('sleep!') });
}

let basepath: string;
describe("IMAGE_FITTING_CANCEL test: Testing cancel function in image fitting.", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + "/" + assertItem.filelist.directory;
        });

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            describe(`(Step 0) Initialization: open the image`, () => {
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    msgController.closeFile(-1);
                    msgController.closeFile(0);
                    let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
                    expect(OpenFileResponse.success).toEqual(true);
                    let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
                }, openFileTimeout);
    
                test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                    msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                    let RasterTileData = await Stream(CARTA.RasterTileData,3); //RasterTileData * 1 + RasterTileSync * 2
                    msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                    let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
                }, openFileTimeout);

                test(`Set a region:`, async () => {
                    let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion.fileId, assertItem.setRegion.regionId, assertItem.setRegion.regionInfo);
                    expect(setRegionAckResponse.regionId).toEqual(1);
                    expect(setRegionAckResponse.success).toEqual(true);
                });
            });

            describe(`(Step 1) Request 1st image fitting, and send stop request:`, ()=>{
                test(`Send Image fitting request and cancel image fitting after receiving 10 fittingProgressStream`, async()=>{
                    let imageFittingProgressArray = [];
                    let imageFittingProgressReponse : any;
                    let count = 0;
                    let imageFittingProgressPromise = new Promise((resolve)=>{
                        msgController.fittingProgressStream.subscribe({
                            next: (data) => {
                                count++;
                                console.log('Image Fitting progress :', data.progress);
                                imageFittingProgressArray.push(data)
                                if (count == 10) {
                                    msgController.cancelRequestingFitting(assertItem.stopFittingRequest.fileId)
                                    resolve('cancel fitting')
                                }
                            },
                        });
                    });
            
                    try {
                        let response = await msgController.requestFitting(assertItem.fittingRequest[0]);
                    } catch (err) {
                        expect(err).toContain(assertItem.imageFittingCancelMessage);
                    } 
                    imageFittingProgressReponse = await imageFittingProgressPromise;
                    
                },imageFittingTimeout);
            });

            describe(`(Step 2) Request Image fitting again and let it finish:`, ()=>{
                test(`Send Image fitting request again, let the fitting request finished and matching the result`, async()=>{
                    await sleep(3000);
            
                    let response2 = await msgController.requestFitting(assertItem.fittingRequest[0]);

                    expect(response2.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response2.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response2.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response2.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response2.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response2.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response2.success).toEqual(assertItem.fittingResponse[0].success);
                    expect(response2.resultErrors[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].center.x, assertItem.precisionDigits);
                    expect(response2.resultErrors[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].center.y, assertItem.precisionDigits);
                    expect(response2.resultErrors[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].amp, assertItem.precisionDigits);
                    expect(response2.resultErrors[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].fwhm.x, assertItem.precisionDigits);
                    expect(response2.resultErrors[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].fwhm.y, assertItem.precisionDigits);
                    expect(response2.resultErrors[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].pa, assertItem.precisionDigits);
                    expect(response2.log).toContain(assertItem.fittingResponse[0].log);
                },imageFittingTimeout)
            })

            test(`close file`, async () => {
                msgController.closeFile(-1);
            }, connectTimeout);
        });
        afterAll(() => msgController.closeConnection());
    });
});