import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';
let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let changeChannelTimeout = config.timeout.changeChannel;
let messageReturnTimeout = config.timeout.messageEvent;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpens: CARTA.IOpenFile[];
    setImageChannels: CARTA.ISetImageChannels[];
    changeImageChannels: CARTA.ISetImageChannels[];
    regionHistogramDatas: CARTA.IRegionHistogramData[];
    rasterTileDatas: CARTA.IRasterTileData[];
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpens: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
            fileId: 0,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            fileId: 1,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannels: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    changeImageChannels: [
        {
            fileId: 0,
            channel: 2,
            stokes: 1,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 1,
            channel: 12,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 100,
            stokes: 3,
        },
        {
            fileId: 1,
            channel: 100,
            stokes: 1,
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 2,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    regionHistogramDatas: [
        {
            fileId: 0,
            stokes: 1,
            regionId: -1,
            progress: 1,
            histograms: {},
            channel: 2 ,
        },
        {
            fileId: 1,
            stokes: 0,
            regionId: -1,
            progress: 1,
            histograms: {},
            channel: 12 ,
        },
        {},
        {},
        {},
        {
            fileId: 0,
            stokes: 0,
            regionId: -1,
            progress: 1,
            histograms: {},
            channel: 0 
        },
    ],
    rasterTileDatas: [
        {
            fileId: 0,
            channel: 2,
            stokes: 1,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            channel: 12,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: -1,
        },
        {
            fileId: -1,
        },
        {
            fileId: -1,
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
}

let basepath: string;
describe("ANIMATOR_NAVIGATION: Testing using animator to see different frames/channels/stokes", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpens[0].directory = basepath + "/" + assertItem.filelist.directory;
            assertItem.fileOpens[1].directory = basepath + "/" + assertItem.filelist.directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open images`, () => {
            test(`Preparation`, async () => {
                msgController.closeFile(-1);
                for (let i = 0; i < assertItem.fileOpens.length; i++) {
                    let OpenFileResponse = await msgController.loadFile(assertItem.fileOpens[i]);
                    expect(OpenFileResponse.success).toEqual(true);
                    let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
                    msgController.setChannels(assertItem.setImageChannels[i]);
                    let RasterTileData = await Stream(CARTA.RasterTileData,3);
                }
            });

            assertItem.rasterTileDatas.map((rasterTileData: CARTA.IRasterTileData, index: number) => {
                const { requiredTiles, ..._channel } = assertItem.changeImageChannels[index];
                describe(`Set Image Channel ${JSON.stringify(_channel)}`, () => {
                    let lastRegionHistogramData: CARTA.RegionHistogramData[] = []; 
                    let RasterTileDataResponse: any = [];
                    if (rasterTileData.fileId < 0) {
                        test(`REGION_HISTOGRAM_DATA should not arrive within ${messageReturnTimeout * .5} ms.`, async () => {
                            msgController.setChannels(assertItem.changeImageChannels[index]);
                            let ErrorDataResponse = await Stream(CARTA.ErrorData,1);
                        }, changeChannelTimeout + messageReturnTimeout);
                    } else {
                        test(`REGION_HISTOGRAM_DATA should arrive within ${changeChannelTimeout} ms.`, async () => {
                            msgController.setChannels(assertItem.changeImageChannels[index]);
                            msgController.histogramStream.pipe(take(1)).subscribe({
                                next: (data) => {
                                    lastRegionHistogramData.push(data)
                                }
                            });
                            RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);
                        });

                        test(`REGION_HISTOGRAM_DATA.file_id = ${assertItem.regionHistogramDatas[index].regionId}`, () => {
                            expect(lastRegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramDatas[index].regionId);
                        });
    
                        test(`REGION_HISTOGRAM_DATA.stokes = ${assertItem.regionHistogramDatas[index].stokes}`, () => {
                            expect(lastRegionHistogramData[0].stokes).toEqual(assertItem.regionHistogramDatas[index].stokes);
                        });
    
                        test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramDatas[index].regionId}`, () => {
                            expect(lastRegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramDatas[index].regionId);
                        });
    
                        test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramDatas[index].progress}`, () => {
                            expect(lastRegionHistogramData[0].progress).toEqual(assertItem.regionHistogramDatas[index].progress);
                        });
    
                        test(`REGION_HISTOGRAM_DATA.histograms.channel = ${assertItem.regionHistogramDatas[index].channel}`, () => {
                            expect(lastRegionHistogramData[0].channel).toEqual(assertItem.regionHistogramDatas[index].channel);
                        });

                        test(`RASTER_IMAGE_DATA should arrive within ${changeChannelTimeout} ms.`, async () => {
                            expect(RasterTileDataResponse.length).toEqual(3);
                        }, changeChannelTimeout);
    
                        test(`RASTER_IMAGE_DATA.file_id = ${rasterTileData.fileId}`, () => {
                            expect(RasterTileDataResponse[1].fileId).toEqual(rasterTileData.fileId);
                        });
    
                        test(`RASTER_IMAGE_DATA.channel = ${rasterTileData.channel}`, () => {
                            expect(RasterTileDataResponse[1].channel).toEqual(rasterTileData.channel);
                        });
    
                        test(`RASTER_IMAGE_DATA.stokes = ${rasterTileData.stokes}`, () => {
                            expect(RasterTileDataResponse[1].stokes).toEqual(rasterTileData.stokes);
                        });
                    }
                });
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});