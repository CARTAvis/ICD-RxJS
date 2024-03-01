import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let PVTimeout: number = config.performance.pvTimeout;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest;
};

let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory + "/cube_B",
        file: "cube_B_09600_z00100.image",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [67108870, 67108869, 67108871, 67108868, 67108872, 67108867, 67108873, 67108866, 67108874, 67108865, 67108875, 67108864, 67108876],
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1,
            point: { x: 175, y: 125 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 3719.17546581019, y: 3663.715601206708 }, { x: 5897.900936510895, y: 5842.441071907413 }],
                rotation: 135,
            }
        },
    ],
    setPVRequest: {
        fileId:0,
        regionId:1,
        width:3,
    },
};

let basepath: string;
describe("PERF_PV",()=>{
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`(step 1): Open File`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`(step 2): set cursor and add required tiles`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);

                msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq[0].tiles.length + 2);
            }, openFileTimeout);

            test(`(step 3): set SET_SPATIAL_REQUIREMENTS`, async()=>{
                msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData, 1);
            });

            test(`(Step 4): set SET_REGION`,async()=>{
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            let regionHistogramData = [];
            let pvProgressData = [];
            test(`(Step 5): PV Response should arrived within ${PVTimeout} ms`, async()=>{
                let pvProgressPromise = new Promise((resolve)=>{
                    msgController.pvProgressStream.subscribe({
                        next: (data) => {
                            pvProgressData.push(data)
                            if (data.progress == 1) {
                                resolve(pvProgressData)
                            }
                        }
                    })
                });

                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest);
                let pvProgressResponse = await pvProgressPromise;
                expect(pvProgressResponse[pvProgressResponse.length - 1].progress).toEqual(1);
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                expect(PVresponse.success).toBe(true);
                expect(regionHistogramDataResponse.length).toBe(1);
            }, PVTimeout);

            test(`(Step 6): request ${assertItem.addTilesReq[1].tiles.length} tiles after PV response`, async()=>{
                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let TilesResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[1].tiles.length + 2);
                expect(TilesResponse.length).toEqual(assertItem.addTilesReq[1].tiles.length + 2);
            });

        });

        afterAll(() => msgController.closeConnection());
    });
});