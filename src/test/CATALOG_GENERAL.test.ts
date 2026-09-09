import { CARTA } from 'carta-protobuf';
import { checkConnection } from './MyClient';
import {
    ICatalogFileInfoResponseExt,
    ICatalogFilterResponseExt,
    IOpenCatalogFileAckExt,
    assertCatalogFileInfo,
    assertCatalogFilterResponse,
    assertCatalogList,
    assertOpenCatalogFile,
    assertOpenImageFile,
    assertRasterTiles,
    doubleColumn,
    expectPreviewData,
    requestCatalogFilter,
    stringColumn,
} from './CatalogHelpers';
import {
    CATALOG_ARTIFICIAL_SUBDIRECTORY,
    CONNECTION_TIMEOUT,
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
    filelist: { directory: CATALOG_ARTIFICIAL_SUBDIRECTORY },
    fileOpen: {
        directory: CATALOG_ARTIFICIAL_SUBDIRECTORY,
        file: 'Gaussian_J2000.fits',
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
        point: { x: 1250, y: 100 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
    },
    catalogListReq: {
        directory: CATALOG_ARTIFICIAL_SUBDIRECTORY,
    },
    catalogFileInfoReq: {
        directory: CATALOG_ARTIFICIAL_SUBDIRECTORY,
        name: 'artificial_catalog_J2000.xml',
    },
    openCatalogFile: {
        directory: CATALOG_ARTIFICIAL_SUBDIRECTORY,
        fileId: 1,
        name: 'artificial_catalog_J2000.xml',
        previewDataSize: 50,
    },
    catalogFilterReq: [
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: 'RA_d',
            sortingType: CARTA.SortingType.Ascending,
            subsetDataSize: 29,
            subsetStartIndex: 0,
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: 'RA_d', comparisonOperator: CARTA.ComparisonOperator.GreaterOrEqual, value: 160 },
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null,
            },
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 29,
            subsetStartIndex: 0,
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [{ columnName: 'OTYPE_S', subString: 'Star' }],
            imageBounds: {
                xColumnName: null,
                yColumnName: null,
            },
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 29,
            subsetStartIndex: 0,
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: 'OTYPE_S', subString: 'Star' },
                { columnName: 'RA_d', comparisonOperator: CARTA.ComparisonOperator.GreaterOrEqual, value: 160 },
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null,
            },
            regionId: null,
            sortColumn: 'RA_d',
            sortingType: CARTA.SortingType.Ascending,
            subsetDataSize: 29,
            subsetStartIndex: 0,
        },
    ],
    catalogListResponse: {
        directory: CATALOG_ARTIFICIAL_SUBDIRECTORY,
        success: true,
        subdirectories: ['Gaussian_J2000.image'],
    },
    catalogFileInfoResponse: {
        fileInfo: {
            name: 'artificial_catalog_J2000.xml',
            type: CARTA.CatalogFileType.VOTable,
            fileSize: 113559,
        },
        success: true,
        lengthOfHeaders: 235,
        descriptionKeywords: [
            'Name: artificial_catalog_J2000.xml',
            'Column Count: 235',
            'Coordinate System: FK5',
            'Epoch: J2000',
            'Equinox: 2000',
        ],
    },
    openCatalogFileAck: {
        dataSize: 29,
        fileId: 1,
        fileInfo: {
            name: 'artificial_catalog_J2000.xml',
            type: CARTA.CatalogFileType.VOTable,
            fileSize: 113559,
        },
        lengthOfHeaders: 235,
        lengthOfPreviewData: 235,
        success: true,
    },
    // The table holds 29 rows, so every subset fits in one CatalogFilterResponse
    catalogFilterResponse: [
        {
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 29,
            subsetEndIndex: 29,
            filterDataSize: 29,
            requestEndIndex: 29,
            progress: 1,
        },
        {
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 26,
            subsetEndIndex: 26,
            filterDataSize: 26,
            requestEndIndex: 26,
            progress: 1,
        },
        {
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 24,
            subsetEndIndex: 24,
            filterDataSize: 24,
            requestEndIndex: 24,
            progress: 1,
        },
        {
            lengthOfColumns: 10,
            fileId: 1,
            numberOfResponses: 1,
            subsetDataSize: 23,
            subsetEndIndex: 23,
            filterDataSize: 23,
            requestEndIndex: 23,
            progress: 1,
        },
    ],
};

describe('Test for general CATALOG related messages:', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            await assertBasePath([
                assertItem.fileOpen,
                assertItem.catalogListReq,
                assertItem.catalogFileInfoReq,
                assertItem.openCatalogFile,
            ]);
        });

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

        let CatalogFileInfoAck: CARTA.ICatalogFileInfoResponse;
        test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
            CatalogFileInfoAck = await assertCatalogFileInfo(
                assertItem.catalogFileInfoReq,
                assertItem.catalogFileInfoResponse
            );
        });

        // The filter and the sort are requested by column name, while the response keys its
        // columns by index, so the two are tied together through the headers.
        let filterColumnIndices: Map<string, number>;
        test(`(Step 4) the headers place the filtered columns inside the requested column_indices | `, () => {
            filterColumnIndices = new Map(
                CatalogFileInfoAck.headers.map((header) => [header.name, header.columnIndex])
            );
            const filteredColumnNames = [
                assertItem.catalogFilterReq[0].sortColumn,
                assertItem.catalogFilterReq[1].filterConfigs[0].columnName,
                assertItem.catalogFilterReq[2].filterConfigs[0].columnName,
            ];
            filteredColumnNames.forEach((columnName) => {
                expect(filterColumnIndices.get(columnName)).toBeDefined();
                expect(assertItem.catalogFilterReq[0].columnIndices).toContain(filterColumnIndices.get(columnName));
            });
        });

        let CatalogFileAck: CARTA.IOpenCatalogFileAck;
        test(`(Step 5) Request CatalogFile & check CatalogFileAck | `, async () => {
            CatalogFileAck = await assertOpenCatalogFile(assertItem.openCatalogFile, assertItem.openCatalogFileAck);
        });

        test(`(Step 5) OPEN_CATALOG_FILE_ACK.preview_data is clamped to the ${assertItem.openCatalogFileAck.dataSize} rows of the table | `, () => {
            // preview_data_size asks for more rows than the table holds, so the backend
            // returns the whole table instead.
            expect(assertItem.openCatalogFile.previewDataSize).toBeGreaterThan(assertItem.openCatalogFileAck.dataSize);
            expectPreviewData(
                CatalogFileAck,
                assertItem.openCatalogFileAck.lengthOfPreviewData,
                assertItem.openCatalogFileAck.dataSize
            );
        });

        let SortedResponse: CARTA.ICatalogFilterResponse[];
        test(`(Step 6) Request CatalogFilter: Sorting & check CatalogFilterResponse | `, async () => {
            SortedResponse = await requestCatalogFilter(assertItem.catalogFilterReq[0]);
            assertCatalogFilterResponse(
                SortedResponse,
                assertItem.catalogFilterResponse[0],
                assertItem.catalogFilterReq[0]
            );
        });

        test(`(Step 6) the rows are sorted by "${assertItem.catalogFilterReq[0].sortColumn}" in ascending order | `, () => {
            const sortColumnIndex = filterColumnIndices.get(assertItem.catalogFilterReq[0].sortColumn);
            const sortValues = doubleColumn(SortedResponse[0].columns[sortColumnIndex]);
            expect(sortValues).toEqual([...sortValues].sort((a, b) => a - b));
        });

        let NumberFilteredResponse: CARTA.ICatalogFilterResponse[];
        test(`(Step 7) Request CatalogFilter: Filter(number) & check CatalogFilterResponse | `, async () => {
            NumberFilteredResponse = await requestCatalogFilter(assertItem.catalogFilterReq[1]);
            assertCatalogFilterResponse(
                NumberFilteredResponse,
                assertItem.catalogFilterResponse[1],
                assertItem.catalogFilterReq[1]
            );
        });

        test(`(Step 7) every returned row satisfies the number filter | `, () => {
            const filterConfig = assertItem.catalogFilterReq[1].filterConfigs[0];
            const filterValues = doubleColumn(
                NumberFilteredResponse[0].columns[filterColumnIndices.get(filterConfig.columnName)]
            );
            filterValues.forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(filterConfig.value);
            });
            // The unfiltered table is the sorted response of step 6, so the rows the filter
            // removed have to be the ones below the threshold.
            const allValues = doubleColumn(SortedResponse[0].columns[filterColumnIndices.get(filterConfig.columnName)]);
            expect(filterValues.length).toEqual(allValues.filter((value) => value >= filterConfig.value).length);
        });

        let StringFilteredResponse: CARTA.ICatalogFilterResponse[];
        test(`(Step 8) Request CatalogFilter: Filter(string) & check CatalogFilterResponse | `, async () => {
            StringFilteredResponse = await requestCatalogFilter(assertItem.catalogFilterReq[2]);
            assertCatalogFilterResponse(
                StringFilteredResponse,
                assertItem.catalogFilterResponse[2],
                assertItem.catalogFilterReq[2]
            );
        });

        test(`(Step 8) every returned row satisfies the string filter | `, () => {
            const filterConfig = assertItem.catalogFilterReq[2].filterConfigs[0];
            const filterValues = stringColumn(
                StringFilteredResponse[0].columns[filterColumnIndices.get(filterConfig.columnName)]
            );
            filterValues.forEach((value) => {
                expect(value).toContain(filterConfig.subString);
            });
            const allValues = stringColumn(SortedResponse[0].columns[filterColumnIndices.get(filterConfig.columnName)]);
            expect(filterValues.length).toEqual(
                allValues.filter((value) => value.includes(filterConfig.subString)).length
            );
        });

        let SortedAndFilteredResponse: CARTA.ICatalogFilterResponse[];
        test(`(Step 9) Request CatalogFilter: Sorting when Filter(string+number) is applied & check CatalogFilterResponse | `, async () => {
            SortedAndFilteredResponse = await requestCatalogFilter(assertItem.catalogFilterReq[3]);
            assertCatalogFilterResponse(
                SortedAndFilteredResponse,
                assertItem.catalogFilterResponse[3],
                assertItem.catalogFilterReq[3]
            );
        });

        test(`(Step 9) the returned rows satisfy both filters and are sorted by "${assertItem.catalogFilterReq[3].sortColumn}" | `, () => {
            const [stringFilterConfig, numberFilterConfig] = assertItem.catalogFilterReq[3].filterConfigs;
            const stringValues = stringColumn(
                SortedAndFilteredResponse[0].columns[filterColumnIndices.get(stringFilterConfig.columnName)]
            );
            const numberValues = doubleColumn(
                SortedAndFilteredResponse[0].columns[filterColumnIndices.get(numberFilterConfig.columnName)]
            );
            stringValues.forEach((value) => {
                expect(value).toContain(stringFilterConfig.subString);
            });
            numberValues.forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(numberFilterConfig.value);
            });
            expect(numberValues).toEqual([...numberValues].sort((a, b) => a - b));
            // Both filters together keep fewer rows than either one alone
            expect(SortedAndFilteredResponse[0].filterDataSize).toBeLessThan(NumberFilteredResponse[0].filterDataSize);
            expect(SortedAndFilteredResponse[0].filterDataSize).toBeLessThan(StringFilteredResponse[0].filterDataSize);
        });

        afterAll(() => msgController.closeConnection());
    });
});
