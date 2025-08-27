import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/myClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';
import { take } from 'rxjs/operators';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    SpatialProfileData: CARTA.ISpatialProfileData[];
    setImageChannel: CARTA.ISetImageChannels[];
    setRegion: CARTA.ISetRegion;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    ReturnSpectralProfileRawValuesFp64Index: number[];
    ReturnSpectralProfileRawValuesFp64NumberFirst: Number[];
    ReturnSpectralProfileRawValuesFp64NumberSecond: Number[];
}
let assertItem: AssertItem = {
    precisionDigits: 7,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: 'HD163296_CO_2_1.fits',
            fileId: 0,
            hdu: '',
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'HD163296_13CO_2-1.fits',
            fileId: 1,
            hdu: '',
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16781312, 16777217, 16781313],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16781312, 16777217, 16781313],
        },
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 216, y: 216 },
        },
        {
            fileId: 1,
            point: { x: 216, y: 216 },
        },
    ],
    SpatialProfileData: [
        {
            profiles: [],
            x: 216,
            y: 216,
            value: 0.004661305341869593,
        },
        {
            profiles: [],
            x: 216,
            y: 216,
            value: 0.0016310831997543573,
        },
    ],
    setImageChannel: [
        {
            fileId: 1,
            channel: 109,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [
                { x: 213, y: 277 },
                { x: 100, y: 100 },
            ],
            rotation: 0.0,
        },
    },
    setSpectralRequirements: [
        {
            fileId: 1,
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
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
    ],
    ReturnSpectralProfileRawValuesFp64Index: [0, 100, 200, 300, 400, 500, 600, 700, 800],
    ReturnSpectralProfileRawValuesFp64NumberFirst: [101, 95, 225, 189, 117, 237, 74, 88, 52],
    ReturnSpectralProfileRawValuesFp64NumberSecond: [101, 95, 225, 189, 117, 237, 74, 88, 52],
};

let basepath: string;
describe('MULTI-SPECTRAL-PROFILE-IMAGE: Test plotting the multi-spectral profiles with two matched images', () => {
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
            assertItem.openFile.map((input, index) => {
                assertItem.openFile[index].directory = basepath + '/' + assertItem.openFile[index].directory;
            });
        });

        describe(`Prepare the first images`, () => {
            test(
                `Should open the first image ${assertItem.openFile[0].file}:`,
                async () => {
                    let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[0].file);
                },
                openFileTimeout
            );

            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileDataResponse = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq[0].tiles.length + 2
                );

                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq[0].tiles.length + 2);
            });
        });

        describe(`Prepare the second images`, () => {
            test(
                `Should open the second image ${assertItem.openFile[1].file}:`,
                async () => {
                    let OpenFileResponse = await msgController.loadFile(assertItem.openFile[1]);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[1].file);
                },
                openFileTimeout
            );

            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let RasterTileDataResponse = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq[1].tiles.length + 2
                );

                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq[1].tiles.length + 2);
            });
        });

        describe(`Plot multi image in the spectral profiler:`, () => {
            test(`Set two images in tile=[0]`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[2]);
                let RasterTileDataResponse3 = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq[2].tiles.length + 2
                );
                msgController.addRequiredTiles(assertItem.addTilesReq[3]);
                let RasterTileDataResponse4 = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq[3].tiles.length + 2
                );

                expect(RasterTileDataResponse3.length).toEqual(assertItem.addTilesReq[2].tiles.length + 2);
                expect(RasterTileDataResponse4.length).toEqual(assertItem.addTilesReq[3].tiles.length + 2);
                RasterTileDataResponse4.map((input) => {
                    if (Object.keys(input).includes('tiles')) {
                        expect(input.fileId).toEqual(1);
                    }
                });
            });

            let regionHistogramData = [];
            let SpatialProfileData = [];
            test(`Match spatial and spectral of two images`, async () => {
                let regionHistogramDataPromise = new Promise((resolve) => {
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            regionHistogramData.push(data);
                            resolve(regionHistogramData);
                        },
                    });
                });

                let SpatialProfileDataPromise = new Promise((resolve) => {
                    msgController.spatialProfileStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            SpatialProfileData.push(data);
                            resolve(SpatialProfileData);
                        },
                    });
                });
                msgController.setCursor(
                    assertItem.setCursor[0].fileId,
                    assertItem.setCursor[0].point.x,
                    assertItem.setCursor[0].point.y
                );
                msgController.setCursor(
                    assertItem.setCursor[1].fileId,
                    assertItem.setCursor[1].point.x,
                    assertItem.setCursor[1].point.y
                );

                let spectralProfileDataResponse = await Stream(CARTA.SpatialProfileData, 2);
                let receiveValue = [spectralProfileDataResponse[0].value, spectralProfileDataResponse[1].value];
                expect(receiveValue).toContain(assertItem.SpatialProfileData[0].value);
                expect(receiveValue).toContain(assertItem.SpatialProfileData[1].value);

                msgController.setChannels(assertItem.setImageChannel[0]);
                let RasterTileDataResponse5 = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesReq[3].tiles.length + 2
                );
                let RegionHistogramData5 = await regionHistogramDataPromise;
                let spectralProfileDataResponse5 = await SpatialProfileDataPromise;
                let total5Count =
                    RegionHistogramData5.length + spectralProfileDataResponse5.length + RasterTileDataResponse5.length;
                expect(total5Count).toEqual(5);
            });

            test(`Set a Region in one of the images`, async () => {
                let setRegionAckResponse = await msgController.setRegion(
                    assertItem.setRegion.fileId,
                    assertItem.setRegion.regionId,
                    assertItem.setRegion.regionInfo
                );
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            test(`Plot two images' spectral profiles and check the values`, async () => {
                let spectralProfileProgressArray = [];
                let spectralProfileProgressPromise = new Promise((resolve) => {
                    msgController.spectralProfileStream.subscribe({
                        next: (data) => {
                            spectralProfileProgressArray.push(data);
                            if (Math.round(data.progress) > 0.99) {
                                resolve(spectralProfileProgressArray);
                            }
                        },
                    });
                });

                let spectralProfileProgressArray2 = [];
                let spectralProfileProgressPromise2 = new Promise((resolve) => {
                    msgController.spectralProfileStream.subscribe({
                        next: (data) => {
                            spectralProfileProgressArray2.push(data);
                            if (Math.round(data.progress) > 0.99) {
                                resolve(spectralProfileProgressArray2);
                            }
                        },
                    });
                });

                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
                let spectralProfileProgressReponse: any = await spectralProfileProgressPromise;
                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[1]);
                let spectralProfileProgressReponse2: any = await spectralProfileProgressPromise2;

                let SecondImageSpectralProfile = spectralProfileProgressReponse.slice(-1)[0];
                expect(SecondImageSpectralProfile.fileId).toEqual(1);
                expect(SecondImageSpectralProfile.progress).toEqual(1);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(SecondImageSpectralProfile.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64NumberSecond[index]
                    );
                });

                let FirstImageSpectralProfile = spectralProfileProgressReponse2.slice(-1)[0];
                expect(FirstImageSpectralProfile.progress).toEqual(1);
                assertItem.ReturnSpectralProfileRawValuesFp64Index.map((inputIndex, index) => {
                    expect(FirstImageSpectralProfile.profiles[0].rawValuesFp64[inputIndex]).toEqual(
                        assertItem.ReturnSpectralProfileRawValuesFp64NumberFirst[index]
                    );
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
