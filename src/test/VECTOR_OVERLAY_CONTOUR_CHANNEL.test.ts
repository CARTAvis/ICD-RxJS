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

interface IContourImageDataExt extends CARTA.IContourImageData {
    totalCoordinate?: Number;
    totalStartIndices?: Number;
}

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setVectorOverlayParameters: CARTA.ISetVectorOverlayParameters[];
    VectorOverlayTileData : IVectorOverlayTileDataExt[];
    setImageChannel: CARTA.ISetImageChannels[];
    regionHistogramData: CARTA.IRegionHistogramData[];
    setContour: CARTA.ISetContourParameters[];
    contourImageData: IContourImageDataExt[];
    contourImageData2: IContourImageDataExt[];
    precisionDigits: number;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setVectorOverlayParameters: [
        {
            compressionQuality: 8,
            compressionType: CARTA.CompressionType.NONE,
            debiasing: false,
            fileId: 0,
            fractional: true,
            imageBounds: { xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            qError: undefined,
            smoothingFactor: 1,
            stokesAngle: 1,
            stokesIntensity: 1,
            threshold: NaN,
            uError: undefined
        },
        {
            fileId: 0,
            stokesAngle: -1,
            stokesIntensity: -1
        },
        {
            compressionQuality: 8,
            compressionType: CARTA.CompressionType.NONE,
            debiasing: false,
            fileId: 1,
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
            totalAngleImageDataLength: 2500,
            angleTiles: [{
                height: 25,
                mip: 1,
                layer: 3,
                width: 25,
                x: 4,
                y: 4
            }],
            totalIntensityImageDataLength: 2500,
            intensityTiles: [{
                height: 25,
                layer: 3,
                mip: 1,
                width: 25,
                x: 4,
                y: 4
            }],
            selectedAngleImageDataIndex: [3,501, 1002,1500, 2000, 2499],
            selectedAngleImageDataValue: [127, 0, 192, 0, 0, 127],
            selectedIntensityImageDataIndex: [3,501, 1002,1500, 2000, 2499],
            selectedIntensityImageDataValue: [127, 0, 192, 0, 0, 127],
        }, 
        {
            progress: 1, 
            fileId: 1,
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
        {
            progress: 1, 
            stokesAngle: 1,
            stokesIntensity: 1,
            compressionQuality: 8,
            channel: 1,
            fileId: 1,
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
            fileId: 1,
            channel: 1,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [50339842, 50339841, 50335746, 50335745, 50343938, 50339843, 50343937, 50335747, 50339840, 50331650, 50335744, 50331649, 50343939, 50343936, 50331651, 50331648, 50348034, 50339844, 50348033, 50335748, 50348035, 50343940, 50348032, 50331652, 50348036],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    regionHistogramData: [
        {
            channel:1,
            histograms: {
                binWidth: 0.0000605975255894009,
                firstBinCenter: -0.027060849592089653,
                mean: 0.000027204052476844467,
                numBins: 1049,
                stdDev: 0.0028536340154345988
            },
        },
        {
            fileId: 1,
            histograms: {
                binWidth: 0.0002482116605919582,
                firstBinCenter: -0.12420587090720325,
                mean: 0.000008067378262600356,
                numBins: 1049,
                stdDev: 0.014456610096577697
            },
            progress: 1,
            regionId: -1,
        },
        {
            fileId: 1,
            histograms: {
                binWidth: 0.00006059752519751186,
                firstBinCenter: -0.027060850478133436,
                mean: 0.00002720431488691676,
                numBins: 1049,
                stdDev: 0.002852936706926054
            },
            progress: 1,
            regionId: -1,
            channel: 1,
        },
    ],
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            levels: [0.014208443731897273, 0.042625331195691826, 0.07104221865948637],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
        },
        {
            fileId: 1,
            referenceFileId: 0,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            levels: [0.014208443731897273, 0.042625331195691826, 0.07104221865948637],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
    contourImageData: [
        {
            contourSets: [{
                decimationFactor: 4,
                level: 0.07104221865948637,
                uncompressedCoordinatesSize: 1056
            }],
            progress: 1,
            totalCoordinate: 301,
            totalStartIndices: 48,
        },
        {
            contourSets: [{
                decimationFactor: 4,
                level: 0.0426253311956918267,
                uncompressedCoordinatesSize: 23608
            }],
            progress: 1,
            totalCoordinate: 4085,
            totalStartIndices: 780,
        },
        {
            contourSets: [{
                decimationFactor: 4,
                level: 0.014208443731897273,
                uncompressedCoordinatesSize: 353960
            }],
            progress: 1,
            totalCoordinate: 47845,
            totalStartIndices: 6396,
        },
    ],
    contourImageData2: [
        {
            contourSets: [{
                decimationFactor: 0,
                level: 0.07104221865948637,
                uncompressedCoordinatesSize: 0
            }],
            fileId: 1,
            progress: 1,
            channel: 1,
        },
        {
            contourSets: [{
                decimationFactor: 0,
                level: 0.0426253311956918267,
                uncompressedCoordinatesSize: 0
            }],
            fileId: 1,
            progress: 1,
            channel: 1,
        },
        {
            contourSets: [{
                decimationFactor: 4,
                level: 0.014208443731897273,
                uncompressedCoordinatesSize: 2144
            }],
            fileId: 1,
            progress: 1,
            channel: 1,
            totalCoordinate: 503,
            totalStartIndices: 64,
        },
    ],
    precisionDigits: 8,
};

let basepath: string;
describe("VECTOR_OVERLAY_CONTOUR_CHANNEL: Testing the vector overlay ICD messages with the contours and changing the channel", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile[0].directory = basepath + "/" + assertItem.openFile[0].directory;
            assertItem.openFile[1].directory = basepath + "/" + assertItem.openFile[1].directory;
        });

        describe(`(Case 1) Initialization: open the image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileData = await Stream(CARTA.RasterTileData,3); //RasterTileData * 1 + RasterTileSync * 2
                expect(RasterTileData[2].tileCount).toEqual(assertItem.addTilesReq[0].tiles.length);
            }, openFileTimeout);
        });

        describe(`(Case 1) Set vector overlay and contours:`, ()=>{
            let VectorOverlayTileDataArray = [];
            let VectorOverlayTileDataResponse: any;
            test(`(Step 1) Request Vector Overlay and Response should arrived within ${vectorOverlayTimeout} ms`, async() => {
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

            test(`(Step 3) Set Contours parameter, Receive the Stream responses and check the correctness:`, async () => {
                msgController.setContourParameters(assertItem.setContour[0]);
                let ContourImageDataResponse: [] = await Stream(CARTA.ContourImageData, assertItem.setContour[0].levels.length);
                assertItem.contourImageData.map((data)=>{
                    let eachContourImageData: any[] = ContourImageDataResponse.filter(ResponseData => ResponseData.contourSets[0].level == data.contourSets[0].level);
                    expect(eachContourImageData[0].progress).toEqual(data.progress);
                    expect(eachContourImageData[0].contourSets[0].decimationFactor).toEqual(data.contourSets[0].decimationFactor);
                    expect(eachContourImageData[0].contourSets[0].level).toEqual(data.contourSets[0].level);
                    expect(eachContourImageData[0].contourSets[0].uncompressedCoordinatesSize).toEqual(data.contourSets[0].uncompressedCoordinatesSize);
                    // data.selectedCoordinateIndex.map((subdata, index) => {
                    //     expect(eachContourImageData[0].contourSets[0].rawCoordinates[subdata]).toEqual(data.selectedCoordinateValue[index]);
                    // })
                    // data.selectedStartIndicesIndex.map((subdata, index) => {
                    //     expect(eachContourImageData[0].contourSets[0].rawStartIndices[subdata]).toEqual(data.selectedStartIndicesValue[index]);
                    // })
                })
            });

            test(`(Step 4) Clear Vector Overlay and Contours, and there is no any ICD message returned:`, done => {
                msgController.setVectorOverlayParameters(assertItem.setVectorOverlayParameters[1]);
                msgController.setContourParameters(assertItem.setContour[1]);
                let receiveNumberCurrent = msgController.messageReceiving();
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 500 ms
                    done();
                }, 500)
            });
        });

        describe(`(Case 2) Initialization: open the image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[1]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
                expect(RegionHistrogramDataResponse[0].progress).toEqual(assertItem.regionHistogramData[1].progress);
                expect(RegionHistrogramDataResponse[0].regionId).toEqual(assertItem.regionHistogramData[1].regionId);
                expect(RegionHistrogramDataResponse[0].fileId).toEqual(assertItem.regionHistogramData[1].fileId);
                expect(RegionHistrogramDataResponse[0].histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData[1].histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistrogramDataResponse[0].histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData[1].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistrogramDataResponse[0].histograms.mean).toBeCloseTo(assertItem.regionHistogramData[1].histograms.mean, assertItem.precisionDigits);
                expect(RegionHistrogramDataResponse[0].histograms.numBins).toEqual(assertItem.regionHistogramData[1].histograms.numBins);
                expect(RegionHistrogramDataResponse[0].histograms.stdDev).toBeCloseTo(assertItem.regionHistogramData[1].histograms.stdDev, assertItem.precisionDigits);
            }, openFileTimeout);

            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let RasterTileData = await Stream(CARTA.RasterTileData,3); //RasterTileData * 1 + RasterTileSync * 2
                expect(RasterTileData[1].fileId).toEqual(assertItem.addTilesReq[1].fileId);
                expect(RasterTileData[2].tileCount).toEqual(assertItem.addTilesReq[1].tiles.length);
            }, openFileTimeout);
        });

        describe(`(Case 2) Open the second images, and set vector overlay, contour, and change channel:`, () => {
            let VectorOverlayTileDataArray = [];
            let VectorOverlayTileDataResponse: any;
            test(`(Step 1) Request Vector Overlay and Response should arrived within ${vectorOverlayTimeout} ms`, async() => {
                msgController.setVectorOverlayParameters(assertItem.setVectorOverlayParameters[2]);
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
                expect(lastVectorOverlayTileDataResponse.progress).toEqual(assertItem.VectorOverlayTileData[1].progress);
                expect(lastVectorOverlayTileDataResponse.fileId).toEqual(assertItem.VectorOverlayTileData[1].fileId);
                expect(lastVectorOverlayTileDataResponse.stokesAngle).toEqual(assertItem.VectorOverlayTileData[1].stokesAngle);
                expect(lastVectorOverlayTileDataResponse.stokesIntensity).toEqual(assertItem.VectorOverlayTileData[1].stokesIntensity);
                expect(lastVectorOverlayTileDataResponse.compressionQuality).toEqual(assertItem.VectorOverlayTileData[1].compressionQuality);
                
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].height).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].width).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].x).toEqual(assertItem.VectorOverlayTileData[1].angleTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[1].totalAngleImageDataLength);
                assertItem.VectorOverlayTileData[1].selectedAngleImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[1].selectedAngleImageDataValue[index])
                });

                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].height).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].width).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].x).toEqual(assertItem.VectorOverlayTileData[1].intensityTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[1].totalIntensityImageDataLength);
                assertItem.VectorOverlayTileData[1].selectedIntensityImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[1].selectedIntensityImageDataValue[index])
                });
            });

            test(`(Step 3) Set Contours parameter, Receive the Stream responses and check the correctness:`, async () => {
                msgController.setContourParameters(assertItem.setContour[2]);
                let ContourImageDataResponse: [] = await Stream(CARTA.ContourImageData, assertItem.setContour[0].levels.length);
                assertItem.contourImageData.map((data)=>{
                    let eachContourImageData: any[] = ContourImageDataResponse.filter(ResponseData => ResponseData.contourSets[0].level == data.contourSets[0].level);
                    expect(eachContourImageData[0].progress).toEqual(data.progress);
                    expect(eachContourImageData[0].contourSets[0].decimationFactor).toEqual(data.contourSets[0].decimationFactor);
                    expect(eachContourImageData[0].contourSets[0].level).toEqual(data.contourSets[0].level);
                    expect(eachContourImageData[0].contourSets[0].uncompressedCoordinatesSize).toEqual(data.contourSets[0].uncompressedCoordinatesSize);
                    // data.selectedCoordinateIndex.map((subdata, index) => {
                    //     expect(eachContourImageData[0].contourSets[0].rawCoordinates[subdata]).toEqual(data.selectedCoordinateValue[index]);
                    // })
                    // data.selectedStartIndicesIndex.map((subdata, index) => {
                    //     expect(eachContourImageData[0].contourSets[0].rawStartIndices[subdata]).toEqual(data.selectedStartIndicesValue[index]);
                    // })
                })
            });

            let VectorOverlayTileDataArrayChannel1 = [];
            let VectorOverlayTileDataResponseChannel1: any;
            let RegionHistogramData: any;
            let RasterTileDataChannel1: any;
            let RasterTileDataSyncChannel1: any;
            let ContourImageDataResponse: [];
            test(`(Step 4) Set Image (fileId = 1) Channel to 1 and Receive the three type ICD messages:`, async ()=> {
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

                // msgController.setContourParameters(assertItem.setContour[0]);
                ContourImageDataResponse = await Stream(CARTA.ContourImageData, assertItem.setContour[0].levels.length);

                VectorOverlayTileDataResponseChannel1 = await VectorOverlayTileDataPromiseChannel1;
                RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
        
                RasterTileDataChannel1 = await RasterTileDataPromise;
                RasterTileDataSyncChannel1 = await RasterTileDataSyncPromise;
            });

            test(`(Step 5) Verify the Responses (the all CONTOUR_IMAGE_DATA Stream messages of fileid 1 channel 1) correctness`, async () => {
                assertItem.contourImageData2.map((data)=>{
                    let eachContourImageData: any[] = ContourImageDataResponse.filter(ResponseData => ResponseData.contourSets[0].level == data.contourSets[0].level);
                    expect(eachContourImageData[0].progress).toEqual(data.progress);
                    expect(eachContourImageData[0].fileId).toEqual(data.fileId);
                    expect(eachContourImageData[0].channel).toEqual(data.channel);
                    expect(eachContourImageData[0].contourSets[0].decimationFactor).toEqual(data.contourSets[0].decimationFactor);
                    expect(eachContourImageData[0].contourSets[0].level).toEqual(data.contourSets[0].level);
                    expect(eachContourImageData[0].contourSets[0].uncompressedCoordinatesSize).toEqual(data.contourSets[0].uncompressedCoordinatesSize);
                })
            });

            test(`(Step 6: Verify the Response (the last VECTOR_OVERLAY_TILE_DATA of fileid 1 channel 1) correctness)`, () => {
                let lastVectorOverlayTileDataResponse = VectorOverlayTileDataResponseChannel1.slice(-1)[0];
                expect(lastVectorOverlayTileDataResponse.progress).toEqual(assertItem.VectorOverlayTileData[2].progress);
                expect(lastVectorOverlayTileDataResponse.stokesAngle).toEqual(assertItem.VectorOverlayTileData[2].stokesAngle);
                expect(lastVectorOverlayTileDataResponse.stokesIntensity).toEqual(assertItem.VectorOverlayTileData[2].stokesIntensity);
                expect(lastVectorOverlayTileDataResponse.compressionQuality).toEqual(assertItem.VectorOverlayTileData[2].compressionQuality);
                expect(lastVectorOverlayTileDataResponse.channel).toEqual(assertItem.VectorOverlayTileData[2].channel);

                expect(lastVectorOverlayTileDataResponse.angleTiles[0].height).toEqual(assertItem.VectorOverlayTileData[2].angleTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[2].angleTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[2].angleTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].width).toEqual(assertItem.VectorOverlayTileData[2].angleTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].x).toEqual(assertItem.VectorOverlayTileData[2].angleTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[2].totalAngleImageDataLength);
                assertItem.VectorOverlayTileData[2].selectedAngleImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.angleTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[2].selectedAngleImageDataValue[index])
                });

                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].height).toEqual(assertItem.VectorOverlayTileData[2].intensityTiles[0].height);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].layer).toEqual(assertItem.VectorOverlayTileData[2].intensityTiles[0].layer);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].mip).toEqual(assertItem.VectorOverlayTileData[2].intensityTiles[0].mip);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].width).toEqual(assertItem.VectorOverlayTileData[2].intensityTiles[0].width);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].x).toEqual(assertItem.VectorOverlayTileData[2].intensityTiles[0].x);
                expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData.length).toEqual(assertItem.VectorOverlayTileData[2].totalIntensityImageDataLength);
                assertItem.VectorOverlayTileData[2].selectedIntensityImageDataIndex.map((data, index) => {
                    expect(lastVectorOverlayTileDataResponse.intensityTiles[0].imageData[data]).toEqual(assertItem.VectorOverlayTileData[2].selectedIntensityImageDataValue[index])
                });
            });

            test(`(Step 7) Verify the Response (REGION_HISTOGRAM_DATA, RASTER_TILE, and RASTER_TILE_SYNC of fileid 1 channel 1) correctness`, () => {
                expect(RegionHistogramData[0].channel).toEqual(assertItem.regionHistogramData[2].channel);
                expect(RegionHistogramData[0].histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData[2].histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData[2].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.mean).toBeCloseTo(assertItem.regionHistogramData[2].histograms.mean, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.numBins).toEqual(assertItem.regionHistogramData[2].histograms.numBins);

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