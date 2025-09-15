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
        const msgTotalLen = (rasterTileDataLen + 2) * channels;
        let count = 0;
        let ack: any[] = [];
        let ex1 = msgController.rasterSyncStream.pipe(take(2 * channels));
        ex1.subscribe((data) => {
            count++;
            ack.push(data);
            if (data.endSync && count === msgTotalLen) {
                resolve(ack);
            }
        });
        let ex2 = msgController.rasterTileStream.pipe(take(rasterTileDataLen * channels));
        ex2.subscribe((data) => {
            count++;
            ack.push(data);
        });
    });
}

export { checkConnection, Stream, ChannelMapStream };
