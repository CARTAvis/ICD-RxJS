import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let saveSubdirectory = config.path.save;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;
let exportTimeout = config.timeout.export;

interface ImportRegionAckExt2 extends CARTA.IImportRegionAck {
    lengthOfRegions?: number;
    assertRegionId?: {
        index: number,
        id: number,
    };
};

interface AssertItem {
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    importRegion: CARTA.IImportRegion;
    importRegionAck: CARTA.IImportRegionAck;
    exportRegion: CARTA.IExportRegion[];
    exportRegionAck: CARTA.IExportRegionAck[];
    importRegion2: CARTA.IImportRegion[];
    importRegionAck2: ImportRegionAckExt2[];
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
    precisionDigits: 4,
    importRegion:
    {
        contents: [],
        file: "M17_SWex_testRegions_pix.crtf",
        groupId: 0,
        type: CARTA.FileType.CRTF,
    },
    importRegionAck:
    {
        success: true,
        regions: {
            '1': {
                controlPoints: [{ x: 320, y: 400 }, { x: 40, y: 100 }],
                regionType: CARTA.RegionType.RECTANGLE,
            },
            '2': {
                controlPoints: [{ x: 320, y: 400 }, { x: 100, y: 40 }],
                regionType: CARTA.RegionType.RECTANGLE,
            },
            '3': {
                controlPoints: [{ x: 320, y: 400 }, { x: 200, y: 40 }],
                rotation: 45,
                regionType: CARTA.RegionType.RECTANGLE,
            },
            '4': {
                controlPoints: [{ x: 320, y: 400 }, { x: 320, y: 600 }, { x: 400, y: 400 }],
                regionType: CARTA.RegionType.POLYGON,
            },
            '5': {
                controlPoints: [{ x: 320, y: 400 }, { x: 200, y: 200 }],
                regionType: CARTA.RegionType.ELLIPSE,
            },
            '6': {
                controlPoints: [{ x: 320, y: 400 }, { x: 100, y: 20 }],
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 45,
            },
            '7': {
                controlPoints: [{ x: 320, y: 400 }, { x: 320, y: 300 }],
                regionType: CARTA.RegionType.LINE,
            },
            '8': {
                controlPoints: [{ x: 320, y: 300 }],
                regionType: CARTA.RegionType.POINT,
            },
        },
        regionStyles: {
            '1': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '2': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '3': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '4': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '5': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '6': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '7': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
            '8': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
        },
    },
    exportRegion:
        [
            {
                directory: saveSubdirectory,
                coordType: CARTA.CoordinateType.WORLD,
                file: "M17_SWex_testRegions_pix_export_to_world.crtf",
                fileId: 0,
                type: CARTA.FileType.CRTF,
                regionStyles: {
                    '1': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '2': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '3': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '4': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '5': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '6': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '7': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '8': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                },
            },
            {
                directory: saveSubdirectory,
                coordType: CARTA.CoordinateType.PIXEL,
                file: "M17_SWex_testRegions_pix_export_to_pix.crtf",
                fileId: 0,
                type: CARTA.FileType.CRTF,
                regionStyles: {
                    '1': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '2': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '3': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '4': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '5': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '6': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '7': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '8': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                }
            },
        ],
    exportRegionAck:
        [
            {
                success: true,
                contents: [],
            },
            {
                success: true,
                contents: [],
            },
        ],
    importRegion2:
        [
            {
                directory: saveSubdirectory,
                contents: [],
                file: "M17_SWex_testRegions_pix_export_to_world.crtf",
                groupId: 0,
                type: CARTA.FileType.CRTF,
            },
            {
                directory: saveSubdirectory,
                contents: [],
                file: "M17_SWex_testRegions_pix_export_to_pix.crtf",
                groupId: 0,
                type: CARTA.FileType.CRTF,
            },
        ],
    importRegionAck2:
        [
            {
                success: true,
                lengthOfRegions: 8,
                assertRegionId: {
                    index: 7,
                    id: 16,
                },
            },
            {
                success: true,
                lengthOfRegions: 8,
                assertRegionId: {
                    index: 7,
                    id: 24,
                },
            },
        ],
};

let basepath: string;
describe("CASA_REGION_IMPORT_EXPORT: Testing import/export of CASA region format", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
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
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);

                msgController.addRequiredTiles(assertItem.addTilesRequire);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);
                msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
            });

            describe(`Import "${assertItem.importRegion.file}"`, () => {
                let importRegionAck: any;
                let importRegionAckProperties: any[];
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    importRegionAck = await msgController.importRegion(basepath + "/" + regionSubdirectory,assertItem.importRegion.file, assertItem.importRegion.type, assertItem.importRegion.groupId )
                    importRegionAckProperties = Object.keys(importRegionAck.regions);
                    if (importRegionAck.message != '') {
                        console.warn(importRegionAck.message);
                    }
                }, importTimeout);
    
                test(`IMPORT_REGION_ACK.success = ${assertItem.importRegionAck.success}`, () => {
                    expect(importRegionAck.success).toBe(assertItem.importRegionAck.success);
                });
    
                test(`Length of IMPORT_REGION_ACK.region = ${Object.keys(assertItem.importRegionAck.regions).length}`, () => {
                    expect(importRegionAckProperties.length).toEqual(Object.keys(assertItem.importRegionAck.regions).length);
                });
    
                Object.keys(assertItem.importRegionAck.regions).map((region, index) => {
                    test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region}, Type:${CARTA.RegionType[assertItem.importRegionAck.regions[region].regionType]}"`, () => {
                        expect(importRegionAckProperties[index]).toEqual(String(region));
                        expect(importRegionAck.regions[importRegionAckProperties[index]].regionType).toEqual(assertItem.importRegionAck.regions[region].regionType);
                        if (assertItem.importRegionAck.regions[region].rotation)
                            expect(importRegionAck.regions[importRegionAckProperties[index]].rotation).toEqual(assertItem.importRegionAck.regions[region].rotation);
                        expect(importRegionAck.regions[importRegionAckProperties[index]].controlPoints).toEqual(assertItem.importRegionAck.regions[region].controlPoints);
                    });
                });
            });

            assertItem.exportRegionAck.map((exRegion, idxRegion) => {
                describe(`Export "${assertItem.exportRegion[idxRegion].file} to ${saveSubdirectory}"`, () => {
                    let exportRegionAck: any;
                    test(`EXPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                        let regionStyle = new Map<number, CARTA.IRegionStyle>().set(1, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(2, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(3, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(4, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(5, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(6, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(7, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });
                        regionStyle.set(8, { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" });

                        assertItem.exportRegion[idxRegion].directory = basepath + "/" + assertItem.exportRegion[idxRegion].directory
                        exportRegionAck = await msgController.exportRegion(assertItem.exportRegion[idxRegion].directory, assertItem.exportRegion[idxRegion].file, assertItem.exportRegion[idxRegion].type, assertItem.exportRegion[idxRegion].coordType, assertItem.exportRegion[idxRegion].fileId, regionStyle);
                    }, exportTimeout);
    
                    test(`EXPORT_REGION_ACK.success = ${exRegion.success}`, () => {
                        expect(exportRegionAck.success).toBe(exRegion.success);
                    });
    
                    test(`EXPORT_REGION_ACK.contents = ${JSON.stringify(exRegion.contents)}`, () => {
                        expect(exportRegionAck.contents).toEqual(exRegion.contents);
                    });
                });
            });

            assertItem.importRegionAck2.map((Region, idxRegion) => {
                describe(`Import "${assertItem.importRegion2[idxRegion].file}" from ${saveSubdirectory}`, () => {
                    let importRegionAck: any;
                    let importRegionAckProperties: any;
                    test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                        assertItem.importRegion2[idxRegion].directory = basepath + "/" + assertItem.importRegion2[idxRegion].directory;
                        importRegionAck = await msgController.importRegion(assertItem.importRegion2[idxRegion].directory, assertItem.importRegion2[idxRegion].file, assertItem.importRegion2[idxRegion].type, assertItem.importRegion2[idxRegion].groupId )
                        
                        importRegionAckProperties = Object.keys(importRegionAck.regions);
                        if (importRegionAck.message != '') {
                            console.warn(importRegionAck.message);
                        }
                    }, importTimeout);
    
                    test(`IMPORT_REGION_ACK.success = ${Region.success}`, () => {
                        expect(importRegionAck.success).toBe(Region.success);
                    });
    
                    test(`Length of IMPORT_REGION_ACK.regions = ${Region.lengthOfRegions}`, () => {
                        expect(importRegionAckProperties.length).toEqual(Region.lengthOfRegions);
                    });
    
                    test(`IMPORT_REGION_ACK.regions[${Region.assertRegionId.index}].region_id = ${Region.assertRegionId.id}`, () => {
                        expect(importRegionAckProperties[importRegionAckProperties.length - 1]).toEqual(String(Region.assertRegionId.id));
                    });
                });
            });
        })

        afterAll(() => msgController.closeConnection());
    });
})