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
