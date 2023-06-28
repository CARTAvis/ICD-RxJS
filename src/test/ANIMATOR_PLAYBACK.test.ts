import { CARTA } from "carta-protobuf";
import config from "./config.json";
import * as Long from "long";
import { take } from 'rxjs/operators';
import { checkConnection, Stream } from './myClient';
import {MessageController, ConnectionStatus} from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile; 
let sleepTimeout: number = config.timeout.sleep;
let playAnimatorTimeout = config.timeout.playAnimator;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    addTilesReq: CARTA.IAddRequiredTiles[];
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
    reverseAnimation: CARTA.IStartAnimation[];
    blinkAnimation: CARTA.IStartAnimation;
    playAnimatorTimeout: number[];
    numArray2: number[];
    numArray3: number[];
    numArray4: number[];
    numArray5: number[];
    numArray6: number[];
    numArray7: number[];
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
            file: "M17_SWex.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 9,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 300, y: 300 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}],
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722]
        },
    ],
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
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
            },
            {
                fileId: 0,
                startFrame: { channel: 19, stokes: 0 },
                firstFrame: { channel: 9, stokes: 0 },
                lastFrame: { channel: 19, stokes: 0 },
                deltaFrame: { channel: -1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                matchedFrames: {},
            },
            {
                fileId: 0,
                startFrame: { channel: 9, stokes: 0 },
                firstFrame: { channel: 9, stokes: 0 },
                lastFrame: { channel: 19, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                matchedFrames: {},
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
                endFrame: { channel: 18, stokes: 0 },
            },
            {
                fileId: 0,
                endFrame: { channel: 10, stokes: 0 },
            },
            {
                fileId: 0,
                endFrame: { channel: 23, stokes: 0 },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 0,
            },
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
                channel: 10,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
            },
            {
                fileId: 0,
                channel: 18,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 0,
                channel: 10,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 0,
                channel: 23,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
        reverseAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 20, stokes: 0 },
                firstFrame: { channel: 10, stokes: 0 },
                lastFrame: { channel: 20, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                reverse: true,
                looping: true,
                frameRate: 5,
                matchedFrames: {},
            },
            {
                fileId: 0,
                startFrame: { channel: 20, stokes: 0 },
                firstFrame: { channel: 10, stokes: 0 },
                lastFrame: { channel: 20, stokes: 0 },
                deltaFrame: { channel: -1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                reverse: false,
                looping: true,
                frameRate: 5,
                matchedFrames: {},
            },
        ],
        blinkAnimation:{
            fileId: 0,
            startFrame: { channel: 3, stokes: 0 },
            firstFrame: { channel: 3, stokes: 0 },
            lastFrame: { channel: 10, stokes: 0 },
            deltaFrame: { channel: 7, stokes: 0 },
            matchedFrames: {},
            requiredTiles: {
                fileId: 0,
                tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 9,
            },
            looping: true,
            frameRate: 5,
            reverse: false,
    },
    playAnimatorTimeout: [200000],
    numArray2: [1, 2, 3, 4,  5, 6, 7, 8, 9, 10],
    numArray3: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10,  9, 19, 18],
    numArray4: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,  9, 10],
    numArray5: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,23],
    numArray6: [20,19,18,17,16,15,14,13,12,11,10],
    numArray7: [3,10,3,10,3,10,3,10,3,10,3,10],
};

describe("PERF_ANIMATION_PLAYBACK",() => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('sleep!') });
    }

    checkConnection();
    let basepath: string;
    test(`Get basepath`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        let OpenFileResponse: CARTA.IOpenFileAck;
        test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData: CARTA.RegionHistogramData[] = [];
            let resRegionHistogramData = msgController.histogramStream.pipe(take(1));
            resRegionHistogramData.subscribe(data => {
                RegionHistogramData.push(data)
            });
        
            msgController.addRequiredTiles(assertItem.initTilesReq);
            let RasterTileData = await Stream(CARTA.RasterTileData,14); //RasterTileData * 12 + RasterTileSync * 2
    
        },openFileTimeout);

        describe(`(Step 2)Play some channels forwardly`, () => {
            let sequence: number[] = [];
            test(`running animation flow and stop:`, async() => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation({
                    ...assertItem.startAnimation[0],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                for (let i=0; i < assertItem.stopAnimation[0].endFrame.channel-1; i++){
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                        complete: () => {
                            expect(RegionHistogramData[0].channel).toEqual(i+1);
                        }
                    })

                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);

                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[0],
                        receivedFrame: {
                            channel: i+1,
                            stokes: 0
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }

                // Pick up the streaming messages
                // Channel 10 & 11: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel10: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel10.push(data)
                });
                let RasterTileDataChannel10 = await Stream(CARTA.RasterTileData,14);
                let RegionHistogramDataChannel11: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel11.push(data)
                });
                let RasterTileDataChannel11 = await Stream(CARTA.RasterTileData,14);

                msgController.stopAnimation(assertItem.stopAnimation[0]);
                //Set Channel 10 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[0]);

                let lastRegionHistogramDataChannel10: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    lastRegionHistogramDataChannel10.push(data)
                });
                let lastRasterTileDataChannel10 = await Stream(CARTA.RasterTileData,14);
                sequence.push(lastRasterTileDataChannel10[1].channel)

            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async() => {
                console.log(`(Step 2) Sequent channel index: ${sequence}`);
                assertItem.numArray2.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            })
        })

        describe(`(Step 3) Play some channels backwardly with looping`, () => {
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation({
                    ...assertItem.startAnimation[1],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                
                for (let i=0; i < 13; i++){
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                     msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                    })
            
                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);
                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[1],
                        receivedFrame: {
                             channel: i+1,
                            stokes: 0
                            },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }
        
                // Pick up the streaming messages
                // Channel 17 & 16: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel17: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel17.push(data)
                });
                let RasterTileDataChannel17 = await Stream(CARTA.RasterTileData,14);
                let RegionHistogramDataChannel16: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel16.push(data)
                });
                let RasterTileDataChannel16 = await Stream(CARTA.RasterTileData,14);

                msgController.stopAnimation(assertItem.stopAnimation[1]);
                //Set Channel 18 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[1]);

                let RegionHistogramDataChannel18: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel18.push(data)
                });
                let RasterTileDataChannel18 = await Stream(CARTA.RasterTileData,14);

                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[1].endFrame.channel);

                await sleep(sleepTimeout);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async() => {
                console.log(`(Step 3) Sequent channel index: ${sequence}`);
                assertItem.numArray3.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            })
        });

        describe(`(Step 4 )Play some channels forwardly with looping until stop`, () => {
            let sequence: number[] = [];
            let lastRasterImageData: any[] = [];
            test(`Image should return one after one`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation({
                    ...assertItem.startAnimation[2],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                for (let i = 0; i < 13; i++){ 
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                    })
            
                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);
                    let currentChannel = RasterTileData[0].channel;
                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[2],
                        receivedFrame: {
                             channel: currentChannel,
                            stokes: 0
                            },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                };
                // Pick up the streaming messages
                // Channel 11 & 12: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel11: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel11.push(data)
                });
                let RasterTileDataChannel11 = await Stream(CARTA.RasterTileData,14);
                let RegionHistogramDataChannel12: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel12.push(data)
                });
                let RasterTileDataChannel12 = await Stream(CARTA.RasterTileData,14);

                msgController.stopAnimation(assertItem.stopAnimation[2]);
                 //Set Channel 10 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[2]);

                let lastRegionHistogramDataChannel10: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    lastRegionHistogramDataChannel10.push(data)
                });
                let lastRasterTileDataChannel10 = await Stream(CARTA.RasterTileData,14);

                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[2].endFrame.channel);

                await sleep(sleepTimeout);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async() => {
                console.log(`(Step 4) Sequent channel index: ${sequence}`);
                assertItem.numArray4.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            })
        });

        describe(`(Step 5) Play images round-trip`, () => {
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation({
                    ...assertItem.startAnimation[0],
                    looping: true,
                    reverse: true,
                });

                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                for (let i = 0; i < 3 * Math.abs(assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel); i++) {
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                    })

                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);


                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[0],
                        receivedFrame: {
                            channel: RasterTileData[0].channel,
                            stokes: 0
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                };

                // Pick up the streaming messages
                // Channel 23: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel23: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel23.push(data)
                });
                let RasterTileDataChannel23 = await Stream(CARTA.RasterTileData,14);

                msgController.stopAnimation(assertItem.stopAnimation[3]);
                //Set Channel 23 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[3]);

                //Because the RegionHistogram of channel 23 has already exit, we do not need to receive it again.
                let lastRasterTileData = await Stream(CARTA.RasterTileData,14);
                sequence.push(lastRasterTileData[1].channel)

                await sleep(sleepTimeout);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence and then reverse:`, async () => {
                console.log(`(Step 5) Channel index in roundtrip: ${sequence}`);
                assertItem.numArray5.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            });
        });

        describe(`(Step 6) Play all images backwardly using method 1`, () => {
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation(assertItem.reverseAnimation[0]);
                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                for (let i = 0; i < Math.abs(assertItem.reverseAnimation[0].lastFrame.channel - assertItem.reverseAnimation[0].firstFrame.channel); i++) {
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                    })

                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);

                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[0],
                        receivedFrame: {
                            channel: RasterTileData[0].channel,
                            stokes: 0
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }

                // Pick up the streaming messages
                // Channel 10 & 11: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel10: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel10.push(data)
                });
                let RasterTileDataChannel10 = await Stream(CARTA.RasterTileData,14);
                let RegionHistogramDataChannel11: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel11.push(data)
                });
                let RasterTileDataChannel11 = await Stream(CARTA.RasterTileData,14);
            
                msgController.stopAnimation(assertItem.stopAnimation[0]);
                //Set Channel 10 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[0]);

                let lastRegionHistogramData: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    lastRegionHistogramData.push(data)
                });

                let lastRasterTileData = await Stream(CARTA.RasterTileData,14);
                sequence.push(lastRasterTileData[1].channel)

                await sleep(sleepTimeout);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`(Step 6) Backward channel index with method 1: ${sequence}`);
                assertItem.numArray6.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            });
        });

        describe(`(Step 6) Play all images backwardly using method 2`, () => {
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation(assertItem.reverseAnimation[1]);
                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                for (let i = 0; i < Math.abs(assertItem.reverseAnimation[0].lastFrame.channel - assertItem.reverseAnimation[0].firstFrame.channel); i++) {
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                    })

                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);

                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[0],
                        receivedFrame: {
                            channel: RasterTileData[0].channel,
                            stokes: 0
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }

                // Pick up the streaming messages
                // Channel 10 & 11: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel10: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel10.push(data)
                });
                let RasterTileDataChannel10 = await Stream(CARTA.RasterTileData,14);

                let RegionHistogramDataChannel11: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel11.push(data)
                });
                let RasterTileDataChannel11 = await Stream(CARTA.RasterTileData,14);
            
                msgController.stopAnimation(assertItem.stopAnimation[0]);
                //Set Channel 10 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[0]);

                let lastRegionHistogramData: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    lastRegionHistogramData.push(data)
                });
                let lastRasterTileData = await Stream(CARTA.RasterTileData,14);
                sequence.push(lastRasterTileData[1].channel)

                await sleep(sleepTimeout);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`(Step 6) Backward channel index with method 2: ${sequence}`);
                assertItem.numArray6.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            });
        });

        describe(`(Step 7) Blink images between ${assertItem.blinkAnimation.firstFrame.channel} and ${assertItem.blinkAnimation.lastFrame.channel}`, () => {
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation(assertItem.blinkAnimation);
                expect(StartAnimationResponse.success).toEqual(true);
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                for (let i = 0; i < 11; i++) {
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            RegionHistogramData.push(data);
                        },
                    })

                    let RasterTileData = await Stream(CARTA.RasterTileData,14);
                    sequence.push(RasterTileData[0].channel);

                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[0],
                        receivedFrame: {
                            channel: RasterTileData[0].channel,
                            stokes: 0
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }

                // Pick up the streaming messages
                // Channel 10: RasterTileData + RasterTileSync(start & end) + RegionHistogramData
                let RegionHistogramDataChannel10: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramDataChannel10.push(data)
                });
                let RasterTileDataChannel10 = await Stream(CARTA.RasterTileData,14);

                msgController.stopAnimation(assertItem.stopAnimation[0]);
                //Set Channel 10 as the stop channel
                msgController.setChannels(assertItem.setImageChannel[0]);

                //Because the RegionHistogram of channel 23 has already exit, we do not need to receive it again.
                let lastRasterTileData = await Stream(CARTA.RasterTileData,14);
                sequence.push(lastRasterTileData[1].channel)

                await sleep(sleepTimeout);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`(Step 7) Blink channel index: ${sequence}`);
                assertItem.numArray7.map((value,index) => {
                    expect(sequence[index]).toEqual(value)
                })
            });
        });

    });

    afterAll(() => msgController.closeConnection());
});