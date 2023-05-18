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
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest[];
    imageDataIndex: number[];
    imageData1: number[];
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
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            hdu: "0",
            fileId: 2,
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
            fileId: -1000,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16777217],
        },
        {
            fileId: 2,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: -3000,
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
        {
            fileId: 2,
            point: { x: 1, y: 1 },
        },
        {
            fileId: -1000,
            point: { x: 177, y: 79 },
        },
        {
            fileId: -3000,
            point: { x: 177, y: 79 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
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
        {
            fileId: 2,
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
            fileId:2,
            regionId:2,
            width:3,
        },
    ],
    imageDataIndex: [0,2500,5000,7500,10000,15000,20000,25000],
    imageData1: [241,125,53,100,216,50,129,121],
    imageDataSequence1: [83,243,72,117,76,88,203,166,92,176,89],
    imageData2: [241,165,145,83,25,175,7,188],
    imageDataSequence2: [105,233,60,28,2,164,208,104,130,43,234],
};

let basepath: string;
describe("PV_GENERATOR_HDF5_COMPARED_FITS:Testing PV generator with hdf5 file and comparing hdf5 file result to fits file.", () => {
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

        describe(`Go to "${assertItem.filelist.directory}" folder and open "${assertItem.openFile[0].file}`, () => {
            test(`(step 1): Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[0].file);
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
                expect(PVresponse.success).toBe(true);
                expect(regionHistogramDataResponse.length).toBe(1);
            },PVTimeout);

            test(`(Step 6 & 7): request 2 tiles after PV response`, async()=>{
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
                    // for (let i=0; i<assertItem.imageData1.length; i++) {
                    //     expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData1[i]);
                    // }
                    // for (let i = 0; i <= 10; i++) {
                    //     expect(Tile1.tiles[0].imageData[i+18800]).toEqual(assertItem.imageDataSequence1[i]);
                    // }
    
                    expect(Tile2.tiles[0].layer).toEqual(1);
                    expect(Tile2.tiles[0].width).toEqual(256);
                    expect(Tile2.tiles[0].height).toEqual(250);
                    // for (let i=0; i<assertItem.imageData2.length; i++) {
                    //     expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData2[i]);
                    // }
                    // for (let i = 0; i <= 10; i++) {
                    //     expect(Tile2.tiles[0].imageData[i+35500]).toEqual(assertItem.imageDataSequence2[i]);
                    // }
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

        describe(`Go to "${assertItem.filelist.directory}" folder and open "${assertItem.openFile[1].file}"`, () => {
            test(`(step 8): Open File`,async () => {
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[1]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[1].file)
                expect(RegionHistogramData[0].fileId).toEqual(2);
            }, readTimeout);

            test(`(step 9): set cursor and add required tiles`, async()=>{
                msgController.setCursor(assertItem.setCursor[2].fileId, assertItem.setCursor[2].point.x, assertItem.setCursor[2].point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.addRequiredTiles(assertItem.addTilesReq[2]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[2].tiles.length + 2);
            });

            test(`(Step 10): set SET_REGION`,async()=>{
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[1].fileId, assertItem.setRegion[1].regionId, assertItem.setRegion[1].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(2);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            let regionHistogramData = [];
            test(`(Step 11): PV Request`, async()=>{
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest[1]);
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                expect(PVresponse.success).toBe(true);
                expect(regionHistogramDataResponse.length).toBe(1);
            },PVTimeout);

            test(`(Step 12): request 2 tiles after PV response`, async()=>{
                msgController.addRequiredTiles(assertItem.addTilesReq[3]);
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

            test(`(Step 13): set SET_REGION`,async()=>{
                msgController.setCursor(assertItem.setCursor[3].fileId, assertItem.setCursor[3].point.x, assertItem.setCursor[3].point.y);
                let hdf5PVCursorValue = await Stream(CARTA.SpatialProfileData, 1);
                msgController.setCursor(assertItem.setCursor[4].fileId, assertItem.setCursor[4].point.x, assertItem.setCursor[4].point.y);
                let fitsPVCursorValue = await Stream(CARTA.SpatialProfileData, 1);
                expect(hdf5PVCursorValue.value).toEqual(fitsPVCursorValue.value)
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});