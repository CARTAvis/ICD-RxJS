import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
}
let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: 'tu2310418.fits.gz',
        hdu: '0',
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
        point: { x: 2268, y: 2467 },
    },
};

let basepath: string;
describe('Open a fit.gz image:', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + '/' + assertItem.openFile.directory;
        });

        describe(`query the info of opened file: ${assertItem.openFile.file}`, () => {
            let OpenFileAck: any;
            test(
                `(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,
                async () => {
                    OpenFileAck = await msgController.loadFile(assertItem.openFile);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileAck.success).toBe(true);
                    expect(OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
                },
                openFileTimeout
            );

            test(
                `(Step 2) return RASTER_TILE_DATA(Stream) and check total length `,
                async () => {
                    msgController.setCursor(
                        assertItem.setCursor.fileId,
                        assertItem.setCursor.point.x,
                        assertItem.setCursor.point.y
                    );
                    let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);

                    msgController.addRequiredTiles(assertItem.addRequiredTiles);
                    let RasterTileDataResponse = await Stream(
                        CARTA.RasterTileData,
                        assertItem.addRequiredTiles.tiles.length + 2
                    );
                    expect(RasterTileDataResponse[0].tileCount).toEqual(assertItem.addRequiredTiles.tiles.length);
                },
                readFileTimeout
            );
        });

        afterAll(() => msgController.closeConnection());
    });
});
