import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

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

let basepath: string;
describe("OPEN_SWAPPED_IMAGES test: Testing open swapped images in different axes sequences", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let i=0; i<assertItem.fileOpen.length; i++) {
                assertItem.fileOpen[i].directory = basepath + "/" + assertItem.filelist.directory;
            }
        });

        describe(`Case 1: Open the image with axes sequence of RA-Freq-Dec-Stokes and test basic change image channel and set cursor info`,()=>{
            test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK should arrive within ${openFileTimeout} ms`,async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse.success).toEqual(true);
                // We ignore REGION_HISTOGRAM_DATA
            }, openFileTimeout);

            test(`(Step 2)"${assertItem.fileOpen[0].file}" add tile request and receive RASTER_TILE_DATA(Stream) and check total length`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);
                expect(RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length + 2);
                expect(RasterTileData.slice(-1)[0].endSync).toEqual(true)
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});