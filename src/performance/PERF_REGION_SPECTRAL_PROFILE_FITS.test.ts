import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let readRegionTimeout: number = config.timeout.region;
let spectralProfileTimeout: number = 120000;

interface AssertItem {
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setRegion: CARTA.ISetRegion[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
};

let assertItem: AssertItem = {
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_B",
            file: "cube_B_01600_z01000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}],
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                rotation: 0,
                regionType: 3,

            },
        },
    ],
    setSpectralRequirements: [
        {
            spectralProfiles: [{ coordinate: "z", statsTypes: [4] },],
            regionId: 1,
            fileId: 0,
        },
    ],
}

let basepath: string;
describe("PERF_LOAD_IMAGE",()=>{
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
            test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`(Step 1)"${assertItem.fileOpen[0].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.initTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

                msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.initTilesReq.tiles.length + 2);
            }, openFileTimeout);

            test(`(Step 2)"${assertItem.fileOpen[0].file}" SET_REGION_ACK should arrive within ${readRegionTimeout} ms`, async () => {
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            }, readRegionTimeout);

            test(`(Step 3)"${assertItem.fileOpen[0].file}" SPECTRAL_PROFILE_DATA stream should arrive within ${spectralProfileTimeout} ms`, async () => {
                await msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
                let SpectralProfileDataStreamPromise = new Promise((resolve) => {
                    msgController.spectralProfileStream.subscribe({
                        next: (data) => {
                            if (data.progress === 1) {
                                resolve(data)
                            }
                        }
                    })
                })
                let SpectralProfileDataResponse = await SpectralProfileDataStreamPromise as CARTA.SpectralProfileData;
                expect(SpectralProfileDataResponse.progress).toEqual(1);
            }, spectralProfileTimeout);

        });

        afterAll(() => msgController.closeConnection());
    });
});