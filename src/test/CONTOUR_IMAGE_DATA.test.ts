import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import {
    assertContourImageDataHeader,
    assertPolylineIndices,
    assertVerticesAreOnGrid,
    assertVerticesWithinBounds,
    decodeContourSet,
    streamContourImageData,
    verticesOnGrid,
} from './ContourHelpers';
import {
    CONNECTION_TIMEOUT,
    CONTOUR_TIMEOUT,
    OPEN_FILE_TIMEOUT,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    assertBasePath,
} from './CommonHelpers';

/**
 * One smoothing mode, and the contour the backend traces with it. The vertices are pinned on the
 * 1/decimation pixel grid, which is where a Zstd-encoded set already sits and where a plain float32
 * set lands once rounded the same way, so one table covers both encodings.
 */
interface ContourCase {
    setContour: CARTA.ISetContourParameters;
    vertices: number[][];
}

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    contourCases: ContourCase[];
    channel: number;
    stokes: number;
}

const imageBounds: CARTA.IImageBounds = { xMin: 0, xMax: 21, yMin: 0, yMax: 21 };
const decimationFactor = 4;

function setContourParameters(
    levels: number[],
    smoothingMode: CARTA.SmoothingMode,
    smoothingFactor: number
): CARTA.ISetContourParameters {
    return {
        fileId: 0,
        referenceFileId: 0,
        imageBounds: imageBounds,
        levels: levels,
        smoothingMode: smoothingMode,
        smoothingFactor: smoothingFactor,
        decimationFactor: decimationFactor,
        compressionLevel: 8,
        contourChunkSize: 100000,
    };
}

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    openFile: {
        directory: TEST_SUBDIRECTORY,
        file: 'contour_test.miriad',
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
        point: { x: 1.0, y: 1.0 },
    },
    contourCases: [
        {
            setContour: setContourParameters([0.6], CARTA.SmoothingMode.GaussianBlur, 4),
            vertices: [
                [9.75, 9.5],
                [9.5, 9.75],
                [9.25, 10.5],
                [9.5, 11.25],
                [9.75, 11.5],
                [10.5, 11.75],
                [11.25, 11.5],
                [11.5, 11.25],
                [11.75, 10.5],
                [11.5, 9.75],
                [11.25, 9.5],
                [10.5, 9.25],
                [9.75, 9.5],
            ],
        },
        {
            // Block averaging replaces each block of 4x4 pixels with its mean before tracing, which
            // on a 21x21 image leaves the peak as a handful of blocks and the contour as a diamond.
            setContour: setContourParameters([0.6], CARTA.SmoothingMode.BlockAverage, 4),
            vertices: [
                [9, 10],
                [10, 11.25],
                [11.25, 10],
                [10, 9],
                [9, 10],
            ],
        },
        {
            setContour: setContourParameters([0.85], CARTA.SmoothingMode.NoSmoothing, 4),
            vertices: [
                [10, 9.5],
                [9.5, 10],
                [9.25, 10.5],
                [9.5, 11],
                [10, 11.5],
                [10.5, 11.75],
                [11, 11.5],
                [11.5, 11],
                [11.75, 10.5],
                [11.5, 10],
                [11, 9.5],
                [10.5, 9.25],
                [10, 9.5],
            ],
        },
    ],
    channel: 0,
    stokes: 0,
};

describe('CONTOUR_IMAGE_DATA: Testing if contour image data (vertices) are delivered correctly', () => {
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

        assertItem.contourCases.forEach((contourCase, index) => {
            const setContour = contourCase.setContour;
            describe(`SET_CONTOUR_PARAMETERS${index} with SmoothingMode:"${CARTA.SmoothingMode[setContour.smoothingMode!]}"`, () => {
                let contourImageData: CARTA.IContourImageData;
                let decoded: ReturnType<typeof decodeContourSet>;

                test(
                    `should return one CONTOUR_IMAGE_DATA with progress = 1 within ${CONTOUR_TIMEOUT} ms`,
                    async () => {
                        const contourImageDataStream = streamContourImageData(setContour.levels!.length);
                        msgController.setContourParameters(setContour);
                        const messages = await contourImageDataStream;
                        // The whole contour of a 21x21 image fits well inside one chunk
                        expect(messages.length).toEqual(1);
                        contourImageData = messages[0];
                        expect(contourImageData.progress).toEqual(1);
                        decoded = decodeContourSet(contourImageData.contourSets![0]);
                    },
                    CONTOUR_TIMEOUT
                );

                test(`CONTOUR_IMAGE_DATA should be of file ${setContour.fileId}, channel ${assertItem.channel} and stokes ${assertItem.stokes}`, () => {
                    assertContourImageDataHeader(contourImageData, {
                        fileId: setContour.fileId!,
                        referenceFileId: setContour.referenceFileId!,
                        channel: assertItem.channel,
                        stokes: assertItem.stokes,
                    });
                });

                test(`contourSets[0].level = ${setContour.levels![0]}`, () => {
                    expect(decoded.level).toEqual(setContour.levels![0]);
                });

                test(`contourSets[0].uncompressedCoordinatesSize should account for ${contourCase.vertices.length} vertices`, () => {
                    // Two coordinates per vertex, four bytes each, whichever encoding was used
                    expect(contourImageData.contourSets![0].uncompressedCoordinatesSize).toEqual(
                        contourCase.vertices.length * 8
                    );
                    expect(decoded.vertices.length).toEqual(contourCase.vertices.length * 2);
                });

                test(`the decoded vertices should trace the contour of level ${setContour.levels![0]}`, () => {
                    expect(verticesOnGrid(decoded, decimationFactor)).toEqual(contourCase.vertices);
                });

                test(`the vertices should be rounded to 1/${decimationFactor} of a pixel`, () => {
                    assertVerticesAreOnGrid(decoded);
                });

                test(`the vertices should lie inside the requested image bounds`, () => {
                    assertVerticesWithinBounds(decoded, imageBounds);
                });

                test(`contourSets[0].rawStartIndices should subdivide the vertices into polylines`, () => {
                    assertPolylineIndices(decoded);
                    // A peak in the middle of the image is enclosed by the level, so the contour is
                    // a single closed ring: one polyline whose last vertex repeats its first.
                    expect(decoded.startIndices.length).toEqual(1);
                    const onGrid = verticesOnGrid(decoded, decimationFactor);
                    expect(onGrid[onGrid.length - 1]).toEqual(onGrid[0]);
                });
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});
