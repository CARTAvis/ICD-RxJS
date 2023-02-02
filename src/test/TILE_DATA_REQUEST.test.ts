import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

interface IRasterTileDataExt extends CARTA.IRasterTileData {
    assert: {
        lengthTiles: number,
    }[];
}
interface AssertItem {
    precisionDigit: number;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialReq: CARTA.ISetSpatialRequirements;
    rasterTileData: IRasterTileDataExt;
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: IRasterTileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigit: 4,
    fileOpen: {
        directory: testSubdirectory,
        file: "cluster_04096.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    fileOpenAck: {
        success: true,
        fileFeatureFlags: 0,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.NONE,
        tiles: [16777216, 16781312, 16777217, 16781313],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    rasterTileData: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        compressionType: CARTA.CompressionType.NONE,
        compressionQuality: 11,
        tiles: [
            { x: 0, y: 0, layer: 1, },
            { x: 1, y: 0, layer: 1, },
            { x: 0, y: 1, layer: 1, },
            { x: 1, y: 1, layer: 1, },
        ],
        assert: [
            { lengthTiles: 1, },
            { lengthTiles: 1, },
            { lengthTiles: 1, },
            { lengthTiles: 1, },
        ],
    },
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [33558529, 33562626, 33566723],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 0,
            tiles: [33558529, 33562626, 33566723, 33570820],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            // Jest only received one returned message from Backend {RasterTileSync: [RasterTileSync {}]} as Stream
            // No RASTER_TILE_DATA returned
            // BackendLog:
            // Mean filter 0x0 raster data to 0x0 in 0.003 ms at 0 MPix/s
            // Bus error(core dumped)
            // or BackendLog:
            // Mean filter 0x0 raster data to 0x0 in 0.002 ms at 0 MPix/s
            // Segmentation fault(core dumped)
        },
        // {
        //     fileId: 0,
        //     tiles: [33570820],
        //     compressionType: CARTA.CompressionType.ZFP,
        //     compressionQuality: 11,
        //     // BackendLog:
        //     // Mean filter 0x0 raster data to 0x0 in 0.01 ms at 0 MPix / s 
        //     // Segmentation fault(core dumped)
        // },
        // {
        //     fileId: 0,
        //     tiles: [50364424],
        //     compressionType: CARTA.CompressionType.ZFP,
        //     compressionQuality: 11,
        //     // BackendLog:
        //     // Mean filter 0x0 raster data to 0x0 in 0.012 ms at 0 MPix / s 
        //     // Segmentation fault(core dumped)
        //     // or BackendLog:
        //     // Mean filter 0x0 raster data to 0x0 in 0.002 ms at 0 MPix / s 
        //     // Bus error(core dumped)
        // },
    ],
    rasterTileDataGroup: [
        {
            tiles: [
                { x: 1, y: 1, layer: 2, },
                { x: 2, y: 2, layer: 2, },
                { x: 3, y: 3, layer: 2, },
            ],
            assert: [
                { lengthTiles: 1, },
                { lengthTiles: 1, },
                { lengthTiles: 1, },
            ],
        },
        {
            tiles: [
                { x: 1, y: 1, layer: 2, },
                { x: 2, y: 2, layer: 2, },
                { x: 3, y: 3, layer: 2, },
            ],
            assert: [
                { lengthTiles: 1, },
                { lengthTiles: 1, },
                { lengthTiles: 1, },
            ],
        },
        // {
        //     tiles: [],
        //     assert: [],
        // },
        // {
        //     tiles: [],
        //     assert: [],
        // },
    ],
};

let basepath: string;
describe("CHECK_RASTER_TILE_DATA: Testing data values at different layers in RASTER_TILE_DATA", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + "/" + assertItem.fileOpen.directory;
        });

        test(`Preparation: Open image`,async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
            expect(OpenFileResponse.success).toEqual(true);
            let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
        });

        let RasterTileDataResponse: CARTA.RasterTileData;
        test(`RasterTileData * 4 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)?`, async () => {
            await msgController.addRequiredTiles(assertItem.initTilesReq);
            RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

            await msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            await msgController.setSpatialRequirements(assertItem.initSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);
        }, readFileTimeout);

        assertItem.rasterTileData.tiles.map((tiles, index) => {
            describe(`(Step1-3) Check each RASTER_TILE_DATA`, () => {
                test(`(#${index})RASTER_TILE_DATA.tiles.length = 1 |`, () => {
                    expect(RasterTileDataResponse[index+1].tiles.length).toEqual(assertItem.rasterTileData.assert[index].lengthTiles)
                });

                test(`(#${index})RASTER_TILE_DATA.tiles[0].x = ${tiles.x} & RASTER_TILE_DATA.tiles[0].y = ${tiles.y} & RASTER_TILE_DATA.tiles[0].layer = ${tiles.layer}|`, () => {
                    let TempTiles = assertItem.rasterTileData.tiles.filter(f => f.x === RasterTileDataResponse[index+1].tiles[0].x && f.y === RasterTileDataResponse[index+1].tiles[0].y && f.layer === RasterTileDataResponse[index+1].tiles[0].layer);
                    expect(TempTiles).toBeDefined();
                })
            });
        });

        afterAll(() => msgController.closeConnection());
    });
})