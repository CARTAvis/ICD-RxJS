import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    openFile: CARTA.IOpenFile;
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
                bounds:{min: -1, max: 0.1376738934777677},
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
        },
        {
            channel: 3,
            progress: 1,
            regionId: -1,
            stokes: 1,
            config: 
            {
                bounds:{min: -1, max: 0.1376738934777677},
                fixedBounds: true, 
                fixedNumBins: true, 
                numBins: 2
            },
            histograms: 
            {
                binWidth: 0.5688369274139404,
                bins: [0, 736705],
                firstBinCenter: -0.7155815362930298,
                mean: 0.000002222024835655828,
                numBins: 2,
                stdDev: 0.002096762523721388,
            }
        },
        {
            channel: 3,
            progress: 1,
            regionId: -1,
            stokes: 1,
            config: 
            {
                bounds:{},
                numBins: -1
            },
            histograms: 
            {
                binWidth: 0.00003724902853718959,
                firstBinCenter: -0.016793109476566315,
                mean: 0.000002222024835655828,
                numBins: 1049,
                stdDev: 0.002096762523721388,
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
            
                //click Histogram widget
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

            let RegionHistogramData: CARTA.IRegionHistogramData;
            test(`(Case 1) set Bounds and NumBins, and then receive the first RegionHistogramData:`, async () => {
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements[1]);
                RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
            });

            test(`(Case 1) Check the correction of the first RegionHistogramData`, () => {
                expect(RegionHistogramData[0].progress).toEqual(assertItem.ResponseRegionHistogramData[1].progress);
                expect(RegionHistogramData[0].regionId).toEqual(assertItem.ResponseRegionHistogramData[1].regionId);
                expect(RegionHistogramData[0].stokes).toEqual(assertItem.ResponseRegionHistogramData[1].stokes);
                expect(RegionHistogramData[0].config.bounds).toEqual(assertItem.ResponseRegionHistogramData[1].config.bounds);
                expect(RegionHistogramData[0].config.fixedBounds).toEqual(assertItem.ResponseRegionHistogramData[1].config.fixedBounds);
                expect(RegionHistogramData[0].config.fixedNumBins).toEqual(assertItem.ResponseRegionHistogramData[1].config.fixedNumBins);
                expect(RegionHistogramData[0].config.numBins).toEqual(assertItem.ResponseRegionHistogramData[1].config.numBins);
                expect(RegionHistogramData[0].histograms.binWidth).toBeCloseTo(assertItem.ResponseRegionHistogramData[1].histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(assertItem.ResponseRegionHistogramData[1].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.mean).toBeCloseTo(assertItem.ResponseRegionHistogramData[1].histograms.mean, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.numBins).toBeCloseTo(assertItem.ResponseRegionHistogramData[1].histograms.numBins, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.stdDev).toBeCloseTo(assertItem.ResponseRegionHistogramData[1].histograms.stdDev, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.bins).toEqual(assertItem.ResponseRegionHistogramData[1].histograms.bins);
            });

            let RegionHistogramDataResponse: CARTA.RegionHistogramData[] = [];
            let RasterTileDataResponse: any = [];
            test(`(Case 2) Set image channel, and then receive the RegionHistogramData * 2 + RasterTileData * 20 + RasterTileSync * 2:`, async () => {
                msgController.setChannels(assertItem.setImageChannel);
                msgController.histogramStream.pipe(take(2)).subscribe({
                    next: (data) => {
                        RegionHistogramDataResponse.push(data)
                    }
                })
                RasterTileDataResponse = await Stream(CARTA.RasterTileData,22);
            });

            test(`(Case 2) Check the correction of RegionHistogramData * 2 + RasterTileData * 20 + RasterTileSync * 2:`, () => {
                let firstRegionHistogramData = RegionHistogramDataResponse.filter(data => data.histograms.numBins == 2);
                expect(firstRegionHistogramData[0].channel).toEqual(assertItem.ResponseRegionHistogramData[2].channel);
                expect(firstRegionHistogramData[0].progress).toEqual(assertItem.ResponseRegionHistogramData[2].progress);
                expect(firstRegionHistogramData[0].regionId).toEqual(assertItem.ResponseRegionHistogramData[2].regionId);
                expect(firstRegionHistogramData[0].stokes).toEqual(assertItem.ResponseRegionHistogramData[2].stokes);
                expect(firstRegionHistogramData[0].config.bounds).toEqual(assertItem.ResponseRegionHistogramData[2].config.bounds);
                expect(firstRegionHistogramData[0].config.fixedBounds).toEqual(assertItem.ResponseRegionHistogramData[2].config.fixedBounds);
                expect(firstRegionHistogramData[0].config.fixedNumBins).toEqual(assertItem.ResponseRegionHistogramData[2].config.fixedNumBins);
                expect(firstRegionHistogramData[0].config.numBins).toEqual(assertItem.ResponseRegionHistogramData[2].config.numBins);
                expect(firstRegionHistogramData[0].histograms.binWidth).toBeCloseTo(assertItem.ResponseRegionHistogramData[2].histograms.binWidth, assertItem.precisionDigits);
                expect(firstRegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(assertItem.ResponseRegionHistogramData[2].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(firstRegionHistogramData[0].histograms.mean).toBeCloseTo(assertItem.ResponseRegionHistogramData[2].histograms.mean, assertItem.precisionDigits);
                expect(firstRegionHistogramData[0].histograms.numBins).toBeCloseTo(assertItem.ResponseRegionHistogramData[2].histograms.numBins, assertItem.precisionDigits);
                expect(firstRegionHistogramData[0].histograms.stdDev).toBeCloseTo(assertItem.ResponseRegionHistogramData[2].histograms.stdDev, assertItem.precisionDigits);
                expect(firstRegionHistogramData[0].histograms.bins).toEqual(assertItem.ResponseRegionHistogramData[2].histograms.bins);

                let secondRegionHistogramData = RegionHistogramDataResponse.filter(data => data.histograms.numBins == 1049);
                expect(secondRegionHistogramData[0].channel).toEqual(assertItem.ResponseRegionHistogramData[3].channel);
                expect(secondRegionHistogramData[0].progress).toEqual(assertItem.ResponseRegionHistogramData[3].progress);
                expect(secondRegionHistogramData[0].regionId).toEqual(assertItem.ResponseRegionHistogramData[3].regionId);
                expect(secondRegionHistogramData[0].stokes).toEqual(assertItem.ResponseRegionHistogramData[3].stokes);
                expect(secondRegionHistogramData[0].config.bounds).toEqual(assertItem.ResponseRegionHistogramData[3].config.bounds);
                expect(secondRegionHistogramData[0].config.numBins).toEqual(assertItem.ResponseRegionHistogramData[3].config.numBins);
                expect(secondRegionHistogramData[0].histograms.binWidth).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.binWidth, assertItem.precisionDigits);
                expect(secondRegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(secondRegionHistogramData[0].histograms.mean).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.mean, assertItem.precisionDigits);
                expect(secondRegionHistogramData[0].histograms.numBins).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.numBins, assertItem.precisionDigits);
                expect(secondRegionHistogramData[0].histograms.stdDev).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.stdDev, assertItem.precisionDigits);
                expect(secondRegionHistogramData[0].histograms.bins.length).toEqual(assertItem.ResponseRegionHistogramData[3].histograms.numBins);

                RasterTileDataResponse.map((data) => {
                    expect(data.channel).toEqual(assertItem.setImageChannel.channel);
                    expect(data.stokes).toEqual(assertItem.setImageChannel.stokes);
                })
            });

            test(`(Case 3) Reset the Histogram to default and check the correction of RegionHistogramData:`, async () => {
                msgController.setHistogramRequirements(assertItem.setHistogramRequirements[2]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                expect(RegionHistogramData[0].channel).toEqual(assertItem.ResponseRegionHistogramData[3].channel);
                expect(RegionHistogramData[0].progress).toEqual(assertItem.ResponseRegionHistogramData[3].progress);
                expect(RegionHistogramData[0].regionId).toEqual(assertItem.ResponseRegionHistogramData[3].regionId);
                expect(RegionHistogramData[0].stokes).toEqual(assertItem.ResponseRegionHistogramData[3].stokes);
                expect(RegionHistogramData[0].config.bounds).toEqual(assertItem.ResponseRegionHistogramData[3].config.bounds);
                expect(RegionHistogramData[0].config.numBins).toEqual(assertItem.ResponseRegionHistogramData[3].config.numBins);
                expect(RegionHistogramData[0].histograms.binWidth).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.binWidth, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.firstBinCenter).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.firstBinCenter, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.mean).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.mean, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.numBins).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.numBins, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.stdDev).toBeCloseTo(assertItem.ResponseRegionHistogramData[3].histograms.stdDev, assertItem.precisionDigits);
                expect(RegionHistogramData[0].histograms.bins.length).toEqual(assertItem.ResponseRegionHistogramData[3].histograms.numBins);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});