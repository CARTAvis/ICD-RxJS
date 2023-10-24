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
                    center: {x: 134.71901545254707, y: 280.5806035857425}, 
                    amp: 0.32324384579078735,
                    fwhm: {x: 0.11156025893790322, y: 0.24300739457731213},
                    pa: 269.765289976127
                }, 
                {
                    center: {x: 324.3521444187749, y: 324.3491586869771}, 
                    amp: 9.99634021928039,
                    fwhm: {x: 29.398134914496783, y: 117.48901863716506},
                    pa: 0.5342657009476233
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
                    center: {x: 133.68963395314788, y: 279.4296558916677}, 
                    amp: 0.3051940682010388,
                    fwhm: {x: 0.9918277059980043, y: 0.10724962636867277},
                    pa: 270.34921504256135
                }, 
                {
                    center: {x: 324.35325414270676, y: 324.3486351500509}, 
                    amp: 9.998129592410757,
                    fwhm: {x: 29.401693377698905, y: 117.46523145735479},
                    pa: 0.5400323304359984
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
                    center: {x: 133.4184530167203, y: 280.52502826230335}, 
                    amp: 0.25241074009104447,
                    fwhm: {x: 0.24917287151473577, y: 0.20202155323899262},
                    pa: 271.65734710218123
                }, 
                {
                    center: {x: 324.3500898741599, y: 324.34882505943415}, 
                    amp: 9.998730466240248,
                    fwhm: {x: 29.40086746322177, y: 117.48600516164915},
                    pa: 0.5286898742437943
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
                    center: {x: 136.76553013744936, y: 279.50635164812815}, 
                    amp: 0.36574294260117873,
                    fwhm: {x: 1.1387893241134832, y: 0.18890294966851637},
                    pa: 270.8147167298713
                }, 
                {
                    center: {x: 324.34924142407914, y: 324.34970453785337}, 
                    amp: 9.997706868406881,
                    fwhm: {x: 29.3988719098713, y: 117.49522726645462},
                    pa: 0.5372354225396865
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
                    center: {x: 133.4184530167203, y: 280.52502826230335}, 
                    amp: 0.25241074009104547,
                    fwhm: {x: 0.24917287151474088, y: 0.20202155323899124},
                    pa: 271.6573471021813
                }, 
                {
                    center: {x: 324.35415486029046, y: 324.3493042512026}, 
                    amp: 9.996523847544967,
                    fwhm: {x: 29.402929410267397, y: 117.47664910355407},
                    pa: 0.5456977999242042
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
                    center: {x: 136.37672823927974, y: 279.5037991104328}, 
                    amp: 0.2904618522435351,
                    fwhm: {x: 1.9853484080837196, y: 0.146547210359357},
                    pa: 269.45997949821316
                }, 
                {
                    center: {x: 324.3496961381463, y: 324.34883759659834}, 
                    amp: 9.997264701948565,
                    fwhm: {x: 29.393895344533018, y: 117.4720630755205},
                    pa: 0.536583218147941
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
                    center: {x: 135.6039671553926, y: 279.3982090340097}, 
                    amp: 0.2667783422848237,
                    fwhm: {x: 0.00663387750450295, y: 0.25375495985499164},
                    pa: 268.82156926726475
                }, 
                {
                    center: {x: 324.3548469822517, y: 324.3493131416585}, 
                    amp: 9.996067823419335,
                    fwhm: {x: 29.404786487293283, y: 117.49510621189104},
                    pa: 0.5401367844577657
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

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
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

                    expect(response.resultErrors[0].center.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].center.y).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.x).toBeCloseTo(0);
                    expect(response.resultErrors[0].fwhm.y).toBeCloseTo(0);
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