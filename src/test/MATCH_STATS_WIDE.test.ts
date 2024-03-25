import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spectralProfile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor[];
    setRegion: CARTA.ISetRegion[];
    setStatsRequirements: CARTA.ISetStatsRequirements[][];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "casa_wideField.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "casa_wideField.image",
            fileId: 101,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: [
        {
            fileId: 100,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
        },
    ],
    setRegion: [
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 400, y: 1800 }, { x: 800, y: 800 }],
            },
        },
        {
            fileId: 100,
            regionId: 2,
            regionInfo: {
                regionType: 3,
                rotation: 45,
                controlPoints: [{ x: 1800, y: 800 }, { x: 1000, y: 1000 }],
            },
        },
        {
            fileId: 100,
            regionId: 3,
            regionInfo: {
                regionType: 4,
                rotation: 22,
                controlPoints: [{ x: 1800, y: 1300 }, { x: 230, y: 300 }],
            },
        },
        {
            fileId: 100,
            regionId: 4,
            regionInfo: {
                regionType: 6,
                controlPoints: [{ x: 3300, y: 1300 }, { x: 3400, y: 120 }, { x: 2200, y: 100 }],
            },
        },
    ],
    setStatsRequirements: [
        [
            {
                fileId: 100,
                regionId: 1,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 2,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 3,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 4,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
        [
            {
                fileId: 101,
                regionId: 1,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 2,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 3,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 4,
                statsConfigs: [ {coordinate: "z", statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9]}],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
    ]
};

let basepath: string;
describe("MATCH_STATS_WIDE: Testing region stats with spatially and spectrally matched wide field images", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let i = 0; i < assertItem.openFile.length; i++) {
                assertItem.openFile[i].directory = basepath + "/" + assertItem.openFile[i].directory;
            }
        });

        describe(`Preparation`, () => {
            test(`(step 1): Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[0].file);
            });

            // test(`(step 2): set cursor and add required tiles`, async () => {
            //     msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            //     let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            //     msgController.addRequiredTiles(assertItem.addTilesReq[0]);
            //     let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);
            // });

            // test(`(step 3): set SET_SPATIAL_REQUIREMENTS`, async()=>{
            //     msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            //     let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
            // });

            // test(`(Step 4): set SET_REGION`,async()=>{
            //     let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
            //     expect(setRegionAckResponse.regionId).toEqual(1);
            //     expect(setRegionAckResponse.success).toEqual(true);
            // });

        });
        afterAll(() => msgController.closeConnection());
    });
});