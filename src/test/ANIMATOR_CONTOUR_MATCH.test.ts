import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import * as Long from "long";
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let connectTimeout = config.timeout.connection;
let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let openFileTimeout: number = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setContour: CARTA.ISetContourParameters[];
    startAnimation: CARTA.IStartAnimation;
    stopAnimation: CARTA.IStopAnimation;
    setImageChannel: CARTA.ISetImageChannels[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 1,
            imageBounds: {
                xMin: 0, xMax: 640,
                yMin: 0, yMax: 800,
            },
            levels: [-0.01, 0.01],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 1,
            referenceFileId: 1,
            imageBounds: {
                xMin: 0, xMax: 640,
                yMin: 0, yMax: 800,
            },
            levels: [-0.01, 0.01],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
    startAnimation: {
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: 24, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
        looping: false,
        reverse: false,
        frameRate: 5,
        matchedFrames: {
            [1]: {
                frameNumbers: [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
                    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
                    20, 21, 22, 23, 24,
                ],
            },
        },
    },
    stopAnimation:
    {
        fileId: 0,
        endFrame: { channel: 10, stokes: 0 },
    },
    setImageChannel: [
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
        {
            fileId: 1,
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
};


let basepath: string;
describe("ANIMATOR_CONTOUR: Testing animation playback with contour lines", () => {

    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
        });


        describe(`Open two images:`, () => {
            test(`Check open successful`,async () => {
                assertItem.fileOpen[0].directory = basepath + "/" + assertItem.filelist.directory;
                assertItem.fileOpen[1].directory = basepath + "/" + assertItem.filelist.directory;

                let OpenFileResponse1 = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse1.success).toEqual(true);

                let RegionHistrogramDataResponse1 = await Stream(CARTA.RegionHistogramData,1);

                let OpenFileResponse2 = await msgController.loadFile(assertItem.fileOpen[1]);
                expect(OpenFileResponse2.success).toEqual(true);

                let RegionHistrogramDataResponse2 = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);
        });

        describe(`Preparation`, () => {
            test(`Contour set`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);
                
                msgController.setContourParameters(assertItem.setContour[0]);
                let ContourImageDataResponse1 = await Stream(CARTA.ContourImageData, assertItem.setContour[0].levels.length);

                msgController.setContourParameters(assertItem.setContour[1]);
                let ContourImageDataResponse2 = await Stream(CARTA.ContourImageData, assertItem.setContour[1].levels.length);

            });
        });

        describe(`Play some channels forwardly`, () => {
            let regionHistogramData: CARTA.RegionHistogramData[] = [];
            let sequence: number[] = [];
            let contourImageData: CARTA.ContourImageData[] = [];
            let HistogramSequence: number[] = [];
            let ContourSequence: number[] = [];
            test(`Assert ContourImageData.channel = RasterTileData.channel`, async () => {
                let StartAnimationResponse = await msgController.startAnimation(assertItem.startAnimation);
                expect(StartAnimationResponse.success).toEqual(true);

                for (let i = 0; i < assertItem.stopAnimation.endFrame.channel; i++) {
                    msgController.addRequiredTiles(assertItem.addTilesReq);
                    let resRegionHistogramData = msgController.histogramStream.pipe(take(2)).subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            HistogramSequence.push(data.channel)
                        }
                    });
                    let rasterTileDataResponse = await Stream(CARTA.RasterTileData, 3);
                    let resContourImageData = msgController.contourStream.pipe(take(4)).subscribe({
                        next: (data) => {
                            contourImageData.push(data)
                            ContourSequence.push(data.channel)
                        },
                    });
                    let currentChannel = rasterTileDataResponse[0].channel;
                    sequence.push(currentChannel);
                    msgController.sendAnimationFlowControl(
                        {
                            fileId: 0,
                            animationId: 0,
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                }

                // // Pick up the streaming messages
                // // Channel 11 & 12: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                // let RegionHistogramDataChannel11: CARTA.RegionHistogramData[] = [];
                // msgController.histogramStream.pipe(take(1)).subscribe(data => {
                //     RegionHistogramDataChannel11.push(data)
                // });
                // let ContourImageDataChannel11 = await Stream(CARTA.ContourImageData,4)
                // console.log(ContourImageDataChannel11);
                // let RasterTileDataChannel11 = await Stream(CARTA.RasterTileData,3);
                // console.log(RasterTileDataChannel11);

                // let RegionHistogramDataChannel12: CARTA.RegionHistogramData[] = [];
                // msgController.histogramStream.pipe(take(1)).subscribe(data => {
                //     RegionHistogramDataChannel12.push(data)
                // });
                // let ContourImageDataChannel12 = await Stream(CARTA.ContourImageData,4)
                // console.log(ContourImageDataChannel12);
                // let RasterTileDataChannel12 = await Stream(CARTA.RasterTileData,3);
                // console.log(RasterTileDataChannel12)

            });

            test(`Assert the last channel = StopAnimation.endFrame`, async () => {
                msgController.stopAnimation(assertItem.stopAnimation);
                msgController.setChannels(assertItem.setImageChannel[0]);
                let lastRegionHistogramData1: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe({
                next: (data) => {
                    lastRegionHistogramData1.push(data)
                },
                });
                let lastContourImageData1: CARTA.ContourImageData[] = [];
                msgController.contourStream.pipe(take(2)).subscribe({
                next: (data) => {
                    lastContourImageData1.push(data)
                },
                });
          
                let lastRasterTileData1 = await Stream(CARTA.RasterTileData,3);  

                msgController.setChannels(assertItem.setImageChannel[1]);
                let lastRegionHistogramData2: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe({
                next: (data) => {
                    lastRegionHistogramData2.push(data)
                },
                });
                let lastContourImageData2: CARTA.ContourImageData[] = [];
                msgController.contourStream.pipe(take(2)).subscribe({
                next: (data) => {
                    lastContourImageData2.push(data)
                },
                });
          
                let lastRasterTileData2 = await Stream(CARTA.RasterTileData,3);
            });

            test(`Received image channels should be in sequence`, async () => {
                sequence.map((id, index) => {
                    let channelId = (index + assertItem.startAnimation.startFrame.channel + assertItem.startAnimation.deltaFrame.channel);
                    expect(id).toEqual(channelId-1);
                });
            });

            test(`Assert a series of ContourImageData`, async () => {
                for (let i = 2; i <= assertItem.stopAnimation.endFrame.channel; i++) {
                    let testSet = contourImageData.filter(data => data.progress == 1 && data.channel == i);
                    expect(testSet.length).toEqual(assertItem.setContour[0].levels.length * assertItem.fileOpen.length);
                    expect(testSet.filter(data => data.fileId == 0).length).toEqual(assertItem.setContour[0].levels.length);
                    expect(testSet.filter(data => data.fileId == 1).length).toEqual(assertItem.setContour[1].levels.length);
                }
                expect(contourImageData.length).toEqual(assertItem.stopAnimation.endFrame.channel * assertItem.setContour[0].levels.length * assertItem.fileOpen.length);
                contourImageData.map(data => {
                    expect(data.referenceFileId).toEqual(1);
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});