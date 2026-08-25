import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import {
    assertNoFurtherMessage,
    assertSpatialProfile,
    testBackendIsAlive,
    testOpenFile,
    testTilesAndProfiles,
} from './CloseFileHelpers';
import { CONNECTION_TIMEOUT, READ_FILE_TIMEOUT, TEST_SERVER_URL, TEST_SUBDIRECTORY, basePath } from './CommonHelpers';

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    closedFileError: CARTA.IErrorData;
}

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: TEST_SUBDIRECTORY },
    fileOpen: [
        {
            directory: TEST_SUBDIRECTORY,
            file: 'M17_SWex.fits',
            hdu: '',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: TEST_SUBDIRECTORY,
            file: 'M17_SWex.hdf5',
            hdu: '',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: TEST_SUBDIRECTORY,
            file: 'M17_SWex.image',
            hdu: '0',
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addRequiredTiles: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 2,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 2,
            point: { x: 1, y: 1 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [
                { coordinate: 'x', mip: 1 },
                { coordinate: 'y', mip: 1 },
            ],
        },
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: [
                { coordinate: 'x', mip: 1 },
                { coordinate: 'y', mip: 1 },
            ],
        },
        {
            fileId: 2,
            regionId: 0,
            spatialProfiles: [
                { coordinate: 'x', mip: 1 },
                { coordinate: 'y', mip: 1 },
            ],
        },
    ],
    // Session::OnSetSpatialRequirements answers a request naming a file the session no
    // longer holds a frame for with this error and nothing else.
    closedFileError: {
        severity: CARTA.ErrorSeverity.DEBUG,
        tags: ['spatial'],
    },
};

// Ask a file which should still be open for its spatial profile. Closing one file must
// neither silence another file nor redirect its stream.
async function assertFileIsOpen(fileId: number) {
    await assertSpatialProfile(assertItem.setSpatialReq[fileId]);
}

// Ask a file which should be closed for its spatial profile. Since CLOSE_FILE draws no
// acknowledgement, the error this request draws is the only direct evidence the backend
// really dropped the file.
async function assertFileIsClosed(fileId: number) {
    const msgController = MessageController.Instance;
    const messageCountBefore = msgController.messageReceiving();
    const errorDataStream = Stream(CARTA.ErrorData, 1);
    msgController.setSpatialRequirements(assertItem.setSpatialReq[fileId]);
    const errorData = await errorDataStream;
    expect(errorData[0].severity).toEqual(assertItem.closedFileError.severity);
    expect(errorData[0].tags).toEqual(assertItem.closedFileError.tags);
    expect(errorData[0].message).toEqual(`File id ${fileId} not found`);
    // The error has to be the whole of the answer: a closed file must not go on streaming
    // SPATIAL_PROFILE_DATA.
    await assertNoFurtherMessage(messageCountBefore + 1);
}

// The same three images are opened ahead of each close order, so the preparation is
// declared once. Every message is checked to carry the file id it belongs to, which is
// what the close cases below then rely on.
function openThreeImages() {
    assertItem.fileOpen.forEach((fileOpen, index) => {
        testOpenFile(`(Image ${fileOpen.fileId})`, fileOpen);
        testTilesAndProfiles(
            `(Image ${fileOpen.fileId})`,
            assertItem.addRequiredTiles[index],
            assertItem.setCursor[index],
            assertItem.setSpatialReq[index]
        );
    });
}

describe('Test for Close one file (run1):', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
        msgController.closeFile(-1);
    }, CONNECTION_TIMEOUT);

    checkConnection();
    basePath([assertItem.filelist, ...assertItem.fileOpen]);

    describe('Prepare Image 0,1,2 for Case 1: ', () => {
        openThreeImages();
    });

    describe(`Case 1 (close image 2 -> close image 1 -> close image 0):`, () => {
        test(`(Step 1) closing image 2 draws no message of its own | `, async () => {
            const messageCountBefore = msgController.messageReceiving();
            msgController.closeFile(2);
            await assertNoFurtherMessage(messageCountBefore);
        });

        test(
            `(Step 2) image 2 no longer answers, while images 0 and 1 still do | `,
            async () => {
                await assertFileIsClosed(2);
                await assertFileIsOpen(0);
                await assertFileIsOpen(1);
            },
            READ_FILE_TIMEOUT
        );

        test(
            `(Step 3) closing image 1 leaves image 0 streaming | `,
            async () => {
                msgController.closeFile(1);
                await assertFileIsClosed(1);
                await assertFileIsOpen(0);
            },
            READ_FILE_TIMEOUT
        );

        test(
            `(Step 4) closing image 0 closes the last of the three | `,
            async () => {
                msgController.closeFile(0);
                await assertFileIsClosed(0);
            },
            READ_FILE_TIMEOUT
        );

        testBackendIsAlive(assertItem.filelist);

        test(`(Step 5) There is no any ICD message returned:`, async () => {
            await assertNoFurtherMessage(msgController.messageReceiving());
        });
    });
    afterAll(() => msgController.closeConnection());
});

describe('Test for Close one file (run2):', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
        msgController.closeFile(-1);
    }, CONNECTION_TIMEOUT);

    checkConnection();

    describe('Prepare Image 0,1,2 for Case 2: ', () => {
        openThreeImages();
    });

    describe(`Case 2 (close image 0 & 1 -> close image 2):`, () => {
        test(`(Step 1) close image 0 & image 1 at once, and there is no any ICD message returned:`, async () => {
            const messageCountBefore = msgController.messageReceiving();
            msgController.closeFile(0);
            msgController.closeFile(1);
            await assertNoFurtherMessage(messageCountBefore);
        });

        test(
            `(Step 2) images 0 and 1 no longer answer, while image 2 still does | `,
            async () => {
                await assertFileIsClosed(0);
                await assertFileIsClosed(1);
                await assertFileIsOpen(2);
            },
            READ_FILE_TIMEOUT
        );

        test(`(Step 3) close image 2 | `, () => {
            expect(msgController.closeFile(2)).toBe(true);
        });

        testBackendIsAlive(assertItem.filelist);

        test(
            `(Step 4) image 2 no longer answers | `,
            async () => {
                await assertFileIsClosed(2);
            },
            READ_FILE_TIMEOUT
        );

        test(`(Step 5) There is no any ICD message returned:`, async () => {
            await assertNoFurtherMessage(msgController.messageReceiving());
        });
    });
    afterAll(() => msgController.closeConnection());
});

describe('Test for Close one file (run3):', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
        msgController.closeFile(-1);
    }, CONNECTION_TIMEOUT);

    checkConnection();

    describe('Prepare Image 0,1,2 for Case 3: ', () => {
        openThreeImages();
    });

    describe(`Case 3 (close image 0, 1 & 2 together):`, () => {
        test(`(Step 1) close image 0, image 1 & image 2 together, and there is no any ICD message returned:`, async () => {
            const messageCountBefore = msgController.messageReceiving();
            msgController.closeFile(0);
            msgController.closeFile(1);
            msgController.closeFile(2);
            await assertNoFurtherMessage(messageCountBefore);
        });

        test(
            `(Step 2) none of the three images answers any more | `,
            async () => {
                await assertFileIsClosed(0);
                await assertFileIsClosed(1);
                await assertFileIsClosed(2);
            },
            READ_FILE_TIMEOUT
        );

        testBackendIsAlive(assertItem.filelist);

        test(`(Step 3) There is no any ICD message returned:`, async () => {
            await assertNoFurtherMessage(msgController.messageReceiving());
        });
    });

    afterAll(() => msgController.closeConnection());
});
