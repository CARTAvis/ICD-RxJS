import { CARTA } from 'carta-protobuf';
import { Stream } from './MyClient';
import { MessageController } from './MessageController';
import { QUIET_TIME } from './CommonHelpers';

/**
 * Shared steps for the CLOSE_FILE_* tests. Every one of them opens one or more images, closes
 * a file at some point of the streaming, and then checks that the backend is still alive, so
 * the preparation lives here and only the close itself differs.
 *
 * These are plain assertions rather than jest tests: the test titles and timeouts belong to
 * the test files, so that every test( ) a file registers can be read there.
 */

/**
 * The backend has to have sent nothing since the count was taken. CLOSE_FILE is not
 * acknowledged in the ICD, so silence is the only thing which can be observed directly after
 * it.
 */
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

/**
 * `closeFileFirst` is the file id to close before the image is opened, -1 for all of them.
 * Omit it to open the image on top of whatever the session already holds.
 */
export async function assertOpenFile(fileOpen: CARTA.IOpenFile, closeFileFirst?: number): Promise<CARTA.IOpenFileAck> {
    const msgController = MessageController.Instance;
    if (closeFileFirst !== undefined) {
        msgController.closeFile(closeFileFirst);
    }
    const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
    const openFileResponse = await msgController.loadFile(fileOpen);
    const regionHistogramData = await regionHistogramDataStream;
    expect(openFileResponse.success).toBe(true);
    expect(openFileResponse.fileInfo.name).toEqual(fileOpen.file);
    expect(openFileResponse.fileId).toEqual(fileOpen.fileId);
    expect(regionHistogramData[0].fileId).toEqual(fileOpen.fileId);
    return openFileResponse;
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

export async function assertTilesAndProfiles(
    requiredTiles: CARTA.IAddRequiredTiles,
    setCursor: CARTA.ISetCursor,
    setSpatialReq: CARTA.ISetSpatialRequirements
) {
    await assertRasterTiles(requiredTiles);
    await assertCursorProfile(setCursor);
    await assertSpatialProfile(setSpatialReq);
}
