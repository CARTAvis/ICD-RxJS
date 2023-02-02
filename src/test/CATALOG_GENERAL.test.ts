import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.catalogArtificial;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

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
        file: "Gaussian_J2000.fits",
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
        point: { x: 1250, y: 100 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    catalogListReq: {
        directory:  testSubdirectory
    },
    catalogFileInfoReq: {
        directory:  testSubdirectory,
        name: "artificial_catalog_J2000.xml"
    },
    openCatalogFile: {
        directory:  testSubdirectory,
        fileId: 1,
        name: "artificial_catalog_J2000.xml",
        previewDataSize: 50
    },
    catalogFilterReq: [
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: "RA_d",
            sortingType: 0,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: "RA_d", comparisonOperator: 5, value: 160 }
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null
            },
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: "OTYPE_S", subString: "Star" }
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null
            },
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: "OTYPE_S", subString: "Star" },
                { columnName: "RA_d", comparisonOperator: 5, value: 160 }
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null
            },
            regionId: null,
            sortColumn: "RA_d",
            sortingType: 0,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
    ],
    catalogListResponse: {
        directory: testSubdirectory,
        success: true,
        subdirectories: ["Gaussian_J2000.image"]
    },
    catalogFileInfoResponse: {
        fileInfo: { name: "artificial_catalog_J2000.xml", type: 1, fileSize: 113559 },
        success: true,
        lengthOfHeaders: 235,
    },
    openCatalogFileAck: {
        dataSize: 29,
        fileId: 1,
        fileInfo: { name: "artificial_catalog_J2000.xml", type: 1, fileSize: 113559 },
        lengthOfHeaders: 235,
        success: true
    },
    catalogFilterResponse: [
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 29,
            subsetEndIndex: 29,
            filterDataSize: 29,
            requestEndIndex: 29,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 26,
            subsetEndIndex: 26,
            filterDataSize: 26,
            requestEndIndex: 26,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 24,
            subsetEndIndex: 24,
            filterDataSize: 24,
            requestEndIndex: 24,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 23,
            subsetEndIndex: 23,
            filterDataSize: 23,
            requestEndIndex: 23,
            progress: 1
        },
    ]
};

let basepath: string;
describe("Test for general CATALOG related messages:", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
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
            let CatalogFileInfoAck = await msgController.getCatalogFileInfo(assertItem.catalogFileInfoReq.directory, assertItem.catalogFileInfoReq.name)
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
        });

        test(`(Step 6) Request CatalogFilter: Sorting & check CatalogFilterResponse | `, async () => {
            await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[0]);
            let CatalogFilterResponse = await Stream(CARTA.CatalogFilterResponse, 1);
            expect(Object.keys(CatalogFilterResponse[0].columns).length).toEqual(assertItem.catalogFilterResponse[0].lengthOfColumns);
            expect(CatalogFilterResponse[0].fileid).toEqual(assertItem.catalogFilterResponse[0].fileId);
            expect(CatalogFilterResponse[0].subsetDataSize).toEqual(assertItem.catalogFilterResponse[0].subsetDataSize);
            expect(CatalogFilterResponse[0].subsetEndIndex).toEqual(assertItem.catalogFilterResponse[0].subsetEndIndex);
            expect(CatalogFilterResponse[0].filterDataSize).toEqual(assertItem.catalogFilterResponse[0].filterDataSize);
            expect(CatalogFilterResponse[0].requestEndIndex).toEqual(assertItem.catalogFilterResponse[0].requestEndIndex);
            expect(CatalogFilterResponse[0].progress).toEqual(assertItem.catalogFilterResponse[0].progress);
        });
        
        test(`(Step 7) Request CatalogFilter: Filter(number) & check CatalogFilterResponse | `, async () => {
            await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[1]);
            let CatalogFilterResponse2 = await Stream(CARTA.CatalogFilterResponse, 1);
            expect(Object.keys(CatalogFilterResponse2[0].columns).length).toEqual(assertItem.catalogFilterResponse[1].lengthOfColumns);
            expect(CatalogFilterResponse2[0].fileid).toEqual(assertItem.catalogFilterResponse[1].fileId);
            expect(CatalogFilterResponse2[0].subsetDataSize).toEqual(assertItem.catalogFilterResponse[1].subsetDataSize);
            expect(CatalogFilterResponse2[0].subsetEndIndex).toEqual(assertItem.catalogFilterResponse[1].subsetEndIndex);
            expect(CatalogFilterResponse2[0].filterDataSize).toEqual(assertItem.catalogFilterResponse[1].filterDataSize);
            expect(CatalogFilterResponse2[0].requestEndIndex).toEqual(assertItem.catalogFilterResponse[1].requestEndIndex);
            expect(CatalogFilterResponse2[0].progress).toEqual(assertItem.catalogFilterResponse[1].progress);
        });

        test(`(Step 8) Request CatalogFilter: Filter(string) & check CatalogFilterResponse | `, async () => {
            await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[2]);
            let CatalogFilterResponse3 = await Stream(CARTA.CatalogFilterResponse, 1);
            expect(Object.keys(CatalogFilterResponse3[0].columns).length).toEqual(assertItem.catalogFilterResponse[2].lengthOfColumns);
            expect(CatalogFilterResponse3[0].fileid).toEqual(assertItem.catalogFilterResponse[2].fileId);
            expect(CatalogFilterResponse3[0].subsetDataSize).toEqual(assertItem.catalogFilterResponse[2].subsetDataSize);
            expect(CatalogFilterResponse3[0].subsetEndIndex).toEqual(assertItem.catalogFilterResponse[2].subsetEndIndex);
            expect(CatalogFilterResponse3[0].filterDataSize).toEqual(assertItem.catalogFilterResponse[2].filterDataSize);
            expect(CatalogFilterResponse3[0].requestEndIndex).toEqual(assertItem.catalogFilterResponse[2].requestEndIndex);
            expect(CatalogFilterResponse3[0].progress).toEqual(assertItem.catalogFilterResponse[2].progress);
        });

        test(`(Step 9) Request CatalogFilter: Sorting when Filter(string+number) is applied & check CatalogFilterResponse | `, async () => {
            await msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[3]);
            let CatalogFilterResponse4 = await Stream(CARTA.CatalogFilterResponse, 1);
            expect(Object.keys(CatalogFilterResponse4[0].columns).length).toEqual(assertItem.catalogFilterResponse[3].lengthOfColumns);
            expect(CatalogFilterResponse4[0].fileid).toEqual(assertItem.catalogFilterResponse[3].fileId);
            expect(CatalogFilterResponse4[0].subsetDataSize).toEqual(assertItem.catalogFilterResponse[3].subsetDataSize);
            expect(CatalogFilterResponse4[0].subsetEndIndex).toEqual(assertItem.catalogFilterResponse[3].subsetEndIndex);
            expect(CatalogFilterResponse4[0].filterDataSize).toEqual(assertItem.catalogFilterResponse[3].filterDataSize);
            expect(CatalogFilterResponse4[0].requestEndIndex).toEqual(assertItem.catalogFilterResponse[3].requestEndIndex);
            expect(CatalogFilterResponse4[0].progress).toEqual(assertItem.catalogFilterResponse[3].progress);
        });

        afterAll(() => msgController.closeConnection());
    });
})