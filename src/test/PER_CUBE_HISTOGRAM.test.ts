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

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number, value: number }[];
    mean: number;
    stdDev: number;
}
interface AssertItem {
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: "supermosaic.10.fits",
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
        histograms: [{bounds: {min: 0, max: 0}, channel: -2, numBins: -1, fixedBounds: false, fixedNumBins: false}],
    },
    regionHistogramData: {
        regionId: -2,
        channel: -2,
        histograms: {
            numBins: 2775,
            binWidth: 0.7235205769538879,
            firstBinCenter: -1773.2998046875,
        },
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 },],
        mean: 18.742310255027036,
        stdDev: 22.534721826342878,
    },
    precisionDigits: 4,
};

let basepath: string;
describe("PER_CUBE_HISTOGRAM: Testing calculations of the per-cube histogram", () => {
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

        test(`return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
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
            test(`(Step1) "${assertItem.openFile.file}" REGION_HISTOGRAM_DATA should arrive completely within 3000 ms:`, async () => {
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements);
                RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                ReceiveProgress = RegionHistogramData.progress;
            }, 3000);

            test(`(Step2) REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                expect(RegionHistogramData[0].progress).toBeGreaterThan(0);
                expect(RegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramData.regionId);
            });

            test("(Step3 & Step4) Assert and check REGION_HISTOGRAM_DATA as the progress be just greater than 0.5", async () => {
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            RegionHistogramDataTemp1.push(data)
                            if (data.progress > 0.5) {
                                resolve(RegionHistogramDataTemp1)
                            }
                        }
                    })
                });
                
                let regionHistogramDataResponse = await regionHistogramDataPromise;
                RegionHistogramData = regionHistogramDataResponse.slice(-1)[0]
                ReceiveProgress = RegionHistogramData.progress;
                expect(ReceiveProgress).toBeGreaterThanOrEqual(0.5);
                expect(RegionHistogramData.histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramData.histograms.bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                expect(RegionHistogramData.channel).toEqual(assertItem.regionHistogramData.channel);
                expect(RegionHistogramData.histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramData.histograms.numBins).toEqual(assertItem.regionHistogramData.histograms.numBins);
                expect(RegionHistogramData.regionId).toEqual(assertItem.regionHistogramData.regionId);
            }, cubeHistogramTimeout);

            test("(Step5) Assert and check REGION_HISTOGRAM_DATA as the progress be just greater than 1", async () => {
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
                expect(RegionHistogramData.histograms.bins[2500]).toEqual(assertItem.regionHistogramData.binValues[0].value);
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