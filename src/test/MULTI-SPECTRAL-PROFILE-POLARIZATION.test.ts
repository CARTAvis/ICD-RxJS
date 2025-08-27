import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
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
    openFile: {
        directory: testSubdirectory,
        file: 'HH211_IQU.fits',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },

    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
    },
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [
                { x: 520, y: 520 },
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
                    coordinate: 'Iz',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'Iz',
                    statsTypes: [CARTA.StatsType.Mean],
                },
                {
                    coordinate: 'Qz',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'Qz',
                    statsTypes: [CARTA.StatsType.Mean],
                },
                {
                    coordinate: 'Iz',
                    statsTypes: [CARTA.StatsType.Mean],
                },
                {
                    coordinate: 'Uz',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
    ],
    ReturnSpectralProfileRawValuesFp64Index: [0, 5, 10, 15, 20, 25, 30, 35, 39],
    ReturnSpectralProfileRawValuesFp64Number1: [202, 58, 229, 63, 220, 156, 70, 189, 63],
    ReturnSpectralProfileRawValuesFp64Number2: [10, 1, 168, 190, 232, 120, 204, 28, 190],
    ReturnSpectralProfileRawValuesFp64Number3: [211, 167, 75, 62, 249, 74, 233, 192, 63],
};

let basepath: string;
describe('MULTI-SPECTRAL-PROFILE-POLARIZATION: Test plotting the multi-spectral profiles with setting multi polarizations in one region', () => {
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

        describe(`Plot multi polarizations for one region in the spectral profiler widget:`, () => {
            test(`Set one Region in the images`, async () => {
                let setRegionAckResponse = await msgController.setRegion(
                    assertItem.setRegion.fileId,
                    assertItem.setRegion.regionId,
                    assertItem.setRegion.regionInfo
                );
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            test(`Plot the first polarizations Iz in the spectral profiles and check the values`, async () => {
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
                expect(spectralProfileProgressReponse.profiles[0].coordinate).toEqual('Iz');
                expect(spectralProfileProgressReponse.profiles[0].statsType).toEqual(CARTA.StatsType.Mean);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(spectralProfileProgressReponse.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64Number1[index]
                    );
                });
            });

            test(`Adding the second polarizations Qz in the spectral profiles and check the values`, async () => {
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
                expect(spectralProfileProgressReponse2.profiles[0].coordinate).toEqual('Qz');
                expect(spectralProfileProgressReponse2.profiles[0].statsType).toEqual(CARTA.StatsType.Mean);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(spectralProfileProgressReponse2.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64Number2[index]
                    );
                });
            });

            test(`Adding the third polarizations Qz in the spectral profiles and check the values`, async () => {
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
                expect(spectralProfileProgressReponse3.profiles[0].coordinate).toEqual('Uz');
                expect(spectralProfileProgressReponse3.profiles[0].statsType).toEqual(CARTA.StatsType.Mean);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(spectralProfileProgressReponse3.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64Number3[index]
                    );
                });
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});
