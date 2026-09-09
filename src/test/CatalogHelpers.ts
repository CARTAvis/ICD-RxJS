import { CARTA } from 'carta-protobuf';
import { Stream } from './MyClient';
import { MessageController } from './MessageController';
/**
 * Shared fixtures and steps for the CATALOG_* tests. Every one of them opens an image, lists
 * the catalogs stored beside it, and then opens and filters one catalog file, so steps 1 to 5
 * live here and only the filtering of step 6 onwards differs per test.
 *
 * These are plain assertions rather than jest tests: the test titles and timeouts belong to
 * the test files, so that every test( ) a file registers can be read there.
 */

/**
 * The expected values of a CATALOG_FILTER_RESPONSE which the protobuf message has no field
 * for: how many messages the subset is streamed as, and how many columns each one carries.
 */
export interface ICatalogFilterResponseExt extends CARTA.ICatalogFilterResponse {
    lengthOfColumns: number;
    numberOfResponses: number;
}

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
 * ColumnData carries every type other than String as binary, so a row of a column is a fixed
 * number of bytes rather than an element of an array.
 */
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

export function columnRowCount(column: CARTA.IColumnData): number {
    if (column.dataType === CARTA.ColumnType.String) {
        return column.stringData!.length;
    }
    return column.binaryData!.length / bytesPerElement.get(column.dataType!)!;
}

/**
 * Rows are compared as raw payload, which works for every column type without having to decode
 * it. ProtobufProcessing cannot be used here because it needs the CARTACompute WASM global for
 * the 64 bit types.
 */
export function columnSlice(column: CARTA.IColumnData, startRow: number, rowCount: number): (string | number)[] {
    if (column.dataType === CARTA.ColumnType.String) {
        return column.stringData!.slice(startRow, startRow + rowCount);
    }
    const elementSize = bytesPerElement.get(column.dataType!)!;
    return Array.from(column.binaryData!.slice(startRow * elementSize, (startRow + rowCount) * elementSize));
}

export function stringColumn(column: CARTA.IColumnData): string[] {
    expect(column.dataType).toEqual(CARTA.ColumnType.String);
    return column.stringData!;
}

export function doubleColumn(column: CARTA.IColumnData): number[] {
    expect(column.dataType).toEqual(CARTA.ColumnType.Double);
    return Array.from(new Float64Array(column.binaryData!.slice().buffer));
}

export async function assertOpenImageFile(image: IImageFixture) {
    const msgController = MessageController.Instance;
    msgController.closeFile(-1);
    const OpenFileResponse = await msgController.loadFile(image.fileOpen);
    await Stream(CARTA.RegionHistogramData, 1);

    expect(OpenFileResponse.success).toBe(true);
    expect(OpenFileResponse.fileInfo.name).toEqual(image.fileOpen.file);
}

export async function assertRasterTiles(image: IImageFixture) {
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
}

export async function assertCatalogList(request: CARTA.ICatalogListRequest, expected: CARTA.ICatalogListResponse) {
    const CatalogListAck = await MessageController.Instance.getCatalogList(request.directory, request.filterMode);
    expect(CatalogListAck.directory).toContain(expected.directory);
    expect(CatalogListAck.success).toEqual(expected.success);
    const CatalogListAckSubdirectories = CatalogListAck.subdirectories.map((f) => f.name);
    expect(CatalogListAckSubdirectories).toEqual(expect.arrayContaining(expected.subdirectories));
}

/** The acknowledgement is returned for the tests which check it further. */
export async function assertCatalogFileInfo(
    request: CARTA.ICatalogFileInfoRequest,
    expected: ICatalogFileInfoResponseExt
): Promise<CARTA.ICatalogFileInfoResponse> {
    const CatalogFileInfoAck = await MessageController.Instance.getCatalogFileInfo(request.directory, request.name);
    expect(CatalogFileInfoAck.success).toEqual(expected.success);
    expect(CatalogFileInfoAck.fileInfo.name).toEqual(expected.fileInfo.name);
    // CatalogFileType.FITSTable is 0, so the type has to be compared unconditionally
    expect(CatalogFileInfoAck.fileInfo.type).toEqual(expected.fileInfo.type);
    expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(expected.fileInfo.fileSize);
    expected.descriptionKeywords?.forEach((keyword) => {
        expect(CatalogFileInfoAck.fileInfo.description).toContain(keyword);
    });
    expect(CatalogFileInfoAck.headers.length).toEqual(expected.lengthOfHeaders);
    return CatalogFileInfoAck;
}

/** The acknowledgement is returned for the tests which check it further. */
export async function assertOpenCatalogFile(
    request: CARTA.IOpenCatalogFile,
    expected: IOpenCatalogFileAckExt
): Promise<CARTA.IOpenCatalogFileAck> {
    const CatalogFileAck = await MessageController.Instance.loadCatalogFile(
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
    return CatalogFileAck;
}

/** OPEN_CATALOG_FILE_ACK.preview_data holds the same number of rows of every column. */
export function expectPreviewData(ack: CARTA.IOpenCatalogFileAck, columnCount: number, rowCount: number) {
    const previewData = ack.previewData;
    expect(Object.keys(previewData).length).toEqual(columnCount);
    Object.keys(previewData).forEach((key) => {
        expect(columnRowCount(previewData[key])).toEqual(rowCount);
    });
}

export function requestCatalogFilter(
    filterRequest: CARTA.ICatalogFilterRequest
): Promise<CARTA.ICatalogFilterResponse[]> {
    const msgController = MessageController.Instance;
    // The stream has to be subscribed before the request is sent, otherwise the first
    // responses are dropped.
    const catalogFilterStream = Stream(CARTA.CatalogFilterResponse);
    msgController.setCatalogFilterRequest(filterRequest);
    return catalogFilterStream;
}

/** Assert the last message of a streamed subset against the request which asked for it. */
export function assertCatalogFilterResponse(
    responses: CARTA.ICatalogFilterResponse[],
    expected: ICatalogFilterResponseExt,
    request: CARTA.ICatalogFilterRequest
) {
    expect(responses.length).toEqual(expected.numberOfResponses);
    const lastResponse = responses.slice(-1)[0];
    expect(lastResponse.fileId).toEqual(expected.fileId);
    expect(Object.keys(lastResponse.columns).length).toEqual(expected.lengthOfColumns);
    expect(Object.keys(lastResponse.columns)).toEqual(request.columnIndices.map((columnIndex) => `${columnIndex}`));
    expect(lastResponse.subsetDataSize).toEqual(expected.subsetDataSize);
    expect(lastResponse.subsetEndIndex).toEqual(expected.subsetEndIndex);
    expect(lastResponse.filterDataSize).toEqual(expected.filterDataSize);
    expect(lastResponse.requestEndIndex).toEqual(expected.requestEndIndex);
    expect(lastResponse.progress).toEqual(expected.progress);
    Object.keys(lastResponse.columns).forEach((key) => {
        expect(columnRowCount(lastResponse.columns[key])).toEqual(expected.subsetDataSize);
    });
}

/** A subset streamed in chunks reports a progress which only the last chunk completes. */
export function assertIncreasingProgress(responses: CARTA.ICatalogFilterResponse[]) {
    const progresses = responses.map((response) => response.progress);
    progresses.slice(0, -1).forEach((progress, i) => {
        expect(progress).toBeGreaterThan(0);
        expect(progress).toBeLessThan(1);
        expect(progresses[i + 1]).toBeGreaterThan(progress);
    });
    expect(progresses.slice(-1)[0]).toEqual(1);
}
