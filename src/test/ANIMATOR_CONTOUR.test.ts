import { CARTA } from "carta-protobuf";
import * as Long from "long";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let connectTimeout = config.timeout.connection;
let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playAnimatorTimeout = config.timeout.playAnimator

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setContour: CARTA.ISetContourParameters;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
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
    setContour: {
        fileId: 0,
        referenceFileId: 0,
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
    startAnimation:
        [
            {
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
            },
            {
                fileId: 0,
                startFrame: { channel: 20, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 24, stokes: 0 },
                deltaFrame: { channel: -1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                looping: false,
                reverse: false,
                frameRate: 5,
            },
        ],
    stopAnimation:
        [
            {
                fileId: 0,
                endFrame: { channel: 10, stokes: 0 },
            },
            {
                fileId: 0,
                endFrame: { channel: 10, stokes: 0 },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 1,
            },
            {
                fileId: 0,
                animationId: 2,
            },
        ],
    setImageChannel:
        [
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
                fileId: 0,
                channel: 20,
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

describe("ANIMATOR_CONTOUR: Testing animation playback with contour lines", () => {

    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        let basepath: string;
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
        });

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            let OpenFileResponse: CARTA.IOpenFileAck;
        test(`"${assertItem.openFile.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            assertItem.openFile.directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            expect(OpenFileResponse.success).toEqual(true);

            let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            expect(RegionHistrogramDataResponse.length).toEqual(1);        
        },openFileTimeout);

        test(`Preparation`, async() => {
            msgController.addRequiredTiles(assertItem.addTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);
            
            msgController.setContourParameters(assertItem.setContour);
            let ContourImageDataResponse = await Stream(CARTA.ContourImageData, assertItem.setContour.levels.length);
        }, readFileTimeout)
        });
        
        describe(`(Case 1):Play some channels forwardly`, ()=>{
            test(`Preparation`, async () => {
                msgController.setChannels(assertItem.setImageChannel[0]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.setImageChannel[0].requiredTiles.tiles.length + 2);
            });

            let regionHistogramData: CARTA.RegionHistogramData[] = [];
            let RasterTileSequence: number[] = [];
            let HistogramSequence: number[] = [];
            let ContourSequence: number[] = [];
            test(`Image should return one after one and the last channel is correct:`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation(assertItem.startAnimation[0]);
                expect(StartAnimationResponse.success).toEqual(true);

                for (let i = 0; i < assertItem.stopAnimation[0].endFrame.channel; i++) {
                    msgController.addRequiredTiles(assertItem.addTilesReq);
                    let resRegionHistogramData = msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            HistogramSequence.push(data.channel)
                        }
                    });
                    let resContourImageData = msgController.contourStream.pipe(take(2)).subscribe({
                        next: (data) => {
                            ContourSequence.push(data.channel)
                        }
                    });

                    let rasterTileDataResponse = await Stream(CARTA.RasterTileData, 3);
                    let currentChannel = rasterTileDataResponse[0].channel;
                    RasterTileSequence.push(currentChannel);

                    msgController.sendAnimationFlowControl(
                        {
                            ...assertItem.animationFlowControl[0],
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                }

                // Pick up the streaming messages
                // Channel 11 & 12: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel11: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel11.push(data)
                });
                let RasterTileDataChannel11 = await Stream(CARTA.RasterTileData,3);

                let RegionHistogramDataChannel12: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel12.push(data)
                });
                let RasterTileDataChannel12 = await Stream(CARTA.RasterTileData,3);


                // // Send StopAnimator
                msgController.stopAnimation(assertItem.stopAnimation[0]);
                msgController.setChannels(assertItem.setImageChannel[0]);  

                let lastRegionHistogramData: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe({
                    next: (data) => {
                        lastRegionHistogramData.push(data)
                    },
                    // complete: () => {
                    //     console.log(lastRegionHistogramData)
                    // }
                });
                let lastContourImageData: CARTA.ContourImageData[] = [];
                msgController.contourStream.pipe(take(2)).subscribe({
                    next: (data) => {
                        lastContourImageData.push(data)
                    },
                    // complete: () => {
                    //     console.log(lastContourImageData)
                    // }
                });
          
                let lastRasterTileData = await Stream(CARTA.RasterTileData,3);
            }, playAnimatorTimeout);

            test(`Received RasterTileData channels should be in sequence`, async () => {
                console.warn(`(Step 1) Sequent channel index: ${RasterTileSequence}`);
                RasterTileSequence.map((id, index) => {
                    let channelId = (index + assertItem.startAnimation[0].startFrame.channel + assertItem.startAnimation[0].deltaFrame.channel) - 1.;
                    expect(id).toEqual(channelId);
                });
            });

            test(`Received ContourData channels should be in sequence`, async () => {
                for (let i = 1; i <= assertItem.stopAnimation[0].endFrame.channel; i++) {
                    expect(ContourSequence[(i-1)*2]).toEqual(i);
                    expect(ContourSequence[(i-1)*2+1]).toEqual(i);
                }
            });

            test(`Received RegionHistogramData channels should be in sequence`, async () => {
                for (let i = 1; i <= assertItem.stopAnimation[0].endFrame.channel; i++) {
                    expect(HistogramSequence[i-1]).toEqual(i);
                }
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});

describe("ANIMATOR_CONTOUR: Testing animation playback with contour lines", () => {

    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        let basepath: string;
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
        });

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            let OpenFileResponse: CARTA.IOpenFileAck;
        test(`"${assertItem.openFile.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            assertItem.openFile.directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            expect(OpenFileResponse.success).toEqual(true);

            let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            expect(RegionHistrogramDataResponse.length).toEqual(1);        
        },openFileTimeout);

        test(`Preparation`, async() => {
            msgController.addRequiredTiles(assertItem.addTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2)
            
            msgController.setContourParameters(assertItem.setContour);
            let ContourImageDataResponse = await Stream(CARTA.ContourImageData, assertItem.setContour.levels.length);
        }, readFileTimeout)
        });

        describe(`(Case 2) Play some channels backwardly`, () => {
            test(`Preparation`, async () => {
                msgController.setChannels(assertItem.setImageChannel[1]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.setImageChannel[1].requiredTiles.tiles.length + 2);
            });

            let regionHistogramData: CARTA.RegionHistogramData[] = [];
            let RasterTileSequence: number[] = [];
            let HistogramSequence: number[] = [];
            let ContourSequence: number[] = [];
            test(`Image should return one after one and the last channel is correct:`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation(assertItem.startAnimation[1]);
                expect(StartAnimationResponse.success).toEqual(true);

                for (let i = assertItem.startAnimation[1].startFrame.channel; i > assertItem.stopAnimation[1].endFrame.channel - 1; i--) {
                    msgController.addRequiredTiles(assertItem.addTilesReq);
                    let resRegionHistogramData = msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            HistogramSequence.push(data.channel)
                        }
                    });
                    let resContourImageData = msgController.contourStream.pipe(take(2)).subscribe({
                        next: (data) => {
                            ContourSequence.push(data.channel)
                        }
                    });

                    let rasterTileDataResponse = await Stream(CARTA.RasterTileData, 3);
                    let currentChannel = rasterTileDataResponse[0].channel;
                    RasterTileSequence.push(currentChannel);

                    msgController.sendAnimationFlowControl(
                        {
                            ...assertItem.animationFlowControl[0],
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                }

                // Pick up the streaming messages
                // Channel 8 & 7: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel8: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel8.push(data)
                });
                let RasterTileDataChannel8 = await Stream(CARTA.RasterTileData,3);

                let RegionHistogramDataChannel7: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel7.push(data)
                });
                let RasterTileDataChannel7 = await Stream(CARTA.RasterTileData,3);

                // // Send StopAnimator
                msgController.stopAnimation(assertItem.stopAnimation[1]);
                msgController.setChannels(assertItem.setImageChannel[1]);  

                let lastRegionHistogramData: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe({
                    next: (data) => {
                        lastRegionHistogramData.push(data)
                    },
                    // complete: () => {
                    //     console.log(lastRegionHistogramData)
                    // }
                });
                let lastContourImageData: CARTA.ContourImageData[] = [];
                msgController.contourStream.pipe(take(2)).subscribe({
                    next: (data) => {
                        lastContourImageData.push(data)
                    },
                    // complete: () => {
                    //     console.log(lastContourImageData)
                    // }
                });
          
                let lastRasterTileData = await Stream(CARTA.RasterTileData,3);
            }, playAnimatorTimeout);

            test(`Received RasterTileData channels should be in sequence`, async () => {
                console.warn(`(Step 2) Sequent channel index: ${RasterTileSequence}`);
                RasterTileSequence.map((id, index) => {
                    let channelId = -index + assertItem.startAnimation[1].startFrame.channel - 1;
                    expect(id).toEqual(channelId);
                });
            });

            test(`Received ContourData channels should be in sequence`, async () => {
                let index = 1;
                for (let i = assertItem.startAnimation[1].startFrame.channel -1 ; i > assertItem.stopAnimation[1].endFrame.channel - 2; i--) {
                    expect(ContourSequence[(index-1)*2]).toEqual(i);
                    expect(ContourSequence[(index-1)*2+1]).toEqual(i);
                    index++;
                }
            });

            test(`Received RegionHistogramData channels should be in sequence`, async () => {
                let index = 1;
                for (let i = assertItem.startAnimation[1].startFrame.channel -1 ; i > assertItem.stopAnimation[1].endFrame.channel - 2; i--) {
                    expect(HistogramSequence[index-1]).toEqual(i);
                    index++;
                }
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});