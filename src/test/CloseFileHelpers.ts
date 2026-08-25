import { CARTA } from 'carta-protobuf';
import { Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

/**
 * Shared fixtures and steps for the CLOSE_FILE_* tests. Every one of them opens one or more
 * images, closes a file at some point of the streaming, and then checks that the backend is
 * still alive, so the preparation is registered from here and only the close itself differs.
 *
 * The functions come in two levels: the ones named test* register a jest test, while the ones
 * named assert* are plain assertions, for the tests which close a file in the middle of a
 * longer step of their own.
 */

export const TEST_SERVER_URL: string = config.serverURL0;
export const TEST_SUBDIRECTORY: string = config.path.QA;
export const CONNECTION_TIMEOUT: number = config.timeout.connection;
export const OPEN_FILE_TIMEOUT: number = config.timeout.openFile;
export const READ_FILE_TIMEOUT: number = config.timeout.readFile;
// CLOSE_FILE is not acknowledged in the ICD, so the only thing which can be observed
// directly after it is silence. This is how long silence is waited for.
export const QUIET_TIME: number = config.timeout.messageEvent;

/**
 * Resolve "$BASE" and prepend it to the directory of every request given. The requests are
 * modified in place, so a file which registers more than one describe block has to pass each
 * of them once only.
 */
export function testBasePath(requests: { directory?: string }[]) {
    test(`Get basepath and modify the directory path`, async () => {
        const fileListResponse = await MessageController.Instance.getFileList('$BASE', 0);
        const basepath = fileListResponse.directory;
        requests.forEach((request) => {
            request.directory = basepath + '/' + request.directory;
        });
    });
}

/** The backend has to have sent nothing since the count was taken. */
export async function assertNoFurtherMessage(expectedMessageCount: number) {
    await new Promise((resolve) => setTimeout(resolve, QUIET_TIME));
    expect(MessageController.Instance.messageReceiving()).toEqual(expectedMessageCount);
}

/**
 * A file list request is answered by the session itself rather than by any open image, so it
 * still succeeds once every file has been closed.
 */
export async function assertBackendIsAlive(filelist: CARTA.IFileListRequest) {
    const backendStatus = await MessageController.Instance.getFileList(filelist.directory, filelist.filterMode);
    expect(backendStatus).toBeDefined();
    expect(backendStatus.success).toBe(true);
    expect(backendStatus.directory).toContain('set_QA');
}

export function testBackendIsAlive(filelist: CARTA.IFileListRequest) {
    test(`the backend is still alive | `, async () => {
        await assertBackendIsAlive(filelist);
    });
}

export async function assertOpenFile(fileOpen: CARTA.IOpenFile): Promise<CARTA.IOpenFileAck> {
    const msgController = MessageController.Instance;
    const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
    const openFileResponse = await msgController.loadFile(fileOpen);
    const regionHistogramData = await regionHistogramDataStream;
    expect(openFileResponse.success).toBe(true);
    expect(openFileResponse.fileInfo.name).toEqual(fileOpen.file);
    expect(openFileResponse.fileId).toEqual(fileOpen.fileId);
    expect(regionHistogramData[0].fileId).toEqual(fileOpen.fileId);
    return openFileResponse;
}

/**
 * `closeFileFirst` is the file id to close before the image is opened, -1 for all of them.
 * Omit it to open the image on top of whatever the session already holds.
 */
export function testOpenFile(step: string, fileOpen: CARTA.IOpenFile, closeFileFirst?: number) {
    test(
        `${step} OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of "${fileOpen.file}" should arrive within ${OPEN_FILE_TIMEOUT} ms | `,
        async () => {
            if (closeFileFirst !== undefined) {
                MessageController.Instance.closeFile(closeFileFirst);
            }
            await assertOpenFile(fileOpen);
        },
        OPEN_FILE_TIMEOUT
    );
}

export async function assertRasterTiles(requiredTiles: CARTA.IAddRequiredTiles): Promise<CARTA.RasterTileData[]> {
    const msgController = MessageController.Instance;
    // RasterTileSync start & end, plus one RasterTileData per requested tile
    const rasterTileDataStream = Stream(CARTA.RasterTileData, requiredTiles.tiles.length + 2);
    msgController.addRequiredTiles(requiredTiles);
    const rasterTileData = await rasterTileDataStream;
    // Stream resolves as soon as it has collected the number of messages it was asked for, so
    // the length of the array carries no information. The file id and the sync envelope do.
    rasterTileData.forEach((message) => expect(message.fileId).toEqual(requiredTiles.fileId));
    expect(rasterTileData[0].endSync).toBe(false);
    expect(rasterTileData.slice(-1)[0].endSync).toBe(true);
    expect(rasterTileData.slice(-1)[0].tileCount).toEqual(requiredTiles.tiles.length);
    return rasterTileData;
}

export async function assertCursorProfile(setCursor: CARTA.ISetCursor): Promise<CARTA.SpatialProfileData> {
    const msgController = MessageController.Instance;
    const cursorProfileStream = Stream(CARTA.SpatialProfileData, 1);
    msgController.setCursor(setCursor.fileId, setCursor.point.x, setCursor.point.y);
    const cursorProfile = await cursorProfileStream;
    expect(cursorProfile[0].fileId).toEqual(setCursor.fileId);
    expect(cursorProfile[0].x).toEqual(setCursor.point.x);
    expect(cursorProfile[0].y).toEqual(setCursor.point.y);
    return cursorProfile[0];
}

/**
 * Ask a file which should be open for its spatial profile. The file id on the response is the
 * point of the check: closing one file must neither silence another file nor redirect its
 * stream.
 */
export async function assertSpatialProfile(
    setSpatialReq: CARTA.ISetSpatialRequirements
): Promise<CARTA.SpatialProfileData> {
    const msgController = MessageController.Instance;
    const spatialProfileDataStream = Stream(CARTA.SpatialProfileData, 1);
    msgController.setSpatialRequirements(setSpatialReq);
    const spatialProfileData = await spatialProfileDataStream;
    expect(spatialProfileData[0].fileId).toEqual(setSpatialReq.fileId);
    expect(spatialProfileData[0].regionId).toEqual(setSpatialReq.regionId);
    expect(spatialProfileData[0].profiles.map((profile) => profile.coordinate)).toEqual(
        setSpatialReq.spatialProfiles.map((profile) => profile.coordinate)
    );
    return spatialProfileData[0];
}

export function testTilesAndProfiles(
    step: string,
    requiredTiles: CARTA.IAddRequiredTiles,
    setCursor: CARTA.ISetCursor,
    setSpatialReq: CARTA.ISetSpatialRequirements
) {
    test(
        `${step} RASTER_TILE_DATA and SPATIAL_PROFILE_DATA of file id ${requiredTiles.fileId} | `,
        async () => {
            await assertRasterTiles(requiredTiles);
            await assertCursorProfile(setCursor);
            await assertSpatialProfile(setSpatialReq);
        },
        READ_FILE_TIMEOUT
    );
}
