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
    precisionDigits: 4,
    // importRegion:
    // {
    //     contents: [],
    //     directory: regionSubdirectory,
    //     file: "M17_SWex_testRegions_pix.reg",
    //     groupId: 0,
    //     type: CARTA.FileType.DS9_REG,
    // },
    // importRegionAck:
    // {
    //     success: true,
    //     regions: {
    //         '1': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 40, y: 100 }],
    //             regionType: CARTA.RegionType.RECTANGLE,
    //         },
    //         '2': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 100, y: 40 }],
    //             regionType: CARTA.RegionType.RECTANGLE,
    //         },
    //         '3': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 200, y: 40 }],
    //             rotation: 45,
    //             regionType: CARTA.RegionType.RECTANGLE,
    //         },
    //         '4': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 320, y: 600 }, { x: 400, y: 400 }],
    //             regionType: CARTA.RegionType.POLYGON,
    //         },
    //         '5': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 200, y: 200 }],
    //             regionType: CARTA.RegionType.ELLIPSE,
    //         },
    //         '6': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 100, y: 20 }],
    //             regionType: CARTA.RegionType.ELLIPSE,
    //             rotation: 45,
    //         },
    //         '7': {
    //             controlPoints: [{ x: 320, y: 400 }, { x: 320, y: 300}],
    //             regionType: CARTA.RegionType.LINE,
    //         },
    //         '8': {
    //             controlPoints: [{ x: 320, y: 400 }, {x: 369.99951171875, y: 449.99951171875}],
    //             regionType: CARTA.RegionType.ANNVECTOR,
    //         },
    //         '9': {
    //             controlPoints: [{ x: 320, y: 400 }, {}],
    //             regionType: CARTA.RegionType.ANNTEXT,
    //         },
    //         '10': {
    //             controlPoints: [{ x: 320, y: 300 }],
    //             regionType: CARTA.RegionType.POINT,
    //         },
    //     },
    //     regionStyles: {
    //         '1': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '2': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '3': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '4': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '5': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '6': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '7': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '8': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '9': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //         '10': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //     },
    // },
    // exportRegion:
    //     [
    //         {
    //             coordType: CARTA.CoordinateType.WORLD,
    //             file: "M17_SWex_testRegions_pix_export_to_world.reg",
    //             fileId: 0,
    //             type: CARTA.FileType.DS9_REG,
    //             regionStyles: {
    //                 '1': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '2': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '3': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '4': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '5': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '6': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '7': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '8': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //                 '9': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "", annotationStyle: {textLabel0: 'CARTA REGION TEST'} },
    //                 '10': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //             },
    //         },
    //         {
    //             coordType: CARTA.CoordinateType.PIXEL,
    //             file: "M17_SWex_testRegions_pix_export_to_pix.reg",
    //             fileId: 0,
    //             type: CARTA.FileType.DS9_REG,
    //             regionStyles: {
    //                 '1': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '2': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '3': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '4': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '5': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '6': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '7': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
    //                 '8': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //                 '9': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "", annotationStyle: {textLabel0: 'CARTA REGION TEST'} },
    //                 '10': { color: "#2EE6D6", dashList: [], lineWidth: 1, name: "" },
    //             }
    //         },
    //     ],
    // exportRegionAck:
    //     [
    //         {
    //             success: true,
    //             contents: [],
    //         },
    //         {
    //             success: true,
    //             contents: [],
    //         },
    //     ],
    // importRegion2:
    //     [
    //         {
    //             directory: saveSubdirectory,
    //             contents: [],
    //             file: "M17_SWex_testRegions_pix_export_to_world.reg",
    //             groupId: 0,
    //             type: CARTA.FileType.DS9_REG,
    //         },
    //         {
    //             directory: saveSubdirectory,
    //             contents: [],
    //             file: "M17_SWex_testRegions_pix_export_to_pix.reg",
    //             groupId: 0,
    //             type: CARTA.FileType.DS9_REG,
    //         },
    //     ],
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
    });
});