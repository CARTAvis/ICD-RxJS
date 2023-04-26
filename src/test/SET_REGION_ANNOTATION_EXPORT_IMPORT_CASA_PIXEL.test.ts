import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { execSync } from "child_process";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let saveSubdirectory = config.path.save;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let importTimeout = config.timeout.import;
let exportTimeout = config.timeout.export;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    setRegion: CARTA.ISetRegion[];
    exportRegion: CARTA.IExportRegion;
    exportRegionAck: CARTA.IExportRegionAck;
    importRegion: CARTA.IImportRegion;
    importRegionAck: CARTA.IImportRegionAck;
};
let assertItem: AssertItem = {
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        fileId: 0,
        hdu: "0",
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 3,
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNPOINT,
                controlPoints: [{ x: 163, y: 565 }],
                rotation: 0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNLINE,
                controlPoints: [{x: 270, y: 618}, {x: 219, y: 560}],
                rotation: 318.95805304638026,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNRECTANGLE,
                controlPoints: [{x: 309, y: 587}, {x: 36, y: 44}],
                rotation: 0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNELLIPSE,
                controlPoints: [{x: 388, y: 587}, {x: 33.7, y: 11.9}],
                rotation: 0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNPOLYGON,
                controlPoints: [{x: 175.5794044665014, y: 511.6588089330025}, 
                    {x: 125.95161290322585, y: 464.01612903225805}, 
                    {x: 169.62406947890827, y: 446.1501240694789}, 
                    {x: 225.2071960297768, y: 464.01612903225805}, 
                    {x: 175.5794044665014, y: 471.95657568238215}
                    ],
                rotation: 0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNPOLYLINE,
                controlPoints: [{x: 265, y: 458}, {x: 299, y: 520}, {x: 324, y: 446}],
                rotation: 0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNVECTOR,
                controlPoints: [{x: 340, y: 533}, {x: 416, y: 474}],
                rotation: 52.177245850855,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNTEXT,
                controlPoints: [{x: 260.939208984375, y: 346.894500732421}, {x: 400.28278943386033, y: 107.19604796038084}],
                rotation: 45,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNCOMPASS,
                controlPoints: [{x: 157.71339950372214, y: 132.50248138957818}, {x: 100, y: 100}],
                rotation: 0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ANNRULER,
                controlPoints: [{x: 362, y: 219}, {x: 485, y: 285}],
                rotation: 0,
            }
        },
    ],
    exportRegion: {
        coordType: CARTA.CoordinateType.WORLD,
        file: "set_region_annotation_test_pixel.crtf",
        fileId: 0,
        type: CARTA.FileType.CRTF,
        regionStyles: {},
    },
    exportRegionAck: {
        contents: [],
        success: true
    },
    importRegion:
    {
        contents: [],
        directory: saveSubdirectory,
        file: "set_region_annotation_test_pixel.crtf",
        groupId: 0,
        type: CARTA.FileType.CRTF,
    },
    importRegionAck:
    {
        success: true,
        regions: {
            '11': {
                controlPoints: [{x: 163, y: 565}],
                regionType: CARTA.RegionType.ANNPOINT,
            },
            '12': {
                controlPoints: [{x: 270, y: 618}, {x: 219, y: 560}],
                regionType: CARTA.RegionType.ANNLINE,
                rotation: 318.95805304638026
            },
            '13': {
                controlPoints: [{x: 309, y: 587}, {x: 36, y: 44}],
                regionType: CARTA.RegionType.ANNRECTANGLE,
            },
            '14': {
                controlPoints: [{x: 388, y: 587}, {x: 33.7, y: 11.9}],
                regionType: CARTA.RegionType.ANNELLIPSE,
            },
            '15': {
                controlPoints: [{x: 175.5794044665014, y: 511.6588089330025}, 
                    {x: 125.95161290322585, y: 464.01612903225805}, 
                    {x: 169.62406947890827, y: 446.1501240694789}, 
                    {x: 225.2071960297768, y: 464.01612903225805}, 
                    {x: 175.5794044665014, y: 471.95657568238215}],
                regionType: CARTA.RegionType.ANNPOLYGON,
            },
            '16': {
                controlPoints: [{x: 265, y: 458}, {x: 299, y: 520}, {x: 324, y: 446}],
                regionType: CARTA.RegionType.ANNPOLYLINE,
            },
            '17': {
                controlPoints: [{x: 340, y: 533}, {x: 416, y: 474}],
                regionType: CARTA.RegionType.ANNVECTOR,
                rotation: 52.177245850855,
            },
            '18': {
                controlPoints: [{x: 260.939208984375, y: 346.8945007324219}, {x: 400.28278943386033, y: 107.19604796038084}],
                regionType: CARTA.RegionType.ANNTEXT,
                rotation: 45,
            },
            '19': {
                controlPoints: [{x: 157.71339950372214, y: 132.50248138957818}, {x: 100, y: 100}],
                regionType: CARTA.RegionType.ANNCOMPASS,
            },
            '20': {
                controlPoints: [{x: 362, y: 219}, {x: 485, y: 285}],
                regionType: CARTA.RegionType.ANNRULER,
            },
        },
        regionStyles: {
            '11': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {pointWidth: 1,fontStyle: 'bold',font: 'Helvetica',fontSize: 10} },
            '12': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontStyle: 'bold', font: 'Helvetica', fontSize: 10} },
            '13': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontStyle: 'bold', font: 'Helvetica', fontSize: 10} },
            '14': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontStyle: 'bold', font: 'Helvetica', fontSize: 10} },
            '15': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontStyle: 'bold', font: 'Helvetica', fontSize: 10} },
            '16': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontStyle: 'bold', font: 'Helvetica', fontSize: 10} },
            '17': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontStyle: 'bold', font: 'Helvetica', fontSize: 10} },
            '18': { name: "", color: '#FFBA01', lineWidth: 1, dashList: [0], annotationStyle: {font: "Helvetica", fontSize: 20, fontStyle: "Normal", textLabel0: "Double click to edit text", textPosition: 0} },
            '19': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {font: "Helvetica", fontSize: 20, fontStyle: "Normal", isEastArrow: true, isNorthArrow: true, textLabel0: "N", textLabel1: "E"} },
            '20': { name: "", color: '#FFBA01', lineWidth: 2, dashList: [0], annotationStyle: {fontSize: 13, fontStyle: 'normal', font: 'Helvetica'} },
        },
    },
};

let basepath: string;
describe("Testing set region ICD message to all annotation RegionTypes and export and import for CASA pixel format", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        afterAll(() => msgController.closeConnection());

        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
            test(`Preparation: Open image`,async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);

                msgController.addRequiredTiles(assertItem.addTilesRequire);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);
                msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
            }, openFileTimeout);

            test(`(Case 1) Set 10 annotation regions and receive the responses, then check the response:`, async () => {
                for (let index = 0; index < assertItem.setRegion.length; index++) {
                    let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[index].fileId, assertItem.setRegion[index].regionId, assertItem.setRegion[index].regionInfo);
                    expect(setRegionAckResponse.success).toEqual(true);
                    expect(setRegionAckResponse.regionId).toEqual(index + 1);
                };
            });

            test(`(Case 2) Export all annotation RegionTypes as crtf pixel (CASA region) format`, async () => {
                //Request the Export Region ICD message
                let exportRegionAck: any;
                let regionStyle = new Map<number, CARTA.IRegionStyle>().set(1, { name: '', color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(2, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(3, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(4, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(5, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(6, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(7, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {} });
                regionStyle.set(8, { name: "", color: '#FFBA01', lineWidth: 1, dashList: [], annotationStyle: {font: "Helvetica", fontSize: 20, fontStyle: "Normal", textLabel0: "Double click to edit text", textPosition: 0}});
                regionStyle.set(9, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {coordinateSystem: "PIXEL", font: "Helvetica", fontSize: 20, fontStyle: "Normal", isEastArrow: true, isNorthArrow: true, textLabel0: "N", textLabel1: "E"}});
                regionStyle.set(10, { name: "", color: '#FFBA01', lineWidth: 2, dashList: [], annotationStyle: {fontSize: 13, fontStyle: 'Normal', font: 'Helvetica', coordinateSystem: 'PIXEL'} });

                //Receive the Export Region ICD message Response
                assertItem.exportRegion.directory = basepath + "/" + saveSubdirectory; 
                exportRegionAck = await msgController.exportRegion(assertItem.exportRegion.directory, assertItem.exportRegion.file, assertItem.exportRegion.type, assertItem.exportRegion.coordType, assertItem.exportRegion.fileId, regionStyle);
                expect(exportRegionAck.contents).toEqual(assertItem.exportRegionAck.contents);
                expect(exportRegionAck.success).toEqual(assertItem.exportRegionAck.success);
            }, exportTimeout);

            test(`(Case 3) Import the exported region file`, async () => {
                //Request and Receive import the expored region file ICD message
                let importRegionAck: any;
                assertItem.importRegion.directory = basepath + "/" + saveSubdirectory; 
                importRegionAck = await msgController.importRegion(assertItem.importRegion.directory, assertItem.importRegion.file, assertItem.importRegion.type, assertItem.importRegion.groupId);
                
                //Check the Responsed import region ICD message
                let importRegionAckIndex = Object.keys(importRegionAck.regions);
                //Check each region
                for (let index = 0; index < importRegionAckIndex.length; index++) {
                    //Check the controlPoints
                    for (let controlPointsArrayLength = 0; controlPointsArrayLength < importRegionAck.regions[importRegionAckIndex[index]].controlPoints.length; controlPointsArrayLength++) {
                        expect(importRegionAck.regions[importRegionAckIndex[index]].controlPoints[controlPointsArrayLength].x).toBeCloseTo(assertItem.importRegionAck.regions[importRegionAckIndex[index]].controlPoints[controlPointsArrayLength].x, assertItem.precisionDigits);
                        expect(importRegionAck.regions[importRegionAckIndex[index]].controlPoints[controlPointsArrayLength].y).toBeCloseTo(assertItem.importRegionAck.regions[importRegionAckIndex[index]].controlPoints[controlPointsArrayLength].y, assertItem.precisionDigits);
                    };

                    //Check the rotation
                    if (importRegionAck.regions[importRegionAckIndex[index]].rotation) {
                        expect(importRegionAck.regions[importRegionAckIndex[index]].rotation).toBeCloseTo(assertItem.importRegionAck.regions[importRegionAckIndex[index]].rotation);
                    };

                    //Check the regionType
                    expect(importRegionAck.regions[importRegionAckIndex[index]].regionType).toEqual(assertItem.importRegionAck.regions[importRegionAckIndex[index]].regionType);
                }

                //Check each regionStyles
                for (let index = 0; index < importRegionAckIndex.length; index++) {
                    let regionStylesProperties = Object.keys(importRegionAck.regionStyles[importRegionAckIndex[index]]);
                    //Check dashList
                    expect(importRegionAck.regionStyles[importRegionAckIndex[index]].dashList).toEqual(assertItem.importRegionAck.regionStyles[importRegionAckIndex[index]].dashList);

                    //Check colour
                    expect(importRegionAck.regionStyles[importRegionAckIndex[index]].color).toEqual(assertItem.importRegionAck.regionStyles[importRegionAckIndex[index]].color);

                    //Check lineWidth
                    expect(importRegionAck.regionStyles[importRegionAckIndex[index]].lineWidth).toEqual(assertItem.importRegionAck.regionStyles[importRegionAckIndex[index]].lineWidth);

                    //Check annotationStyle
                    let annotationStyleProperties = Object.keys(importRegionAck.regionStyles[importRegionAckIndex[index]].annotationStyle);
                    annotationStyleProperties.map((property, index) => {
                        let importRegionAckAnnotationArray = new Array(importRegionAck.regionStyles[importRegionAckIndex[index]].annotationStyle);
                        expect(importRegionAckAnnotationArray).toContainEqual(assertItem.importRegionAck.regionStyles[importRegionAckIndex[index]].annotationStyle);
                    });
                }
            }, importTimeout);

            test(`Delete the exported region file`, () => {
                let deleteExportRegionFileCommand = assertItem.exportRegion.directory + "/" + assertItem.exportRegion.file;
                execSync(`rm /${deleteExportRegionFileCommand}`,{encoding: 'utf-8'})
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});