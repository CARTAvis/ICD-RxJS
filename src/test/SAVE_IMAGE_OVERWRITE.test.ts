import { CARTA } from 'carta-protobuf';
import * as fs from 'fs';
import * as path from 'path';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let regionSubdirectory: string = config.path.region;
let saveSubdirectory: string = config.path.save;
// Absolute path of the backend top level folder, only used to create the symbolic link fixture.
// It must match the folder the backend was started with (see config.path.imageRoot).
let imageRoot: string = config.path.imageRoot;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let saveFileTimeout: number = config.timeout.saveFile;

const symbolicLinkName: string = 'save_image_overwrite_symlink';
const symbolicLinkTarget: string = 'M17_SWex_regionSet1_pix.crtf';

interface AssertItem {
    fileOpen: CARTA.IOpenFile;
    saveFile: CARTA.ISaveFile[];
    saveFileAck: CARTA.ISaveFileAck[];
}

let assertItem: AssertItem = {
    fileOpen: {
        directory: testSubdirectory,
        file: 'M17_SWex.fits',
        hdu: '',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    saveFile: [
        {
            // No file name at all
            fileId: 0,
            outputFileDirectory: saveSubdirectory,
            outputFileName: '',
            outputFileType: CARTA.FileType.CASA,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: true,
        },
        {
            // The output path resolves to the image which is currently open
            fileId: 0,
            outputFileDirectory: testSubdirectory,
            outputFileName: 'M17_SWex.fits',
            outputFileType: CARTA.FileType.FITS,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: true,
        },
        {
            // The output path resolves to an existing directory which is not an image
            fileId: 0,
            outputFileDirectory: testSubdirectory,
            outputFileName: 'regionTest',
            outputFileType: CARTA.FileType.CASA,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: true,
        },
        {
            // The output path resolves to an existing file which is not an image
            fileId: 0,
            outputFileDirectory: regionSubdirectory,
            outputFileName: symbolicLinkTarget,
            outputFileType: CARTA.FileType.CASA,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: false,
        },
        {
            // The output path resolves to a symbolic link
            fileId: 0,
            outputFileDirectory: saveSubdirectory,
            outputFileName: symbolicLinkName,
            outputFileType: CARTA.FileType.CASA,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: false,
        },
        {
            // The output path resolves to an existing image file
            fileId: 0,
            outputFileDirectory: testSubdirectory,
            outputFileName: 'M17_SWex.hdf5',
            outputFileType: CARTA.FileType.HDF5,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: false,
        },
        {
            // The output path resolves to an existing image directory
            fileId: 0,
            outputFileDirectory: testSubdirectory,
            outputFileName: 'M17_SWex.image',
            outputFileType: CARTA.FileType.CASA,
            regionId: 0,
            channels: [],
            stokes: [],
            keepDegenerate: true,
            restFreq: NaN,
            overwrite: false,
        },
    ],
    saveFileAck: [
        {
            fileId: 0,
            success: false,
            message: 'Cannot save image with no filename.',
            overwriteConfirmationRequired: false,
        },
        {
            fileId: 0,
            success: false,
            message: 'Cannot overwrite the source image.',
            overwriteConfirmationRequired: false,
        },
        {
            fileId: 0,
            success: false,
            message: 'Cannot overwrite existing directory.',
            overwriteConfirmationRequired: false,
        },
        {
            fileId: 0,
            success: false,
            message: 'Cannot overwrite existing file or symlink.',
            overwriteConfirmationRequired: true,
        },
        {
            fileId: 0,
            success: false,
            message: 'Cannot overwrite existing file or symlink.',
            overwriteConfirmationRequired: true,
        },
        {
            fileId: 0,
            success: false,
            message: 'Cannot overwrite existing image.',
            overwriteConfirmationRequired: true,
        },
        {
            fileId: 0,
            success: false,
            message: 'Cannot overwrite existing image.',
            overwriteConfirmationRequired: true,
        },
    ],
};

let basepath: string;
describe('SAVE_IMAGE_OVERWRITE: Saving an image to a path which cannot be overwritten', () => {
    const msgController = MessageController.Instance;

    // The backend rejects the request through SAVE_FILE_ACK.success = false, and the message
    // controller turns an unsuccessful ack into a rejection carrying the whole ack.
    const saveFile = async (input: CARTA.ISaveFile): Promise<CARTA.ISaveFileAck> => {
        try {
            return await msgController.saveFile(
                input.fileId,
                input.outputFileDirectory,
                input.outputFileName,
                input.outputFileType,
                input.regionId,
                input.channels,
                input.stokes,
                input.keepDegenerate,
                input.restFreq,
                input.overwrite
            );
        } catch (err) {
            return err as CARTA.ISaveFileAck;
        }
    };

    const linkDirectory = path.join(imageRoot, saveSubdirectory);
    const linkPath = path.join(linkDirectory, symbolicLinkName);

    describe(`Register a session`, () => {
        // The symbolic link must exist before any request is sent: with nothing at the target path
        // the backend has nothing to refuse and saves a new image there instead. Preparing it in
        // beforeAll aborts the whole block on failure, so the checks below can never write a file.
        beforeAll(() => {
            if (!fs.existsSync(imageRoot)) {
                throw new Error(
                    `config.path.imageRoot "${imageRoot}" does not exist, set it to the top level folder of the backend.`
                );
            }
            const linkTarget = path.join(imageRoot, regionSubdirectory, symbolicLinkTarget);
            if (!fs.existsSync(linkTarget)) {
                throw new Error(`The symbolic link target "${linkTarget}" does not exist.`);
            }
            fs.mkdirSync(linkDirectory, { recursive: true });
            // Remove anything left behind by an interrupted run, which may be a file or a directory
            fs.rmSync(linkPath, { recursive: true, force: true });
            fs.symlinkSync(linkTarget, linkPath);
            expect(fs.lstatSync(linkPath).isSymbolicLink()).toBe(true);
        });

        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        // The basepath is empty when the backend starts in its own top level folder, and prefixing
        // a subdirectory with "basepath + '/'" would then make it absolute. SaveFile joins the
        // directory with std::filesystem::operator/, which drops the top level folder for an
        // absolute directory, so the request would leave the image folder entirely.
        const resolveDirectory = (subdirectory: string): string =>
            basepath ? basepath + '/' + subdirectory : subdirectory;

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = resolveDirectory(assertItem.fileOpen.directory);
            assertItem.saveFile.map((saveFileInput) => {
                saveFileInput.outputFileDirectory = resolveDirectory(saveFileInput.outputFileDirectory);
            });
        });

        test(
            `Open the image "${assertItem.fileOpen.file}"`,
            async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
                await Stream(CARTA.RegionHistogramData, 1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
            },
            openFileTimeout
        );

        assertItem.saveFile.map((saveFileInput, index) => {
            const expectedAck = assertItem.saveFileAck[index];
            describe(`Save the image to "${saveFileInput.outputFileName === '' ? '(no file name)' : saveFileInput.outputFileName}" with overwrite = ${saveFileInput.overwrite}`, () => {
                let saveFileAck: CARTA.ISaveFileAck;
                test(
                    `SAVE_FILE_ACK should arrive within ${saveFileTimeout} ms`,
                    async () => {
                        saveFileAck = await saveFile(saveFileInput);
                    },
                    saveFileTimeout
                );

                test(`SAVE_FILE_ACK.success = ${expectedAck.success}`, () => {
                    expect(saveFileAck.success).toEqual(expectedAck.success);
                });

                test(`SAVE_FILE_ACK.message = "${expectedAck.message}"`, () => {
                    expect(saveFileAck.message).toEqual(expectedAck.message);
                });

                test(`SAVE_FILE_ACK.overwrite_confirmation_required = ${expectedAck.overwriteConfirmationRequired}`, () => {
                    expect(saveFileAck.overwriteConfirmationRequired).toEqual(
                        expectedAck.overwriteConfirmationRequired
                    );
                });
            });
        });

        afterAll(() => {
            if (fs.lstatSync(linkPath, { throwIfNoEntry: false })?.isSymbolicLink()) {
                fs.unlinkSync(linkPath);
            }
            msgController.closeConnection();
        });
    });
});
