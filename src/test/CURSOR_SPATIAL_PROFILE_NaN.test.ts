import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;

interface ISpatialProfileDataExt extends CARTA.ISpatialProfileData {
    value?: number,
    profileLength?: { x: number, y: number },
    oddPoint?: {
        x: { one: { idx: number, value: number }[], others?: number },
        y: { one: { idx: number, value: number }[], others?: number },
    }
}
interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 321, y: 401 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x",mip:1}, {coordinate:"y",mip:1}],
    },
    setCursor:
        [
            {
                fileId: 0,
                point: { x: 314.00, y: 393.00 },
            },
            {
                fileId: 0,
                point: { x: 596.00, y: 292.00 },
            },
        ],
    spatialProfileData:
        [
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                x: 314.0,
                y: 393.0,
                profileLength: { x: 640, y: 800 },
                value: -0.004026404581964016,
                oddPoint: {
                    x: { one: [{ idx: 0, value: NaN }, { idx: 200, value: -0.0018224817467853427 }], others: null },
                    y: { one: [{ idx: 799, value: NaN }, { idx: 400, value: 0.0019619895610958338 }], others: null },
                }
            },
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                x: 596.0,
                y: 292.0,
                profileLength: { x: 640, y: 800 },
                value: NaN,
                oddPoint: {
                    x: { one: [], others: NaN },
                    y: { one: [], others: NaN },
                }
            },
        ],
}

describe("CURSOR_SPATIAL_PROFILE_NaN: Testing if full resolution cursor spatial profiles with NaN data are delivered correctly", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    test(`Get basepath and modify the directory path`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
        assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
    });

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

    test(`Return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
        msgController.addRequiredTiles(assertItem.initTilesReq);
        let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

        msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
        let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

        msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
        let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

        expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
    }, readFileTimeout);

    afterAll(() => msgController.closeConnection());
});