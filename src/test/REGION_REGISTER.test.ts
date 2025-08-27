import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/myClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;
let returnTimeout = config.timeout.messageEvent;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    failedRegion: CARTA.ISetRegion;
}
let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: 'M17_SWex.fits',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: {
        tiles: [0],
        fileId: 0,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 197.0, y: 489.0 },
                    { x: 10.0, y: 10.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 306.0, y: 670.0 },
                    { x: 20.0, y: 48.0 },
                ],
                rotation: 27.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 551.0, y: 330.0 },
                    { x: 30.0, y: 15.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 580.0, y: 240.0 },
                    { x: 35.0, y: 35.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 552.0, y: 184.0 },
                    { x: 350.0, y: 18.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 635.0, y: 128.0 },
                    { x: 25.0, y: 48.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 694.0, y: 80.0 },
                    { x: 25.0, y: 33.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 84.0, y: 491.0 },
                    { x: 10.0, y: 10.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 43.0, y: 491.0 },
                    { x: 10.0, y: 10.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: -1.0, y: 491.0 },
                    { x: 10.0, y: 10.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: -14.0, y: 491.0 },
                    { x: 10.0, y: 10.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 197.0, y: 489.0 },
                    { x: 10.0, y: 10.0 },
                ],
                rotation: 0.0,
            },
        },
    ],
    regionAck: [
        { regionId: 1 },
        { regionId: 2 },
        { regionId: 3 },
        { regionId: 4 },
        { regionId: 5 },
        { regionId: 6 },
        { regionId: 7 },
        { regionId: 1 },
        { regionId: 1 },
        { regionId: 1 },
        { regionId: 1 },
        { regionId: 1 },
    ],
    failedRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [
                { x: 551.0, y: 330.0 },
                { x: 30.0, y: 15.0 },
            ],
            rotation: 30.0,
        },
    },
};

let basepath: string;
describe('REGION_REGISTER: Testing region creation and modification', () => {
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

        let regionHistogramData = [];
        test(
            `Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
            async () => {
                msgController.closeFile(-1);
                let regionHistogramDataPromise = new Promise((resolve) => {
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data);
                            resolve(regionHistogramData);
                        },
                    });
                });
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let RegionHistogramData = await regionHistogramDataPromise;

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            },
            openFileTimeout
        );

        test(
            `Return RASTER_TILE_DATA(Stream) and check total length | `,
            async () => {
                msgController.addRequiredTiles(assertItem.addRequiredTiles);
                let RasterTileDataResponse = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addRequiredTiles.tiles.length + 2
                );

                msgController.setCursor(
                    assertItem.setCursor.fileId,
                    assertItem.setCursor.point.x,
                    assertItem.setCursor.point.y
                );
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData, 1);

                expect(RasterTileDataResponse.length).toEqual(3); //RasterTileSync: start & end + 1 Tile returned
            },
            readFileTimeout
        );

        assertItem.setRegion.map((region, index) => {
            describe(`${region.regionId < 0 ? 'Creating' : 'Modify'} ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId} on ${JSON.stringify(region.regionInfo.controlPoints)}`, () => {
                let SetRegionAck: any;
                test(
                    `SET_REGION_ACK should return within ${regionTimeout} ms`,
                    async () => {
                        SetRegionAck = await msgController.setRegion(region.fileId, region.regionId, region.regionInfo);
                    },
                    regionTimeout
                );

                test('SET_REGION_ACK.success = True', () => {
                    expect(SetRegionAck.success).toBe(true);
                });

                test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[index].regionId}`, () => {
                    expect(SetRegionAck.regionId).toEqual(assertItem.regionAck[index].regionId);
                });
            });
        });

        describe('Remove region #3', () => {
            beforeAll(async () => {
                let removeRegion = msgController.removeRegion(3);
                expect(removeRegion).toEqual(true);
            });

            test(`(Step 3) There is no any ICD message returned:`, (done) => {
                let receiveNumberCurrent = msgController.messageReceiving();
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 500 ms
                    done();
                }, 500);
            });

            describe('Modify region #3', () => {
                let SetRegionAck: any;
                test(
                    `SET_REGION_ACK should return within ${regionTimeout} ms`,
                    async () => {
                        SetRegionAck = await msgController.setRegion(
                            assertItem.failedRegion.fileId,
                            assertItem.failedRegion.regionId,
                            assertItem.failedRegion.regionInfo
                        );
                    },
                    regionTimeout
                );

                test('SET_REGION_ACK.success = true', () => {
                    expect(SetRegionAck.success).toBe(true);
                });

                test(`SET_REGION_ACK.region_id = 8`, () => {
                    expect(SetRegionAck.regionId).toEqual(8);
                });
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});
