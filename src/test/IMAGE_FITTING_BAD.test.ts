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
                    center: {x: 0.14270290674700617, y: 0.03926940295174565},
                    amp: 0.011881771744524577,
                    fwhm: {x: 0.045959932685532584, y: 0.18286860946141664},
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
                    center: {x: 101.25754777255497, y: 289.50143388893946}, 
                    amp: 0.20980810056293095,
                    fwhm: {x: 4.831878951840909, y: -0.13027624912739558},
                    pa: 270.12676256733675
                }, 
                {
                    center: {x: 324.34784293804995, y: 324.3488176351443}, 
                    amp: 9.995468914523238,
                    fwhm: {x: 29.399978883356663, y: 117.51285901668908},
                    pa: 0.5307253505485405
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.1423816628460514, y: 0.03918068073755874},
                    amp: 0.0116739400572081767,
                    fwhm: {x: 0.04547626539798418, y: 0.1796625783242974},
                    pa: 0.005286464774864215
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
    fittingResponseMacOS12: [
        {
            resultValues: [
                {
                    center: {x: 129.52934425744016, y: 285.4183410816301}, 
                    amp: 0.4657574006276674,
                    fwhm: {x: -1.0178734138400989, y: 0.0643954893477044},
                    pa: 356.65196671978725
                }, 
                {
                    center: {x: 324.3426307770264, y: 324.34813278164734}, 
                    amp: 9.995057596365545,
                    fwhm: {x: 29.40129200278109, y: 117.49460686897025},
                    pa: 0.5241778093682095
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.14270290674700617, y: 0.03926940295174565},
                    amp: 0.011881771744524577,
                    fwhm: {x: 0.045959932685532584, y: 0.18286860946141664},
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
    fittingResponseMacOS13Intel: [
        {
            resultValues: [
                {
                    center: {x: 136.49556911082368, y: 278.08008022648016}, 
                    amp: 0.2414428639733735,
                    fwhm: {x: -0.035086268932571996, y: 1.011727212842695},
                    pa: 271.18864267723285
                }, 
                {
                    center: {x: 324.3598704687632, y: 324.34942213905913}, 
                    amp: 9.995537508226132,
                    fwhm: {x: 29.405181974640342, y: 117.48854907348138},
                    pa: 0.5265650438721612
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.14246835955239062, y: 0.0391787062010038},
                    amp: 0.011865601682753666,
                    fwhm: {x: 0.04589568731464764, y: 0.18529292212690812},
                    pa: 0.004632250668430636
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
    fittingResponseMacOS13M1: [
        {
            resultValues: [
                {
                    center: {x: 139.88828927260894, y: 285.63743853031957}, 
                    amp: -0.09046278591104534,
                    fwhm: {x: -0.7281890831651717, y: -0.10089592905045275},
                    pa: 109.78802516494271
                }, 
                {
                    center: {x: 324.3452616872527, y: 324.3493423440347}, 
                    amp: 9.996084410000183,
                    fwhm: {x: 29.39775151995946, y: 117.47356948279578},
                    pa: 0.5470083928473619
                }
            ],
            resultErrors: [
                {
                    center: {x: 16160262987404282000, y:2.6053708763051396e+21},
                    fwhm: {},
                    pa:1.0280825445404448e+23
                },
                {
                    center: {x: 0.14349869564476797, y: 0.039352289800575986},
                    amp: 0.012355048218821756,
                    fwhm: {x: 0.06293761631405334, y: 0.17994623248919553},
                    pa: 0.0048896212175092825
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
    fittingResponseLinux: [
        {
            resultValues: [
                {
                    center: {x: 135.44304395891785, y: 279.2872847693339}, 
                    amp: 0.3679796147238359,
                    fwhm: {x: 0.10606045985196957, y: 0.28676758030525856},
                    pa: 280.48905602819553
                }, 
                {
                    center: {x: 324.3493469406151, y: 324.34873891574335}, 
                    amp: 9.99701377626984,
                    fwhm: {x: 29.399853003901757, y: 117.47343456730091},
                    pa: 0.5291923527559826
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.14270290674700617, y: 0.03926940295174565},
                    amp: 0.011881771744524577,
                    fwhm: {x: 0.045959932685532584, y: 0.18286860946141664},
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
    fittingResponseUbuntu2204: [
        {
            resultValues: [
                {
                    center: {x: 141.19569242428403, y: 274.468080399765}, 
                    amp: 0.0073312614530695805,
                    fwhm: {x: 1.8888434341244704, y: 0.003414731271306315},
                    pa: 289.1517791897806
                }, 
                {
                    center: {x: 324.34387675503626, y: 324.3494127204754}, 
                    amp: 9.995719972488988,
                    fwhm: {x: 29.395209261545435, y: 117.53236329753543},
                    pa: 0.5369662783821492
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.14270290674700617, y: 0.03926940295174565},
                    amp: 0.011794239703922002,
                    fwhm: {x: 0.045959932685532584, y: 0.18286860946141664},
                    pa: 0.004197561925501329
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

                // if (MacOSNumber === "11.6.1" && platformOS === 'macOS') {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponseMacOS110601[0].success);

                //     expect(response.resultErrors[0].center.x).toEqual(0);
                //     expect(response.resultErrors[0].center.y).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponseMacOS110601[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponseMacOS110601[0].message);
                // } else if (Math.floor(MacOSNumber) === 12 && platformOS === 'macOS' && MacChipM1 === true) {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponseMacOS12[0].success);

                //     expect(response.resultErrors[0].center.x).toEqual(0);
                //     expect(response.resultErrors[0].center.y).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponseMacOS12[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponseMacOS12[0].message);
                // } else if (Math.floor(MacOSNumber) === 13 && platformOS === 'macOS' && MacChipM1 === true) {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponseMacOS13M1[0].success);

                //     expect(response.resultErrors[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[0].pa, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13M1[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponseMacOS13M1[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponseMacOS13M1[0].message);
                // } else if (Math.floor(MacOSNumber) === 13 && platformOS === 'macOS' && MacChipM1 === false) {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponseMacOS13Intel[0].success);

                //     expect(response.resultErrors[0].center.x).toEqual(0);
                //     expect(response.resultErrors[0].center.y).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS13Intel[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponseMacOS13Intel[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponseMacOS13Intel[0].message);
                // } else if (platformOS === 'Linux' && isUbunutu2204orRedHat9 === false) {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponseLinux[0].success);

                //     expect(response.resultErrors[0].center.x).toEqual(0);
                //     expect(response.resultErrors[0].center.y).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponseLinux[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponseLinux[0].message);
                // } else if (platformOS === 'Linux' && isUbunutu2204orRedHat9 === true) {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponseUbuntu2204[0].success);

                //     expect(response.resultErrors[0].center.x).toEqual(0);
                //     expect(response.resultErrors[0].center.y).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponseUbuntu2204[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponseUbuntu2204[0].message);
                // } else {
                //     expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].pa, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].amp, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].pa, assertItem.precisionDigits);
                //     expect(response.success).toEqual(assertItem.fittingResponse[0].success);

                //     expect(response.resultErrors[0].center.x).toEqual(0);
                //     expect(response.resultErrors[0].center.y).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.x).toEqual(0);
                //     expect(response.resultErrors[0].fwhm.y).toEqual(0);
                //     expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].center.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].center.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].amp, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                //     expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                //     expect(response.log).toContain(assertItem.fittingResponse[0].log);
                //     expect(response.message).toContain(assertItem.fittingResponse[0].message);
                // }
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