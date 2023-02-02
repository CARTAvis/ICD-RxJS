import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let PVTimeout: number = config.timeout.pvRequest;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "Gaussian-cutted.fits",
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
            fileId: -1000,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16777217],
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: -1000,
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
            fileId: -1000,
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
                controlPoints: [{ x: 74, y: 190 }, { x: 164, y: 190 }],
                rotation: 90,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 769, y: 190 }, { x: 859, y: 190 }],
                rotation: 90,
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
            fileId:0,
            regionId:2,
            width:3,
        }
    ],
};

let basepath: string;
describe("PV_GENERATOR_WIDE:Testing PV generator with wide (~all sky) image", () => {
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

        describe(`Preparation`, () => {
            test(`(step 1): Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            });

            test(`(step 2): set cursor and add required tiles`, async () => {
                msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);
            });

            test(`(step 3): set SET_SPATIAL_REQUIREMENTS`, async()=>{
                msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
            });

            test(`(Step 4): set SET_REGION`,async()=>{
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            let regionHistogramData = [];
            test(`(Step 5): PV Request`, async()=>{
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
                expect(regionHistogramDataResponse[0].progress).toEqual(1);
                expect(regionHistogramDataResponse[0].regionId).toEqual(-1);
                expect(PVresponse.openFileAck.fileId).toEqual(-1000);
                expect(PVresponse.openFileAck.fileInfoExtended.height).toEqual(16);
                expect(PVresponse.openFileAck.fileInfoExtended.width).toEqual(182);
                expect(PVresponse.openFileAck.fileInfo.name).toEqual("Gaussian-cutted_pv.fits");
                expect(PVresponse.success).toEqual(true);
            },PVTimeout);

            test(`(Step 6): set the second region`,async()=>{
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[1].fileId, assertItem.setRegion[1].regionId, assertItem.setRegion[1].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(2);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            test(`(Step 7): PV Request for the second region`, async()=>{
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                let finalPVResponse = await msgController.requestPV(assertItem.setPVRequest[1]);
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                expect(regionHistogramDataResponse[0].fileId).toEqual(-1000);
                expect(regionHistogramDataResponse[0].progress).toEqual(1);
                expect(regionHistogramDataResponse[0].regionId).toEqual(-1);
                expect(finalPVResponse.openFileAck.fileId).toEqual(-1000);
                expect(finalPVResponse.openFileAck.fileInfoExtended.height).toEqual(16);
                expect(finalPVResponse.openFileAck.fileInfoExtended.width).toEqual(94);
                expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("Gaussian-cutted_pv.fits");
                expect(finalPVResponse.success).toEqual(true);
            },PVTimeout);
        });
        afterAll(() => msgController.closeConnection());
    });
});