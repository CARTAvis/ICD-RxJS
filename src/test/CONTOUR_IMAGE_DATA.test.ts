import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

const ZstdCodec = require('zstd-codec').ZstdCodec;
let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;

interface ContourImageData extends CARTA.IContourImageData {
    contourVertices?: number[];
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters[];
    contourImageData: ContourImageData[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "contour_test.miriad",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: []
        },
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [0.6],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [0.6],
            smoothingMode: CARTA.SmoothingMode.BlockAverage,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [0.85],
            smoothingMode: CARTA.SmoothingMode.NoSmoothing,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
    contourImageData: [
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 104,
                },
            ],
            progress: 1,
            contourVertices: [
                9.25, 9.00,
                9.00, 9.25,
                8.75, 10.00,
                9.00, 10.75,
                9.25, 11.00,
                10.00, 11.25,
                10.75, 11.00,
                11.00, 10.75,
                11.25, 10.00,
                11.00, 9.25,
                10.75, 9.00,
                10.00, 8.75,
                9.25, 9.00,
            ],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 40,
                },
            ],
            progress: 1,
            contourVertices: [
                8.50, 9.50,
                9.50, 10.75,
                10.75, 9.50,
                9.50, 8.50,
                8.50, 9.50,
            ],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.85,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 104,
                },
            ],
            progress: 1,
            contourVertices: [
                9.50, 9.00,
                9.00, 9.50,
                8.75, 10.00,
                9.00, 10.50,
                9.50, 11.00,
                10.00, 11.25,
                10.50, 11.00,
                11.00, 10.50,
                11.25, 10.00,
                11.00, 9.50,
                10.50, 9.00,
                10.00, 8.75,
                9.50, 9.00,
            ],
        },
    ],
};
