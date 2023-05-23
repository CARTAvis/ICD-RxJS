import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let saveSubdirectory = config.path.save;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    setHistogramRequirements: CARTA.ISetHistogramRequirements[];
    setImageChannel: CARTA.ISetImageChannels;
    ResponseRegionHistogramData: CARTA.IRegionHistogramData[];
};

let assertItem: AssertItem = {
    openFile:
    {
        directory: testSubdirectory,
        file: "HH211_IQU.fits",
        fileId: 0,
        hdu: "0",
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 6,
    setHistogramRequirements: [
        {
            fileId: 0,
            regionId: -1,
            histograms: [{channel: -1, numBins: -1, bounds: {min: 0, max: 0}, coordinate: "z", fixedBounds: false, fixedNumBins: false}]
        },
        {
            fileId: 0,
            regionId: -1,
            histograms: [{channel: -1, numBins: 2, bounds: {min: -1, max: 0.1376738934777677}, coordinate: "Qz", fixedBounds: true, fixedNumBins: true}]
        },
        {
            fileId: 0,
            regionId: -1,
            histograms: [{channel: -1, numBins: -1, bounds: {min: 0, max: 0}, coordinate: "Qz", fixedBounds: false, fixedNumBins: false}]
        }
    ],
    setImageChannel: 
    {
        fileId: 0,
        channel: 3,
        stokes: 1,
        requiredTiles: {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [50339842, 50339841, 50335746, 50335745, 50343938, 50339843, 50343937, 50335747, 50339840, 50331650, 50335744, 50331649, 50343939, 50343936, 50331651, 50331648, 50348034, 50348033, 50348035, 50348032],
        },
    },
    ResponseRegionHistogramData: 
    [
        {
            progress: 1,
            regionId: -1,
            config: 
            {
                bounds: {},
                numBins: -1
            },
            histograms: 
            {
                binWidth: 0.0002482116688042879,
                firstBinCenter: -0.12420587241649628,
                mean: 0.000008066841056845398,
                numBins: 1049,
                stdDev: 0.014460244218400708,
            }
        },
        {
            progress: 1,
            regionId: -1,
            stokes: 1,
            config: 
            {
                fixedBounds: true, 
                fixedNumBins: true, 
                numBins: 2
            },
            histograms: 
            {
                binWidth: 0.5688369274139404,
                bins: [0, 736448],
                firstBinCenter: -0.7155815362930298,
                mean: -0.0000026881257400475778,
                numBins: 2,
                stdDev: 0.0142919735819505,
            }
        }
    ]
}

let basepath: string;
describe("Testing set region ICD message to all annotation RegionTypes and export and import for CASA pixel format", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        afterAll(() => msgController.closeConnection());

        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
            test(`Preparation: Open image`,async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);

                msgController.addRequiredTiles(assertItem.addTilesRequire);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);
                msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements[0]);
                let RegionHistogramDataReponse = await Stream(CARTA.RegionHistogramData,1);
                expect(RegionHistogramDataReponse[0].progress).toEqual(assertItem.ResponseRegionHistogramData[0].progress);
                expect(RegionHistogramDataReponse[0].regionId).toEqual(assertItem.ResponseRegionHistogramData[0].regionId);
                expect(RegionHistogramDataReponse[0].config.bounds).toEqual(assertItem.ResponseRegionHistogramData[0].config.bounds);
                expect(RegionHistogramDataReponse[0].config.numBins).toEqual(assertItem.ResponseRegionHistogramData[0].config.numBins);
                expect(RegionHistogramDataReponse[0].histograms.binWidth).toBeCloseTo(assertItem.ResponseRegionHistogramData[0].histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramDataReponse[0].histograms.firstBinCenter).toBeCloseTo(assertItem.ResponseRegionHistogramData[0].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramDataReponse[0].histograms.mean).toBeCloseTo(assertItem.ResponseRegionHistogramData[0].histograms.mean, assertItem.precisionDigits);
                expect(RegionHistogramDataReponse[0].histograms.numBins).toBeCloseTo(assertItem.ResponseRegionHistogramData[0].histograms.numBins, assertItem.precisionDigits);
                expect(RegionHistogramDataReponse[0].histograms.stdDev).toBeCloseTo(assertItem.ResponseRegionHistogramData[0].histograms.stdDev, assertItem.precisionDigits);
            }, openFileTimeout);

            // let RegionHistogramData: CARTA.IRegionHistogramData;
            // test(`(Case 1) set Bounds and NumBins, and then receive the first RegionHistogramData:`, async () => {
            //     console.log(assertItem.setHistogramRequirements[0])
            //     msgController.setHistogramRequirements(assertItem.setHistogramRequirements[0]);
            //     RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
            //     console.log(RegionHistogramData);
            //     // msgController.setHistogramRequirements(assertItem.setHistogramRequirements[0]);
            // });

            // test(`(Case 1) Check the correction of the first RegionHistogramData`, () => {
            //     // expect(RegionHistogramData[0].progress).toEqual(assertItem.ResponseRegionHistogramData[0].progress);
            //     // expect(RegionHistogramData[0].regionId).toEqual(assertItem.ResponseRegionHistogramData[0].regionId);
            //     // expect(RegionHistogramData[0].stokes).toEqual(assertItem.ResponseRegionHistogramData[0].stokes);
            //     // expect(RegionHistogramData[0].config.fixedBounds).toEqual(assertItem.ResponseRegionHistogramData[0].config.fixedBounds);
            // });
        });

        afterAll(() => msgController.closeConnection());
    });
});