import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import { assertBackendIsAlive, assertOpenFile, assertTilesAndProfiles } from './CloseFileHelpers';
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
    fileOpen: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setImageChannel: CARTA.ISetImageChannels;
}

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    fileOpen: {
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
    setImageChannel: {
        fileId: 0,
        channel: 10,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [
                33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721,
                33566720, 33566722,
            ],
        },
    },
};

describe('Testing CLOSE_FILE with large-size image and test CLOSE_FILE during the TILE data streaming :', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            await assertBasePath([assertItem.fileOpen, assertItem.filelist]);
        });

        test(
            `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${assertItem.fileOpen.file}" should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
            async () => {
                await assertOpenFile(assertItem.fileOpen, -1);
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

        test(`(Step 3) Set SET_IMAGE_CHANNELS and then CLOSE_FILE during the tile streaming & Check whether the backend is alive:`, async () => {
            msgController.setChannels(assertItem.setImageChannel);
            // Interupt during the tile, we will receive the number <  assertItem.setImageChannel.requiredTiles.tiles.length
            let ReceiveData = await Stream(CARTA.RasterTileData, 2);
            // CLOSE_FILE during the tile streaming
            msgController.closeFile(0);

            await assertBackendIsAlive(assertItem.filelist);
        });

        afterAll(() => msgController.closeConnection());
    });
});
