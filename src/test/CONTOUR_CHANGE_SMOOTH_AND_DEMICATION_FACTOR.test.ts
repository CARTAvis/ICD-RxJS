import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let playImageTimeout: number = config.timeout.playImages;
let contourTimeout: number = config.timeout.contour;

interface ContourImageData extends CARTA.IContourImageData {
    rawCoordinatesIndex?: number[];
    rawCoordinatesArray?: number[];
}

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setContour: CARTA.ISetContourParameters[];
    contourImageData: ContourImageData[];
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "h_m51_b_s05_drz_sci.fits",
        hdu: "0",
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
        spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}]
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [0.6],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 2,
            compressionLevel: 8,
            contourChunkSize: 100000,
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [0.85],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 6,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [0.1],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 6,
            compressionLevel: 8,
            contourChunkSize: 100000,
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 2,
        },
    ],
    contourImageData: [
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.6,
                    decimationFactor: 2,
                    uncompressedCoordinatesSize: 417688,
                },
            ],
            progress: 1,
            rawCoordinatesIndex: [1000, 2000, 3000],
            rawCoordinatesArray: [247, 173, 102]
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.85,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 486624,
                },
            ],
            progress: 1,
            rawCoordinatesIndex: [1000, 2000, 3000],
            rawCoordinatesArray: [53, 37, 220],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.1,
                    decimationFactor: 6,
                    uncompressedCoordinatesSize: 724136,
                },
            ],
            progress: 1,
            rawCoordinatesIndex: [1000, 2000, 3000],
            rawCoordinatesArray: [211, 58, 171]
        },
    ],
};

describe("CONTOUR_CHANGE_SMOOTH_MODE_FACTOR: Testing Contour with different SmoothingFactor & DemicationFactor", () => {
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

    describe(`(Step 1) Initialize the open image"`, () => {
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
        }, openFileTimeout);

        test(`Initialised WCS info from frame: ADD_REQUIRED_TILES, SET_CURSOR, and SET_SPATIAL_REQUIREMENTS, then check them are all returned correctly:`, async () => {
            msgController.addRequiredTiles(assertItem.addTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);
            expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

            msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);
            expect(SpatialProfileDataResponse1[0].x).toEqual(assertItem.setCursor.point.x);
            expect(SpatialProfileDataResponse1[0].y).toEqual(assertItem.setCursor.point.y);

            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);
            expect(SpatialProfileDataResponse2[0].x).toEqual(assertItem.setCursor.point.x);
            expect(SpatialProfileDataResponse2[0].y).toEqual(assertItem.setCursor.point.y);
        }, playImageTimeout);

        describe(`(Contour Tests)`, () => {
            assertItem.setContour.map((contour, index) => {
                let ContourImageDataArray = [];
                let ContourImageData : any;
                let ContourImageDataProgress1: any;
                test(`(Case ${index+2}: Set Smoothing factor of ${contour.smoothingFactor} & Decimation factor of ${contour.decimationFactor}):t`, async () => {
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
                    ContourImageDataProgress1 = ContourImageData.filter(data => data.progress == 1);
                }, contourTimeout);

                test(`Case ${index+2}: fileId = ${contour.fileId}`, () => {
                    expect(ContourImageDataProgress1[0].fileId).toEqual(contour.fileId);
                });

                test(`Case ${index+2}: referenceFileId = ${contour.referenceFileId}`, () => {
                    expect(ContourImageDataProgress1[0].referenceFileId).toEqual(contour.referenceFileId);
                });

                test(`Case ${index+2}: progress = 1`, () => {
                    expect(ContourImageDataProgress1[0].progress).toEqual(1);
                });

                test(`Case ${index+2}: len(contourSet) = 1`, () => {
                    expect(ContourImageDataProgress1[0].contourSets.length).toEqual(1);
                });

                test(`Case ${index+2}: contourSets[0].level = ${assertItem.contourImageData[index].contourSets[0].level}`, () => {
                    expect(ContourImageDataProgress1[0].contourSets[0].level).toEqual(assertItem.contourImageData[index].contourSets[0].level);
                });

                test(`Case ${index+2}: contourSets[0].decimationFactor = ${assertItem.contourImageData[index].contourSets[0].decimationFactor}`, () => {
                    expect(ContourImageDataProgress1[0].contourSets[0].decimationFactor).toEqual(assertItem.contourImageData[index].contourSets[0].decimationFactor);
                });

                test(`Case ${index+2}: contourSets[0].uncompressedCoordinatesSize = ${assertItem.contourImageData[index].contourSets[0].uncompressedCoordinatesSize}`, () => {
                    expect(ContourImageDataProgress1[0].contourSets[0].uncompressedCoordinatesSize).toEqual(assertItem.contourImageData[index].contourSets[0].uncompressedCoordinatesSize);
                });

                test(`Case ${index+2}: Check rawCoordinates[index] value`, () => {
                    assertItem.contourImageData[index].rawCoordinatesIndex.map((input, idx) => {
                        expect(ContourImageDataProgress1[0].contourSets[0].rawCoordinates[input]).toEqual(assertItem.contourImageData[index].rawCoordinatesArray[idx]);
                    })
                });
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});