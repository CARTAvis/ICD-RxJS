import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController, ConnectionStatus } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen:
        [
            {
                directory: testSubdirectory,
                file: "M17_SWex.fits",
                hdu: "",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                hdu: "",
                fileId: 1,
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.image",
                hdu: "0",
                fileId: 2,
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
    addRequiredTiles:
        [
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
            {
                fileId: 2,
                compressionQuality: 11,
                compressionType: CARTA.CompressionType.ZFP,
                tiles: [0],
            },
        ],
    setCursor:
        [
            {
                fileId: 0,
                point: { x: 1, y: 1 },
            },
            {
                fileId: 1,
                point: { x: 1, y: 1 },
            },
            {
                fileId: 2,
                point: { x: 1, y: 1 },
            },
        ],
    setSpatialReq:
        [
            {
                fileId: 0,
                regionId: 0,
                spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}],
            },
            {
                fileId: 1,
                regionId: 0,
                spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}],
            },
            {
                fileId: 2,
                regionId: 0,
                spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}],
            },
        ],
};

let basepath: string;
describe("Test for Close one file (run1):", () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
        msgController.closeFile(-1);
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

    test(`Get basepath and modify the directory path`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
        assertItem.filelist.directory = basepath + "/" + assertItem.filelist.directory;
        for (let i = 0; i < assertItem.fileOpen.length; i++) {
            assertItem.fileOpen[i].directory = basepath + "/" + assertItem.fileOpen[i].directory;
        }
    }); 

    describe("Prepare Image 1,2,3 for Case 1: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck.success).toBe(true);
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[0]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[0].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            //RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck2 = await msgController.loadFile(assertItem.fileOpen[1]);
            let RegionHistogramData2 = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck2.success).toBe(true);
            expect(OpenAck2.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[1]);
            let RasterTileDataResponse2 = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[1].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
            let SpatialProfileDataResponse3 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse4 = await Stream(CARTA.SpatialProfileData,1);

            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse2.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck3 = await msgController.loadFile(assertItem.fileOpen[2]);
            let RegionHistogramData3 = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck3.success).toBe(true);
            expect(OpenAck3.fileInfo.name).toEqual(assertItem.fileOpen[2].file);
        }, openFileTimeout);

        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[2]);
            let RasterTileDataResponse3 = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[2].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[2].fileId, assertItem.setCursor[2].point.x, assertItem.setCursor[2].point.y);
            let SpatialProfileDataResponse5 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
            let SpatialProfileDataResponse6 = await Stream(CARTA.SpatialProfileData,1);

            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse3.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);
    });

    describe(`Case 1 (close image 2 -> close image 1 -> close image 0 ):`, () => {
        test(`(Step 1) close image 2`, async () => {
            msgController.closeFile(2);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
            let SpatialProfileDataResponse7 = await Stream(CARTA.SpatialProfileData,2);
            expect(SpatialProfileDataResponse7.length).toEqual(2);
        });

        test(`(Step 2) close image 1`, async () => {
            msgController.closeFile(1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse8 = await Stream(CARTA.SpatialProfileData,1);
            expect(SpatialProfileDataResponse8.length).toEqual(1);
        });

        test(`(Step 3) Close image 0 and the backend is still alive`, async () => {
            msgController.closeFile(0);

            //check the backend is still alive
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        })

        test(`(Step 4) There is no any ICD message returned:`, done => {
            let receiveNumberCurrent = msgController.messageReceiving();
            setTimeout(() => {
                let receiveNumberLatter = msgController.messageReceiving();
                expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 500 ms
                done();
            }, 500)
        });
    });
    afterAll(() => msgController.closeConnection());
});

describe("Test for Close one file (run2):", () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
        msgController.closeFile(-1);
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

    describe("Prepare Image 1,2,3 for Case 2: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck.success).toBe(true);
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[0]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[0].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            //RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck2 = await msgController.loadFile(assertItem.fileOpen[1]);
            let RegionHistogramData2 = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck2.success).toBe(true);
            expect(OpenAck2.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[1]);
            let RasterTileDataResponse2 = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[1].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
            let SpatialProfileDataResponse3 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse4 = await Stream(CARTA.SpatialProfileData,1);

            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse2.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck3 = await msgController.loadFile(assertItem.fileOpen[2]);
            let RegionHistogramData3 = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck3.success).toBe(true);
            expect(OpenAck3.fileInfo.name).toEqual(assertItem.fileOpen[2].file);
        }, openFileTimeout);

        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[2]);
            let RasterTileDataResponse3 = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[2].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[2].fileId, assertItem.setCursor[2].point.x, assertItem.setCursor[2].point.y);
            let SpatialProfileDataResponse5 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
            let SpatialProfileDataResponse6 = await Stream(CARTA.SpatialProfileData,1);

            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse3.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);
    });

    describe(`Case 2 (close image 0 & 1 -> close image 2):`, () => {
        test(`(Step 1) close image 0 & image 1 at once, and there is no any ICD message returned:`, done => {
            msgController.closeFile(0);
            msgController.closeFile(1);
            
            let receiveNumberCurrent = msgController.messageReceiving();
            setTimeout(() => {
                let receiveNumberLatter = msgController.messageReceiving();
                expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 500 ms
                done();
            }, 500)
        });

        test(`(Step 2) Close image 2 and the backend is still alive `, async () => {
            msgController.closeFile(2);
            
            //check the backend is still alive
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        });

        test(`(Step 3) There is no any ICD message returned:`, done => {
            let receiveNumberCurrent = msgController.messageReceiving();
            setTimeout(() => {
                let receiveNumberLatter = msgController.messageReceiving();
                expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 500 ms
                done();
            }, 500)
        });
    });
    afterAll(() => msgController.closeConnection());
});

describe("Test for Close one file (run3):", () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
        msgController.closeFile(-1);
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

    describe("Prepare Image 1,2,3 for Case 3: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await msgController.loadFile(assertItem.fileOpen[0]);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck.success).toBe(true);
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[0]);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[0].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

            //RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck2 = await msgController.loadFile(assertItem.fileOpen[1]);
            let RegionHistogramData2 = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck2.success).toBe(true);
            expect(OpenAck2.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[1]);
            let RasterTileDataResponse2 = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[1].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
            let SpatialProfileDataResponse3 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse4 = await Stream(CARTA.SpatialProfileData,1);

            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse2.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck3 = await msgController.loadFile(assertItem.fileOpen[2]);
            let RegionHistogramData3 = await Stream(CARTA.RegionHistogramData,1);
            expect(OpenAck3.success).toBe(true);
            expect(OpenAck3.fileInfo.name).toEqual(assertItem.fileOpen[2].file);
        }, openFileTimeout);

        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            msgController.addRequiredTiles(assertItem.addRequiredTiles[2]);
            let RasterTileDataResponse3 = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[2].tiles.length + 2);

            msgController.setCursor(assertItem.setCursor[2].fileId, assertItem.setCursor[2].point.x, assertItem.setCursor[2].point.y);
            let SpatialProfileDataResponse5 = await Stream(CARTA.SpatialProfileData,1);

            msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
            let SpatialProfileDataResponse6 = await Stream(CARTA.SpatialProfileData,1);

            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(RasterTileDataResponse3.length).toEqual(3); //RasterTileSync: start & end
        }, readFileTimeout);
    });

    describe(`Case 3 (close image 0, 1 & 2 together):`, () => {
        test(`(Step 1) close image 0, image 1 & image 2 together and the backend is still alive`, async () => {
            msgController.closeFile(0);
            msgController.closeFile(1);
            msgController.closeFile(2);

            //check the backend is still alive
            let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toContain("set_QA");
        });

        test(`(Step 2) There is no any ICD message returned:`, done => {
            let receiveNumberCurrent = msgController.messageReceiving();
            setTimeout(() => {
                let receiveNumberLatter = msgController.messageReceiving();
                expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 500 ms
                done();
            }, 500)
        });
    });

    afterAll(() => msgController.closeConnection());
});
