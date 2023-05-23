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
};

let assertItem: AssertItem = {
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
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
    }
}