import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';
import * as Long from "long";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.performance.openFile;
let readFileTimeout: number = config.performance.readFile;

interface AssertItem {
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
    playAnimatorTimeout: number[];
};

let assertItem: AssertItem = {
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_B",
            file: "cube_B_09600_z00100.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    startAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 0, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 999, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
            },
        ],
    stopAnimation:
        [
            {
                fileId: 0,
                endFrame: { channel: 46, stokes: 0 },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 1,
            },
        ],
    setImageChannel:
        [
            {
                fileId: 0,
                channel: 46,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
    playAnimatorTimeout: [600000],
};

let basepath: string;
describe("PERF_ANIMATION_PLAYBACK",()=>{
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.fileOpen[0].directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`(Step 1)"${assertItem.fileOpen[0].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.initTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

                msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.initTilesReq.tiles.length + 2);
            }, openFileTimeout);

            describe(`Play some channels forwardly`, () => {
                test(`(Step 2)"${assertItem.fileOpen[0].file}" Image should return within ${assertItem.playAnimatorTimeout[0]}:`, async () => {
                    let sequence: number[] = [];
                    let StartAnimationResponse: CARTA.IStartAnimationAck;
                    let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                    let SpatialProfileData: CARTA.SpatialProfileData[] = [];

                    StartAnimationResponse = await msgController.startAnimation({
                        ...assertItem.startAnimation[0],
                        looping: true,
                        reverse: false,
                        frameRate: 15,
                    });
                    expect(StartAnimationResponse.success).toEqual(true);
                    msgController.addRequiredTiles(assertItem.addTilesReq[0]);

                    for (let i=0; i < assertItem.stopAnimation[0].endFrame.channel-1; i++){
                        msgController.histogramStream.pipe(take(1)).subscribe({
                            next: (data) => {
                                RegionHistogramData.push(data);
                            }
                        })

                        msgController.spatialProfileStream.pipe(take(1)).subscribe({
                            next: (data) => {
                                SpatialProfileData.push(data)
                            }
                        })

                        let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.startAnimation[0].requiredTiles.tiles.length + 2);
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
                    msgController.stopAnimation(assertItem.stopAnimation[0]);
                    msgController.setChannels(assertItem.setImageChannel[0]);
                    let lastRegionHistogramDataPromise = new Promise((resolve) => {
                        msgController.histogramStream.pipe(take(1)).subscribe({
                            next: (data) => {
                                resolve(data)
                            }
                        });
                    });
                    let lastRegionHistogramData = await lastRegionHistogramDataPromise;
                    
                    let lastSpatialProfileDataPromise = new Promise((resolve) => {
                        msgController.spatialProfileStream.pipe(take(1)).subscribe({
                            next: (data) => {
                                resolve(data)
                            }
                        });
                    });
                    let lastSpatialProfileData = await lastSpatialProfileDataPromise;

                    let lastRasterTileDataChannel46 = await Stream(CARTA.RasterTileData,3);
                    sequence.push(lastRasterTileDataChannel46[1].channel);
                    console.log(sequence);
                    expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[0].endFrame.channel);
                    
                }, assertItem.playAnimatorTimeout[0]);
            });

        });

        afterAll(() => msgController.closeConnection());
    });
});