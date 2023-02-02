import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements;
    ErrorMessage: CARTA.IErrorData;
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "0",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        }
    ],
    addRequiredTiles: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor:
        [
            {
                fileId: 0,
                point: { x: 1, y: 1 },
            },
            {
                fileId: 1,
                point: { x: 1, y: 1 },
            }
        ],
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    ErrorMessage: {
        tags: ['cursor'],
        message: 'File id 1 not found',
    },
};

let basepath: string;
describe("[Case 1] Test for requesting the ICD message of the CLOSED image:", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.filelist.directory = basepath + "/" + assertItem.filelist.directory;
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.fileOpen[0].directory;
            assertItem.fileOpen[1].directory = basepath + "/" + assertItem.fileOpen[1].directory;
        });

        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of fileId = 0 should arrive within ${openFileTimeout} ms `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        test(`(Step 2) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of fileId = 1 should arrive within ${openFileTimeout} ms `, async () => {
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[1]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        test(`(Step 3) close fileId =1 & request ICD message of the closed fileId=1, then the backend is still alive:`, async () => {
            //close fileId =1
            msgController.closeFile(1);
    
            //request ICD message of the closed fileId=1
            msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y)
            let ErrMesssage = await Stream(CARTA.ErrorData, 1);
            expect(ErrMesssage[0].tags).toEqual(assertItem.ErrorMessage.tags);
            expect(ErrMesssage[0].message).toEqual(assertItem.ErrorMessage.message);
    
            // //check the backend is still alive
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        });

        test(`(Step 4) Test fileId = 0 is still working well: `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles.tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        }, readFileTimeout);

        afterAll(() => msgController.closeConnection());
    });
});

describe("[Case 2] Open=>Close=>Open of fileId=0, and then check the backend alive:", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of fileId = 0 should arrive within ${openFileTimeout} ms `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length`, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles.tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        }, openFileTimeout);

        test(`(Step 3) Closed and Re-open `, async () => {
            //Close fileid=0
            msgController.closeFile(0);
    
            //Re-opne fileid=0
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
    
            //ICD messages work fine?
            msgController.addRequiredTiles(assertItem.addRequiredTiles);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles.tiles.length + 2);
            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);
            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);
            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        });

        test(`(Step 4) the backend is still alive`, async () => {
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        }, readFileTimeout);

        afterAll(() => msgController.closeConnection());
    });
});
