import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.performance.openFile;
let readFileTimeout: number = config.performance.readFile;

interface AssertItem {
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
}

let assertItem: AssertItem = {
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_B",
            file: "cube_B_09600_z00100.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [67125252, 67129348, 67125253, 67129349, 67125251, 67121156, 67129347, 67121157, 67121155, 67133444, 67125254, 67133445, 67129350, 67133443, 67121158, 67125250, 67117060, 67129346, 67117061, 67121154, 67117059, 67133446, 67137540, 67125255, 67133442, 67117062, 67137541, 67129351, 67137539, 67121159, 67117058, 67125249, 67129345, 67137542, 67133447, 67121153, 67137538, 67117063, 67133441, 67125256, 67117057, 67129352, 67137543, 67121160, 67125248, 67133448, 67137537, 67129344, 67121152, 67117064, 67133440, 67117056, 67137544, 67137536],
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
}

let basepath: string;
describe("PERF_RASTER_TILE_DATA",()=>{
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.fileOpen[0].directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`(Step 1)"${assertItem.fileOpen[0].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.initTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

                msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.initTilesReq.tiles.length + 2);
            }, openFileTimeout);

            test(`(Step 2)"${assertItem.fileOpen[0].file}" RasterTileData responses should arrive within ${readFileTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);

                expect(RasterTileDataResponse.length).toBe(assertItem.addTilesReq[0].tiles.length + 2)
            }, readFileTimeout);
        });

        afterAll(() => msgController.closeConnection());
    });
})