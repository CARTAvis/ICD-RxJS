import { CARTA } from 'carta-protobuf';
import { checkConnection } from './MyClient';
import {
    ICatalogFileInfoResponseExt,
    ICatalogFilterResponseExt,
    IOpenCatalogFileAckExt,
    assertCatalogFileInfo,
    assertCatalogFilterResponse,
    assertCatalogList,
    assertIncreasingProgress,
    assertOpenCatalogFile,
    assertOpenImageFile,
    assertRasterTiles,
    columnSlice,
    requestCatalogFilter,
} from './CatalogHelpers';
import {
    CATALOG_LARGE_SUBDIRECTORY,
    CONNECTION_TIMEOUT,
    OPEN_CATALOG_LARGE_TIMEOUT,
    OPEN_FILE_TIMEOUT,
    READ_FILE_TIMEOUT,
    TEST_SERVER_URL,
    assertBasePath,
} from './CommonHelpers';
import { MessageController } from './MessageController';

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
}

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: CATALOG_LARGE_SUBDIRECTORY },
    fileOpen: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
        file: 'cosmos_herschel250micron.fits',
        hdu: '0',
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
        spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
    },
    catalogListReq: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
    },
    catalogFileInfoReq: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
        name: 'COSMOSOPTCAT.vot',
    },
    openCatalogFile: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
        fileId: 1,
        name: 'COSMOSOPTCAT.vot',
        previewDataSize: 50,
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
            subsetStartIndex: 50,
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
            subsetStartIndex: 50,
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
            subsetStartIndex: 100,
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
            subsetStartIndex: 150,
        },
    ],
    catalogListResponse: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
        success: true,
        subdirectories: [],
    },
    catalogFileInfoResponse: {
        fileInfo: { name: 'COSMOSOPTCAT.vot', type: CARTA.CatalogFileType.VOTable, fileSize: 1631311089 },
        success: true,
        lengthOfHeaders: 62,
    },
    openCatalogFileAck: {
        dataSize: 918827,
        fileId: 1,
        fileInfo: { name: 'COSMOSOPTCAT.vot', type: CARTA.CatalogFileType.VOTable, fileSize: 1631311089 },
        lengthOfHeaders: 62,
        success: true,
    },
    catalogFilterResponse: [
        {
            // The whole table is streamed in chunks of at most 100000 rows
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 10,
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1,
        },
        {
            // A window of 50 rows fits in one response
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 50,
            subsetEndIndex: 100,
            filterDataSize: 918827,
            requestEndIndex: 100,
            progress: 1,
        },
        {
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 50,
            subsetEndIndex: 150,
            filterDataSize: 918827,
            requestEndIndex: 150,
            progress: 1,
        },
        {
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 50,
            subsetEndIndex: 200,
            filterDataSize: 918827,
            requestEndIndex: 200,
            progress: 1,
        },
    ],
};

// The first chunk of the whole-table load, kept so that the progressive windows of part 2
// can be compared against the rows the bulk load returned for the same table positions.
let wholeTableFirstChunk: CARTA.ICatalogFilterResponse;

// Steps 1 to 5 open the image and the catalog file, which both describe blocks below need
// before they can filter anything.
function openImageAndCatalogFile() {
    test(
        `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
        async () => {
            await assertOpenImageFile(assertItem);
        },
        OPEN_FILE_TIMEOUT
    );

    test(
        `(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `,
        async () => {
            await assertRasterTiles(assertItem);
        },
        READ_FILE_TIMEOUT
    );

    test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
        await assertCatalogList(assertItem.catalogListReq, assertItem.catalogListResponse);
    });

    test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
        await assertCatalogFileInfo(assertItem.catalogFileInfoReq, assertItem.catalogFileInfoResponse);
    });

    test(
        `(Step 5) Request CatalogFile & check CatalogFileAck | `,
        async () => {
            await assertOpenCatalogFile(assertItem.openCatalogFile, assertItem.openCatalogFileAck);
        },
        OPEN_CATALOG_LARGE_TIMEOUT
    );
}

describe('Test for large-size CATALOG: load whole table at one time', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
    }, CONNECTION_TIMEOUT);

    checkConnection();
    // The directories are prepended here only, the second describe block reuses the fixtures
    test(`Get basepath and modify the directory path`, async () => {
        await assertBasePath([
            assertItem.fileOpen,
            assertItem.catalogListReq,
            assertItem.catalogFileInfoReq,
            assertItem.openCatalogFile,
        ]);
    });

    openImageAndCatalogFile();

    let WholeTableResponse: CARTA.ICatalogFilterResponse[];
    test(
        `(Step 6) Request CatalogFilter: progress & check CatalogFilterResponse | `,
        async () => {
            WholeTableResponse = await requestCatalogFilter(assertItem.catalogFilterReq[0]);
            wholeTableFirstChunk = WholeTableResponse[0];
            console.log(
                `"${assertItem.catalogFileInfoReq.name}" CatalogFilterResponse progress :`,
                WholeTableResponse.map((response) => response.progress)
            );
            assertCatalogFilterResponse(
                WholeTableResponse,
                assertItem.catalogFilterResponse[0],
                assertItem.catalogFilterReq[0]
            );
        },
        OPEN_CATALOG_LARGE_TIMEOUT
    );

    test(`(Step 6) the progress increases and reaches 1 only in the last CatalogFilterResponse | `, () => {
        assertIncreasingProgress(WholeTableResponse);
    });

    afterAll(() => msgController.closeConnection());
});

describe('Test for large-size CATALOG: Progressive load of rows', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
    }, CONNECTION_TIMEOUT);

    checkConnection();
    openImageAndCatalogFile();

    let ProgressiveWindows: CARTA.ICatalogFilterResponse[] = [];
    for (let i = 1; i < 4; i++) {
        test(
            `(Step 6-${i - 1}) Request CatalogFilter: subsetStartIndex of ${assertItem.catalogFilterReq[i].subsetStartIndex} & check CatalogFilterResponse | `,
            async () => {
                const CatalogFilterResponse = await requestCatalogFilter(assertItem.catalogFilterReq[i]);
                ProgressiveWindows[i] = CatalogFilterResponse[0];
                assertCatalogFilterResponse(
                    CatalogFilterResponse,
                    assertItem.catalogFilterResponse[i],
                    assertItem.catalogFilterReq[i]
                );
                // A window ends where the request asked it to, whatever its start index is
                expect(CatalogFilterResponse[0].subsetEndIndex).toEqual(
                    assertItem.catalogFilterReq[i].subsetStartIndex + assertItem.catalogFilterReq[i].subsetDataSize
                );
                // Paging through the table does not change the number of rows it holds
                expect(CatalogFilterResponse[0].filterDataSize).toEqual(assertItem.openCatalogFileAck.dataSize);
            },
            OPEN_CATALOG_LARGE_TIMEOUT
        );
    }

    test(`(Step 6) each window returns the rows the whole table load returned at the same position | `, () => {
        expect(wholeTableFirstChunk).toBeDefined();
        const wholeTableStartIndex = assertItem.catalogFilterReq[0].subsetStartIndex;
        for (let i = 1; i < 4; i++) {
            const request = assertItem.catalogFilterReq[i];
            const offset = request.subsetStartIndex - wholeTableStartIndex;
            Object.keys(ProgressiveWindows[i].columns).forEach((key) => {
                expect(columnSlice(ProgressiveWindows[i].columns[key], 0, request.subsetDataSize)).toEqual(
                    columnSlice(wholeTableFirstChunk.columns[key], offset, request.subsetDataSize)
                );
            });
        }
    });

    test(`(Step 6) the three windows return three different sets of rows | `, () => {
        const firstColumnKey = Object.keys(ProgressiveWindows[1].columns)[0];
        const windowRows = [1, 2, 3].map((i) =>
            JSON.stringify(columnSlice(ProgressiveWindows[i].columns[firstColumnKey], 0, 50))
        );
        expect(new Set(windowRows).size).toEqual(windowRows.length);
    });

    afterAll(() => msgController.closeConnection());
});
