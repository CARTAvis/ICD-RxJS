import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters[];
    contourImageData: CARTA.IContourImageData[];
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "contour_test_nan.image",
        fileId: 0,
        hdu: "",
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
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: []
        },
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [5.6],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [5.6],
            smoothingMode: CARTA.SmoothingMode.BlockAverage,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [5.6],
            smoothingMode: CARTA.SmoothingMode.NoSmoothing,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
    contourImageData: [
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 5.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 208,
                    rawCoordinates: new Uint8Array([
                        40, 181,  47, 253,  32, 208,  93,   2,   0, 116,   2,  62,
                        20, 255,   2,   0,   0, 255,   0, 253,   3, 255,   1, 255,
                         0, 254,   4, 255,   2,   0,   2,   0,   4,   0,   4, 252,
                         4,   0,   0, 252,   4, 252, 255,   0, 252,   0, 255, 253,
                         2, 252,  13,   0,  85, 116,  96,  98, 228,   1, 199, 157,
                        65,  36, 196, 198,  68, 133, 192,  76,  25,  12,  69, 240,
                        16, 184, 129, 227, 244,  76,  78, 114, 187,  76,  56,  46
                    ]),
                },
            ],
            progress: 1,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 5.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 72,
                    rawCoordinates: new Uint8Array([
                        40, 181,  47, 253,  32,  72,  77,   1,   0, 232,  72,
                        10, 244,  14,   0,   0, 255,   0, 252,   3, 252,  13,
                        255,   0, 244,   9, 247,   7, 249,  13, 247,   3, 255,
                        255, 255,  10,   0,   0,   0,   4,   0, 224,  32,  51,
                        57, 201, 237,  50, 225, 184
                    ]),
                },
            ],
            progress: 1,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 5.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 304,
                    rawCoordinates: new Uint8Array([
                        40, 181,  47, 253,  96,  48,   0, 173,   2,   0, 116,   2,
                        74,   6,   0, 252,   4,   0,   0, 255,   0, 254,   4, 254,
                        2, 255,   0, 254,   2, 254,   3, 252,   1,   0,   4,   0,
                        4, 252,   4, 252,   0, 252,   0, 255, 255,   1, 255, 255,
                        255,   0, 253,  17,   0,  69,  17,  24, 130, 192,  12,  11,
                        17, 190, 119, 247, 218,  12,   2,  38, 127, 144,  50,  48,
                        56, 149,  19,  51,  29,  32, 241, 160,   1,  35,  96,  42,
                        25, 207, 228,  36, 183, 203, 110,  43,   7,  24,   2
                    ]),
                },
            ],
            progress: 1,
        },
    ],
};

describe("CONTOUR_IMAGE_DATA_NAN: Testing if contour image data (vertices) are delivered correctly if NaN pixels are present", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    test(`Get basepath`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE", 0);
        basepath = fileListResponse.directory;
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        let OpenFileResponse: CARTA.IOpenFileAck;
        let regionHistogramData = [];
        test(`(Step 1)"${assertItem.openFile.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            msgController.closeFile(-1);
            assertItem.openFile.directory = basepath + "/" + assertItem.filelist.directory;
            let regionHistogramDataPromise = new Promise((resolve)=>{
                msgController.histogramStream.subscribe({
                    next: (data) => {
                        regionHistogramData.push(data)
                        resolve(regionHistogramData)
                    }
                })
            });
            OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let RegionHistogramData = await regionHistogramDataPromise;

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);

            msgController.addRequiredTiles(assertItem.addTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);
            expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

            msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);
            expect(SpatialProfileDataResponse1[0].x).toEqual(assertItem.setCursor.point.x);
            expect(SpatialProfileDataResponse1[0].y).toEqual(assertItem.setCursor.point.y);
        }, openFileTimeout);

        assertItem.contourImageData.map((contour, index) => {
            describe(`SET_CONTOUR_PARAMETERS${index} with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour[index].smoothingMode]}"`, () => {
                let ContourImageDataArray = [];
                let ContourImageData : any;
                test(`should return CONTOUR_IMAGE_DATA x1`, async () => {
                    msgController.setContourParameters(assertItem.setContour[index]);
                    let ContourImageDataPromise = new Promise((resolve)=>{
                        msgController.contourStream.subscribe({
                            next: (data) => {
                                ContourImageDataArray.push(data)
                                if (data.progress === 1) {resolve(ContourImageDataArray)}
                            }
                        });
                    });
                    ContourImageData = await ContourImageDataPromise;
                });

                test(`fileId = ${contour.fileId}`, () => {
                    expect(ContourImageData[0].fileId).toEqual(contour.fileId);
                });

                test(`referenceFileId = ${contour.referenceFileId}`, () => {
                    expect(ContourImageData[0].referenceFileId).toEqual(contour.referenceFileId);
                });

                test(`progress = 1`, () => {
                    expect(ContourImageData[0].progress).toEqual(1);
                });

                test(`len(contourSet) = 1`, () => {
                    expect(ContourImageData[0].contourSets.length).toEqual(1);
                });

                test(`contourSets[0].level = ${contour.contourSets[0].level}`, () => {
                    expect(ContourImageData[0].contourSets[0].level).toEqual(contour.contourSets[0].level);
                });

                test(`contourSets[0].decimationFactor = ${contour.contourSets[0].decimationFactor}`, () => {
                    expect(ContourImageData[0].contourSets[0].decimationFactor).toEqual(contour.contourSets[0].decimationFactor);
                });

                test(`contourSets[0].uncompressedCoordinatesSize = ${contour.contourSets[0].uncompressedCoordinatesSize}`, () => {
                    expect(ContourImageData[0].contourSets[0].uncompressedCoordinatesSize).toEqual(contour.contourSets[0].uncompressedCoordinatesSize);
                });

                test(`number of rawCoordinates = ${contour.contourSets[0].rawCoordinates.length}`, () => {
                    expect(ContourImageData[0].contourSets[0].rawCoordinates.length).toEqual(contour.contourSets[0].rawCoordinates.length);
                });

                test(`Check rawCoordinates value`, () => {
                    for (let idx = 0; idx < contour.contourSets[0].rawCoordinates.length; idx++) {
                        expect(ContourImageData[0].contourSets[0].rawCoordinates[idx]).toEqual(contour.contourSets[0].rawCoordinates[idx]);
                    }
                });

            });
        });
    });

    afterAll(() => msgController.closeConnection());
});