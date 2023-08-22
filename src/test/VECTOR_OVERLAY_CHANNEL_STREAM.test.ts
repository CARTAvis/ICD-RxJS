import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let openFileTimeout: number = config.timeout.openFile;
let connectTimeout: number = config.timeout.connection;
let vectorOverlayTimeout: number = config.timeout.vectorOverlay;

interface IVectorOverlayTileDataExt extends CARTA.IVectorOverlayTileData {
    totalAngleImageDataLength?: Number;
    totalIntensityImageDataLength?: Number;
    selectedAngleImageDataIndex?: Number[];
    selectedAngleImageDataValue?: Number[];
    selectedIntensityImageDataIndex?: Number[];
    selectedIntensityImageDataValue?: Number[];
}

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    selectBinIndex?: Number[];
    selectBinValue?: Number[];
}

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setVectorOverlayParameters: CARTA.ISetVectorOverlayParameters[];
    VectorOverlayTileData : IVectorOverlayTileDataExt[];
    setImageChannel: CARTA.ISetImageChannels[];
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "HH211_IQU.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setVectorOverlayParameters: [
        {
            compressionQuality: 8,
            compressionType: CARTA.CompressionType.NONE,
            debiasing: false,
            fileId: 0,
            fractional: true,
            imageBounds: { xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            qError: undefined,
            smoothingFactor: 4,
            stokesAngle: 1,
            stokesIntensity: 1,
            threshold: 0.01,
            uError: undefined
        },
    ],
    VectorOverlayTileData: [
        {
            progress: 1, 
            stokesAngle: 1,
            stokesIntensity: 1,
            compressionQuality: 8,
            totalAngleImageDataLength: 196,
            angleTiles: [{
                height: 7,
                mip: 4,
                layer: 1,
                width: 7,
                x: 1,
                y: 1
            }],
            totalIntensityImageDataLength: 196,
            intensityTiles: [{
                height: 7,
                layer: 1,
                mip: 4,
                width: 7,
                x: 1,
                y: 1
            }],
            selectedAngleImageDataIndex: [0,50, 100, 143, 190],
            selectedAngleImageDataValue: [0, 192, 0, 127, 192],
            selectedIntensityImageDataIndex: [0,50, 100, 143, 190],
            selectedIntensityImageDataValue: [0, 192, 0, 127, 192],
        }, 
        {
            progress: 1, 
            stokesAngle: 1,
            stokesIntensity: 1,
            compressionQuality: 8,
            channel: 1,
            totalAngleImageDataLength: 196,
            angleTiles: [{
                height: 7,
                mip: 4,
                layer: 1,
                width: 7,
                x: 1,
                y: 1
            }],
            totalIntensityImageDataLength: 196,
            intensityTiles: [{
                height: 7,
                layer: 1,
                mip: 4,
                width: 7,
                x: 1,
                y: 1
            }],
            selectedAngleImageDataIndex: [0,50, 100, 143, 190],
            selectedAngleImageDataValue: [0, 192, 0, 127, 192],
            selectedIntensityImageDataIndex: [0,50, 100, 143, 190],
            selectedIntensityImageDataValue: [0, 192, 0, 127, 192],
        }, 
    ],
    setImageChannel: [
        {
            fileId: 0,
            channel: 1,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [50339842, 50339841, 50335746, 50335745, 50343938, 50339843, 50343937, 50335747, 50339840, 50331650, 50335744, 50331649, 50343939, 50343936, 50331651, 50331648, 50348034, 50339844, 50348033, 50335748, 50348035, 50343940, 50348032, 50331652, 50348036],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    regionHistogramData: {
        channel:1,
        histograms: {
            binWidth: 0.0000605975255894009,
            firstBinCenter: -0.027060849592089653,
            mean: 0.000027204052476844467,
            numBins: 1049,
            stdDev: 0.0028536340154345988
        },
        selectBinIndex:[0, 100, 500, 700, 1000],
        selectBinValue:[0, 100, 500, 700, 1000],
    },
    precisionDigits: 4,
};

let basepath: string;
describe("VECTOR_OVERLAY_CHANNEL_STREAM: Testing the vector overlay ICD messages with the channel stream", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq);
                let RasterTileData = await Stream(CARTA.RasterTileData,3); //RasterTileData * 1 + RasterTileSync * 2
                expect(RasterTileData[2].tileCount).toEqual(assertItem.addTilesReq.tiles.length);
            }, openFileTimeout);
        });

        describe(`Vector Overlay ICD messages with set channel ICD messages:`, ()=>{
            let VectorOverlayTileDataArray = [];
            let VectorOverlayTileDataResponse: any;
            test(`(Step 1) Request and Response should arrived within ${vectorOverlayTimeout} ms`, async() => {
                msgController.setVectorOverlayParameters(assertItem.setVectorOverlayParameters[0]);
                let VectorOverlayTileDataPromise = new Promise((resolve)=>{
                    msgController.vectorTileStream.subscribe({
                        next: (data) => {
                            VectorOverlayTileDataArray.push(data)
                            if (data.progress === 1) {
                                resolve(VectorOverlayTileDataArray)
                            }
                        }
                    });
                });

                VectorOverlayTileDataResponse = await VectorOverlayTileDataPromise;
            }, vectorOverlayTimeout);

            test(`(Step 2) Verify the Response (the last VECTOR_OVERLAY_TILE_DATA) correctness`, ()=>{
                let lastVectorOverlayTileDataResponse = VectorOverlayTileDataResponse.slice(-1)[0];
                expect(lastVectorOverlayTileDataResponse.progress).toEqual(assertItem.VectorOverlayTileData[0].progress);
                expect(lastVectorOverlayTileDataResponse.stokesAngle).toEqual(assertItem.VectorOverlayTileData[0].stokesAngle);
                expect(lastVectorOverlayTileDataResponse.stokesIntensity).toEqual(assertItem.VectorOverlayTileData[0].stokesIntensity);
                expect(lastVectorOverlayTileDataResponse.compressionQuality).toEqual(assertItem.VectorOverlayTileData[0].compressionQuality);
                
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].height).toEqual(assertItem.VectorOverlayTileData[0].angleTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[0].angleTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[0].angleTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].width).toEqual(assertItem.VectorOverlayTileData[0].angleTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].x).toEqual(assertItem.VectorOverlayTileData[0].angleTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[0].totalAngleImageDataLength);
                assertItem.VectorOverlayTileData[0].selectedAngleImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[0].selectedAngleImageDataValue[index])
                });

                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].height).toEqual(assertItem.VectorOverlayTileData[0].intensityTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[0].intensityTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[0].intensityTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].width).toEqual(assertItem.VectorOverlayTileData[0].intensityTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].x).toEqual(assertItem.VectorOverlayTileData[0].intensityTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[0].totalIntensityImageDataLength);
                assertItem.VectorOverlayTileData[0].selectedIntensityImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[0].selectedIntensityImageDataValue[index])
                });
            });

            let VectorOverlayTileDataArrayChannel1 = [];
            let VectorOverlayTileDataResponseChannel1: any;
            let RegionHistogramData: any;
            let RasterTileDataChannel1: any;
            let RasterTileDataSyncChannel1: any;
            test(`(Step 3) Set Image Channel to 1 and Receive the three type ICD messages:`, async ()=> {
                msgController.setChannels(assertItem.setImageChannel[0]);
                let VectorOverlayTileDataPromiseChannel1 = new Promise((resolve)=>{
                    msgController.vectorTileStream.subscribe({
                        next: (data) => {
                            VectorOverlayTileDataArrayChannel1.push(data)
                            if (data.progress === 1) {
                                resolve(VectorOverlayTileDataArrayChannel1)
                            }
                        }
                    });
                });

                let RasterTileData = [];
                let RasterTileDataSync = [];

                let RasterTileDataSyncPromise = new Promise((resolve) => {
                    msgController.rasterSyncStream.subscribe({
                        next: (data) => {
                            RasterTileDataSync.push(data)
                            if (data.endSync === true) {
                                resolve(RasterTileDataSync)
                            }
                        }
                    })
                })

                let RasterTileDataPromise = new Promise((resolve) => {
                    msgController.rasterTileStream.subscribe({
                        next: (data) => {
                            RasterTileData.push(data)
                            if (RasterTileData.length === assertItem.setImageChannel[0].requiredTiles.tiles.length) {
                                resolve(RasterTileData)
                            }
                        },
                    })
                });

                VectorOverlayTileDataResponseChannel1 = await VectorOverlayTileDataPromiseChannel1;
                RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
        
                RasterTileDataChannel1 = await RasterTileDataPromise;
                RasterTileDataSyncChannel1 = await RasterTileDataSyncPromise;
                // console.log(RasterTileDataChannel1.length);
                // console.log(RasterTileDataSyncChannel1);
            });

            test(`(Step 4: Verify the Response (the last VECTOR_OVERLAY_TILE_DATA of channel 1) correctness)`, () => {
                let lastVectorOverlayTileDataResponse = VectorOverlayTileDataResponseChannel1.slice(-1)[0];
                expect(lastVectorOverlayTileDataResponse.progress).toEqual(assertItem.VectorOverlayTileData[1].progress);
                expect(lastVectorOverlayTileDataResponse.stokesAngle).toEqual(assertItem.VectorOverlayTileData[1].stokesAngle);
                expect(lastVectorOverlayTileDataResponse.stokesIntensity).toEqual(assertItem.VectorOverlayTileData[1].stokesIntensity);
                expect(lastVectorOverlayTileDataResponse.compressionQuality).toEqual(assertItem.VectorOverlayTileData[1].compressionQuality);
                expect(lastVectorOverlayTileDataResponse.channel).toEqual(assertItem.VectorOverlayTileData[1].channel);

                expect(lastVectorOverlayTileDataResponse.angleTiles[0].height).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].width).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].x).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[1].totalAngleImageDataLength);
                assertItem.VectorOverlayTileData[0].selectedAngleImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[1].selectedAngleImageDataValue[index])
                });

                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].height).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].width).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].x).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[1].totalIntensityImageDataLength);
                assertItem.VectorOverlayTileData[0].selectedIntensityImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[1].selectedIntensityImageDataValue[index])
                });
            })

            test(`(Step 5) Verify the Response (REGION_HISTOGRAM_DATA, RASTER_TILE, and RASTER_TILE_SYNC) correctness`, () => {
                expect(RegionHistogramData[0].channel).toEqual(assertItem.regionHistogramData.channel);
                expect(RegionHistogramData[0].histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.mean).toBeCloseTo(assertItem.regionHistogramData.histograms.mean, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.numBins).toEqual(assertItem.regionHistogramData.histograms.numBins);

                RasterTileDataChannel1.map((data) => {
                    expect(data.channel).toEqual(assertItem.setImageChannel[0].channel);
                });
                expect(RasterTileDataChannel1.length).toEqual(assertItem.setImageChannel[0].requiredTiles.tiles.length);
                RasterTileDataSyncChannel1.map((data) => {
                    expect(data.channel).toEqual(assertItem.setImageChannel[0].channel);
                })
                expect(RasterTileDataSyncChannel1[1].endSync).toEqual(true);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});