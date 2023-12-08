import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let contourTimeout: number = config.timeout.contour;
let messageTimeout: number = config.timeout.messageEvent;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters;
    contourImageData: CARTA.IContourImageData;
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile: 
    {
        directory: testSubdirectory,
        file: "h_m51_b_s05_drz_sci.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setCursor: 
    {
        fileId: 0,
        point: { x: 4000, y: 2000 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}]
        },
    },
    setContour: 
    {
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
    contourImageData: 
    {
        progress: 1,
    },
};

describe("CONTOUR_DATA_STREAM: Testing contour data stream when there are a lot of vertices", () => {
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
        test(`(Step 1)"${assertItem.openFile.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            msgController.closeFile(-1);
            assertItem.openFile.directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);

            msgController.addRequiredTiles(assertItem.addTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);
            expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

            msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);
            expect(SpatialProfileDataResponse1[0].x).toEqual(assertItem.setCursor.point.x);
            expect(SpatialProfileDataResponse1[0].y).toEqual(assertItem.setCursor.point.y);
        });
        
        describe(`SET_CONTOUR_PARAMETERS with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour.smoothingMode]}"`, () => {
            let ContourImageDataArray = [];
            let contourCount = 0
            test(`should return CONTOUR_IMAGE_DATA x${assertItem.setContour.levels.length} with progress = ${assertItem.contourImageData.progress} in the end`, async () => {
                msgController.setContourParameters(assertItem.setContour);
                let ContourImageDataPromise = new Promise((resolve)=>{
                    msgController.contourStream.subscribe({
                        next: (data) => {
                            ContourImageDataArray.push(data)
                            if (data.progress === 1) {
                                contourCount += 1
                                if (contourCount === 3) {
                                    resolve(ContourImageDataArray)
                                }
                            }
                        }
                    });
                });

                let ContourImageDataResponse = await ContourImageDataPromise as CARTA.ContourImageData[];
                let ContourImageDataProgress1 = ContourImageDataResponse.filter(data => data.progress == assertItem.contourImageData.progress);
                expect(ContourImageDataProgress1.length).toEqual(assertItem.setContour.levels.length);
                ContourImageDataProgress1.map(ContourImageData => {
                    expect(assertItem.setContour.levels).toContain(ContourImageData.contourSets[0].level)
                })
            }, contourTimeout * assertItem.setContour.levels.length);

            test(`There is no receiving message within ${messageTimeout} ms`, done => {
                let receiveNumberCurrent = msgController.messageReceiving();
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter)
                    done();
                }, messageTimeout)
            })
        });
    });

    afterAll(() => msgController.closeConnection());
});