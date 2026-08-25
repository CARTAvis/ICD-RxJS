import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import { assertBackendIsAlive, testOpenFile, testTilesAndProfiles } from './CloseFileHelpers';
import {
    CONNECTION_TIMEOUT,
    PLAY_ANIMATOR_TIMEOUT,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    basePath,
} from './CommonHelpers';
import { take } from 'rxjs/operators';
import * as Long from 'long';

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
}

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: TEST_SUBDIRECTORY },
    fileOpen: {
        directory: TEST_SUBDIRECTORY,
        file: 'M17_SWex.fits',
        hdu: '0',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [
                33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721,
                33566720, 33566722,
            ],
        },
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [
                33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721,
                33566720, 33566722,
            ],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 320, y: 400 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
    },
    startAnimation: {
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: 24, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [
                33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721,
                33566720, 33566722,
            ],
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

describe('Testing CLOSE_FILE with large-size image and test CLOSE_FILE during the TILE data streaming :', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        basePath([assertItem.fileOpen, assertItem.filelist]);
        testOpenFile('(Step 1)', assertItem.fileOpen, -1);
        testTilesAndProfiles(
            '(Step 2)',
            assertItem.addRequiredTiles[0],
            assertItem.setCursor,
            assertItem.setSpatialReq
        );

        let sequence: number[] = [];
        test(
            `(Step 3) START_ANIMATION & ANIMATION_FLOW_CONTROL, then CLOSE_FILE during the animation streaming & Check whether the backend is alive:`,
            async () => {
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
                            expect(RegionHistogramData[0].channel).toEqual(i + 1);
                        },
                    });
                    let RasterTileData = await Stream(
                        CARTA.RasterTileData,
                        assertItem.addRequiredTiles[1].tiles.length + 2
                    );
                    sequence.push(RasterTileData[0].channel);
                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl,
                        receivedFrame: {
                            channel: RasterTileData[0].channel,
                            stokes: 0,
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }

                // CLOSE_FILE before STOP_ANIMATION (NO STOP_ANIMATION in this test!)
                msgController.closeFile(0);

                // The backend may still returning the remain message
                // To check whether the backend is still alive
                await assertBackendIsAlive(assertItem.filelist);
            },
            PLAY_ANIMATOR_TIMEOUT
        );

        afterAll(() => msgController.closeConnection());
    });
});
