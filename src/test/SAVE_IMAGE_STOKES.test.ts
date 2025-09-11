import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let tmpdirectory: string = config.path.save;
let connectTimeout: number = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let saveFileTimeout: number = config.timeout.saveFile;

interface AssertItem {
    fileOpen: CARTA.IOpenFile;
    saveFileReq: CARTA.ISaveFile[];
    exportFileOpen: CARTA.IOpenFile[];
    shapeSize: string[];
}

let assertItem: AssertItem = {
    fileOpen: {
        directory: testSubdirectory,
        file: 'HH211_IQU.fits',
        hdu: '',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    saveFileReq: [
        {
            outputFileName: 'HH211_QU_test.image',
            outputFileType: CARTA.FileType.CASA,
            fileId: 0,
            channels: [0, 2, 1],
            keepDegenerate: true,
            stokes: [1, 2, 1],
        },
        {
            outputFileName: 'HH211_QU_test.fits',
            outputFileType: CARTA.FileType.FITS,
            fileId: 0,
            channels: [0, 2, 1],
            keepDegenerate: true,
            stokes: [1, 2, 1],
        },
    ],
    exportFileOpen: [
        {
            file: 'HH211_QU_test.image',
            hdu: '',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: 'HH211_QU_test.fits',
            hdu: '',
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    shapeSize: ['[1049, 1049, 3, 2]', '[1049, 1049, 3, 2]'],
};

let basepath: string;
describe('SAVE IMAGE STOKES test: Exporting of a partial spectral range of an image cube', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = basepath + '/' + assertItem.fileOpen.directory;
        });

        test(
            `Open image`,
            async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
            },
            readFileTimeout
        );

        assertItem.saveFileReq.map((saveFile, fileIndex) => {
            describe(`try to save image "${saveFile.outputFileName}"`, () => {
                let OpenFileAck: CARTA.IOpenFileAck;
                test(
                    `save image`,
                    async () => {
                        let saveFileResponse = await msgController.saveFile(
                            saveFile.fileId,
                            tmpdirectory,
                            saveFile.outputFileName,
                            saveFile.outputFileType,
                            null,
                            saveFile.channels,
                            saveFile.stokes,
                            saveFile.keepDegenerate,
                            null
                        );
                    },
                    saveFileTimeout
                );

                describe(`reopen the exported file "${saveFile.outputFileName}"`, () => {
                    test(
                        `OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,
                        async () => {
                            let OpenFileResponse = await msgController.loadFile({
                                directory: basepath + '/' + tmpdirectory,
                                ...assertItem.exportFileOpen[fileIndex],
                            });
                            let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
                            expect(OpenFileResponse.fileId).toEqual(RegionHistogramData[0].fileId);
                            OpenFileAck = OpenFileResponse;
                        },
                        openFileTimeout
                    );

                    test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [1049, 1049, 3, 2]`, () => {
                        expect(
                            OpenFileAck.fileInfoExtended.computedEntries.find((o) => o.name == 'Shape').value
                        ).toContain(assertItem.shapeSize[fileIndex]);
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
