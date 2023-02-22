import { CARTA } from "carta-protobuf";
import { Stream} from './myClient';
import { MessageController, ConnectionStatus } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.catalogLarge;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile
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
    catalogFileInfoReq: CARTA.ICatalogFileInfoRequest[];
    catalogFileInfoResponse: ICatalogFileInfoResponseExt[];
    openCatalogFile: CARTA.IOpenCatalogFile[];
    openCatalogFileAck: IOpenCatalogFileAckExt[];
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
        spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}]
    },
    catalogListReq: {
        directory: testSubdirectory
    },
    catalogFileInfoReq: [
        {
            directory: testSubdirectory,
            name: "COSMOSOPTCAT.fits"
        },
        {
            directory: testSubdirectory,
            name: "COSMOSOPTCAT.vot"
        },
    ],
    openCatalogFile: [
        {
            directory: testSubdirectory,
            fileId: 1,
            name: "COSMOSOPTCAT.fits",
            previewDataSize: 50
        },
        {
            directory: testSubdirectory,
            fileId: 2,
            name: "COSMOSOPTCAT.vot",
            previewDataSize: 50
        },
    ],
    catalogListResponse: {
        directory: testSubdirectory,
        success: true,
        subdirectories: []
    },
    catalogFileInfoResponse: [
        {
            fileInfo: { name: "COSMOSOPTCAT.fits", fileSize: 444729600, description: 'Count: 918827' },
            success: true,
            lengthOfHeaders: 62,
        },
        {
            fileInfo: {
                name: "COSMOSOPTCAT.vot", type: 1, fileSize: 1631311089, description: 'Count: 918827'
            },
            success: true,
            lengthOfHeaders: 62,
        },
    ],
    openCatalogFileAck: [
        {
            dataSize: 918827,
            fileId: 1,
            fileInfo: { name: "COSMOSOPTCAT.fits", fileSize: 444729600 },
            lengthOfHeaders: 62,
            success: true
        },
        {
            dataSize: 918827,
            fileId: 2,
            fileInfo: { name: "COSMOSOPTCAT.vot", type: 1, fileSize: 1631311089 },
            lengthOfHeaders: 62,
            success: true
        },
    ],
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
            fileId: 2,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 918777,
            subsetStartIndex: 50
        },
    ],
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
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1
        },
    ],
};

let basepath: string;
assertItem.catalogFileInfoReq.map((data, index) => {
    describe(`Test for "${assertItem.catalogFileInfoReq[index].name}" catalog:`, () => {
        const msgController = MessageController.Instance;
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        test(`(Step 0) Connection open? | `, () => {
            expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
        });

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            if (index === 0) {
                basepath = fileListResponse.directory;
                assertItem.fileOpen.directory = basepath + "/" + assertItem.fileOpen.directory;
                assertItem.catalogListReq.directory = basepath + "/" + assertItem.catalogListReq.directory;
            }
            assertItem.catalogFileInfoReq[index].directory = basepath + "/" + assertItem.catalogFileInfoReq[index].directory;
            assertItem.openCatalogFile[index].directory = basepath + "/" + assertItem.openCatalogFile[index].directory;
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
            let CatalogFileInfoAck = await msgController.getCatalogFileInfo(assertItem.catalogFileInfoReq[index].directory, assertItem.catalogFileInfoReq[index].name);
            expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse[index].success);
            expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.name);
            if (CatalogFileInfoAck.fileInfo.type) {
                expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.type);
            };           
            expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.fileSize);
            expect(CatalogFileInfoAck.headers.length).toEqual(assertItem.catalogFileInfoResponse[index].lengthOfHeaders);
        });

        test(`(Step 5) Request CatalogFile & check CatalogFileAck | `, async () => {
            let CatalogFileAck = await msgController.loadCatalogFile(assertItem.openCatalogFile[index].directory, assertItem.openCatalogFile[index].name, assertItem.openCatalogFile[index].fileId, assertItem.openCatalogFile[index].previewDataSize)
            expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck[index].success);
            expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck[index].dataSize);
            expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck[index].fileId);
            expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck[index].fileInfo.name);
            if (CatalogFileAck.fileInfo.type) {
                expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck[index].fileInfo.type);
            };
            expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(assertItem.openCatalogFileAck[index].fileInfo.fileSize);
            expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck[index].lengthOfHeaders);
        }, openCatalogLargeTimeout);

        test(`(Step 6) Request CatalogFilter: Sorting & check CatalogFilterResponse | `, async () => {
            await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[index]);
            let CatalogFilterResponse = await Stream(CARTA.CatalogFilterResponse);
            for (let i = 0; i < CatalogFilterResponse.length; i++) {
                console.log(`"${assertItem.catalogFileInfoReq[index].name}" CatalogFilterResponse progress :`, CatalogFilterResponse[i].progress);
            }
            let lastCatalogFilterResponse = CatalogFilterResponse.slice(-1)[0];
            expect(Object.keys(lastCatalogFilterResponse.columns).length).toEqual(assertItem.catalogFilterResponse[index].lengthOfColumns);
            expect(lastCatalogFilterResponse.fileid).toEqual(assertItem.catalogFilterResponse[index].fileId);
            expect(lastCatalogFilterResponse.subsetDataSize).toEqual(assertItem.catalogFilterResponse[index].subsetDataSize);
            expect(lastCatalogFilterResponse.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[index].subsetEndIndex);
            expect(lastCatalogFilterResponse.filterDataSize).toEqual(assertItem.catalogFilterResponse[index].filterDataSize);
            expect(lastCatalogFilterResponse.requestEndIndex).toEqual(assertItem.catalogFilterResponse[index].requestEndIndex);
            expect(lastCatalogFilterResponse.progress).toEqual(assertItem.catalogFilterResponse[index].progress);
        }, openCatalogLargeTimeout);

        afterAll(() => msgController.closeConnection());
    });
});