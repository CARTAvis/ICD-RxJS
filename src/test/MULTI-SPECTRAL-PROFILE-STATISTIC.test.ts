import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/MyClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    ReturnSpectralProfileRawValuesFp64Index: number[];
    ReturnSpectralProfileRawValuesFp64Number1: Number[];
    ReturnSpectralProfileRawValuesFp64Number2: Number[];
    ReturnSpectralProfileRawValuesFp64Number3: Number[];
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
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [
                { x: 210, y: 220 },
                { x: 100, y: 100 },
            ],
            rotation: 0.0,
        },
    },
    setSpectralRequirements: [
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
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [CARTA.StatsType.RMS],
                },
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [CARTA.StatsType.RMS, CARTA.StatsType.Sigma],
                },
            ],
        },
    ],
    ReturnSpectralProfileRawValuesFp64Index: [0, 300, 600, 900, 1000, 1200, 1500, 1800, 1900],
    ReturnSpectralProfileRawValuesFp64Number1: [137, 109, 45, 117, 155, 140, 36, 0, 0],
    ReturnSpectralProfileRawValuesFp64Number2: [125, 53, 60, 185, 122, 183, 124, 0, 0],
    ReturnSpectralProfileRawValuesFp64Number3: [25, 80, 41, 210, 250, 176, 70, 0, 0],
};

let basepath: string;
describe('MULTI-SPECTRAL-PROFILE-STATISTIC: Test plotting the multi-spectral profiles with setting multi statistics in one region', () => {
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

        describe(`Plot multi statistics in one region in the spectral profiler:`, () => {
            test(`Set one Region in the images`, async () => {
                let setRegionAckResponse = await msgController.setRegion(
                    assertItem.setRegion.fileId,
                    assertItem.setRegion.regionId,
                    assertItem.setRegion.regionInfo
                );
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            describe(`Plot the statistics in the spectral profiles and check the values separately`, () => {
                test(`Plot the first statistics MEAN in the spectral profiles and check the values`, async () => {
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
                    let spectralProfileProgressReponse: any = await spectralProfileProgressPromise;
                    spectralProfileProgressReponse = spectralProfileProgressReponse.slice(-1)[0];
                    expect(spectralProfileProgressReponse.regionId).toEqual(1);
                    expect(spectralProfileProgressReponse.progress).toEqual(1);
                    expect(spectralProfileProgressReponse.profiles[0].coordinate).toEqual('z');
                    expect(spectralProfileProgressReponse.profiles[0].statsType).toEqual(CARTA.StatsType.Mean);
                    assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                        expect(spectralProfileProgressReponse.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                            assertItem.ReturnSpectralProfileRawValuesFp64Number1[index]
                        );
                    });
                });

                test(`Plot the second statistics RMS in the spectral profiles and check the values`, async () => {
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
                    let spectralProfileProgressReponse2: any = await spectralProfileProgressPromise2;
                    spectralProfileProgressReponse2 = spectralProfileProgressReponse2.slice(-1)[0];
                    expect(spectralProfileProgressReponse2.regionId).toEqual(1);
                    expect(spectralProfileProgressReponse2.progress).toEqual(1);
                    expect(spectralProfileProgressReponse2.profiles[0].coordinate).toEqual('z');
                    expect(spectralProfileProgressReponse2.profiles[0].statsType).toEqual(CARTA.StatsType.RMS);
                    assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                        expect(spectralProfileProgressReponse2.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                            assertItem.ReturnSpectralProfileRawValuesFp64Number2[index]
                        );
                    });
                });
            });

            describe(`Plot two statistics method in the spectral profiles`, () => {
                test(`Request plotting RMS & SIGMA and check the values:`, async () => {
                    let spectralProfileProgressArray3 = [];
                    let spectralProfileProgressPromise3 = new Promise((resolve) => {
                        msgController.spectralProfileStream.subscribe({
                            next: (data) => {
                                spectralProfileProgressArray3.push(data);
                                if (Math.round(data.progress) == 1) {
                                    resolve(spectralProfileProgressArray3);
                                }
                            },
                        });
                    });

                    msgController.setSpectralRequirements(assertItem.setSpectralRequirements[2]);
                    let spectralProfileProgressReponse3: any = await spectralProfileProgressPromise3;
                    spectralProfileProgressReponse3 = spectralProfileProgressReponse3.slice(-1)[0];
                    expect(spectralProfileProgressReponse3.regionId).toEqual(1);
                    expect(spectralProfileProgressReponse3.progress).toEqual(1);
                    expect(spectralProfileProgressReponse3.profiles[0].coordinate).toEqual('z');
                    expect(spectralProfileProgressReponse3.profiles[0].statsType).toEqual(CARTA.StatsType.Sigma);
                    assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                        expect(spectralProfileProgressReponse3.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                            assertItem.ReturnSpectralProfileRawValuesFp64Number3[index]
                        );
                    });
                });
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});
