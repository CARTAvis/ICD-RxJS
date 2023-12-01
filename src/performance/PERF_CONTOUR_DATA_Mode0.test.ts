import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playContourTimeout: number = config.performance.playContour;

interface AssertItem {
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    initContour: CARTA.ISetContourParameters;
    setContour: CARTA.ISetContourParameters[];
};

let assertItem: AssertItem = {
    fileOpen:
        [
            {
                directory: testSubdirectory,
                file: "h_m51_b_s05_drz_sci.fits",
                hdu: "0",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    initContour:{
        fileId:0,
        referenceFileId:0,
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 0,
            smoothingFactor: 4,
            levels: [0.1, 0.36, 0.72, 1.09, 1.46],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        }
    ],
};

let basepath: string;
describe("PERF_CONTOUR_DATA",()=>{
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.fileOpen[0].directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`(Step 1) smoothingMode of ${assertItem.setContour[0].smoothingMode} OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`(Step 1) smoothingMode of ${assertItem.setContour[0].smoothingMode} SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.initTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

                msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.initTilesReq.tiles.length + 2);
            }, openFileTimeout);

            test(`(Step 2) smoothingMode of ${assertItem.setContour[0].smoothingMode} ContourImageData responses should arrive within ${playContourTimeout} ms`, async () => {
                msgController.setContourParameters(assertItem.initContour);
                msgController.setContourParameters(assertItem.setContour[0]);

                let ContourDataArray = [];
                let ContourDataResponse: any;
                let count = 0;

                let ContourPromise = new Promise((resolve)=>{
                    msgController.contourStream.subscribe({
                        next: (data) => {
                            ContourDataArray.push(data)
                            if (data.progress === 1) {
                                count = count + 1
                                if (count === assertItem.setContour[0].levels.length) {
                                    resolve(ContourDataArray)
                                }
                            }
                        }
                    });
                });

                ContourDataResponse = await ContourPromise;
                ContourDataResponse.map((data) => {
                    if (data.progress == 1) {
                        expect(assertItem.setContour[0].levels).toContain(data.contourSets[0].level)
                    }
                })
            }, playContourTimeout)
        });

        afterAll(() => msgController.closeConnection());
    });
});