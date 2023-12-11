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
        file: "contour_test.miriad",
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
            levels: [0.6],
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
            levels: [0.6],
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
            levels: [0.85],
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
                    level: 0.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 104,
                    rawCoordinates: new Uint8Array([40, 181,  47, 253,  32, 104, 245,   1,   0, 196,   2,  39,
                    38, 255,   1,   0,   0, 255,   0, 255,   3,   1,   3,   0,
                    0,   1,   1,   3,   1,   0,   3, 255,   1, 255,   0,   1,
                    253, 255, 253,   0, 255, 255, 255, 255, 255, 253, 255, 253,
                    255, 255, 255,   1,   0,   0,   0,   6,  32,  16, 218, 225,
                    112,  50, 225,  25,  13, 141, 137,  77,  38,  38,  23]),
                },
            ],
            progress: 1,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 40,
                    rawCoordinates: new Uint8Array([40, 181,  47, 253,  32,  40, 237,   0,   0, 168,
                    36,  40,   4,   5,   0,   5, 251, 251, 252,   0,
                    255, 255, 255, 252, 255, 255, 255,   4,   0,   0,
                    0,   2,   0,  59, 194,  13, 160,   5]),
                },
            ],
            progress: 1,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.85,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 104,
                    rawCoordinates: new Uint8Array([40, 181,  47, 253,  32, 104, 253,   1,   0, 212,   2,  40,
                    38, 254,   2,   0,   0, 255,   0, 255,   2,   1,   2,   0,
                    0,   2,   2,   2,   1,   0,   2, 255,   2, 254,   0, 255,
                    1, 254, 255, 254,   0, 255, 255, 255, 254, 254, 254, 255,
                    254, 255, 255, 255,   1,   0,   0,   0,   6,  32,  16, 218,
                    225, 112,  50, 225, 237,   2, 141, 137,  77,  38,  38,  23]),
                },
            ],
            progress: 1,
        },
    ],
};

describe("CONTOUR_IMAGE_DATA: Testing if contour image data (vertices) are delivered correctly", () => {
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