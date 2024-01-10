import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let readFileTimeout = config.timeout.readFile;
let openFileTimeout: number = config.timeout.openFile;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.IImportRegionAck[];
};

let assertItem: AssertItem = {
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 0,
    importRegion:
        [
            {
                groupId: 0,
                type: CARTA.FileType.DS9_REG,
                file: "M17_SWex_regionSet1_world_v4.reg",
            },
            {
                groupId: 0,
                type: CARTA.FileType.DS9_REG,
                file: "M17_SWex_regionSet1_pix_v4.reg",
            },
        ],
    importRegionAck: [
        {
            success: true,
            regions: {
                '1': {
                    controlPoints: [{ x: -103.80, y: 613.10 }],
                    regionType: CARTA.RegionType.POINT,
                    rotation: 0,
                },
                '2': {
                    controlPoints: [{ x: -106.40, y: 528.9 }, { x: 75.10, y: 75.10 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '3': {
                    controlPoints: [{ x: -118.00, y: 412.40 }, { x: 137.20, y: 54.40 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '4': {
                    controlPoints: [{ x: -120.60, y: 251.90 }, { x: 173.50, y: 44.00 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '5': {
                    controlPoints: [{ x: 758.30, y: 635.10 }, { x: 50.50, y: 50.50 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '6': {
                    controlPoints: [{ x: 749.30, y: 486.20 }, { x: 29.80, y: 69.90, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '7': {
                    controlPoints: [{ x: 745.40, y: 369.70 }, { x: 18.10, y: 79.00, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '8': {
                    controlPoints: [{ x: 757.00, y: 270.10 }, { x: 715.60, y: 118.60 }, { x: 829.50, y: 191.10 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
                '9': {
                    controlPoints: [{ x: 175.80, y: 591.10 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '10': {
                    controlPoints: [{ x: 168.00, y: 519.90 }, { x: 57.00, y: 57.00 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '11': {
                    controlPoints: [{ x: 130.50, y: 429.30 }, { x: 121.70, y: 36.208 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '12': {
                    controlPoints: [{ x: 100.70, y: 284.30 }, { x: 137.20, y: 36.20 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '13': {
                    controlPoints: [{ x: 496.80, y: 574.30 }, { x: 49.20, y: 49.20 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '14': {
                    controlPoints: [{ x: 533.10, y: 435.70 }, { x: 25.90, y: 69.90, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '15': {
                    controlPoints: [{ x: 522.70, y: 307.60 }, { x: 22.00, y: 80.30, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '16': {
                    controlPoints: [{ x: 491.60, y: 228.60 }, { x: 416.50, y: 110.80 }, { x: 586.10, y: 106.90 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
            },
        },
        {
            success: true,
            regions: {
                '17': {
                    controlPoints: [{ x: -103.80, y: 613.10 }],
                    regionType: CARTA.RegionType.POINT,
                    rotation: 0,
                },
                '18': {
                    controlPoints: [{ x: -106.40, y: 528.9 }, { x: 75.10, y: 75.10 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '19': {
                    controlPoints: [{ x: -118.00, y: 412.40 }, { x: 137.20, y: 54.40 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '20': {
                    controlPoints: [{ x: -120.6, y: 251.9 }, { x: 173.5, y: 44.0 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '21': {
                    controlPoints: [{ x: 758.30, y: 635.10 }, { x: 50.50, y: 50.50 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '22': {
                    controlPoints: [{ x: 749.30, y: 486.20 }, { x: 29.80, y: 69.90, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '23': {
                    controlPoints: [{ x: 745.40, y: 369.70 }, { x: 18.10, y: 79.00, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '24': {
                    controlPoints: [{ x: 757.00, y: 270.10 }, { x: 715.60, y: 118.60 }, { x: 829.50, y: 191.10 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
                '25': {
                    controlPoints: [{ x: 175.80, y: 591.10 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '26': {
                    controlPoints: [{ x: 168.00, y: 519.90 }, { x: 57.00, y: 57.00 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '27': {
                    controlPoints: [{ x: 130.50, y: 429.30 }, { x: 121.70, y: 36.208 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '28': {
                    controlPoints: [{ x: 100.70, y: 284.30 }, { x: 137.20, y: 36.20 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '29': {
                    controlPoints: [{ x: 496.80, y: 574.30 }, { x: 49.20, y: 49.20 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '30': {
                    controlPoints: [{ x: 533.10, y: 435.70 }, { x: 25.90, y: 69.90, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '31': {
                    controlPoints: [{ x: 522.70, y: 307.60 }, { x: 22.00, y: 80.30, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '32': {
                    controlPoints: [{ x: 491.60, y: 228.60 }, { x: 416.50, y: 110.80 }, { x: 586.10, y: 106.90 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
            },
        },
    ],
};

describe("DS9_REGION_IMPORT_INTERNAL: Testing import of DS9 region files made with CARTA", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        }, readFileTimeout);
    });

    describe(`Open the file "${assertItem.openFile.file}"`, () => {
        let regionHistogramData = [];
        test(`Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let regionHistogramDataPromise = new Promise((resolve)=>{
                msgController.histogramStream.subscribe({
                    next: (data) => {
                        regionHistogramData.push(data)
                        resolve(regionHistogramData)
                    }
                })
            });
            OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let RegionHistogramData = await regionHistogramDataPromise;
        
            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
        }, openFileTimeout);

        assertItem.importRegionAck.map((regionAck, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: any;
                let importRegionAckProperties: any[];
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    assertItem.importRegion[idxRegion].directory = basepath + "/" + regionSubdirectory
                    importRegionAck = await msgController.importRegion(assertItem.importRegion[idxRegion].directory ,assertItem.importRegion[idxRegion].file, assertItem.importRegion[idxRegion].type, assertItem.importRegion[idxRegion].groupId )
                    importRegionAckProperties = Object.keys(importRegionAck.regions);
                    if (importRegionAck.message != '') {
                        console.log(importRegionAck.message);
                    }
                }, importTimeout);

                test(`IMPORT_REGION_ACK.success = ${regionAck.success}`, () => {
                    expect(importRegionAck.success).toBe(regionAck.success);
                });

                test(`Length of IMPORT_REGION_ACK.region = ${Object.keys(regionAck.regions).length}`, () => {
                    expect(importRegionAckProperties.length).toEqual(Object.keys(regionAck.regions).length);
                });

                Object.keys(regionAck.regions).map((region, index) => {
                    test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region}, Type:${CARTA.RegionType[regionAck.regions[region].regionType]}"`, () => {
                        expect(importRegionAckProperties[index]).toEqual(String(region));
                        expect(importRegionAck.regions[importRegionAckProperties[index]].regionType).toEqual(regionAck.regions[region].regionType);
                        if (regionAck.regions[region].rotation) {
                            expect(importRegionAck.regions[importRegionAckProperties[index]].rotation).toBeCloseTo(regionAck.regions[region].rotation);
                        };
                        importRegionAck.regions[importRegionAckProperties[index]].controlPoints.map((point, idx) => {
                            expect(point.x).toBeCloseTo(regionAck.regions[region].controlPoints[idx].x, assertItem.precisionDigits);
                            expect(point.y).toBeCloseTo(regionAck.regions[region].controlPoints[idx].y, assertItem.precisionDigits);
                        });
                    });
                });
            });
        })
    });
    afterAll(() => msgController.closeConnection());
});