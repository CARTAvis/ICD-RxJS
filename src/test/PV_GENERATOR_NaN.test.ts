import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let PVTimeout: number = config.timeout.pvRequest;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest;
    imageDataIndex2: number[];
    imageDataSequence1: number[];
    imageData2: number[];
    imageDataSequence2: number[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
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
            point: { x: 260, y: 11 },
        },
        {
            fileId: -1000,
            point: { x: 64, y: 8 },
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
                controlPoints: [{ x: -54, y: 325 }, { x: 206, y: 325 }],
                rotation: 90,
            }
        },
    ],
    setPVRequest: {
        fileId:0,
        regionId:1,
        width:3,
    },
    imageDataSequence1: [0,0,0,0,0,0,0,0],
    imageDataIndex2: [0,500,1000,1500,2000,3000],
    imageData2: [241,77,63,201,254,220],
    imageDataSequence2: [245,112,51,42,145,32,151,35,241,6,107]
};

let basepath: string;
describe("PV_GENERATOR_NaN:Testing PV generator with a region covers NaN and none pixel.", () => {
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

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            test(`(step 1): Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            }, readTimeout);

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
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest);
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                expect(PVresponse.success).toBe(true);
                expect(regionHistogramDataResponse.length).toBe(1);
            },PVTimeout);

            test(`(Step 6 & 7): request 2 tiles after PV response`, async()=>{
                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let RasterTileDataResponse2 = await Stream(CARTA.RasterTileData, assertItem.addTilesReq[1].tiles.length + 2);
                let Tile1 = RasterTileDataResponse2[1];
                let Tile2 = RasterTileDataResponse2[2];

                if (Tile1.tiles[0].width === 5) {
                    expect(Tile1.tiles[0].layer).toEqual(1);
                    expect(Tile1.tiles[0].width).toEqual(5);
                    expect(Tile1.tiles[0].height).toEqual(25);
                    expect(Tile1.tiles[0].x).toEqual(1);
                    for (let i = 0; i < assertItem.imageDataSequence1.length; i++) {
                        expect(Tile1.tiles[0].imageData[i]).toEqual(assertItem.imageDataSequence1[i]);
                    }
                
                    expect(Tile2.tiles[0].layer).toEqual(1);
                    expect(Tile2.tiles[0].width).toEqual(256);
                    expect(Tile2.tiles[0].height).toEqual(25);
                    for (let i=0; i<assertItem.imageData2.length; i++) {
                        expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex2[i]]).toEqual(assertItem.imageData2[i]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        expect(Tile2.tiles[0].imageData[i+2510]).toEqual(assertItem.imageDataSequence2[i]);
                    }
                } else if (Tile1.tiles[0].width === 256){
                    expect(Tile2.tiles[0].layer).toEqual(1);
                    expect(Tile2.tiles[0].width).toEqual(5);
                    expect(Tile2.tiles[0].height).toEqual(25);
                    expect(Tile2.tiles[0].x).toEqual(1);
                    for (let i = 0; i < assertItem.imageDataSequence1.length; i++) {
                        expect(Tile2.tiles[0].imageData[i]).toEqual(assertItem.imageDataSequence1[i]);
                    }
                
                    expect(Tile1.tiles[0].layer).toEqual(1);
                    expect(Tile1.tiles[0].width).toEqual(256);
                    expect(Tile1.tiles[0].height).toEqual(25);
                    for (let i=0; i<assertItem.imageData2.length; i++) {
                        expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex2[i]]).toEqual(assertItem.imageData2[i]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        expect(Tile1.tiles[0].imageData[i+2510]).toEqual(assertItem.imageDataSequence2[i]);
                    }
                }
            });
            test(`(step 8): set cursor and check the return value`, async()=>{
                msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);
                expect(SpatialProfileDataResponse1[0].fileId).toEqual(-1000);
                expect(SpatialProfileDataResponse1[0].value).toEqual(NaN);

                msgController.setCursor(assertItem.setCursor[2].fileId, assertItem.setCursor[2].point.x, assertItem.setCursor[2].point.y);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData, 1);
                expect(SpatialProfileDataResponse2[0].fileId).toEqual(-1000);
                expect(SpatialProfileDataResponse2[0].value).toEqual(-0.0035615740343928337);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});