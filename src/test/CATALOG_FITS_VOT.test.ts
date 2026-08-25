import { CARTA } from 'carta-protobuf';
import { checkConnection } from './MyClient';
import {
    ICatalogFileInfoResponseExt,
    ICatalogFilterResponseExt,
    IOpenCatalogFileAckExt,
    assertCatalogFilterResponse,
    columnRowCount,
    expectPreviewData,
    requestCatalogFilter,
    testCatalogFileInfo,
    testCatalogList,
    testIncreasingProgress,
    testOpenCatalogFile,
    testOpenImageFile,
    testRasterTiles,
} from './CatalogHelpers';
import {
    CATALOG_LARGE_SUBDIRECTORY,
    CONNECTION_TIMEOUT,
    OPEN_CATALOG_LARGE_TIMEOUT,
    TEST_SERVER_URL,
    basePath,
} from './CommonHelpers';
import { MessageController } from './MessageController';

interface ICatalogFilterResponseExtLocal extends ICatalogFilterResponseExt {
    // The backend streams the requested subset in chunks of TableController's max_chunk_size
    maxChunkSize: number;
}

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
    catalogFilterResponse: ICatalogFilterResponseExtLocal[];
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
        spatialProfiles: [
            { coordinate: 'x', mip: 1 },
            { coordinate: 'y', mip: 1 },
        ],
    },
    catalogListReq: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
    },
    catalogFileInfoReq: [
        {
            directory: CATALOG_LARGE_SUBDIRECTORY,
            name: 'COSMOSOPTCAT.fits',
        },
        {
            directory: CATALOG_LARGE_SUBDIRECTORY,
            name: 'COSMOSOPTCAT.vot',
        },
    ],
    openCatalogFile: [
        {
            directory: CATALOG_LARGE_SUBDIRECTORY,
            fileId: 1,
            name: 'COSMOSOPTCAT.fits',
            previewDataSize: 50,
        },
        {
            directory: CATALOG_LARGE_SUBDIRECTORY,
            fileId: 2,
            name: 'COSMOSOPTCAT.vot',
            previewDataSize: 50,
        },
    ],
    catalogListResponse: {
        directory: CATALOG_LARGE_SUBDIRECTORY,
        success: true,
        subdirectories: [],
    },
    catalogFileInfoResponse: [
        {
            fileInfo: {
                name: 'COSMOSOPTCAT.fits',
                type: CARTA.CatalogFileType.FITSTable,
                fileSize: 444729600,
            },
            success: true,
            lengthOfHeaders: 62,
            descriptionKeywords: ['Name: COSMOSOPTCAT.fits', 'Column Count: 62', 'Row Count: 918827'],
        },
        {
            fileInfo: {
                name: 'COSMOSOPTCAT.vot',
                type: CARTA.CatalogFileType.VOTable,
                fileSize: 1631311089,
            },
            success: true,
            lengthOfHeaders: 62,
            descriptionKeywords: ['Name: COSMOSOPTCAT.vot', 'Column Count: 62', 'Row Count: 918827'],
        },
    ],
    openCatalogFileAck: [
        {
            dataSize: 918827,
            fileId: 1,
            fileInfo: {
                name: 'COSMOSOPTCAT.fits',
                type: CARTA.CatalogFileType.FITSTable,
                fileSize: 444729600,
            },
            lengthOfHeaders: 62,
            lengthOfPreviewData: 62,
            success: true,
        },
        {
            dataSize: 918827,
            fileId: 2,
            fileInfo: {
                name: 'COSMOSOPTCAT.vot',
                type: CARTA.CatalogFileType.VOTable,
                fileSize: 1631311089,
            },
            lengthOfHeaders: 62,
            lengthOfPreviewData: 62,
            success: true,
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
            subsetStartIndex: 50,
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
            subsetStartIndex: 50,
        },
    ],
    catalogFilterResponse: [
        {
            lengthOfColumns: 10,
            fileId: 1,
            maxChunkSize: 100000,
            numberOfResponses: 10,
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1,
        },
        {
            lengthOfColumns: 10,
            fileId: 2,
            maxChunkSize: 100000,
            numberOfResponses: 10,
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1,
        },
    ],
};

assertItem.catalogFileInfoReq.map((data, index) => {
    describe(`Test for "${assertItem.catalogFileInfoReq[index].name}" catalog:`, () => {
        const msgController = MessageController.Instance;
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        // The image and the catalog list are shared by both catalogs, so their directories are
        // prepended in the first describe block only
        basePath(
            index === 0
                ? [
                      assertItem.fileOpen,
                      assertItem.catalogListReq,
                      assertItem.catalogFileInfoReq[index],
                      assertItem.openCatalogFile[index],
                  ]
                : [assertItem.catalogFileInfoReq[index], assertItem.openCatalogFile[index]]
        );
        testOpenImageFile(assertItem);
        testRasterTiles(assertItem);
        testCatalogList(assertItem.catalogListReq, assertItem.catalogListResponse);

        const getCatalogFileInfoAck = testCatalogFileInfo(
            assertItem.catalogFileInfoReq[index],
            assertItem.catalogFileInfoResponse[index]
        );

        test(`(Step 4) CATALOG_FILE_INFO_RESPONSE.headers describe every column once | `, () => {
            const headers = getCatalogFileInfoAck().headers;
            const columnIndices = headers.map((header) => header.columnIndex);
            expect(columnIndices.slice().sort((a, b) => a - b)).toEqual(
                Array.from({ length: assertItem.catalogFileInfoResponse[index].lengthOfHeaders }, (_, i) => i)
            );
            headers.forEach((header) => {
                expect(header.name).not.toEqual('');
                expect(header.dataType).not.toEqual(CARTA.ColumnType.UnsupportedType);
            });
        });

        const getCatalogFileAck = testOpenCatalogFile(
            assertItem.openCatalogFile[index],
            assertItem.openCatalogFileAck[index],
            OPEN_CATALOG_LARGE_TIMEOUT
        );

        test(`(Step 5) OPEN_CATALOG_FILE_ACK.preview_data holds ${assertItem.openCatalogFile[0].previewDataSize} rows of every column | `, () => {
            expectPreviewData(
                getCatalogFileAck(),
                assertItem.openCatalogFileAck[index].lengthOfPreviewData,
                assertItem.openCatalogFile[index].previewDataSize
            );
        });

        let CatalogFilterResponse: CARTA.ICatalogFilterResponse[];
        test(
            `(Step 6) Request CatalogFilter & receive ${assertItem.catalogFilterResponse[0].numberOfResponses} streamed CatalogFilterResponse | `,
            async () => {
                CatalogFilterResponse = await requestCatalogFilter(assertItem.catalogFilterReq[index]);
                console.log(
                    `"${assertItem.catalogFileInfoReq[index].name}" CatalogFilterResponse progress :`,
                    CatalogFilterResponse.map((response) => response.progress)
                );
                assertCatalogFilterResponse(
                    CatalogFilterResponse,
                    assertItem.catalogFilterResponse[index],
                    assertItem.catalogFilterReq[index]
                );
            },
            OPEN_CATALOG_LARGE_TIMEOUT
        );

        test(`(Step 6) every CatalogFilterResponse reports the requested catalog and the whole filtered table | `, () => {
            CatalogFilterResponse.forEach((response) => {
                expect(response.fileId).toEqual(assertItem.catalogFilterResponse[index].fileId);
                expect(response.filterDataSize).toEqual(assertItem.catalogFilterResponse[index].filterDataSize);
                expect(response.requestEndIndex).toEqual(assertItem.catalogFilterResponse[index].requestEndIndex);
                expect(Object.keys(response.columns)).toEqual(
                    assertItem.catalogFilterReq[index].columnIndices.map((columnIndex) => `${columnIndex}`)
                );
            });
        });

        test(`(Step 6) the streamed chunks cover the requested subset without a gap or an overlap | `, () => {
            const maxChunkSize = assertItem.catalogFilterResponse[index].maxChunkSize;
            let expectedStartIndex = assertItem.catalogFilterReq[index].subsetStartIndex;
            let remainingRows = assertItem.catalogFilterReq[index].subsetDataSize;
            CatalogFilterResponse.forEach((response) => {
                const expectedChunkSize = Math.min(maxChunkSize, remainingRows);
                expect(response.subsetDataSize).toEqual(expectedChunkSize);
                // The frontend derives the row offset of a chunk from these two fields, so a
                // chunk has to continue exactly where the previous one ended.
                expect(response.subsetEndIndex - response.subsetDataSize).toEqual(expectedStartIndex);
                Object.keys(response.columns).forEach((key) => {
                    expect(columnRowCount(response.columns[key])).toEqual(expectedChunkSize);
                });
                expectedStartIndex += expectedChunkSize;
                remainingRows -= expectedChunkSize;
            });
            expect(remainingRows).toEqual(0);
        });

        testIncreasingProgress(() => CatalogFilterResponse);

        afterAll(() => msgController.closeConnection());
    });
});
