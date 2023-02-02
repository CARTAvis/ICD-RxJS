import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let largeImageTimeout = config.timeout.readLargeImage;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile: [
        {
            directory:  testSubdirectory,
            file: "S255_IR_sci.spw29.cube.I.pbcor.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "S255_IR_sci.spw25.cube.I.pbcor.fits",
            hdu: "0",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addRequiredTiles: [
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
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1,
            point: { x: 1, y: 1 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
        },
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 630.0, y: 1060.0 }, { x: 600.0, y: 890.0 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 1,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 630.0, y: 1060.0 }, { x: 600.0, y: 890.0 }],
                rotation: 0.0,
            }
        },
    ],
    regionAck:
    {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [],
        },
        {
            fileId: 1,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
    ],
};

let basepath: string;
describe("[Case 1] Request SPECTRAL_REQUIREMENTS and then CLOSE_FILE when data is still streaming :", () => {
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
            assertItem.filelist.directory = basepath + "/" + assertItem.filelist.directory;
        });

        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[0].file);
        }, openFileTimeout);

        test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[0]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[0].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        }, readFileTimeout);

        let SpectralProfileDataTemp = [];
        let ReceiveProgress: number;
        test(`(Step 3) Set REGION & SPECTRAL_PROFILE streaming, once progress>0.3 then CLOSE_FILE & Check whether the backend is alive:`, async() => {
            // Set REGION
            let SetRegionAckTemp = await msgController.setRegion(assertItem.setRegion[0].fileId,assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
            expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck.regionId);
            expect(SetRegionAckTemp.success).toEqual(assertItem.regionAck.success);

            //Set SPECTRAL_PROFILE streaming
            msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
            let spectralProfileDataPromise = new Promise((resolve)=>{
                msgController.spectralProfileStream.subscribe({
                    next: (data) => {
                        SpectralProfileDataTemp.push(data)
                        ReceiveProgress = data.progress;
                        if (ReceiveProgress > 0.3) {
                            resolve(SpectralProfileDataTemp)
                        }
                    },
                })
            }) 
            let spectralProfileDataResponse = await spectralProfileDataPromise;
            for (let i = 0; i < spectralProfileDataResponse.length; i++) {
                console.log('' + assertItem.openFile[0].file + ' SPECTRAL_PROFILE progress :', spectralProfileDataResponse[i].progress);
            }

            //Once progress>0.3, then CLOSE_FILE
            msgController.closeFile(0);

            //Check whether the backend ist alive?
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");

        }, largeImageTimeout)

        afterAll(() => msgController.closeConnection());
    });
})


describe("[Case 2] Request SPECTRAL_REQUIREMENTS of TWO images and then CLOSE_FILE when the SECOND data is still streaming :", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
            
        }, connectTimeout);

        checkConnection();
        test(`(Step 1) IMAGE 1 : OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[0].file);
        }, openFileTimeout);

        test(`(Step 2) IMAGE 1 : return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[0]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[0].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        }, readFileTimeout);

        test(`(Step 3) IMAGE 2 : OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            msgController.closeFile(1);
            let OpenFileResponse = await msgController.loadFile(assertItem.openFile[1]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[1].file);
        }, openFileTimeout);

        test(`(Step 4) IMAGE 2 : return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[1]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[1].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        }, readFileTimeout);

        let SetRegionAckTemp: CARTA.SetRegionAck;
        let SpectralProfileDataTemp1 = [];
        let ReceiveProgress1: number;
        let SpectralProfileDataTemp2 = [];
        let ReceiveProgress2: number;
        test(`(Step 5) Set REGION & SPECTRAL_PROFILE streaming, once progress1>0.3 -> progress2>0.3 -> CLOSE_FILE two images`, async() => {
            // Set REGION
            let SetRegionAckTemp = await msgController.setRegion(assertItem.setRegion[0].fileId,assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
            expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck.regionId);
            expect(SetRegionAckTemp.success).toEqual(assertItem.regionAck.success);

            //Set 1st image SPECTRAL_PROFILE streaming
            msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
            let spectralProfileDataPromise1 = new Promise((resolve)=>{
                msgController.spectralProfileStream.subscribe({
                    next: (data) => {
                        SpectralProfileDataTemp1.push(data)
                        ReceiveProgress1 = data.progress;
                        if (ReceiveProgress1 > 0.3) {
                            resolve(SpectralProfileDataTemp1)
                        }
                    },
                })
            }) 
            let spectralProfileDataResponse1 = await spectralProfileDataPromise1;
            for (let i = 0; i < spectralProfileDataResponse1.length; i++) {
                console.log('(Case 2) 1st image:' + assertItem.openFile[0].file + ' SPECTRAL_PROFILE progress :', spectralProfileDataResponse1[i].progress);
            }

            msgController.setSpectralRequirements(assertItem.setSpectralRequirements[1]);

            // Set  2nd image SPECTRAL_PROFILE streaming
            msgController.setSpectralRequirements(assertItem.setSpectralRequirements[2]);
            let spectralProfileDataPromise2 = new Promise((resolve)=>{
                msgController.spectralProfileStream.subscribe({
                    next: (data) => {
                        SpectralProfileDataTemp2.push(data)
                        ReceiveProgress2 = data.progress;
                        if (ReceiveProgress2 > 0.3) {
                            resolve(SpectralProfileDataTemp2)
                        }
                    },
                })
            }) 
            let spectralProfileDataResponse2 = await spectralProfileDataPromise2;
            for (let i = 0; i < spectralProfileDataResponse2.length; i++) {
                console.log('(Case 2) 2nd image:' + assertItem.openFile[1].file + ' SPECTRAL_PROFILE progress :', spectralProfileDataResponse2[i].progress);
            }

            //Once ReceiveProgress2>0.3, then CLOSE_FILE to 1st & 2nd image
            msgController.closeFile(0);
            msgController.closeFile(1);
            
        }, largeImageTimeout)

        test(`(Step 6) check there is no receiving message`, done => {
            msgController.closeFile(0);

            let receiveNumberCurrent = msgController.messageReceiving();
            setTimeout(() => {
                let receiveNumberLatter = msgController.messageReceiving();
                expect(receiveNumberCurrent).toEqual(receiveNumberLatter)
                done();
            }, 1000)
        })

        test(`(Step 7) the backend is still alive`, async () => {
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        });

        afterAll(() => msgController.closeConnection());
    });
})
