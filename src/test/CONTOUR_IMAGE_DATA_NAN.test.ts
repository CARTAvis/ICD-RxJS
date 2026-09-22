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
 * One smoothing mode, and the contour the backend traces with it across an image whose upper right
 * half is NaN. The vertices are pinned on the 1/decimation pixel grid, which is where a Zstd-encoded
 * set already sits and where a plain float32 set lands once rounded the same way, so one table
 * covers both encodings.
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
    smoothingMode: CARTA.SmoothingMode,
    smoothingFactor: number
): CARTA.ISetContourParameters {
    return {
        fileId: 0,
        referenceFileId: 0,
        imageBounds: imageBounds,
        levels: [5.6],
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
        file: 'contour_test_nan.image',
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
            setContour: setContourParameters(CARTA.SmoothingMode.GaussianBlur, 4),
            vertices: [
                [15.5, 5],
                [15.25, 5.5],
                [14.5, 6.25],
                [14.25, 6.5],
                [13.75, 7.5],
                [13.5, 8],
                [13.5, 8.5],
                [13.5, 9.5],
                [13.5, 10.5],
                [12.5, 11.5],
                [12.5, 11.5],
                [12.5, 12.5],
                [12.5, 13.5],
                [12.5, 14.5],
                [11.5, 15.5],
                [11.5, 15.5],
                [10.5, 16.5],
                [9.5, 16.5],
                [8.5, 16.5],
                [7.5, 16.5],
                [6.5, 16.5],
                [6.25, 16.5],
                [5.5, 17],
                [4.5, 17.5],
                [4.5, 17.5],
                [3.5, 18.5],
            ],
        },
        {
            setContour: setContourParameters(CARTA.SmoothingMode.BlockAverage, 4),
            vertices: [
                [18, 2.5],
                [15, 6],
                [14, 6.75],
                [13, 10],
                [10, 12.25],
                [7.75, 14],
                [6, 17.25],
                [3.75, 18],
                [2, 20.5],
            ],
        },
        {
            setContour: setContourParameters(CARTA.SmoothingMode.NoSmoothing, 4),
            vertices: [
                [18.5, 1.5],
                [18.5, 1.5],
                [17.5, 2.5],
                [17.5, 2.5],
                [17, 3.5],
                [16.5, 4],
                [16, 4.5],
                [15.5, 5.25],
                [14.5, 5.5],
                [14.5, 5.5],
                [13.5, 6.5],
                [13.5, 6.5],
                [13.5, 7.5],
                [13.5, 8.5],
                [13.5, 9.5],
                [13.5, 10.5],
                [12.5, 11.5],
                [12.5, 11.5],
                [12.5, 12.5],
                [12.5, 13.5],
                [12.5, 14.5],
                [11.5, 15.5],
                [11.5, 15.5],
                [10.5, 16.5],
                [9.5, 16.5],
                [8.5, 16.5],
                [7.5, 16.5],
                [6.5, 16.5],
                [5.5, 16.25],
                [5.25, 16.5],
                [4.5, 17.5],
                [4.5, 17.5],
                [3.5, 18.5],
                [3.5, 18.5],
                [2.5, 19.5],
                [1.5, 19.5],
                [1.5, 19.5],
                [0.5, 20.5],
            ],
        },
    ],
    channel: 0,
    stokes: 0,
};

describe('CONTOUR_IMAGE_DATA_NAN: Testing if contour image data (vertices) are delivered correctly if NaN pixels are present', () => {
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

                /**
                 * The point of the test: a NaN pixel is not a value the level can be compared
                 * against, so no vertex may be placed on one or be NaN itself. TraceSegment treats a
                 * NaN as below the level, which ends the polyline at the edge of the NaN region
                 * rather than running into it.
                 */
                test(`no vertex should be NaN, and all of them should lie inside the requested image bounds`, () => {
                    assertVerticesWithinBounds(decoded, imageBounds);
                });

                test(`contourSets[0].rawStartIndices should subdivide the vertices into polylines`, () => {
                    assertPolylineIndices(decoded);
                    // The NaN region cuts the level off at the image edge, so the contour is one open
                    // polyline rather than the closed ring of CONTOUR_IMAGE_DATA.
                    expect(decoded.startIndices.length).toEqual(1);
                    const onGrid = verticesOnGrid(decoded, decimationFactor);
                    expect(onGrid[onGrid.length - 1]).not.toEqual(onGrid[0]);
                });
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});
