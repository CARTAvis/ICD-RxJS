import { CARTA } from 'carta-protobuf';
import { checkConnection } from './MyClient';
import { MessageController } from './MessageController';
import {
    assertBackendIsAlive,
    assertNoFurtherMessage,
    assertOpenFile,
    assertTilesAndProfiles,
} from './CloseFileHelpers';
import {
    CONNECTION_TIMEOUT,
    OPEN_FILE_TIMEOUT,
    READ_FILE_TIMEOUT,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    assertBasePath,
} from './CommonHelpers';

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
}

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    openFile: {
        directory: TEST_SUBDIRECTORY,
        file: 'M17_SWex.fits',
        hdu: '',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
    },
};

describe('Test for Close single file:', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            await assertBasePath([assertItem.openFile, assertItem.filelist]);
        });

        test(
            `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${assertItem.openFile.file}" should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
            async () => {
                await assertOpenFile(assertItem.openFile, -1);
            },
            OPEN_FILE_TIMEOUT
        );

        test(
            `(Step 2) RASTER_TILE_DATA and SPATIAL_PROFILE_DATA of file id ${assertItem.addRequiredTiles.fileId} | `,
            async () => {
                await assertTilesAndProfiles(
                    assertItem.addRequiredTiles,
                    assertItem.setCursor,
                    assertItem.setSpatialReq
                );
            },
            READ_FILE_TIMEOUT
        );

        test(`(Step 3) close image and check there is no receiving message`, async () => {
            msgController.closeFile(0);
            await assertNoFurtherMessage(msgController.messageReceiving());
        });

        test(`the backend is still alive | `, async () => {
            await assertBackendIsAlive(assertItem.filelist);
        });

        afterAll(() => msgController.closeConnection());
    });
});
