import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import {
    assertContourImageDataHeader,
    assertPolylineIndices,
    assertProgressSequence,
    assertReportedDecimationFactor,
    assertVerticesAreOnGrid,
    assertVerticesWithinBounds,
    decodeContourSet,
    streamContourImageData,
    vertexCountOfLevel,
} from './ContourHelpers';
import {
    CONNECTION_TIMEOUT,
    CONTOUR_TIMEOUT,
    OPEN_FILE_TIMEOUT,
    PLAY_IMAGES_TIMEOUT,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    assertBasePath,
} from './CommonHelpers';

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    level: number;
    decimationFactors: number[];
    smoothingFactors: number[];
    heldDecimationFactor: number;
    heldSmoothingFactor: number;
    channel: number;
    stokes: number;
}

const imageBounds: CARTA.IImageBounds = { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 };
const contourChunkSize = 100000;

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    openFile: {
        directory: TEST_SUBDIRECTORY,
        file: 'h_m51_b_s05_drz_sci.fits',
        hdu: '0',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [
            { coordinate: 'x', mip: 1 },
            { coordinate: 'y', mip: 1 },
        ],
    },
    // One level throughout, so that each group of cases varies one factor and nothing else
    level: 0.6,
    decimationFactors: [1, 4, 8],
    smoothingFactors: [1, 4, 8],
    heldDecimationFactor: 4,
    heldSmoothingFactor: 4,
    channel: 0,
    stokes: 0,
};

function setContourParameters(smoothingFactor: number, decimationFactor: number): CARTA.ISetContourParameters {
    return {
        fileId: 0,
        referenceFileId: 0,
        levels: [assertItem.level],
        imageBounds: imageBounds,
        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
        smoothingFactor: smoothingFactor,
        decimationFactor: decimationFactor,
        compressionLevel: 8,
        contourChunkSize: contourChunkSize,
    };
}

describe('CONTOUR_CHANGE_SMOOTH_MODE_FACTOR: Testing Contour with different SmoothingFactor & DecimationFactor', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
    }, CONNECTION_TIMEOUT);

    checkConnection();

    test(`Get the base path and prefix the image directory with it |`, async () => {
        await assertBasePath([assertItem.filelist, assertItem.openFile]);
    });

    describe(`(Step 1) Initialize the open image`, () => {
        test(
            `(Step 1)"${assertItem.openFile.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${OPEN_FILE_TIMEOUT} ms`,
            async () => {
                msgController.closeFile(-1);
                const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
                const OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                await regionHistogramDataStream;

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            },
            OPEN_FILE_TIMEOUT
        );

        test(
            `Initialised WCS info from frame: ADD_REQUIRED_TILES, SET_CURSOR, and SET_SPATIAL_REQUIREMENTS, then check them are all returned correctly:`,
            async () => {
                const rasterTileDataStream = Stream(CARTA.RasterTileData, assertItem.addTilesReq.tiles.length + 2);
                msgController.addRequiredTiles(assertItem.addTilesReq);
                const RasterTileDataResponse = await rasterTileDataStream;
                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

                const cursorProfileStream = Stream(CARTA.SpatialProfileData, 1);
                msgController.setCursor(
                    assertItem.setCursor.fileId,
                    assertItem.setCursor.point.x,
                    assertItem.setCursor.point.y
                );
                const SpatialProfileDataResponse1 = await cursorProfileStream;
                expect(SpatialProfileDataResponse1[0].x).toEqual(assertItem.setCursor.point.x);
                expect(SpatialProfileDataResponse1[0].y).toEqual(assertItem.setCursor.point.y);

                const spatialProfileStream = Stream(CARTA.SpatialProfileData, 1);
                msgController.setSpatialRequirements(assertItem.setSpatialReq);
                const SpatialProfileDataResponse2 = await spatialProfileStream;
                expect(SpatialProfileDataResponse2[0].x).toEqual(assertItem.setCursor.point.x);
                expect(SpatialProfileDataResponse2[0].y).toEqual(assertItem.setCursor.point.y);
            },
            PLAY_IMAGES_TIMEOUT
        );

        /**
         * The decimation factor is the grid the vertices are rounded to, not an input to the
         * tracing: Session::SendContourData passes it to RoundAndEncodeVertices after ContourImage
         * has already produced the vertices. So the same level traced at a different decimation has
         * to return the same number of vertices, on a finer or coarser grid.
         */
        describe(`(Decimation factor) level ${assertItem.level}, smoothing factor ${assertItem.heldSmoothingFactor}`, () => {
            const vertexCounts = new Map<number, number>();

            assertItem.decimationFactors.forEach((decimationFactor) => {
                describe(`Decimation factor ${decimationFactor}`, () => {
                    let messages: CARTA.IContourImageData[];

                    test(
                        `should return CONTOUR_IMAGE_DATA ending with progress = 1 within ${CONTOUR_TIMEOUT} ms`,
                        async () => {
                            const contourImageDataStream = streamContourImageData(1);
                            msgController.setContourParameters(
                                setContourParameters(assertItem.heldSmoothingFactor, decimationFactor)
                            );
                            messages = await contourImageDataStream;
                            vertexCounts.set(decimationFactor, vertexCountOfLevel(messages, assertItem.level));
                            assertProgressSequence(messages, assertItem.level);
                        },
                        CONTOUR_TIMEOUT
                    );

                    test(`every chunk should be of file 0, level ${assertItem.level}, inside the image bounds`, () => {
                        messages.forEach((message) => {
                            assertContourImageDataHeader(message, {
                                fileId: 0,
                                referenceFileId: 0,
                                channel: assertItem.channel,
                                stokes: assertItem.stokes,
                            });
                            const decoded = decodeContourSet(message.contourSets![0]);
                            expect(decoded.level).toEqual(assertItem.level);
                            assertVerticesWithinBounds(decoded, imageBounds);
                            assertPolylineIndices(decoded);
                        });
                    });

                    test(`the vertices should be rounded to 1/${decimationFactor} of a pixel`, () => {
                        messages.forEach((message) => {
                            const decoded = decodeContourSet(message.contourSets![0]);
                            assertReportedDecimationFactor(decoded, decimationFactor);
                            // Only a build which compresses rounds the coordinates; one built with
                            // DisableContourCompression sends the unrounded floats and reports 0.
                            assertVerticesAreOnGrid(decoded);
                        });
                    });

                    test(`the contour should be long enough to be streamed in chunks of ${contourChunkSize} vertices`, () => {
                        expect(vertexCounts.get(decimationFactor)).toBeGreaterThan(contourChunkSize);
                    });
                });
            });

            test(`the decimation factor should not change how many vertices the level has`, () => {
                const counts = assertItem.decimationFactors.map((factor) => vertexCounts.get(factor));
                expect(counts).toEqual(counts.map(() => counts[0]));
            });
        });

        /**
         * The smoothing factor, unlike the decimation factor, is an input to the tracing: it is the
         * width of the Gaussian kernel ContourImage convolves the image with before looking for the
         * level. A wider kernel flattens the small structure the contour would have followed, so the
         * same level returns fewer vertices.
         */
        describe(`(Smoothing factor) level ${assertItem.level}, decimation factor ${assertItem.heldDecimationFactor}`, () => {
            const vertexCounts = new Map<number, number>();

            assertItem.smoothingFactors.forEach((smoothingFactor) => {
                describe(`Smoothing factor ${smoothingFactor}`, () => {
                    let messages: CARTA.IContourImageData[];

                    test(
                        `should return CONTOUR_IMAGE_DATA ending with progress = 1 within ${CONTOUR_TIMEOUT} ms`,
                        async () => {
                            const contourImageDataStream = streamContourImageData(1);
                            msgController.setContourParameters(
                                setContourParameters(smoothingFactor, assertItem.heldDecimationFactor)
                            );
                            messages = await contourImageDataStream;
                            vertexCounts.set(smoothingFactor, vertexCountOfLevel(messages, assertItem.level));
                            assertProgressSequence(messages, assertItem.level);
                        },
                        CONTOUR_TIMEOUT
                    );

                    test(`every chunk should decode to vertices inside the image bounds`, () => {
                        messages.forEach((message) => {
                            const decoded = decodeContourSet(message.contourSets![0]);
                            expect(decoded.level).toEqual(assertItem.level);
                            expect(decoded.vertices.length).toBeGreaterThan(0);
                            assertVerticesWithinBounds(decoded, imageBounds);
                            assertPolylineIndices(decoded);
                        });
                    });
                });
            });

            test(`a wider smoothing kernel should leave the level with fewer vertices`, () => {
                const counts = assertItem.smoothingFactors.map((factor) => vertexCounts.get(factor)!);
                expect(counts).toEqual([...counts].sort((a, b) => b - a));
                expect(new Set(counts).size).toEqual(counts.length);
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});
