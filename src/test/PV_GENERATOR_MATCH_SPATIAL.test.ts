import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let PVTimeout: number = config.timeout.pvRequest;
let Match2ImageTimeout: number = 30000;

interface SpatialProfileDataExtend extends CARTA.ISpatialProfileData {
    index?: number[];
    indexValue?: number[];
}

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest[];
    returnPVSpatial: SpatialProfileDataExtend;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            hdu: "0",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
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
            tiles: [0],
        },

    ],
    setSpatialReq: [
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: []
        },
        {
            fileId: 1,
            regionId: 1,
            spatialProfiles: [{coordinate:"", mip:1, width:3}]
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 79, y: 77 }, { x: 362, y: 360 }],
                rotation: 135,
            }
        },
    ],
    setPVRequest: [
        {
            fileId:0,
            regionId:1,
            width:3,
        },
        {
            fileId:1,
            regionId:1,
            width:3,
        },
    ],
    returnPVSpatial: {
        fileId:1,
        regionId:1,
        profiles: [{coordinate:"", start: 0, end: 400}],
        index: [100, 500, 1000, 1500],
        indexValue: [85, 10, 220, 106],
    }
};

let basepath: string;
describe("PV_GENERATOR_MATCH_SPATIAL:Testing PV generator with two spatially matched images.", () => {
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
            assertItem.openFile[1].directory = basepath + "/" + assertItem.openFile[1].directory;
        });

        describe(`Go to "${assertItem.filelist.directory}" folder and open "${assertItem.openFile[0].file}" & "${assertItem.openFile[1].file}"`, () => {
            test(`(step 1): Open the first image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[0].file);
                expect(RegionHistogramData[0].fileId).toEqual(0);
            });

            test(`(step 2): set cursor and add required tiles to the first image`, async()=>{
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);
            });

            test(`(step 3): Open the second image`,async () => {
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[1]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[1].file)
                expect(RegionHistogramData[0].fileId).toEqual(1);
            }, readTimeout);

            test(`(step 4): set cursor and add required tiles to the second image`, async()=>{
                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[1].tiles.length + 2);
            });

            test(`(Step 5): set SET_REGION to the first image`,async()=>{
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            test(`(step 6): Match the first image to the second image`, async()=>{
                msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
                msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
                let Response = await Stream(CARTA.SpatialProfileData,1);
                expect(Response[0].fileId).toEqual(assertItem.returnPVSpatial.fileId);
                expect(Response[0].regionId).toEqual(assertItem.returnPVSpatial.regionId);
                expect(Response[0].profiles[0].coordinate).toEqual(assertItem.returnPVSpatial.profiles[0].coordinate);
                expect(Response[0].profiles[0].start).toEqual(assertItem.returnPVSpatial.profiles[0].start);
                expect(Response[0].profiles[0].end).toEqual(assertItem.returnPVSpatial.profiles[0].end);
                assertItem.returnPVSpatial.index.map((reference, index) => {
                    expect(Response[0].profiles[0].rawValuesFp32[reference]).toEqual(assertItem.returnPVSpatial.indexValue[index]);
                })
            }, Match2ImageTimeout);

            let regionHistogramData = [];
            test(`(Step 7): 1st image PV Request`, async()=>{
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest[0]);
                let regionHistogramDataResponse = await regionHistogramDataPromise;

                expect(regionHistogramDataResponse[0].fileId).toEqual(-1000);
                expect(regionHistogramDataResponse[0].regionId).toEqual(-1);
                expect(regionHistogramDataResponse[0].progress).toEqual(1);
                expect(PVresponse.openFileAck.fileId).toEqual(-1000);
                expect(PVresponse.openFileAck.fileInfo.name).toEqual("HD163296_CO_2_1_pv.fits");
                expect(PVresponse.success).toEqual(true)
            }, PVTimeout);

            let regionHistogramData2 = [];
            test(`(Step 7): 2nd image PV Request`, async()=>{
                let regionHistogramDataPromise2 = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData2.push(data)
                            resolve(regionHistogramData2)
                        }
                    })
                });
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest[1]);
                let regionHistogramDataResponse = await regionHistogramDataPromise2;
                expect(regionHistogramDataResponse[0].fileId).toEqual(-2000);
                expect(regionHistogramDataResponse[0].regionId).toEqual(-1);
                expect(regionHistogramDataResponse[0].progress).toEqual(1);
                expect(PVresponse.openFileAck.fileId).toEqual(-2000);
                expect(PVresponse.openFileAck.fileInfo.name).toEqual("HD163296_CO_2_1_pv.image");
                expect(PVresponse.success).toEqual(true)
            }, PVTimeout);
        });

        afterAll(() => msgController.closeConnection());
    });
});