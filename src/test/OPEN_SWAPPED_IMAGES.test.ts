import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setImageChannel: CARTA.ISetImageChannels[];
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-rfds.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-rsdf.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-fdsr.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "supermosaic.10-cutted-stokes-glon-vard-glat.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [50331650, 50331649, 50331651, 50331648, 50331652],
        },
    ],    
    setCursor: [
        {
            fileId: 0,
            point: { x: 510, y: 2 },
        },
    ],
    setImageChannel:
    [
        {
            fileId: 0,
            channel: 500,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [50331650, 50331649, 50331651, 50331648, 50331652],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },    
    ],
};