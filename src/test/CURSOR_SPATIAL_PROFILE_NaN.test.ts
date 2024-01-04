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
    profileEnd?: { x: number, y: number },
    rawValuesFp32Length?: { x: number, y: number },
    rawValuesPoint?: {
        x: { index?: number[], values?: number[] },
        y: { index?: number[], values?: number[] },
    }
}
interface AssertItem {
    precisionDigits: number;
    openFile: CARTA.IOpenFile;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
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
                x: 314.0,
                y: 393.0,
                profileEnd: { x: 640, y: 800 },
                rawValuesFp32Length: {x: 2560, y: 3200}, 
                value: -0.004026404581964016,
                rawValuesPoint: {
                    x: { index: [500, 1000, 1500, 2000, 2500], values: [92, 142, 164, 171, 255] },
                    y: { index: [500, 1000, 1500, 2000, 2500, 3000], values: [255, 56, 244, 246, 1, 255]},
                }
            },
            {
                x: 596.0,
                y: 292.0,
                profileEnd: { x: 640, y: 800 },
                rawValuesFp32Length: {x: 2560, y: 3200}, 
                value: NaN,
                rawValuesPoint: {
                    x: { index: [500, 1000, 1500, 2000, 2500], values: [90, 155, 28, 38, 255]},
                    y: { index: [500, 1000, 1500, 2000, 2500, 3000], values: [255, 255, 255, 255, 255, 255]},
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

    assertItem.spatialProfileData.map((profileData, index) => {
        describe(`set cursor on {${assertItem.setCursor[index].point.x}, ${assertItem.setCursor[index].point.y}}`, () => {
            let SpatialProfileDataTemp: any;
            test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                msgController.setCursor(assertItem.setCursor[index].fileId, assertItem.setCursor[index].point.x, assertItem.setCursor[index].point.y);
                SpatialProfileDataTemp = await Stream(CARTA.SpatialProfileData,1);
                SpatialProfileDataTemp = SpatialProfileDataTemp[0];
            }, cursorTimeout);

            test(`SPATIAL_PROFILE_DATA.value = ${profileData.value}`, () => {
                if (isNaN(profileData.value)) {
                    expect(SpatialProfileDataTemp.value).toEqual(NaN);
                } else {
                    expect(SpatialProfileDataTemp.value).toBeCloseTo(profileData.value, assertItem.precisionDigits);
                }
            });

            test(`SPATIAL_PROFILE_DATA.x = ${profileData.x} and SPATIAL_PROFILE_DATA.y = ${profileData.y}`, () => {
                expect(SpatialProfileDataTemp.x).toEqual(profileData.x);
                expect(SpatialProfileDataTemp.y).toEqual(profileData.y);
            });

            test(`Check profiles.rawValuesFp32 value of x coordinate`, () => {
                profileData.rawValuesPoint.x.index.map((f, index) => {
                    expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").rawValuesFp32[f]).toEqual(profileData.rawValuesPoint.x.values[index])
                })
            });

            test(`Check profiles.rawValuesFp32 value of y coordinate`, () => {
                profileData.rawValuesPoint.y.index.map((f, index) => {
                    expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").rawValuesFp32[f]).toEqual(profileData.rawValuesPoint.y.values[index])
                })
            });

        });
    });

    afterAll(() => msgController.closeConnection());
});