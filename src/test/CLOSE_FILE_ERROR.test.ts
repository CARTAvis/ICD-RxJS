import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import {
    assertBackendIsAlive,
    assertCursorProfile,
    assertOpenFile,
    assertRasterTiles,
    assertSpatialProfile,
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
    fileOpen: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements;
    ErrorMessage: CARTA.IErrorData;
}

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    fileOpen: [
        {
            directory: TEST_SUBDIRECTORY,
            file: 'M17_SWex.fits',
            hdu: '0',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: TEST_SUBDIRECTORY,
            file: 'M17_SWex.hdf5',
            hdu: '0',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addRequiredTiles: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1,
            point: { x: 1, y: 1 },
        },
    ],
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
    },
    ErrorMessage: {
        tags: ['cursor'],
        message: 'File id 1 not found',
    },
};

describe('[Case 1] Test for requesting the ICD message of the CLOSED image:', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            await assertBasePath([assertItem.filelist, assertItem.fileOpen[0], assertItem.fileOpen[1]]);
        });

        test(
            `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${assertItem.fileOpen[0].file}" should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
            async () => {
                await assertOpenFile(assertItem.fileOpen[0], -1);
            },
            OPEN_FILE_TIMEOUT
        );

        test(
            `(Step 2) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${assertItem.fileOpen[1].file}" should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
            async () => {
                await assertOpenFile(assertItem.fileOpen[1]);
            },
            OPEN_FILE_TIMEOUT
        );

        test(`(Step 3) close fileId =1 & request ICD message of the closed fileId=1, then the backend is still alive:`, async () => {
            //close fileId =1
            msgController.closeFile(1);

            //request ICD message of the closed fileId=1
            const errorDataStream = Stream(CARTA.ErrorData, 1);
            msgController.setCursor(
                assertItem.setCursor[1].fileId,
                assertItem.setCursor[1].point.x,
                assertItem.setCursor[1].point.y
            );
            let ErrMesssage = await errorDataStream;
            expect(ErrMesssage[0].tags).toEqual(assertItem.ErrorMessage.tags);
            expect(ErrMesssage[0].message).toEqual(assertItem.ErrorMessage.message);

            //check the backend is still alive
            await assertBackendIsAlive(assertItem.filelist);
        });

        test(
            `(Step 4) fileId = 0 is still working well: RASTER_TILE_DATA and SPATIAL_PROFILE_DATA of file id ${assertItem.addRequiredTiles.fileId} | `,
            async () => {
                await assertTilesAndProfiles(
                    assertItem.addRequiredTiles,
                    assertItem.setCursor[0],
                    assertItem.setSpatialReq
                );
            },
            READ_FILE_TIMEOUT
        );

        afterAll(() => msgController.closeConnection());
    });
});

describe('[Case 2] Open=>Close=>Open of fileId=0, and then check the backend alive:', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        test(
            `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${assertItem.fileOpen[0].file}" should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
            async () => {
                await assertOpenFile(assertItem.fileOpen[0], -1);
            },
            OPEN_FILE_TIMEOUT
        );

        test(
            `(Step 2) RASTER_TILE_DATA and SPATIAL_PROFILE_DATA of file id ${assertItem.addRequiredTiles.fileId} | `,
            async () => {
                await assertTilesAndProfiles(
                    assertItem.addRequiredTiles,
                    assertItem.setCursor[0],
                    assertItem.setSpatialReq
                );
            },
            READ_FILE_TIMEOUT
        );

        test(
            `(Step 3) Closed and Re-open `,
            async () => {
                //Close fileid=0
                msgController.closeFile(0);

                //Re-open fileid=0
                await assertOpenFile(assertItem.fileOpen[0]);

                //ICD messages work fine?
                await assertRasterTiles(assertItem.addRequiredTiles);
                await assertCursorProfile(assertItem.setCursor[0]);
                await assertSpatialProfile(assertItem.setSpatialReq);
            },
            OPEN_FILE_TIMEOUT
        );

        test(`the backend is still alive | `, async () => {
            await assertBackendIsAlive(assertItem.filelist);
        });

        afterAll(() => msgController.closeConnection());
    });
});
