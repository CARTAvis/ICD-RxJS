import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;

interface ISpatialProfileDataExt extends CARTA.ISpatialProfileData {
    value?: number,
    rawValuesFp32Length?: { x: number, y: number },
    rawValuesPoint?: {
        x: { one?: { idx: number, value: number }, two?: { idx: number, value: number}, others?: number },
        y: { one?: { idx: number, value: number }, two?: { idx: number, value: number}, others?: number },
    }
};
interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor1: CARTA.ISetCursor[];
    setCursor2: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
    spatialProfileData2: ISpatialProfileDataExt[];
    errorPoint: CARTA.ISetCursor[];
}
let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile:
    {
        directory: testSubdirectory,
        file: "qa_xyProfiler.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 51, y: 51 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x",mip:1}, {coordinate:"y",mip:1}],
    },
    setCursor1: [
        {
            fileId: 0,
            point: { x: 50.00, y: 50.00 },
        },
        {
            fileId: 0,
            point: { x: 49.50, y: 49.50 },
        },
        {
            fileId: 0,
            point: { x: 49.50, y: 50.49 },
        },
        {
            fileId: 0,
            point: { x: 50.49, y: 49.50 },
        },
        {
            fileId: 0,
            point: { x: 50.49, y: 50.49 },
        },
    ],
    setCursor2: [
        {
            fileId: 0,
            point: { x: 0.00, y: 0.00 },
        },
        {
            fileId: 0,
            point: { x: 0.00, y: 99.00 },
        },
        {
            fileId: 0,
            point: { x: 99.00, y: 0.00 },
        },
        {
            fileId: 0,
            point: { x: 99.00, y: 99.00 },
        },
    ],
    spatialProfileData: [
        {
            x: 50.0,
            y: 50.0,
            rawValuesFp32Length: { x: 400, y: 400 },
            value: 1,
            rawValuesPoint: {
                x: { one: { idx: 202, value: 128 }, two: { idx: 203, value: 63}, others: 0 },
                y: { one: { idx: 202, value: 128 }, two: { idx: 203, value: 63}, others: 0 },
            }
        },
    ],
    spatialProfileData2: [
        {
            rawValuesFp32Length: { x: 400, y: 400 },
            value: 1,
            rawValuesPoint: {
                x: { one: { idx: 2, value: 128 }, two: { idx: 3, value: 63}, others: 0 },
                y: { one: { idx: 2, value: 128 }, two: { idx: 3, value: 63}, others: 0 },
            }
        },
        {
            y: 99.0,
            rawValuesFp32Length: { x: 400, y: 400 },
            value: 0,
            rawValuesPoint: {
                x: { one: { idx: 398, value: 128 }, two: { idx: 399, value: 63}, others: 0 },
                y: { one: { idx: 2, value: 128 }, two: { idx: 3, value: 63}, others: 0 },
            }
        },
        {
            x: 99.0,
            y: 0.0,
            rawValuesFp32Length: { x: 400, y: 400 },
            value: 0,
            rawValuesPoint: {
                x: { one: { idx: 2, value: 128 }, two: { idx: 3, value: 63}, others: 0 },
                y: { one: { idx: 398, value: 128 }, two: { idx: 399, value: 63}, others: 0 },
            }
        },
        {
            x: 99.0,
            y: 99.0,
            rawValuesFp32Length: { x: 400, y: 400 },
            value: 1,
            rawValuesPoint: {
                x: { one: { idx: 398, value: 128 }, two: { idx: 399, value: 63}, others: 0 },
                y: { one: { idx: 398, value: 128 }, two: { idx: 399, value: 63}, others: 0 },
            }
        },
    ],
    errorPoint:
        [
            {
                fileId: 0,
                point: { x: 200.00, y: 200.00 },
            },
        ],
};

describe("CURSOR_SPATIAL_PROFILE: if full resolution cursor spatial profiles are delivered correctly", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    test(`Get basepath and modify the directory path`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
        assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
    });

    let regionHistogramData = [];
    test(`Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
        msgController.closeFile(-1);
        let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
        let regionHistogramDataPromise = new Promise((resolve)=>{
            msgController.histogramStream.subscribe({
                next: (data) => {
                    regionHistogramData.push(data)
                    resolve(regionHistogramData)
                }
            })
        });
        OpenFileResponse = await msgController.loadFile(assertItem.openFile);
        let RegionHistogramData = await regionHistogramDataPromise;

        expect(OpenFileResponse.success).toBe(true);
        expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
    }, openFileTimeout);

    test(`Return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
        msgController.addRequiredTiles(assertItem.initTilesReq);
        let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

        msgController.setCursor(assertItem.initSetCursor.fileId, assertItem.initSetCursor.point.x, assertItem.initSetCursor.point.y);
        let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

        msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
        let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

        expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
    }, readFileTimeout);

    assertItem.setCursor1.map((setCursor, index) => {
        describe(`set cursor on {${assertItem.setCursor1[index].point.x}, ${assertItem.setCursor1[index].point.y}}`, () => {
            let SpatialProfileDataTemp: any;
            test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                msgController.setCursor(setCursor.fileId, setCursor.point.x, setCursor.point.y);
                SpatialProfileDataTemp = await Stream(CARTA.SpatialProfileData,1);
                SpatialProfileDataTemp = SpatialProfileDataTemp[0];
            }, cursorTimeout);

            test(`SPATIAL_PROFILE_DATA.value = ${assertItem.spatialProfileData[0].value}`, () => {
                expect(SpatialProfileDataTemp.value).toEqual(assertItem.spatialProfileData[0].value);
            });

            test(`SPATIAL_PROFILE_DATA.x = ${assertItem.spatialProfileData[0].x} and SPATIAL_PROFILE_DATA.y = ${assertItem.spatialProfileData[0].y}`, () => {
                expect(SpatialProfileDataTemp.x).toEqual(assertItem.spatialProfileData[0].x);
                expect(SpatialProfileDataTemp.y).toEqual(assertItem.spatialProfileData[0].y);
            });

            test(`Length of rawValuesFp32 in x coordinate = ${assertItem.spatialProfileData[0].rawValuesFp32Length.x} and length of rawValuesFp32 in y coordinate = ${assertItem.spatialProfileData[0].rawValuesFp32Length.y}`, () => {
                expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").rawValuesFp32.length).toEqual(assertItem.spatialProfileData[0].rawValuesFp32Length.x);
                expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").rawValuesFp32.length).toEqual(assertItem.spatialProfileData[0].rawValuesFp32Length.y);
            });

            test(`Check rawValuesFp32[${assertItem.spatialProfileData[0].rawValuesPoint.x.one.idx}] and rawValuesFp32[${assertItem.spatialProfileData[0].rawValuesPoint.x.two.idx}] value in x coordinate`, () => {
                SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").rawValuesFp32.map((value, index) => {
                    if (index === assertItem.spatialProfileData[0].rawValuesPoint.x.one.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData[0].rawValuesPoint.x.one.value);
                    } else if (index === assertItem.spatialProfileData[0].rawValuesPoint.x.two.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData[0].rawValuesPoint.x.two.value);
                    } else {
                        expect(value).toEqual(assertItem.spatialProfileData[0].rawValuesPoint.x.others);
                    }
                })
            });

            test(`Check rawValuesFp32[${assertItem.spatialProfileData[0].rawValuesPoint.y.one.idx}] and rawValuesFp32[${assertItem.spatialProfileData[0].rawValuesPoint.y.two.idx}] value in y coordinate`, () => {
                SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").rawValuesFp32.map((value, index) => {
                    if (index === assertItem.spatialProfileData[0].rawValuesPoint.y.one.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData[0].rawValuesPoint.y.one.value);
                    } else if (index === assertItem.spatialProfileData[0].rawValuesPoint.y.two.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData[0].rawValuesPoint.y.two.value);
                    } else {
                        expect(value).toEqual(assertItem.spatialProfileData[0].rawValuesPoint.y.others);
                    }
                })
            });
        });
    });

    assertItem.setCursor2.map((setCursor, index) => {
        describe(`set cursor on {${assertItem.setCursor2[index].point.x}, ${assertItem.setCursor2[index].point.y}}`, () => {
            let SpatialProfileDataTemp: any;
            test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                msgController.setCursor(setCursor.fileId, setCursor.point.x, setCursor.point.y);
                SpatialProfileDataTemp = await Stream(CARTA.SpatialProfileData,1);
                SpatialProfileDataTemp = SpatialProfileDataTemp[0];
            }, cursorTimeout);

            test(`SPATIAL_PROFILE_DATA.value = ${assertItem.spatialProfileData2[index].value}`, () => {
                expect(SpatialProfileDataTemp.value).toEqual(assertItem.spatialProfileData2[index].value);
            });

            test(`Check rawValuesFp32[${assertItem.spatialProfileData2[index].rawValuesPoint.x.one.idx}] and rawValuesFp32[${assertItem.spatialProfileData2[index].rawValuesPoint.x.two.idx}] value in x coordinate`, () => {
                SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").rawValuesFp32.map((value, index2) => {
                    if (index2 === assertItem.spatialProfileData2[index].rawValuesPoint.x.one.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData2[index].rawValuesPoint.x.one.value);
                    } else if (index2 === assertItem.spatialProfileData2[index].rawValuesPoint.x.two.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData2[index].rawValuesPoint.x.two.value);
                    } else {
                        expect(value).toEqual(assertItem.spatialProfileData2[index].rawValuesPoint.x.others);
                    }
                });
            });

            test(`Check rawValuesFp32[${assertItem.spatialProfileData2[index].rawValuesPoint.y.one.idx}] and rawValuesFp32[${assertItem.spatialProfileData2[index].rawValuesPoint.y.two.idx}] value in y coordinate`, () => {
                SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").rawValuesFp32.map((value, index2) => {
                    if (index2 === assertItem.spatialProfileData2[index].rawValuesPoint.y.one.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData2[index].rawValuesPoint.y.one.value);
                    } else if (index2 === assertItem.spatialProfileData2[index].rawValuesPoint.y.two.idx) {
                        expect(value).toEqual(assertItem.spatialProfileData2[index].rawValuesPoint.y.two.value);
                    } else {
                        expect(value).toEqual(assertItem.spatialProfileData2[index].rawValuesPoint.y.others);
                    }
                });
            });

        });
    });

    assertItem.errorPoint.map((setCursor, index) => {
        describe(`set error point of cursor on {${setCursor.point.x}, ${setCursor.point.y}}`, () => {
            test(`SPATIAL_PROFILE_DATA should not return, no additional ICD message should be returned from the backend within 1000 ms`, done => {
                msgController.setCursor(setCursor.fileId, setCursor.point.x, setCursor.point.y);

                let receiveNumberCurrent = msgController.messageReceiving();
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter)
                    done();
                }, 1000)
            }, cursorTimeout);

            test(`Backend is still alive`, async () => {
                let BackendStatus = await msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
                expect(BackendStatus).toBeDefined();
                expect(BackendStatus.success).toBe(true);
                expect(BackendStatus.directory).toContain("set_QA");
            });

        });
    });

    afterAll(() => msgController.closeConnection());
});