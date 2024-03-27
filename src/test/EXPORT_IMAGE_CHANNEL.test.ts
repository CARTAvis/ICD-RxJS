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
    fileOpen: CARTA.IOpenFile;
    saveFileReq: CARTA.ISaveFile[];
    exportFileOpen: CARTA.IOpenFile[];
    shapeSize: string[]
};

let assertItem: AssertItem = {
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    saveFileReq:[
    {
        outputFileName: "M17_SWex_Partial.image",
        outputFileType: CARTA.FileType.CASA,
        fileId: 0,
        channels: [5, 20, 1],
        keepDegenerate: true,
    },
    {
        outputFileName: "M17_SWex_Partial.fits",
        outputFileType: CARTA.FileType.FITS,
        fileId: 0,
        channels: [5, 20, 1],
        keepDegenerate: true,
    },],
    exportFileOpen: [
        {
            file: "M17_SWex_Partial.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Partial.fits",
            hdu: "",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    shapeSize: ['[640, 800, 16, 1]','[640, 800, 16, 1]']
};

let basepath: string;
describe("EXPORT IMAGE CHANNEL test: Exporting of a partial spectral range of an image cube", () => {
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

        assertItem.saveFileReq.map((saveFile, fileIndex) => {
            describe(`try to save image "${saveFile.outputFileName}"`, () => {
                let OpenFileAck: CARTA.IOpenFileAck
                test(`save image`, async () => {
                    let saveFileResponse = await msgController.saveFile(saveFile.fileId, tmpdirectory, saveFile.outputFileName, saveFile.outputFileType, null, saveFile.channels, null, saveFile.keepDegenerate, null);
                }, saveFileTimeout);

                describe(`reopen the exported file "${saveFile.outputFileName}"`, () => {
                    test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                        let OpenFileResponse = await msgController.loadFile({directory: basepath + "/" + tmpdirectory, ...assertItem.exportFileOpen[fileIndex]});
                        let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);
                        expect(OpenFileResponse.fileId).toEqual(RegionHistogramData[0].fileId);
                        OpenFileAck = OpenFileResponse;
                    }, openFileTimeout);

                    test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [640, 800, 16, 1]`, () => {
                        expect(OpenFileAck.fileInfoExtended.computedEntries.find(o => o.name == 'Shape').value).toContain(assertItem.shapeSize[fileIndex]);
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});