import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.catalogArtificial;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;

interface ICatalogFileInfoResponseExt extends CARTA.ICatalogFileInfoResponse {
    lengthOfHeaders: number;
    descriptionKeywords: string[];
}

interface IOpenCatalogFileAckExt extends CARTA.IOpenCatalogFileAck {
    lengthOfHeaders: number;
    lengthOfPreviewData: number;
}

interface ICatalogFilterResponseExt extends CARTA.ICatalogFilterResponse {
    lengthOfColumns: number;
    numberOfResponses: number;
}

// ColumnData carries every type other than String as binary, so the number of rows in a
// column has to be derived from the byte length of its payload.
const bytesPerElement = new Map<CARTA.ColumnType, number>([
    [CARTA.ColumnType.Uint8, 1],
    [CARTA.ColumnType.Int8, 1],
    [CARTA.ColumnType.Bool, 1],
    [CARTA.ColumnType.Uint16, 2],
    [CARTA.ColumnType.Int16, 2],
    [CARTA.ColumnType.Uint32, 4],
    [CARTA.ColumnType.Int32, 4],
    [CARTA.ColumnType.Float, 4],
    [CARTA.ColumnType.Uint64, 8],
    [CARTA.ColumnType.Int64, 8],
    [CARTA.ColumnType.Double, 8],
]);

function columnRowCount(column: CARTA.IColumnData): number {
    if (column.dataType === CARTA.ColumnType.String) {
        return column.stringData!.length;
    }
    return column.binaryData!.length / bytesPerElement.get(column.dataType!)!;
}

function stringColumn(column: CARTA.IColumnData): string[] {
    expect(column.dataType).toEqual(CARTA.ColumnType.String);
    return column.stringData!;
}

function doubleColumn(column: CARTA.IColumnData): number[] {
    expect(column.dataType).toEqual(CARTA.ColumnType.Double);
    return Array.from(new Float64Array(column.binaryData!.slice().buffer));
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
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
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
        directory: testSubdirectory,
    },
    catalogFileInfoReq: {
        directory: testSubdirectory,
        name: 'artificial_catalog_J2000.xml',
    },
    openCatalogFile: {
        directory: testSubdirectory,
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
        directory: testSubdirectory,
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

function assertCatalogFilterResponse(
    responses: CARTA.ICatalogFilterResponse[],
    expected: ICatalogFilterResponseExt,
    requestedColumnIndices: number[]
) {
    expect(responses.length).toEqual(expected.numberOfResponses);
    const response = responses[0];
    expect(response.fileId).toEqual(expected.fileId);
    expect(Object.keys(response.columns).length).toEqual(expected.lengthOfColumns);
    expect(Object.keys(response.columns)).toEqual(requestedColumnIndices.map((columnIndex) => `${columnIndex}`));
    expect(response.subsetDataSize).toEqual(expected.subsetDataSize);
    expect(response.subsetEndIndex).toEqual(expected.subsetEndIndex);
    expect(response.filterDataSize).toEqual(expected.filterDataSize);
    expect(response.requestEndIndex).toEqual(expected.requestEndIndex);
    expect(response.progress).toEqual(expected.progress);
    Object.keys(response.columns).forEach((key) => {
        expect(columnRowCount(response.columns[key])).toEqual(expected.subsetDataSize);
    });
}

function requestCatalogFilter(
    msgController: MessageController,
    filterRequest: CARTA.ICatalogFilterRequest
): Promise<CARTA.ICatalogFilterResponse[]> {
    // The stream has to be subscribed before the request is sent, otherwise the response
    // is dropped and the promise never settles.
    const catalogFilterStream = Stream(CARTA.CatalogFilterResponse);
    msgController.setCatalogFilterRequest(filterRequest);
    return catalogFilterStream;
}

let basepath: string;
describe('Test for general CATALOG related messages:', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + '/' + assertItem.fileOpen.directory;
            assertItem.catalogListReq.directory = basepath + '/' + assertItem.catalogListReq.directory;
            assertItem.catalogFileInfoReq.directory = basepath + '/' + assertItem.catalogFileInfoReq.directory;
            assertItem.openCatalogFile.directory = basepath + '/' + assertItem.openCatalogFile.directory;
        });

        test(
            `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
            async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
            },
            openFileTimeout
        );

        test(
            `(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `,
            async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq);
                let RasterTileDataResponse = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq.tiles.length + 2
                );

                msgController.setCursor(
                    assertItem.setCursor.fileId,
                    assertItem.setCursor.point.x,
                    assertItem.setCursor.point.y
                );
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);

                msgController.setSpatialRequirements(assertItem.setSpatialReq);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData, 1);

                expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
            },
            readFileTimeout
        );

        test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
            let CatalogListAck = await msgController.getCatalogList(
                assertItem.catalogListReq.directory,
                assertItem.catalogListReq.filterMode
            );
            expect(CatalogListAck.directory).toContain(assertItem.catalogListResponse.directory);
            expect(CatalogListAck.success).toEqual(assertItem.catalogListResponse.success);
            let CatalogListAckTempSubdirectories = CatalogListAck.subdirectories.map((f) => f.name);
            expect(CatalogListAckTempSubdirectories).toEqual(
                expect.arrayContaining(assertItem.catalogListResponse.subdirectories)
            );
        });

        let CatalogFileInfoAck: CARTA.ICatalogFileInfoResponse;
        test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
            CatalogFileInfoAck = await msgController.getCatalogFileInfo(
                assertItem.catalogFileInfoReq.directory,
                assertItem.catalogFileInfoReq.name
            );
            expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse.success);
            expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse.fileInfo.name);
            expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse.fileInfo.type);
            expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(
                assertItem.catalogFileInfoResponse.fileInfo.fileSize
            );
            assertItem.catalogFileInfoResponse.descriptionKeywords.forEach((keyword) => {
                expect(CatalogFileInfoAck.fileInfo.description).toContain(keyword);
            });
            expect(CatalogFileInfoAck.headers.length).toEqual(assertItem.catalogFileInfoResponse.lengthOfHeaders);
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
            CatalogFileAck = await msgController.loadCatalogFile(
                assertItem.openCatalogFile.directory,
                assertItem.openCatalogFile.name,
                assertItem.openCatalogFile.fileId,
                assertItem.openCatalogFile.previewDataSize
            );
            expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck.success);
            expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck.dataSize);
            expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck.fileId);
            expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck.fileInfo.name);
            expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck.fileInfo.type);
            expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(assertItem.openCatalogFileAck.fileInfo.fileSize);
            expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck.lengthOfHeaders);
        });

        test(`(Step 5) OPEN_CATALOG_FILE_ACK.preview_data is clamped to the ${assertItem.openCatalogFileAck.dataSize} rows of the table | `, () => {
            const previewData = CatalogFileAck.previewData;
            expect(Object.keys(previewData).length).toEqual(assertItem.openCatalogFileAck.lengthOfPreviewData);
            // preview_data_size asks for more rows than the table holds, so the backend
            // returns the whole table instead.
            expect(assertItem.openCatalogFile.previewDataSize).toBeGreaterThan(assertItem.openCatalogFileAck.dataSize);
            Object.keys(previewData).forEach((key) => {
                expect(columnRowCount(previewData[key])).toEqual(assertItem.openCatalogFileAck.dataSize);
            });
        });

        let SortedResponse: CARTA.ICatalogFilterResponse[];
        test(`(Step 6) Request CatalogFilter: Sorting & check CatalogFilterResponse | `, async () => {
            SortedResponse = await requestCatalogFilter(msgController, assertItem.catalogFilterReq[0]);
            assertCatalogFilterResponse(
                SortedResponse,
                assertItem.catalogFilterResponse[0],
                assertItem.catalogFilterReq[0].columnIndices
            );
        });

        test(`(Step 6) the rows are sorted by "${assertItem.catalogFilterReq[0].sortColumn}" in ascending order | `, () => {
            const sortColumnIndex = filterColumnIndices.get(assertItem.catalogFilterReq[0].sortColumn);
            const sortValues = doubleColumn(SortedResponse[0].columns[sortColumnIndex]);
            expect(sortValues).toEqual([...sortValues].sort((a, b) => a - b));
        });

        let NumberFilteredResponse: CARTA.ICatalogFilterResponse[];
        test(`(Step 7) Request CatalogFilter: Filter(number) & check CatalogFilterResponse | `, async () => {
            NumberFilteredResponse = await requestCatalogFilter(msgController, assertItem.catalogFilterReq[1]);
            assertCatalogFilterResponse(
                NumberFilteredResponse,
                assertItem.catalogFilterResponse[1],
                assertItem.catalogFilterReq[1].columnIndices
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
            StringFilteredResponse = await requestCatalogFilter(msgController, assertItem.catalogFilterReq[2]);
            assertCatalogFilterResponse(
                StringFilteredResponse,
                assertItem.catalogFilterResponse[2],
                assertItem.catalogFilterReq[2].columnIndices
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
            SortedAndFilteredResponse = await requestCatalogFilter(msgController, assertItem.catalogFilterReq[3]);
            assertCatalogFilterResponse(
                SortedAndFilteredResponse,
                assertItem.catalogFilterResponse[3],
                assertItem.catalogFilterReq[3].columnIndices
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
