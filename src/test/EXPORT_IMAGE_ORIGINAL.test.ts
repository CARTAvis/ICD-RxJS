import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout = config.timeout.connection;
let tmpdirectory: string = config.path.save;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let saveFileTimeout: number = config.timeout.saveFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    precisionDigit?: number;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    saveFile: CARTA.ISaveFile[];
    exportedFileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels;
    shapeSize: string[]
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    precisionDigit: 4,
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 200,
        renderMode: CARTA.RenderMode.RASTER,
    },
    saveFile: [
        {
            fileId: 200,
            outputFileName: "M17_SWex_Original.fits",
            outputFileType: CARTA.FileType.FITS,
            keepDegenerate: true,
        },
        {
            fileId: 200,
            outputFileName: "M17_SWex_Original.image",
            outputFileType: CARTA.FileType.CASA,
            keepDegenerate: true,
        },
    ],
    exportedFileOpen: [
        {
            file: "M17_SWex_Original.fits",
            hdu: "",
            fileId: 300,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Original.image",
            hdu: "",
            fileId: 300,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: {
        fileId: 300,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 300,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    },
    shapeSize: ['[640, 800, 25, 1]','[640, 800, 25, 1]']
}

let basepath: string;
describe("EXPORT_IMAGE_ORIGINAL: Exporting of an image without modification", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + "/" + assertItem.fileOpen.directory;
        });

        test(`Open image`, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
            let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
        }, readFileTimeout);

        assertItem.saveFile.map((saveFile, fileIndex) => {
            describe(`try to save image "${saveFile.outputFileName}"`, () => {
                let OpenFileAck: CARTA.IOpenFileAck
                test(`save image`, async () => {
                    let saveFileResponse = await msgController.saveFile(saveFile.fileId, tmpdirectory, saveFile.outputFileName, saveFile.outputFileType, null, null, null, saveFile.keepDegenerate, null);
                }, saveFileTimeout);

                describe(`reopen the exported file "${saveFile.outputFileName}"`, () => {
                    test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                        let OpenFileResponse = await msgController.loadFile({directory: basepath + "/" + tmpdirectory, ...assertItem.exportedFileOpen[fileIndex]});
                        let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                        expect(OpenFileResponse.fileId).toEqual(RegionHistogramData[0].fileId);
                        OpenFileAck = OpenFileResponse;
                    }, openFileTimeout);

                    test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [640, 800, 25, 1]`, () => {
                        expect(OpenFileAck.fileInfoExtended.computedEntries.find(o => o.name == 'Shape').value).toContain(assertItem.shapeSize[fileIndex]);
                    });
                });

                describe(`request raster image of the file "${saveFile.outputFileName}"`, () => {
                    test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                        msgController.setChannels(assertItem.setImageChannel);
                        let RasterTileDataTemp = await Stream(CARTA.RasterTileData, assertItem.setImageChannel.requiredTiles.tiles.length + 2); //RasterTileerTile * 1 + RasterTileSync * 2(start & end)
                        expect(RasterTileDataTemp.find(input => input.tiles).tiles.length).toEqual(assertItem.setImageChannel.requiredTiles.tiles.length);
                    }, readFileTimeout)
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});