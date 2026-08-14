import { CARTA } from 'carta-protobuf';
import { Stream, columnRowCount, ICatalogFilterResponseExt } from './MyClient';
import { MessageController, ConnectionStatus } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.catalogLarge;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let openCatalogLargeTimeout: number = config.timeout.openCatalogLarge;

interface ICatalogFileInfoResponseExt extends CARTA.ICatalogFileInfoResponse {
    lengthOfHeaders: number;
    descriptionKeywords: string[];
}

interface IOpenCatalogFileAckExt extends CARTA.IOpenCatalogFileAck {
    lengthOfHeaders: number;
    lengthOfPreviewData: number;
}

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
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
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
        directory: testSubdirectory,
    },
    catalogFileInfoReq: [
        {
            directory: testSubdirectory,
            name: 'COSMOSOPTCAT.fits',
        },
        {
            directory: testSubdirectory,
            name: 'COSMOSOPTCAT.vot',
        },
    ],
    openCatalogFile: [
        {
            directory: testSubdirectory,
            fileId: 1,
            name: 'COSMOSOPTCAT.fits',
            previewDataSize: 50,
        },
        {
            directory: testSubdirectory,
            fileId: 2,
            name: 'COSMOSOPTCAT.vot',
            previewDataSize: 50,
        },
    ],
    catalogListResponse: {
        directory: testSubdirectory,
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

let basepath: string;
assertItem.catalogFileInfoReq.map((data, index) => {
    describe(`Test for "${assertItem.catalogFileInfoReq[index].name}" catalog:`, () => {
        const msgController = MessageController.Instance;
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        test(`(Step 0) Connection open? | `, () => {
            expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
        });

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            if (index === 0) {
                basepath = fileListResponse.directory;
                assertItem.fileOpen.directory = basepath + '/' + assertItem.fileOpen.directory;
                assertItem.catalogListReq.directory = basepath + '/' + assertItem.catalogListReq.directory;
            }
            assertItem.catalogFileInfoReq[index].directory =
                basepath + '/' + assertItem.catalogFileInfoReq[index].directory;
            assertItem.openCatalogFile[index].directory = basepath + '/' + assertItem.openCatalogFile[index].directory;
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
                assertItem.catalogFileInfoReq[index].directory,
                assertItem.catalogFileInfoReq[index].name
            );
            expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse[index].success);
            expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.name);
            // CatalogFileType.FITSTable is 0, so the type has to be compared unconditionally
            expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.type);
            expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(
                assertItem.catalogFileInfoResponse[index].fileInfo.fileSize
            );
            assertItem.catalogFileInfoResponse[index].descriptionKeywords.forEach((keyword) => {
                expect(CatalogFileInfoAck.fileInfo.description).toContain(keyword);
            });
            expect(CatalogFileInfoAck.headers.length).toEqual(
                assertItem.catalogFileInfoResponse[index].lengthOfHeaders
            );
        });

        test(`(Step 4) CATALOG_FILE_INFO_RESPONSE.headers describe every column once | `, () => {
            const columnIndices = CatalogFileInfoAck.headers.map((header) => header.columnIndex);
            expect(columnIndices.slice().sort((a, b) => a - b)).toEqual(
                Array.from({ length: assertItem.catalogFileInfoResponse[index].lengthOfHeaders }, (_, i) => i)
            );
            CatalogFileInfoAck.headers.forEach((header) => {
                expect(header.name).not.toEqual('');
                expect(header.dataType).not.toEqual(CARTA.ColumnType.UnsupportedType);
            });
        });

        let CatalogFileAck: CARTA.IOpenCatalogFileAck;
        test(
            `(Step 5) Request CatalogFile & check CatalogFileAck | `,
            async () => {
                CatalogFileAck = await msgController.loadCatalogFile(
                    assertItem.openCatalogFile[index].directory,
                    assertItem.openCatalogFile[index].name,
                    assertItem.openCatalogFile[index].fileId,
                    assertItem.openCatalogFile[index].previewDataSize
                );
                expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck[index].success);
                expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck[index].dataSize);
                expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck[index].fileId);
                expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck[index].fileInfo.name);
                // CatalogFileType.FITSTable is 0, so the type has to be compared unconditionally
                expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck[index].fileInfo.type);
                expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(
                    assertItem.openCatalogFileAck[index].fileInfo.fileSize
                );
                expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck[index].lengthOfHeaders);
            },
            openCatalogLargeTimeout
        );

        test(`(Step 5) OPEN_CATALOG_FILE_ACK.preview_data holds ${assertItem.openCatalogFile[0].previewDataSize} rows of every column | `, () => {
            const previewData = CatalogFileAck.previewData;
            expect(Object.keys(previewData).length).toEqual(assertItem.openCatalogFileAck[index].lengthOfPreviewData);
            Object.keys(previewData).forEach((key) => {
                expect(columnRowCount(previewData[key])).toEqual(assertItem.openCatalogFile[index].previewDataSize);
            });
        });

        let CatalogFilterResponse: CARTA.ICatalogFilterResponse[];
        test(
            `(Step 6) Request CatalogFilter & receive ${assertItem.catalogFilterResponse[0].numberOfResponses} streamed CatalogFilterResponse | `,
            async () => {
                // The stream has to be subscribed before the request is sent, otherwise the
                // first chunks are dropped and only the tail of the stream is asserted.
                const catalogFilterStream = Stream(CARTA.CatalogFilterResponse);
                msgController.setCatalogFilterRequest(assertItem.catalogFilterReq[index]);
                CatalogFilterResponse = await catalogFilterStream;
                console.log(
                    `"${assertItem.catalogFileInfoReq[index].name}" CatalogFilterResponse progress :`,
                    CatalogFilterResponse.map((response) => response.progress)
                );
                expect(CatalogFilterResponse.length).toEqual(assertItem.catalogFilterResponse[index].numberOfResponses);
            },
            openCatalogLargeTimeout
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

        test(`(Step 6) the progress increases and reaches 1 only in the last CatalogFilterResponse | `, () => {
            const progresses = CatalogFilterResponse.map((response) => response.progress);
            progresses.slice(0, -1).forEach((progress, i) => {
                expect(progress).toBeGreaterThan(0);
                expect(progress).toBeLessThan(1);
                expect(progresses[i + 1]).toBeGreaterThan(progress);
            });
            expect(progresses.slice(-1)[0]).toEqual(assertItem.catalogFilterResponse[index].progress);
        });

        test(`(Step 6) the last CatalogFilterResponse ends the requested subset | `, () => {
            const lastCatalogFilterResponse = CatalogFilterResponse.slice(-1)[0];
            expect(Object.keys(lastCatalogFilterResponse.columns).length).toEqual(
                assertItem.catalogFilterResponse[index].lengthOfColumns
            );
            expect(lastCatalogFilterResponse.subsetDataSize).toEqual(
                assertItem.catalogFilterResponse[index].subsetDataSize
            );
            expect(lastCatalogFilterResponse.subsetEndIndex).toEqual(
                assertItem.catalogFilterResponse[index].subsetEndIndex
            );
        });

        afterAll(() => msgController.closeConnection());
    });
});
