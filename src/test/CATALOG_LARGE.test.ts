import { CARTA } from "carta-protobuf";
import { Stream} from './myClient';
import { MessageController, ConnectionStatus } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.catalogLarge;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let openCatalogLargeTimeout: number = config.timeout.openCatalogLarge

interface ICatalogFileInfoResponseExt extends CARTA.ICatalogFileInfoResponse {
    lengthOfHeaders: number;
};

interface IOpenCatalogFileAckExt extends CARTA.IOpenCatalogFileAck {
    lengthOfHeaders: number;
};

interface ICatalogFilterResponseExt extends CARTA.ICatalogFilterResponse {
    lengthOfColumns: number;
    fileid: number;
};

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    catalogListReq: CARTA.ICatalogListRequest;
    catalogListResponse: CARTA.ICatalogListResponse;
    catalogFileInfoReq: CARTA.ICatalogFileInfoRequest;
    catalogFileInfoResponse: ICatalogFileInfoResponseExt;
    openCatalogFile: CARTA.IOpenCatalogFile;
    openCatalogFileAck: IOpenCatalogFileAckExt;
    catalogFilterReq: CARTA.ICatalogFilterRequest[];
    catalogFilterResponse: ICatalogFilterResponseExt[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "cosmos_herschel250micron.fits",
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
        point: { x: 3274, y: 3402 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    catalogListReq: {
        directory: testSubdirectory
    },
    catalogFileInfoReq: {
        directory: testSubdirectory,
        name: "COSMOSOPTCAT.vot"
    },
    openCatalogFile: {
        directory: testSubdirectory,
        fileId: 1,
        name: "COSMOSOPTCAT.vot",
        previewDataSize: 50
    },
    catalogFilterReq: [
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 918777,
            subsetStartIndex: 50
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 50,
            subsetStartIndex: 50
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 50,
            subsetStartIndex: 100
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 50,
            subsetStartIndex: 150
        },
    ],
    catalogListResponse: {
        directory: testSubdirectory,
        success: true,
        subdirectories: []
    },
    catalogFileInfoResponse: {
        fileInfo: { name: "COSMOSOPTCAT.vot", type: 1, fileSize: 1631311089 },
        success: true,
        lengthOfHeaders: 62,
    },
    openCatalogFileAck: {
        dataSize: 918827,
        fileId: 1,
        fileInfo: { name: "COSMOSOPTCAT.vot", type: 1, fileSize: 1631311089 },
        lengthOfHeaders: 62,
        success: true
    },
    catalogFilterResponse: [
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 50,
            subsetEndIndex: 100,
            filterDataSize: 918827,
            requestEndIndex: 100,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 50,
            subsetEndIndex: 150,
            filterDataSize: 918827,
            requestEndIndex: 150,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 50,
            subsetEndIndex: 200,
            filterDataSize: 918827,
            requestEndIndex: 200,
            progress: 1
        },
    ]
};

let basepath: string;
describe("Test for large-size CATALOG: load whole table at one time", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

    test(`Get basepath and modify the directory path`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
        assertItem.fileOpen.directory = basepath + "/" + assertItem.fileOpen.directory;
        assertItem.catalogListReq.directory = basepath + "/" + assertItem.catalogListReq.directory;
        assertItem.catalogFileInfoReq.directory = basepath + "/" + assertItem.catalogFileInfoReq.directory;
        assertItem.openCatalogFile.directory = basepath + "/" + assertItem.openCatalogFile.directory;
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
        msgController.closeFile(-1);
        let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
        let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

        expect(OpenFileResponse.success).toBe(true);
        expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
    }, openFileTimeout);

    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
        msgController.addRequiredTiles(assertItem.addTilesReq);
        let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);

        msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
        let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

        msgController.setSpatialRequirements(assertItem.setSpatialReq);
        let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

        expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
        let CatalogListAck = await msgController.getCatalogList(assertItem.catalogListReq.directory, assertItem.catalogListReq.filterMode);
        expect(CatalogListAck.directory).toContain(assertItem.catalogListResponse.directory)
        expect(CatalogListAck.success).toEqual(assertItem.catalogListResponse.success);
        let CatalogListAckTempSubdirectories = CatalogListAck.subdirectories.map(f => f.name);
        expect(CatalogListAckTempSubdirectories).toEqual(expect.arrayContaining(assertItem.catalogListResponse.subdirectories));
    });

    test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
        let CatalogFileInfoAck = await msgController.getCatalogFileInfo(assertItem.catalogFileInfoReq.directory, assertItem.catalogFileInfoReq.name);
        expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse.success);
        expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse.fileInfo.name);
        expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse.fileInfo.type);
        expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(assertItem.catalogFileInfoResponse.fileInfo.fileSize);
        expect(CatalogFileInfoAck.headers.length).toEqual(assertItem.catalogFileInfoResponse.lengthOfHeaders);
    });

    test(`(Step 5) Request CatalogFile & check CatalogFileAck | `, async () => {
        let CatalogFileAck = await msgController.loadCatalogFile(assertItem.openCatalogFile.directory, assertItem.openCatalogFile.name, assertItem.openCatalogFile.fileId, assertItem.openCatalogFile.previewDataSize)
        expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck.success);
        expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck.dataSize);
        expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck.fileId);
        expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck.fileInfo.name);
        expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck.fileInfo.type);
        expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(assertItem.openCatalogFileAck.fileInfo.fileSize);
        expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck.lengthOfHeaders);
    }, openCatalogLargeTimeout);

    test(`(Step 6) Request CatalogFilter: progress & check CatalogFilterResponse | `, async () => {
        await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[0]);
        let CatalogFilterResponse = await Stream(CARTA.CatalogFilterResponse);
        for (let i = 0; i < CatalogFilterResponse.length; i++) {
            console.log(`"${assertItem.catalogFileInfoReq.name}" CatalogFilterResponse progress :`, CatalogFilterResponse[i].progress);
        }
        let lastCatalogFilterResponse = CatalogFilterResponse.slice(-1)[0];
        expect(Object.keys(lastCatalogFilterResponse.columns).length).toEqual(assertItem.catalogFilterResponse[0].lengthOfColumns);
        expect(lastCatalogFilterResponse.fileid).toEqual(assertItem.catalogFilterResponse[0].fileId);
        expect(lastCatalogFilterResponse.subsetDataSize).toEqual(assertItem.catalogFilterResponse[0].subsetDataSize);
        expect(lastCatalogFilterResponse.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[0].subsetEndIndex);
        expect(lastCatalogFilterResponse.filterDataSize).toEqual(assertItem.catalogFilterResponse[0].filterDataSize);
        expect(lastCatalogFilterResponse.requestEndIndex).toEqual(assertItem.catalogFilterResponse[0].requestEndIndex);
        expect(lastCatalogFilterResponse.progress).toEqual(assertItem.catalogFilterResponse[0].progress);
    }, openCatalogLargeTimeout);

    afterAll(() => msgController.closeConnection());
});

describe("Test for large-size CATALOG: Progressive load of rows", () => {

    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
        msgController.closeFile(-1);
        let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
        let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

        expect(OpenFileResponse.success).toBe(true);
        expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
    }, openFileTimeout);

    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
        msgController.addRequiredTiles(assertItem.addTilesReq);
        let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);

        msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
        let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

        msgController.setSpatialRequirements(assertItem.setSpatialReq);
        let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

        expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
        let CatalogListAck = await msgController.getCatalogList(assertItem.catalogListReq.directory, assertItem.catalogListReq.filterMode);
        expect(CatalogListAck.directory).toContain(assertItem.catalogListResponse.directory)
        expect(CatalogListAck.success).toEqual(assertItem.catalogListResponse.success);
        let CatalogListAckTempSubdirectories = CatalogListAck.subdirectories.map(f => f.name);
        expect(CatalogListAckTempSubdirectories).toEqual(expect.arrayContaining(assertItem.catalogListResponse.subdirectories));
    });

    test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
        let CatalogFileInfoAck = await msgController.getCatalogFileInfo(assertItem.catalogFileInfoReq.directory, assertItem.catalogFileInfoReq.name);
        expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse.success);
        expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse.fileInfo.name);
        expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse.fileInfo.type);
        expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(assertItem.catalogFileInfoResponse.fileInfo.fileSize);
        expect(CatalogFileInfoAck.headers.length).toEqual(assertItem.catalogFileInfoResponse.lengthOfHeaders);
    });

    test(`(Step 5) Request CatalogFile & check CatalogFileAck | `, async () => {
        let CatalogFileAck = await msgController.loadCatalogFile(assertItem.openCatalogFile.directory, assertItem.openCatalogFile.name, assertItem.openCatalogFile.fileId, assertItem.openCatalogFile.previewDataSize)
        expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck.success);
        expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck.dataSize);
        expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck.fileId);
        expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck.fileInfo.name);
        expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck.fileInfo.type);
        expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(assertItem.openCatalogFileAck.fileInfo.fileSize);
        expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck.lengthOfHeaders);
    }, openCatalogLargeTimeout);

    for (let i = 1; i < 4; i++) {
        test(`(Step 6-${i - 1}) Request CatalogFilter: subsetStartIndex of ${assertItem.catalogFilterReq[i].subsetStartIndex} & check CatalogFilterResponse | `, async () => {
            await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[i]);
            let CatalogFilterResponse = await Stream(CARTA.CatalogFilterResponse);
            let lastCatalogFilterResponse = CatalogFilterResponse.slice(-1)[0];
            expect(Object.keys(lastCatalogFilterResponse.columns).length).toEqual(assertItem.catalogFilterResponse[i].lengthOfColumns);
            expect(lastCatalogFilterResponse.fileid).toEqual(assertItem.catalogFilterResponse[i].fileId);
            expect(lastCatalogFilterResponse.subsetDataSize).toEqual(assertItem.catalogFilterResponse[i].subsetDataSize);
            expect(lastCatalogFilterResponse.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[i].subsetEndIndex);
            expect(lastCatalogFilterResponse.filterDataSize).toEqual(assertItem.catalogFilterResponse[i].filterDataSize);
            expect(lastCatalogFilterResponse.requestEndIndex).toEqual(assertItem.catalogFilterResponse[i].requestEndIndex);
            expect(lastCatalogFilterResponse.progress).toEqual(assertItem.catalogFilterResponse[i].progress);
        }, openCatalogLargeTimeout);
    };

    afterAll(() => msgController.closeConnection());
});