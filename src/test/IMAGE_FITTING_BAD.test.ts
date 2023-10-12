import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { execSync } from "child_process";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let imageFittingTimeout: number = config.timeout.imageFitting;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    fittingRequest: CARTA.IFittingRequest[];
    fittingResponse: CARTA.IFittingResponse[];
    fittingResponseMacOS110601: CARTA.IFittingResponse[];
    fittingResponseMacOS12: CARTA.IFittingResponse[];
    fittingResponseMacOS13Intel: CARTA.IFittingResponse[];
    fittingResponseMacOS13M1: CARTA.IFittingResponse[];
    fittingResponseLinux: CARTA.IFittingResponse[];
    fittingResponseUbuntu2204: CARTA.IFittingResponse[];
    precisionDigits: number;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "ThreeComponent-inclined-2d-gaussian.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },    
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    fittingRequest: [
        {
            createModelImage: false,
            createResidualImage: false,
            fileId: 0,
            fixedParams: [false, false, false, false, false, false, false, false, false, false, false, false, true],
            fovInfo: null,
            regionId: -1, 
            initialValues: [
                {amp: 1, center: {x: 164, y: 280}, fwhm: {x: 100, y: 5}, pa: 270}, 
                {amp: 1, center: {x: 220, y: 270}, fwhm: {x: 30, y: 100}, pa: 45}, 
            ],
            solver: 1,
            offset: 0,
        },
        {
            createModelImage: false,
            createResidualImage: false,
            fileId: 0,
            fixedParams: [false, false, false, false, false, false, true],
            fovInfo: null,
            regionId: -1, 
            initialValues: [{amp: 10, center: {x: 1000, y: 280}, fwhm: {x: 100, y: 5}, pa: 270}],
            solver: 1,
            offset: 0,
        }
    ],
    fittingResponse: [
        {
            resultValues: [
                {
                    center: {x: 137.38653112387235, y: 279.4981126459642}, 
                    amp: 0.4154252260972863,
                    fwhm: {x: 4.621008222932152, y: 0.17833738966389817},
                    pa: 269.8859608973245
                }, 
                {
                    center: {x: 324.34275275632024, y: 324.34873891574335}, 
                    amp: 9.99701377626984,
                    fwhm: {x: 29.399853003901757, y: 117.47303700274334},
                    pa: 0.5342821807532023
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 2.6460482230020513e-9, y: 6.626869826553853e-10},
                    amp: 5.303135956592168e-10,
                    fwhm: {x: 1.5594807132289487e-9, y: 6.2312247312355106e-9},
                    pa: 0.0049460116505525625
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
        {
            resultValues: [],
            resultErrors: [],
            success: true,
            message: 'fit did not converge'
        }
    ],
    fittingResponseMacOS110601:  [
        {
            resultValues: [
                {
                    center: {x: 126.24520373457794, y: 281.01284636648023}, 
                    amp: -0.40320994041380914,
                    fwhm: {x: -0.049009166755163314, y: -0.06419367220631492},
                    pa: 262.52401250579095
                }, 
                {
                    center: {x: 324.3471436722692, y: 324.3485568907615}, 
                    amp: 9.99626612349591,
                    fwhm: {x: 29.397309361478744, y: 117.50616421197844},
                    pa: 0.5159782022909046
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 2.6469073879195015e-9, y: 6.626218916661896e-10},
                    amp: 5.302615518052789e-10,
                    fwhm: {x: 1.5594085519870113e-9, y: 6.2332275083467686e-9},
                    pa: 1.147113972816126e-9
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
    ],
    fittingResponseMacOS12: [
        {
            resultValues: [
                {
                    center: {x: 131.73852523177715, y: 279.49700153311375}, 
                    amp: 0.2702911043209064,
                    fwhm: {x: 3.3916396328623564, y: 0.16342490216882044},
                    pa: 269.38597981013845
                }, 
                {
                    center: {x: 324.3522354755093, y: 324.34874853324305}, 
                    amp: 9.997657580387253,
                    fwhm: {x: 29.4002254920355, y: 117.48566674597177},
                    pa: 0.5210121850843422
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 2.6461749462157232e-9, y: 6.626279656060305e-10},
                    amp: 5.302815060054006e-10,
                    fwhm: {x: 1.5594048631350577e-9, y: 6.231507310104269e-9},
                    pa: 1.1473533301969971e-9
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
    ],
    fittingResponseMacOS13Intel: [
        {
            resultValues: [
                {
                    center: {x: 135.48814745127947, y: 280.4081908832589}, 
                    amp: 0.39565466359077145,
                    fwhm: {x: 1.8422383959469286, y: 0.01776596312117093},
                    pa: 269.94827629559535
                }, 
                {
                    center: {x: 324.34745973151905, y: 324.3486697952626}, 
                    amp: 9.996599026123887,
                    fwhm: {x: 29.396858662561396, y: 117.48132877819968},
                    pa: 0.5157058198280735
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 2.6465599150911108e-9, y: 6.626641860809681e-10},
                    amp: 5.303216624960029e-10,
                    fwhm: {x: 1.5595094809093706e-9, y: 6.232408985003761e-9},
                    pa: 1.147460776442933e-9
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
    ],
    fittingResponseMacOS13M1: [
        {
            resultValues: [
                {
                    center: {x: 131.73852523177715, y: 279.49700153311375}, 
                    amp: 0.2702911043209056,
                    fwhm: {x: 3.3916396328623506, y: 0.16342490216882155},
                    pa: 269.38597981013845
                }, 
                {
                    center: {x: 324.3522354755093, y: 324.34874853324305}, 
                    amp: 9.997657580387251,
                    fwhm: {x: 29.4002254920355, y: 117.48566674597177},
                    pa: 0.5210121850843422
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {}
                },
                {
                    center: {x: 2.6461749462157237e-9, y: 6.626279656060306e-10},
                    amp: 5.302815060054006e-10,
                    fwhm: {x: 1.559404863135058e-9, y: 6.231507310104271e-9},
                    pa: 1.1473533301969971e-9
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
    ],
    fittingResponseLinux: [
        {
            resultValues: [
                {
                    center: {x: 131.22830254633894, y: 279.5204268875009}, 
                    amp: 0.3893859590687304,
                    fwhm: {x: -0.3077265162957777, y: 0.17292286190463807},
                    pa: 269.27636311071603
                }, 
                {
                    center: {x: 324.3553142692332, y: 324.3493844237152}, 
                    amp: 9.995244552415132,
                    fwhm: {x: 29.40426103098145, y: 117.49294428949506},
                    pa: 0.5366536550079546
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 2.646707864394448e-9, y: 6.628377900916031e-10},
                    amp: 5.30228693940221e-10,
                    fwhm: {x: 1.5598400660409465e-9, y: 6.232777004216184e-9},
                    pa: 1.147613998115689e-9
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
    ],
    fittingResponseUbuntu2204: [
        {
            resultValues: [
                {
                    center: {x: 1040.8290607922947, y: 318.1424610658663}, 
                    amp: 0.3378970051535388,
                    fwhm: {x: -682.8189818197304, y: 7.346474069762189},
                    pa: 338.2100075009321
                }, 
                {
                    center: {x: 324.35187056418823, y: 324.3484712737422}, 
                    amp: 9.996963949794086,
                    fwhm: {x: 29.40611215758184, y: 117.4975572537292},
                    pa: 0.5352608476716524
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 2.646221869634662e-9, y: 6.627293636592795e-10},
                    amp: 5.30201596436001e-10,
                    fwhm: {x: 1.55959026052576e-9, y: 6.231631197843904e-9},
                    pa: 1.1473887943482772e-9
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
    ],
    precisionDigits: 2,
};

let platformOS: String;
let MacOSNumber: any;
let MacOSNumberResponse: any;
let chipVersion: any;
let ubuntuNumber: any;
let isUbunutu2204orRedHat9: boolean;
let MacChipM1: boolean = false;
let basepath: string;
describe("IMAGE_FITTING_FITS test: Testing Image Fitting (with and without fov) with fits file.", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            let registerViewerAck = await msgController.connect(testServerUrl);
            platformOS = registerViewerAck.platformStrings.platform;
            if (platformOS === "macOS") {
                chipVersion = String(execSync('uname -m',{encoding: 'utf-8'}));
                if (chipVersion.toString().includes("arm64")) {
                    MacChipM1 = true;
                };
                MacOSNumberResponse = String(execSync('sw_vers -productVersion',{encoding: 'utf-8'}));
                MacOSNumber = Number(MacOSNumberResponse.slice(0,2));
                if (MacOSNumberResponse.toString().includes('11.6.1')) {
                    MacOSNumber = '11.6.1';
                }
            }
            if (platformOS === "Linux"){
                let Response = String(execSync('lsb_release -a',{encoding: 'utf-8'}));
                isUbunutu2204orRedHat9 = Response.includes("22.04") || Response.includes("Red Hat Enterprise Linux 9.0");
            }
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
                    msgController.addRequiredTiles(assertItem.addTilesReq);
                    let RasterTileData = await Stream(CARTA.RasterTileData,3); //RasterTileData * 1 + RasterTileSync * 2
                    msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                    let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
                }, openFileTimeout);
            });

            
        });

        describe(`(Case 1) Image fitting: exceeded max number of iterations`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                let response = await msgController.requestFitting(assertItem.fittingRequest[0]);
                console.log(MacOSNumber);
                console.log(platformOS);

                console.log('response.resultValues[0].center.x', response.resultValues[0].center.x);
                console.log('response.resultValues[0].center.y', response.resultValues[0].center.y);
                console.log('response.resultValues[0].amp', response.resultValues[0].amp);
                console.log('response.resultValues[0].fwhm.x', response.resultValues[0].fwhm.x);
                console.log('response.resultValues[0].fwhm.y', response.resultValues[0].fwhm.y);
                console.log('response.resultValues[0].pa', response.resultValues[0].pa);
                console.log('response.resultValues[1].center.x', response.resultValues[1].center.x);
                console.log('response.resultValues[1].center.y', response.resultValues[1].center.y);
                console.log('response.resultValues[1].amp', response.resultValues[1].amp);
                console.log('response.resultValues[1].fwhm.x', response.resultValues[1].fwhm.x);
                console.log('response.resultValues[1].fwhm.y', response.resultValues[1].fwhm.y);
                console.log('response.resultValues[1].pa', response.resultValues[1].pa);
                console.log('response.success', response.success);

                console.log('response.resultErrors[0].center.x', response.resultErrors[0].center.x);
                console.log('response.resultErrors[0].center.y', response.resultErrors[0].center.y);
                console.log('response.resultErrors[0].fwhm.x', response.resultErrors[0].fwhm.x);
                console.log('response.resultErrors[0].fwhm.y', response.resultErrors[0].fwhm.y);
                console.log('response.resultErrors[1].center.x', response.resultErrors[1].center.x);
                console.log('response.resultErrors[1].center.y', response.resultErrors[1].center.y);
                console.log('response.resultErrors[1].amp', response.resultErrors[1].amp);
                console.log('response.resultErrors[1].fwhm.x', response.resultErrors[1].fwhm.x);
                console.log('response.resultErrors[1].fwhm.y', response.resultErrors[1].fwhm.y);
                console.log('response.resultErrors[1].pa', response.resultErrors[1].pa);
                
                console.log('response.log', response.log);
                console.log('response.message', response.message);

                if (MacOSNumber === "11.6.1" && platformOS === 'macOS') {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseMacOS110601[0].success);

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseMacOS110601[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseMacOS110601[0].message);
                } else if (Math.floor(MacOSNumber) === 12 && platformOS === 'macOS' && MacChipM1 === true) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseMacOS12[0].success);

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseMacOS12[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseMacOS12[0].message);
                } else if (Math.floor(MacOSNumber) === 13 && platformOS === 'macOS' && MacChipM1 === true) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseMacOS13M1[0].success);

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].pa).toBeCloseTo(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseMacOS13M1[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseMacOS13M1[0].message);
                } else if (Math.floor(MacOSNumber) === 13 && platformOS === 'macOS' && MacChipM1 === false) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseMacOS13Intel[0].success);

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseMacOS13Intel[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseMacOS13Intel[0].message);
                } else if (platformOS === 'Linux' && isUbunutu2204orRedHat9 === false) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseLinux[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(NaN);
                    expect(response.resultErrors[0].center.y).toEqual(NaN);
                    expect(response.resultErrors[0].fwhm.x).toEqual(NaN);
                    expect(response.resultErrors[0].fwhm.y).toEqual(NaN);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseLinux[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseLinux[0].message);
                } else if (platformOS === 'Linux' && isUbunutu2204orRedHat9 === true) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseUbuntu2204[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(NaN);
                    expect(response.resultErrors[0].center.y).toEqual(NaN);
                    expect(response.resultErrors[0].fwhm.x).toEqual(NaN);
                    expect(response.resultErrors[0].fwhm.y).toEqual(NaN);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseUbuntu2204[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseUbuntu2204[0].message);
                } else {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponse[0].success);

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponse[0].log);
                    expect(response.message).toContain(assertItem.fittingResponse[0].message);
                }
            },imageFittingTimeout)
        })

        describe(`(Case 2) Image fitting: fit did not converge`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                try {
                    await msgController.requestFitting(assertItem.fittingRequest[1])
                } catch (err) {
                    expect(err).toEqual(assertItem.fittingResponse[1].message)
                }
            },imageFittingTimeout)
        })

        test(`close file`, async () => {
            msgController.closeFile(-1);
        }, connectTimeout);

        afterAll(() => msgController.closeConnection());
    });
});