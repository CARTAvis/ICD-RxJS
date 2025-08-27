import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/MyClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let tmpdirectory: string = config.path.save;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let saveFileTimeout: number = config.timeout.saveFile;

interface AssertItem {
    fileOpen: CARTA.IOpenFile;
    setRegion: CARTA.ISetRegion;
    saveFile: CARTA.ISaveFile[];
    errorMessage: string;
}

let assertItem: AssertItem = {
    fileOpen: {
        directory: testSubdirectory,
        file: 'M17_SWex.fits',
        hdu: '',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [
                { x: -100.0, y: 35.0 },
                { x: 50.0, y: 50.0 },
            ],
            rotation: 0.0,
        },
    },
    saveFile: [
        {
            fileId: 0,
            outputFileName: 'M17_SWex_error.fits',
            outputFileType: CARTA.FileType.FITS,
            regionId: 1,
            channels: [0, 24, 1],
            stokes: [1, 2, 1],
            restFreq: NaN,
            keepDegenerate: true,
        },
        {
            fileId: 0,
            outputFileName: 'M17_SWex_error.image',
            outputFileType: CARTA.FileType.CASA,
            regionId: 1,
            channels: [0, 24, 1],
            stokes: [1, 2, 1],
            restFreq: NaN,
            keepDegenerate: true,
        },
    ],
    errorMessage: 'The selected region is entirely outside the image.',
};

let basepath: string;
describe('SAVE_IMAGE_ERROR_MESSAGE: Exporting of a region out of the image', () => {
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
            `(Step 1) Open image`,
            async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
            },
            openFileTimeout
        );

        test(
            `(Step 2) Set a region`,
            async () => {
                let SetRegionAck = await msgController.setRegion(
                    assertItem.setRegion.fileId,
                    assertItem.setRegion.regionId,
                    assertItem.setRegion.regionInfo
                );
                expect(SetRegionAck.success).toEqual(true);
            },
            saveFileTimeout
        );

        assertItem.saveFile.map((SaveImageInput, index) => {
            test(
                `Save imagd "${SaveImageInput.outputFileName}" & Check the error message:`,
                async () => {
                    try {
                        let saveFileResponse = await msgController.saveFile(
                            SaveImageInput.fileId,
                            tmpdirectory,
                            SaveImageInput.outputFileName,
                            SaveImageInput.outputFileType,
                            SaveImageInput.regionId,
                            SaveImageInput.channels,
                            SaveImageInput.stokes,
                            SaveImageInput.keepDegenerate,
                            SaveImageInput.restFreq
                        );
                    } catch (err) {
                        expect(err.message).toContain(assertItem.errorMessage);
                    }
                },
                saveFileTimeout
            );
        });
        afterAll(() => msgController.closeConnection());
    });
});
