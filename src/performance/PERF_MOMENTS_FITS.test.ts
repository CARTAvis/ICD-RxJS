import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.performance.openFile;
let readFileTimeout = config.performance.readFile;
let setSpectralReqTimeout = 5000;//config.timeout.region;
let momentTimeout = 400000;//config.timeout.moment;
let sleepTimeout: number = config.timeout.sleep;

interface AssertItem {
    precisionDigit: number;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    momentRequest: CARTA.IMomentRequest;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    openFile: [
       {
           directory: testSubdirectory,
           file: "S255_IR_sci.spw25.cube.I.pbcor.fits",
           hdu: "0",
           fileId: 0,
           renderMode: CARTA.RenderMode.RASTER,
       },
    ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 960, y: 960 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}]
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 0, max: 400 },
    },
};
const momentName = [
    "average", "integrated", "weighted_coord", "weighted_dispersion_coord",
    "median", "median_coord", "standard_deviation", "rms", "abs_mean_dev",
    "maximum", "maximum_coord", "minimum", "minimum_coord",
];
const intensity = [ // Testing intensity at the (5, 5) of each moment image
    0.86652, 2.27450, 302.11578, 31.72338,
    0.91866, 305.16903, 0.18203, 0.88238, 0.09988,
    0.95470, 305.16903, 0.67406, 251.49975,
];

let basepath: string;
describe("PERF_MOMENT_GENERATOR",()=>{
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile[0].directory = basepath + "/" + assertItem.openFile[0].directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`(Step 1)"${assertItem.openFile[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            // let acktemp: AckStream;
            //         test(`(Step 2)"${assertItem.openFile[key].file}" Set SET_SPECTRAL_REQUIREMENTS, the responses should arrive within ${setSpectralReqTimeout} ms`, async () => {
            //             await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            //             await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            //             acktemp = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            //             expect(acktemp.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            //             expect(acktemp.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length); //only 1 Tile returned

            //             await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
            //             await Connection.receive(CARTA.SpatialProfileData);
                        
            //             await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
            //             let temp = await Connection.streamUntil((type,data) => type == CARTA.SpectralProfileData && data.progress == 1)
            //             // let temp = await Connection.receive(CARTA.SpectralProfileData);
            //             // expect(temp.progress).toEqual(1);
            //         }, readFileTimeout);

            test(`(Step 2)"${assertItem.openFile[0].file}" Set SET_SPECTRAL_REQUIREMENTS, the responses should arrive within ${setSpectralReqTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);

                msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setSpatialRequirements(assertItem.setSpatialReq);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

                await msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
            }, setSpectralReqTimeout);

        });

        afterAll(() => msgController.closeConnection());
    });
});