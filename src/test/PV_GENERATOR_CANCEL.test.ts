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
    setPVRequest: CARTA.IPvRequest;
    imageDataIndex: number[];
    imageData1: number[];
    imageDataSequence1: number[];
    imageData2: number[];
    imageDataSequence2: number[];
    stopPV: CARTA.IStopPvCalc;
    pvCancelMessage: string;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
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
            tiles: [16777216, 16777217],
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
                controlPoints: [{ x: 79, y: 77 }, { x: 362, y: 360 }],
                rotation: 135,
            }
        },
    ],
    setPVRequest: {
        fileId:0,
        regionId:1,
        width:3,
    },
    imageDataIndex: [0,2500,5000,7500,10000,15000,20000,25000],
    imageData1: [241,125,53,100,216,50,129,121],
    imageDataSequence1: [83,243,72,117,76,88,203,166,92,176,89],
    imageData2: [241,165,145,83,25,175,7,188],
    imageDataSequence2: [105,233,60,28,2,164,208,104,130,43,234],    
    stopPV: {
        fileId: 0
    },
    pvCancelMessage: "PV image generator cancelled"
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('sleep!') });
}

let basepath: string;
describe("PV_GENERATOR_FITS:Testing PV generator with fits file.", () => {
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

            let pvProgressArray = [];
            let pvProgressReponse : any;
            let pvResponse : any;
            let count = 0;
            test(`(Step 5): PV Request, halt PV when received 3 pvProgress Stream and check cancel`, async()=>{
                let pvProgressPromise = new Promise((resolve)=>{
                    msgController.pvProgressStream.subscribe({
                        next: (data) => {
                            count++;
                            console.log('request ' + assertItem.openFile.file + ' PV response progress :', data.progress);
                            pvProgressArray.push(data)
                            if (count == 3) {
                                msgController.cancelRequestingPV(assertItem.setPVRequest.fileId);
                                resolve(pvProgressArray);
                            }
                        }
                    })
                });
                try {
                    pvResponse = await msgController.requestPV(assertItem.setPVRequest);
                } catch (err) {
                    expect(err).toContain(assertItem.pvCancelMessage);
                } 
                pvProgressReponse = await pvProgressPromise;
            },PVTimeout);

            let regionHistogramData = [];
            test(`(Step 6): Request PV Request again`, async()=>{
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                await sleep(5000);
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest);
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                expect(PVresponse.success).toBe(true);
                expect(regionHistogramDataResponse.length).toBe(1);
            }, PVTimeout);

            test(`(Step 7 & 8): request 2 tiles after PV response`, async()=>{
                msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let RasterTileDataResponse2 = await Stream(CARTA.RasterTileData, assertItem.addTilesReq[1].tiles.length + 2);
                let Tile1 = RasterTileDataResponse2[1];
                let Tile2 = RasterTileDataResponse2[2];

                if (Tile1.tiles[0].width === 145) {
                    expect(Tile1.tiles[0].layer).toEqual(1);
                    expect(Tile1.tiles[0].width).toEqual(145);
                    expect(Tile1.tiles[0].x).toEqual(1);
                    for (let i=0; i<assertItem.imageData1.length; i++) {
                        expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData1[i]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        expect(Tile1.tiles[0].imageData[i+18800]).toEqual(assertItem.imageDataSequence1[i]);
                    }
    
                    expect(Tile2.tiles[0].layer).toEqual(1);
                    expect(Tile2.tiles[0].width).toEqual(256);
                    expect(Tile2.tiles[0].height).toEqual(250);
                    for (let i=0; i<assertItem.imageData2.length; i++) {
                        expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData2[i]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        expect(Tile2.tiles[0].imageData[i+35500]).toEqual(assertItem.imageDataSequence2[i]);
                    }
                } else if (Tile1.tiles[0].width === 256) {
                    expect(Tile2.tiles[0].layer).toEqual(1);
                    expect(Tile2.tiles[0].width).toEqual(145);
                    expect(Tile2.tiles[0].x).toEqual(1);
                    for (let i=0; i<assertItem.imageData2.length; i++) {
                        expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData1[i]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        expect(Tile2.tiles[0].imageData[i+18800]).toEqual(assertItem.imageDataSequence1[i]);
                    }
    
                    expect(Tile1.tiles[0].layer).toEqual(1);
                    expect(Tile1.tiles[0].width).toEqual(256);
                    expect(Tile1.tiles[0].height).toEqual(250);
                    for (let i=0; i<assertItem.imageData1.length; i++) {
                        expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData2[i]);
                    }
                    for (let i = 0; i <= 10; i++) {
                        expect(Tile1.tiles[0].imageData[i+35500]).toEqual(assertItem.imageDataSequence2[i]);
                    }
                }
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});