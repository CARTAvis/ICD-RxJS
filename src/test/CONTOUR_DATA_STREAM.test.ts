import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import {
    assertContourImageDataHeader,
    assertPolylineIndices,
    assertProgressSequence,
    assertVerticesAreOnGrid,
    assertVerticesWithinBounds,
    decodeContourSet,
    messagesOfLevel,
    streamContourImageData,
    vertexCountOfLevel,
} from './ContourHelpers';
import {
    CONNECTION_TIMEOUT,
    CONTOUR_TIMEOUT,
    OPEN_FILE_TIMEOUT,
    QUIET_TIME,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    assertBasePath,
} from './CommonHelpers';

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters;
    channel: number;
    stokes: number;
}

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    openFile: {
        directory: TEST_SUBDIRECTORY,
        file: 'h_m51_b_s05_drz_sci.fits',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setCursor: {
        fileId: 0,
        point: { x: 4000, y: 2000 },
    },
    setContour: {
        fileId: 0,
        referenceFileId: 0,
        imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
        levels: [0.36, 0.72, 1.09],
        smoothingMode: CARTA.SmoothingMode.NoSmoothing,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 8,
        contourChunkSize: 100000,
    },
    channel: 0,
    stokes: 0,
};

describe('CONTOUR_DATA_STREAM: Testing contour data stream when there are a lot of vertices', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
    }, CONNECTION_TIMEOUT);

    checkConnection();

    test(`Get the base path and prefix the image directory with it |`, async () => {
        await assertBasePath([assertItem.filelist, assertItem.openFile]);
    });

    describe(`Go to "${TEST_SUBDIRECTORY}" folder`, () => {
        test(
            `(Step 1)"${assertItem.openFile.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${OPEN_FILE_TIMEOUT} ms`,
            async () => {
                msgController.closeFile(-1);
                const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
                const OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                await regionHistogramDataStream;

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);

                const rasterTileDataStream = Stream(CARTA.RasterTileData, assertItem.addTilesReq.tiles.length + 2);
                msgController.addRequiredTiles(assertItem.addTilesReq);
                const RasterTileDataResponse = await rasterTileDataStream;
                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

                const spatialProfileDataStream = Stream(CARTA.SpatialProfileData, 1);
                msgController.setCursor(
                    assertItem.setCursor.fileId,
                    assertItem.setCursor.point.x,
                    assertItem.setCursor.point.y
                );
                const SpatialProfileDataResponse = await spatialProfileDataStream;
                expect(SpatialProfileDataResponse[0].x).toEqual(assertItem.setCursor.point.x);
                expect(SpatialProfileDataResponse[0].y).toEqual(assertItem.setCursor.point.y);
            },
            OPEN_FILE_TIMEOUT
        );

        describe(`SET_CONTOUR_PARAMETERS with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour.smoothingMode!]}"`, () => {
            const levels = assertItem.setContour.levels!;
            const chunkSize = assertItem.setContour.contourChunkSize!;
            let messages: CARTA.IContourImageData[];

            test(
                `should return CONTOUR_IMAGE_DATA for each of the ${levels.length} levels, each ending with progress = 1`,
                async () => {
                    const contourImageDataStream = streamContourImageData(levels.length);
                    msgController.setContourParameters(assertItem.setContour);
                    messages = await contourImageDataStream;
                    expect(messages.filter((message) => message.progress === 1).length).toEqual(levels.length);
                },
                CONTOUR_TIMEOUT * levels.length
            );

            test(`every CONTOUR_IMAGE_DATA should carry one contour set of a requested level`, () => {
                messages.forEach((message) => {
                    assertContourImageDataHeader(message, {
                        fileId: assertItem.setContour.fileId!,
                        referenceFileId: assertItem.setContour.referenceFileId!,
                        channel: assertItem.channel,
                        stokes: assertItem.stokes,
                    });
                    expect(levels).toContain(message.contourSets![0].level);
                });
            });

            /**
             * The reason this image is here: each level holds far more vertices than one chunk, so
             * TraceLevel has to flush partial results rather than answer in a single message. The
             * levels are traced in parallel, so their messages interleave and only the run belonging
             * to one level is ordered.
             */
            test(`each level should be streamed as more than one chunk`, () => {
                levels.forEach((level) => {
                    const forLevel = messagesOfLevel(messages, level);
                    const vertices = vertexCountOfLevel(messages, level);
                    expect(vertices).toBeGreaterThan(chunkSize);
                    expect(forLevel.length).toBeGreaterThan(1);
                });
            });

            test(`the progress of each level should increase and reach 1 only in its last chunk`, () => {
                levels.forEach((level) => assertProgressSequence(messages, level));
            });

            test(`every chunk should decode to vertices inside the requested image bounds`, () => {
                messages.forEach((message) => {
                    const decoded = decodeContourSet(message.contourSets![0]);
                    expect(decoded.vertices.length).toBeGreaterThan(0);
                    assertVerticesAreOnGrid(decoded);
                    assertVerticesWithinBounds(decoded, assertItem.setContour.imageBounds!);
                    assertPolylineIndices(decoded);
                });
            });

            test(`a lower level should enclose more of the image than a higher one`, () => {
                // Every pixel above 1.09 is also above 0.36, so the lower level traces the longer
                // boundary. This is what shows the levels were not all traced at the same value.
                const vertexCounts = levels.map((level) => vertexCountOfLevel(messages, level));
                expect(vertexCounts).toEqual([...vertexCounts].sort((a, b) => b - a));
                expect(new Set(vertexCounts).size).toEqual(levels.length);
            });

            test(`there should be no further message within ${QUIET_TIME} ms`, async () => {
                const messageCount = msgController.messageReceiving();
                await new Promise((resolve) => setTimeout(resolve, QUIET_TIME));
                expect(msgController.messageReceiving()).toEqual(messageCount);
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});
