import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';
import * as Long from "long";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playAnimatorTimeout = config.timeout.playAnimator;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    startAnimation: CARTA.IStartAnimation;
    animationFlowControl: CARTA.IAnimationFlowControl;
    AnimatorStopChannel: number;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen:
    {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
        },
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
        },
    ],
    setCursor:
    {
        fileId: 0,
        point: { x: 320, y: 400 },
    },
    setSpatialReq:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    startAnimation:
    {
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: 24, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
    },
    animationFlowControl: {
        fileId: 0,
        animationId: 1,
    },
    AnimatorStopChannel: 2,
};

let basepath: string;
describe("Testing CLOSE_FILE with large-size image and test CLOSE_FILE during the TILE data streaming :", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + "/" + assertItem.fileOpen.directory;
            assertItem.filelist.directory = basepath + "/" + assertItem.filelist.directory;
        });

        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
        }, openFileTimeout);

        test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[0]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[0].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(assertItem.addRequiredTiles[0].tiles.length + 2); //RasterTileSync: start & end + 12 Tile returned
        }, readFileTimeout);

        let sequence: number[] = [];
        test(`(Step 3) START_ANIMATION & ANIMATION_FLOW_CONTROL, then CLOSE_FILE during the animation streaming & Check whether the backend is alive:`, async () => {
            let StartAnimationResponse: CARTA.IStartAnimationAck;
            StartAnimationResponse = await msgController.startAnimation({
                ...assertItem.startAnimation,
                looping: true,
                reverse: false,
                frameRate: 5,
            });
            expect(StartAnimationResponse.success).toEqual(true);
            msgController.addRequiredTiles(assertItem.addRequiredTiles[1]);
            for (let i = 0; i < assertItem.AnimatorStopChannel; i++) {
                let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                msgController.histogramStream.pipe(take(1)).subscribe({
                    next: (data) => {
                        RegionHistogramData.push(data);
                    },
                    complete: () => {
                        expect(RegionHistogramData[0].channel).toEqual(i+1);
                    }
                })
                let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[1].tiles.length + 2);
                sequence.push(RasterTileData[0].channel);
                msgController.sendAnimationFlowControl({
                    ...assertItem.animationFlowControl,
                    receivedFrame: {
                        channel: RasterTileData[0].channel,
                        stokes: 0
                    },
                    timestamp: Long.fromNumber(Date.now()),
                });
            }

            // CLOSE_FILE before STOP_ANIMATION (NO STOP_ANIMATION in this test!)
            msgController.closeFile(0);

            // The backend may still returning the remain message
            // To check whether the backend is still alive
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        }, playAnimatorTimeout);

        afterAll(() => msgController.closeConnection());
    });
})

