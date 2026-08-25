import { CARTA } from 'carta-protobuf';
import { checkConnection } from './MyClient';
import { MessageController } from './MessageController';
import { assertNoFurtherMessage, testBackendIsAlive, testOpenFile, testTilesAndProfiles } from './CloseFileHelpers';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL, TEST_SUBDIRECTORY, basePath } from './CommonHelpers';

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
        basePath([assertItem.openFile, assertItem.filelist]);
        testOpenFile('(Step 1)', assertItem.openFile, -1);
        testTilesAndProfiles('(Step 2)', assertItem.addRequiredTiles, assertItem.setCursor, assertItem.setSpatialReq);

        test(`(Step 3) close image and check there is no receiving message`, async () => {
            msgController.closeFile(0);
            await assertNoFurtherMessage(msgController.messageReceiving());
        });

        testBackendIsAlive(assertItem.filelist);

        afterAll(() => msgController.closeConnection());
    });
});
