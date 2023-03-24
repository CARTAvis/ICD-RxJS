import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;
let messageReturnTimeout = config.timeout.readFile;
let cancelTimeout = config.timeout.cancel;

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number, value: number }[];
    mean: number;
    stdDev: number;
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    cancelHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "SDC335.579-0.292.spw0-channel-cutted.line.fits",
        fileId: 0,
        hdu: "0",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [
            { channel: -2, numBins: -1 },
        ],
    },
    cancelHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [],
    },
    regionHistogramData: {
        regionId: -2,
        channel: -2,
        histograms: 
        {
            numBins: 342,
            binWidth: 0.0007966686389409006,
            firstBinCenter: -0.09137402474880219,
        },
        lengthOfHistogramBins: 342,
        binValues: [{ index: 170, value: 10548 },],
        mean: 0.00005560920907762894,
        stdDev: 0.012523454128847715,
    },
    precisionDigits: 4,
};

let basepath: string;
describe("PER_CUBE_HISTOGRAM_CANCELLATION: Testing calculations of the per-cube histogram with cancellation", () => {
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

        test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
        }, openFileTimeout);

        test(`Assert total length of RASTER_TILE_DATA(Stream)`, async () => {
            msgController.addRequiredTiles(assertItem.addTilesReq);
            let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);

            msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
            let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

            expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
        }, readFileTimeout);

        let ReceiveProgress: number;
        let RegionHistogramData: CARTA.RegionHistogramData;
        let RegionHistogramDataTemp1 = []
        describe(`Set histogram requirements:`, () => {
            test(`(Step1) "${assertItem.openFile.file}" REGION_HISTOGRAM_DATA should arrive completely within 10000 ms:`, async () => {
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements);
                RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                ReceiveProgress = RegionHistogramData[0].progress;
            }, 10000);

            test(`(Step2) REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                expect(RegionHistogramData[0].progress).toBeGreaterThan(0);
                expect(RegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramData.regionId);
                console.log('Step2 progress:', ReceiveProgress)
            });

            test(`(Step3) The second REGION_HISTOGRAM_DATA should arrive and REGION_HISTOGRAM_DATA.progress > previous one `, async () => {
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements);
                RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                ReceiveProgress = RegionHistogramData[0].progress;
                console.log('' + assertItem.openFile.file + ' Region Histogram progress :', ReceiveProgress);
            }, readFileTimeout);

            test("(Step4) Assert no more REGION_HISTOGRAM_DATA returns", async () => {
                /// After 5 seconds, the request of the per-cube histogram is cancelled.
                await new Promise<void>(end => setTimeout(() => end(), cancelTimeout));
                msgController.setHistogramRequirements(assertItem.cancelHistogramRequirements);
                // Receive messages until get two ErrorData
                let errorMessage = await Stream(CARTA.ErrorData, 2);
                console.log(errorMessage);
            }, readFileTimeout + messageReturnTimeout + cancelTimeout);

            test("(Step5) Assert a renew REGION_HISTOGRAM_DATA as the progress = 1.0", async () => {
                /// Then request to get the per-cube histogram again in 2 seconds.
                await new Promise<void>(end => setTimeout(() => end(), 2000));
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements);
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            RegionHistogramDataTemp1.push(data)
                            if (data.progress === 1) {
                                resolve(RegionHistogramDataTemp1)
                            }
                        }
                    })
                });
                
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                RegionHistogramData = regionHistogramDataResponse.slice(-1)[0]
                ReceiveProgress = RegionHistogramData.progress;
                expect(ReceiveProgress).toEqual(1);
                expect(RegionHistogramData.histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramData.histograms.bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                expect(RegionHistogramData.histograms.bins[170]).toEqual(assertItem.regionHistogramData.binValues[0].value);
                expect(RegionHistogramData.channel).toEqual(assertItem.regionHistogramData.channel);
                expect(RegionHistogramData.histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramData.histograms.numBins).toEqual(assertItem.regionHistogramData.histograms.numBins);
                expect(RegionHistogramData.histograms.mean).toBeCloseTo(assertItem.regionHistogramData.mean, assertItem.precisionDigits)
                expect(RegionHistogramData.histograms.stdDev).toBeCloseTo(assertItem.regionHistogramData.stdDev, assertItem.precisionDigits)
                expect(RegionHistogramData.regionId).toEqual(assertItem.regionHistogramData.regionId);
            }, cubeHistogramTimeout);
        });


        afterAll(() => msgController.closeConnection());
    });
});