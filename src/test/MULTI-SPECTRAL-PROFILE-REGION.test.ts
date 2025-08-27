import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    ReturnSpectralProfileRawValuesFp64Index: number[];
    ReturnSpectralProfileRawValuesFp64Number1: Number[];
    ReturnSpectralProfileRawValuesFp64Number2: Number[];
}
let assertItem: AssertItem = {
    precisionDigits: 7,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: 'HD163296_CO_2_1.fits',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },

    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [16777216, 16781312, 16777217, 16781313],
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 210, y: 220 },
                    { x: 50, y: 50 },
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
                    { x: 150, y: 170 },
                    { x: 35, y: 35 },
                ],
                rotation: 0.0,
            },
        },
    ],
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 2,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
    ],
    ReturnSpectralProfileRawValuesFp64Index: [0, 100, 300, 900, 1200, 1500, 1800, 1900, 1999],
    ReturnSpectralProfileRawValuesFp64Number1: [116, 88, 207, 169, 228, 162, 0, 0, 0],
    ReturnSpectralProfileRawValuesFp64Number2: [232, 201, 141, 49, 140, 163, 0, 0, 0],
};

let basepath: string;
describe('MULTI-SPECTRAL-PROFILE-REGION: Test plotting the multi-spectral profiles with two regions in one image', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            msgController.closeFile(-1);
            assertItem.openFile.directory = basepath + '/' + assertItem.openFile.directory;
        });

        describe(`Prepare the image`, () => {
            test(
                `Should open image ${assertItem.openFile.file}:`,
                async () => {
                    let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
                },
                openFileTimeout
            );

            test(`return RASTER_TILE_DATA(Stream) and check total length`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq);
                let RasterTileDataResponse = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq.tiles.length + 2
                );

                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);
            });
        });

        describe(`Plot multi regions in the spectral profiler:`, () => {
            test(`Set two Regions in the images`, async () => {
                let setRegionAckResponse = await msgController.setRegion(
                    assertItem.setRegion[0].fileId,
                    assertItem.setRegion[0].regionId,
                    assertItem.setRegion[0].regionInfo
                );
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);

                let setRegionAckResponse2 = await msgController.setRegion(
                    assertItem.setRegion[1].fileId,
                    assertItem.setRegion[1].regionId,
                    assertItem.setRegion[1].regionInfo
                );
                expect(setRegionAckResponse2.regionId).toEqual(2);
                expect(setRegionAckResponse2.success).toEqual(true);
            });

            test(`Plot the frist region's spectral profiles data and check the values`, async () => {
                let spectralProfileProgressArray = [];
                let spectralProfileProgressPromise = new Promise((resolve) => {
                    msgController.spectralProfileStream.subscribe({
                        next: (data) => {
                            spectralProfileProgressArray.push(data);
                            if (Math.round(data.progress) == 1) {
                                resolve(spectralProfileProgressArray);
                            }
                        },
                    });
                });

                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
                let SecondRegionSpectralProfile: any = await spectralProfileProgressPromise;
                SecondRegionSpectralProfile = SecondRegionSpectralProfile.slice(-1)[0];
                expect(SecondRegionSpectralProfile.regionId).toEqual(2);
                expect(SecondRegionSpectralProfile.progress).toEqual(1);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(SecondRegionSpectralProfile.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64Number1[index]
                    );
                });
            });

            test(`Plot the second region's spectral profiles data and check the values`, async () => {
                let spectralProfileProgressArray2 = [];
                let spectralProfileProgressPromise2 = new Promise((resolve) => {
                    msgController.spectralProfileStream.subscribe({
                        next: (data) => {
                            spectralProfileProgressArray2.push(data);
                            if (Math.round(data.progress) == 1) {
                                resolve(spectralProfileProgressArray2);
                            }
                        },
                    });
                });

                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[1]);
                let FirstRegionSpectralProfile: any = await spectralProfileProgressPromise2;
                FirstRegionSpectralProfile = FirstRegionSpectralProfile.slice(-1)[0];
                expect(FirstRegionSpectralProfile.regionId).toEqual(1);
                expect(FirstRegionSpectralProfile.progress).toEqual(1);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(FirstRegionSpectralProfile.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64Number2[index]
                    );
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
