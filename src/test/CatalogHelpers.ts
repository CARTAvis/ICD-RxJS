import { CARTA } from 'carta-protobuf';
import { Stream, columnRowCount } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

/**
 * Shared fixtures and steps for the CATALOG_* tests. Every one of them opens an image, lists
 * the catalogs stored beside it, and then opens and filters one catalog file, so steps 1 to 5
 * are registered from here and only the filtering of step 6 onwards differs per test.
 */

export const TEST_SERVER_URL: string = config.serverURL0;
export const CONNECTION_TIMEOUT: number = config.timeout.connection;
export const OPEN_FILE_TIMEOUT: number = config.timeout.openFile;
export const READ_FILE_TIMEOUT: number = config.timeout.readFile;
export const OPEN_CATALOG_LARGE_TIMEOUT: number = config.timeout.openCatalogLarge;

/** The expected CATALOG_FILE_INFO_RESPONSE values the protobuf message has no field for. */
export interface ICatalogFileInfoResponseExt extends CARTA.ICatalogFileInfoResponse {
    lengthOfHeaders: number;
    /** Omit to leave CATALOG_FILE_INFO_RESPONSE.file_info.description unchecked. */
    descriptionKeywords?: string[];
}

/** The expected OPEN_CATALOG_FILE_ACK values the protobuf message has no field for. */
export interface IOpenCatalogFileAckExt extends CARTA.IOpenCatalogFileAck {
    lengthOfHeaders: number;
    lengthOfPreviewData?: number;
}

/** The image a catalog is overlaid on, opened before the catalog file itself. */
export interface IImageFixture {
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
}

/**
 * Resolve "$BASE" and prepend it to the directory of every request given. The requests are
 * modified in place, so a file which registers more than one describe block has to pass each
 * of them once only.
 */
export function testBasePath(requests: { directory?: string }[]) {
    test(`Get basepath and modify the directory path`, async () => {
        const fileListResponse = await MessageController.Instance.getFileList('$BASE', 0);
        const basepath = fileListResponse.directory;
        requests.forEach((request) => {
            request.directory = basepath + '/' + request.directory;
        });
    });
}

export function testOpenImageFile(image: IImageFixture) {
    test(
        `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
        async () => {
            const msgController = MessageController.Instance;
            msgController.closeFile(-1);
            const OpenFileResponse = await msgController.loadFile(image.fileOpen);
            await Stream(CARTA.RegionHistogramData, 1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(image.fileOpen.file);
        },
        OPEN_FILE_TIMEOUT
    );
}

export function testRasterTiles(image: IImageFixture) {
    test(
        `(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `,
        async () => {
            const msgController = MessageController.Instance;
            // RasterTileSync start & end, plus one RasterTileData per requested tile
            const rasterTileMessageCount = image.addTilesReq.tiles.length + 2;

            msgController.addRequiredTiles(image.addTilesReq);
            const RasterTileDataResponse = await Stream(CARTA.RasterTileData, rasterTileMessageCount);

            msgController.setCursor(image.setCursor.fileId, image.setCursor.point.x, image.setCursor.point.y);
            await Stream(CARTA.SpatialProfileData, 1);

            msgController.setSpatialRequirements(image.setSpatialReq);
            await Stream(CARTA.SpatialProfileData, 1);

            expect(RasterTileDataResponse.length).toEqual(rasterTileMessageCount);
        },
        READ_FILE_TIMEOUT
    );
}

export function testCatalogList(request: CARTA.ICatalogListRequest, expected: CARTA.ICatalogListResponse) {
    test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
        const CatalogListAck = await MessageController.Instance.getCatalogList(request.directory, request.filterMode);
        expect(CatalogListAck.directory).toContain(expected.directory);
        expect(CatalogListAck.success).toEqual(expected.success);
        const CatalogListAckSubdirectories = CatalogListAck.subdirectories.map((f) => f.name);
        expect(CatalogListAckSubdirectories).toEqual(expect.arrayContaining(expected.subdirectories));
    });
}

/**
 * The acknowledgement is returned through a getter because the tests which check it further
 * are registered before this one has run.
 */
export function testCatalogFileInfo(
    request: CARTA.ICatalogFileInfoRequest,
    expected: ICatalogFileInfoResponseExt
): () => CARTA.ICatalogFileInfoResponse {
    let CatalogFileInfoAck: CARTA.ICatalogFileInfoResponse;
    test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
        CatalogFileInfoAck = await MessageController.Instance.getCatalogFileInfo(request.directory, request.name);
        expect(CatalogFileInfoAck.success).toEqual(expected.success);
        expect(CatalogFileInfoAck.fileInfo.name).toEqual(expected.fileInfo.name);
        // CatalogFileType.FITSTable is 0, so the type has to be compared unconditionally
        expect(CatalogFileInfoAck.fileInfo.type).toEqual(expected.fileInfo.type);
        expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(expected.fileInfo.fileSize);
        expected.descriptionKeywords?.forEach((keyword) => {
            expect(CatalogFileInfoAck.fileInfo.description).toContain(keyword);
        });
        expect(CatalogFileInfoAck.headers.length).toEqual(expected.lengthOfHeaders);
    });
    return () => CatalogFileInfoAck;
}

/** Pass a timeout when the catalog is large enough that the default one is too short. */
export function testOpenCatalogFile(
    request: CARTA.IOpenCatalogFile,
    expected: IOpenCatalogFileAckExt,
    timeout?: number
): () => CARTA.IOpenCatalogFileAck {
    let CatalogFileAck: CARTA.IOpenCatalogFileAck;
    test(
        `(Step 5) Request CatalogFile & check CatalogFileAck | `,
        async () => {
            CatalogFileAck = await MessageController.Instance.loadCatalogFile(
                request.directory,
                request.name,
                request.fileId,
                request.previewDataSize
            );
            expect(CatalogFileAck.success).toEqual(expected.success);
            expect(CatalogFileAck.dataSize).toEqual(expected.dataSize);
            expect(CatalogFileAck.fileId).toEqual(expected.fileId);
            expect(CatalogFileAck.fileInfo.name).toEqual(expected.fileInfo.name);
            // CatalogFileType.FITSTable is 0, so the type has to be compared unconditionally
            expect(CatalogFileAck.fileInfo.type).toEqual(expected.fileInfo.type);
            expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(expected.fileInfo.fileSize);
            expect(CatalogFileAck.headers.length).toEqual(expected.lengthOfHeaders);
        },
        timeout
    );
    return () => CatalogFileAck;
}

/** OPEN_CATALOG_FILE_ACK.preview_data holds the same number of rows of every column. */
export function expectPreviewData(ack: CARTA.IOpenCatalogFileAck, columnCount: number, rowCount: number) {
    const previewData = ack.previewData;
    expect(Object.keys(previewData).length).toEqual(columnCount);
    Object.keys(previewData).forEach((key) => {
        expect(columnRowCount(previewData[key])).toEqual(rowCount);
    });
}

/** A subset streamed in chunks reports a progress which only the last chunk completes. */
export function testIncreasingProgress(getResponses: () => CARTA.ICatalogFilterResponse[]) {
    test(`(Step 6) the progress increases and reaches 1 only in the last CatalogFilterResponse | `, () => {
        const progresses = getResponses().map((response) => response.progress);
        progresses.slice(0, -1).forEach((progress, i) => {
            expect(progress).toBeGreaterThan(0);
            expect(progress).toBeLessThan(1);
            expect(progresses[i + 1]).toBeGreaterThan(progress);
        });
        expect(progresses.slice(-1)[0]).toEqual(1);
    });
}
