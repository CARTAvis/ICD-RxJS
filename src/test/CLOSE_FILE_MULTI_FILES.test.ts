import { CARTA } from 'carta-protobuf';
import { Stream } from './MyClient';
import { MessageController, ConnectionStatus } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
// CLOSE_FILE is not acknowledged in the ICD, so the only thing which can be observed
// directly after it is silence. This is how long silence is waited for.
let quietTime: number = config.timeout.messageEvent;

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
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex.fits',
            hdu: '',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex.hdf5',
            hdu: '',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
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

// The backend has to have sent nothing since the count was taken.
async function assertNoFurtherMessage(expectedMessageCount: number) {
    const msgController = MessageController.Instance;
    await new Promise((resolve) => setTimeout(resolve, quietTime));
    expect(msgController.messageReceiving()).toEqual(expectedMessageCount);
}

// Ask a file which should still be open for its spatial profile. The file id on the
// response is the point of the check: closing one file must neither silence another file
// nor redirect its stream.
async function assertFileIsOpen(fileId: number) {
    const msgController = MessageController.Instance;
    const spatialProfileDataStream = Stream(CARTA.SpatialProfileData, 1);
    msgController.setSpatialRequirements(assertItem.setSpatialReq[fileId]);
    const spatialProfileData = await spatialProfileDataStream;
    expect(spatialProfileData[0].fileId).toEqual(fileId);
    expect(spatialProfileData[0].regionId).toEqual(assertItem.setSpatialReq[fileId].regionId);
    expect(spatialProfileData[0].profiles.map((profile) => profile.coordinate)).toEqual(
        assertItem.setSpatialReq[fileId].spatialProfiles.map((profile) => profile.coordinate)
    );
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
    const msgController = MessageController.Instance;
    assertItem.fileOpen.forEach((fileOpen, index) => {
        test(
            `(Image ${fileOpen.fileId}) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${fileOpen.file}" should arrive within ${openFileTimeout} ms | `,
            async () => {
                const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
                const openFileResponse = await msgController.loadFile(fileOpen);
                const regionHistogramData = await regionHistogramDataStream;
                expect(openFileResponse.success).toBe(true);
                expect(openFileResponse.fileInfo.name).toEqual(fileOpen.file);
                expect(openFileResponse.fileId).toEqual(fileOpen.fileId);
                expect(regionHistogramData[0].fileId).toEqual(fileOpen.fileId);
            },
            openFileTimeout
        );

        test(
            `(Image ${fileOpen.fileId}) RASTER_TILE_DATA and SPATIAL_PROFILE_DATA should carry file id ${fileOpen.fileId} | `,
            async () => {
                const requiredTiles = assertItem.addRequiredTiles[index];
                const rasterTileDataStream = Stream(CARTA.RasterTileData, requiredTiles.tiles.length + 2);
                msgController.addRequiredTiles(requiredTiles);
                const rasterTileData = await rasterTileDataStream;
                // Stream resolves as soon as it has collected the number of messages it was
                // asked for, so the length of the array carries no information. The file id
                // and the sync envelope do.
                rasterTileData.forEach((message) => expect(message.fileId).toEqual(fileOpen.fileId));
                expect(rasterTileData[0].endSync).toBe(false);
                expect(rasterTileData.slice(-1)[0].endSync).toBe(true);
                expect(rasterTileData.slice(-1)[0].tileCount).toEqual(requiredTiles.tiles.length);

                const cursorProfileStream = Stream(CARTA.SpatialProfileData, 1);
                msgController.setCursor(
                    assertItem.setCursor[index].fileId,
                    assertItem.setCursor[index].point.x,
                    assertItem.setCursor[index].point.y
                );
                const cursorProfile = await cursorProfileStream;
                expect(cursorProfile[0].fileId).toEqual(fileOpen.fileId);
                expect(cursorProfile[0].x).toEqual(assertItem.setCursor[index].point.x);
                expect(cursorProfile[0].y).toEqual(assertItem.setCursor[index].point.y);

                await assertFileIsOpen(fileOpen.fileId);
            },
            readFileTimeout
        );
    });
}

function assertBackendIsAlive() {
    const msgController = MessageController.Instance;
    test(`the backend is still alive | `, async () => {
        const backendStatus = await msgController.getFileList(
            assertItem.filelist.directory,
            assertItem.filelist.filterMode
        );
        expect(backendStatus).toBeDefined();
        expect(backendStatus.success).toBe(true);
        expect(backendStatus.directory).toContain('set_QA');
    });
}

let basepath: string;
describe('Test for Close one file (run1):', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
        msgController.closeFile(-1);
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

    test(`Get basepath and modify the directory path`, async () => {
        let fileListResponse = await msgController.getFileList('$BASE', 0);
        basepath = fileListResponse.directory;
        assertItem.filelist.directory = basepath + '/' + assertItem.filelist.directory;
        for (let i = 0; i < assertItem.fileOpen.length; i++) {
            assertItem.fileOpen[i].directory = basepath + '/' + assertItem.fileOpen[i].directory;
        }
    });

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
            readFileTimeout
        );

        test(
            `(Step 3) closing image 1 leaves image 0 streaming | `,
            async () => {
                msgController.closeFile(1);
                await assertFileIsClosed(1);
                await assertFileIsOpen(0);
            },
            readFileTimeout
        );

        test(
            `(Step 4) closing image 0 closes the last of the three | `,
            async () => {
                msgController.closeFile(0);
                await assertFileIsClosed(0);
            },
            readFileTimeout
        );

        assertBackendIsAlive();

        test(`(Step 5) There is no any ICD message returned:`, async () => {
            await assertNoFurtherMessage(msgController.messageReceiving());
        });
    });
    afterAll(() => msgController.closeConnection());
});

describe('Test for Close one file (run2):', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
        msgController.closeFile(-1);
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

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
            readFileTimeout
        );

        test(`(Step 3) close image 2 | `, () => {
            expect(msgController.closeFile(2)).toBe(true);
        });

        assertBackendIsAlive();

        test(
            `(Step 4) image 2 no longer answers | `,
            async () => {
                await assertFileIsClosed(2);
            },
            readFileTimeout
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
        await msgController.connect(testServerUrl);
        msgController.closeFile(-1);
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE);
    });

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
            readFileTimeout
        );

        assertBackendIsAlive();

        test(`(Step 3) There is no any ICD message returned:`, async () => {
            await assertNoFurtherMessage(msgController.messageReceiving());
        });
    });

    afterAll(() => msgController.closeConnection());
});
