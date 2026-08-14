import { CARTA } from 'carta-protobuf';
import { MessageController, ConnectionStatus } from './MessageController';
import { take } from 'rxjs/operators';

function checkConnection() {
    const msgController = MessageController.Instance;
    test('check connection', () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });
}

function Stream(cartaType: any, InputNum?: number) {
    return new Promise<any>((resolve, reject) => {
        const msgController = MessageController.Instance;
        let count = 0;
        switch (cartaType) {
            case CARTA.RegionHistogramData:
                let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                let resRegionHistogramData = msgController.histogramStream.pipe(take(InputNum));
                resRegionHistogramData.subscribe((data) => {
                    RegionHistogramData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(RegionHistogramData);
                    }
                });
                break;
            case CARTA.SpatialProfileData:
                let SpatialProfileData: CARTA.SpatialProfileData[] = [];
                let resSpatialProfileData = msgController.spatialProfileStream.pipe(take(InputNum));
                resSpatialProfileData.subscribe((data) => {
                    SpatialProfileData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(SpatialProfileData);
                    }
                });
                break;
            case CARTA.RasterTileData:
                let ack: any[] = [];
                let ex1 = msgController.rasterSyncStream.pipe(take(2));
                ex1.subscribe((data) => {
                    count++;
                    ack.push(data);
                    if (data.endSync && count === InputNum) {
                        resolve(ack);
                    }
                });
                let ex2 = msgController.rasterTileStream.pipe(take(InputNum - 2));
                ex2.subscribe((data) => {
                    count++;
                    ack.push(data);
                });
                break;
            case CARTA.ListProgress:
                let ListProgressData: any[] = [];
                let resListProgressData = msgController.listProgressStream.pipe(take(InputNum));
                resListProgressData.subscribe((data) => {
                    ListProgressData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(ListProgressData);
                    }
                });
                break;
            case CARTA.MomentProgress:
                let MomentProgressData: any[] = [];
                let resMomentProgressData = msgController.momentProgressStream.pipe(take(InputNum));
                resMomentProgressData.subscribe((data) => {
                    MomentProgressData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(MomentProgressData);
                    }
                });
                break;
            case CARTA.ErrorData:
                let ErrorData: CARTA.IErrorData[] = [];
                let resErrorData = msgController.errorStream.pipe(take(InputNum));
                resErrorData.subscribe((data) => {
                    ErrorData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(ErrorData);
                    }
                });
                break;
            case CARTA.ContourImageData:
                let ContourImageData: CARTA.ContourImageData[] = [];
                let resContourImageData = msgController.contourStream.pipe(take(InputNum));
                resContourImageData.subscribe((data) => {
                    ContourImageData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(ContourImageData);
                    }
                });
                break;
            case CARTA.ErrorData:
                let ErrorStreamData: CARTA.ErrorData[] = [];
                let resErrorStreamData = msgController.errorStream.pipe(take(InputNum));
                resErrorStreamData.subscribe((data) => {
                    ErrorStreamData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(ErrorStreamData);
                    }
                });
                break;
            case CARTA.RegionStatsData:
                let RegionStatsData: CARTA.RegionStatsData[] = [];
                let resRegionStatsData = msgController.statsStream.pipe(take(InputNum));
                resRegionStatsData.subscribe((data) => {
                    RegionStatsData.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(RegionStatsData);
                    }
                });
                break;
            case CARTA.SpectralProfileData:
                let SpectralProfileData: any[] = [];
                let resSpectralProfileData = msgController.spectralProfileStream.subscribe({
                    next: (data) => {
                        SpectralProfileData.push(data);
                        if (data.progress === 1) {
                            resolve(SpectralProfileData);
                        }
                    },
                });
                break;
            case CARTA.CatalogFilterResponse:
                let catalogStream: any[] = [];
                let resCatalogStream = msgController.catalogStream.subscribe({
                    next: (data) => {
                        catalogStream.push(data);
                        if (data.progress === 1) {
                            resolve(catalogStream);
                        }
                    },
                });
                break;
            case CARTA.PvPreviewData:
                let pvPreviewStream: any[] = [];
                let resPvPreviewStream = msgController.pvPreviewStream.pipe(take(InputNum));
                resPvPreviewStream.subscribe((data) => {
                    pvPreviewStream.push(data);
                    count++;
                    if (count === InputNum) {
                        resolve(pvPreviewStream);
                    }
                });
                break;
        }
    });
}

function ChannelMapStream(rasterTileDataLen: number, channels: number) {
    return new Promise<any>((resolve, reject) => {
        const msgController = MessageController.Instance;
        const rasterTileMsgLen = (rasterTileDataLen + 2) * channels; // # of RasterTileData + 2 RasterTileSync per channel
        let count = 0;
        let rasterTileMsgs: any[] = [];
        let rasterTileSyncStream = msgController.rasterSyncStream.pipe(take(2 * channels)); // 2 RasterTileSync per channel
        rasterTileSyncStream.subscribe((data) => {
            count++;
            rasterTileMsgs.push(data);
            if (data.endSync && count === rasterTileMsgLen) {
                resolve(rasterTileMsgs);
            }
        });
        let rasterTileDataStream = msgController.rasterTileStream.pipe(take(rasterTileDataLen * channels));
        rasterTileDataStream.subscribe((data) => {
            count++;
            rasterTileMsgs.push(data);
        });
    });
}

// The expected values of a CATALOG_FILTER_RESPONSE which the protobuf message has no field
// for: how many messages the subset is streamed as, and how many columns each one carries.
interface ICatalogFilterResponseExt extends CARTA.ICatalogFilterResponse {
    lengthOfColumns: number;
    numberOfResponses: number;
}

// ColumnData carries every type other than String as binary, so a row of a column is a
// fixed number of bytes rather than an element of an array.
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

// Rows are compared as raw payload, which works for every column type without having to
// decode it. ProtobufProcessing cannot be used here because it needs the CARTACompute
// WASM global for the 64 bit types.
function columnSlice(column: CARTA.IColumnData, startRow: number, rowCount: number): (string | number)[] {
    if (column.dataType === CARTA.ColumnType.String) {
        return column.stringData!.slice(startRow, startRow + rowCount);
    }
    const elementSize = bytesPerElement.get(column.dataType!)!;
    return Array.from(column.binaryData!.slice(startRow * elementSize, (startRow + rowCount) * elementSize));
}

function stringColumn(column: CARTA.IColumnData): string[] {
    expect(column.dataType).toEqual(CARTA.ColumnType.String);
    return column.stringData!;
}

function doubleColumn(column: CARTA.IColumnData): number[] {
    expect(column.dataType).toEqual(CARTA.ColumnType.Double);
    return Array.from(new Float64Array(column.binaryData!.slice().buffer));
}

// Assert the last message of a streamed subset against the request which asked for it
function assertCatalogFilterResponse(
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

function requestCatalogFilter(filterRequest: CARTA.ICatalogFilterRequest): Promise<CARTA.ICatalogFilterResponse[]> {
    const msgController = MessageController.Instance;
    // The stream has to be subscribed before the request is sent, otherwise the first
    // responses are dropped.
    const catalogFilterStream = Stream(CARTA.CatalogFilterResponse);
    msgController.setCatalogFilterRequest(filterRequest);
    return catalogFilterStream;
}

export {
    checkConnection,
    Stream,
    ChannelMapStream,
    columnRowCount,
    columnSlice,
    stringColumn,
    doubleColumn,
    assertCatalogFilterResponse,
    requestCatalogFilter,
};
export type { ICatalogFilterResponseExt };
