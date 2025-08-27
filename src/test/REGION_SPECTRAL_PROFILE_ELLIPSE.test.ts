import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/MyClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface IProfilesExt extends CARTA.ISpectralProfile {
    profileLength?: number;
    selectedRawValue64: number[];
}
interface ISpectralProfileData extends CARTA.ISpectralProfileData {
    profile?: IProfilesExt[];
}

interface AssertItem {
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    spectralProfileData: ISpectralProfileData[];
    spectralProfileDataHdf5: ISpectralProfileData[];
    rawValue64CheckValuesIndex: number[];
}
let assertItem: AssertItem = {
    openFile: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex.image',
            fileId: 0,
            hdu: '',
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex.hdf5',
            fileId: 0,
            hdu: '',
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [],
        },
    },
    addRequiredTiles: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 89, y: 516 },
                    { x: 5, y: 3 },
                ],
                rotation: 30.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [
                    { x: 0, y: 516 },
                    { x: 5, y: 3 },
                ],
                rotation: 30.0,
            },
        },
    ],
    regionAck: [
        {
            success: true,
            regionId: 1,
        },
        {
            success: true,
            regionId: 2,
        },
    ],
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.FluxDensity,
                        CARTA.StatsType.Mean,
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                        CARTA.StatsType.SumSq,
                        CARTA.StatsType.Min,
                        CARTA.StatsType.Max,
                        CARTA.StatsType.Extrema,
                    ],
                },
            ],
        },
        {
            fileId: 0,
            regionId: 2,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.FluxDensity,
                        CARTA.StatsType.Mean,
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                        CARTA.StatsType.SumSq,
                        CARTA.StatsType.Min,
                        CARTA.StatsType.Max,
                        CARTA.StatsType.Extrema,
                    ],
                },
            ],
        },
    ],
    rawValue64CheckValuesIndex: [0, 50, 100, 150, 199],
    spectralProfileData: [
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sum,
                    selectedRawValue64: [0, 192, 13, 213, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.FluxDensity,
                    selectedRawValue64: [118, 95, 104, 143, 63],
                },
                {
                    coordinate: 'z',
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    selectedRawValue64: [78, 23, 112, 142, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.RMS,
                    selectedRawValue64: [33, 3, 8, 145, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sigma,
                    selectedRawValue64: [226, 70, 212, 128, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.SumSq,
                    selectedRawValue64: [0, 80, 253, 122, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Min,
                    selectedRawValue64: [0, 0, 251, 99, 191],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Max,
                    selectedRawValue64: [0, 0, 252, 160, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Extrema,
                    selectedRawValue64: [0, 0, 251, 160, 63],
                },
            ],
        },
        {
            regionId: 2,
            progress: 1,
            profile: [
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sum,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.FluxDensity,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.RMS,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sigma,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.SumSq,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Min,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Max,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Extrema,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
            ],
        },
    ],
    spectralProfileDataHdf5: [
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sum,
                    selectedRawValue64: [0, 192, 13, 213, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.FluxDensity,
                    selectedRawValue64: [118, 95, 104, 143, 63],
                },
                {
                    coordinate: 'z',
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    selectedRawValue64: [78, 23, 112, 142, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.RMS,
                    selectedRawValue64: [178, 21, 8, 145, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sigma,
                    selectedRawValue64: [226, 70, 212, 128, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.SumSq,
                    selectedRawValue64: [218, 87, 253, 122, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Min,
                    selectedRawValue64: [0, 0, 251, 99, 191],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Max,
                    selectedRawValue64: [0, 0, 252, 160, 63],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Extrema,
                    selectedRawValue64: [0, 0, 251, 160, 63],
                },
            ],
        },
        {
            regionId: 2,
            progress: 1,
            profile: [
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sum,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.FluxDensity,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.RMS,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Sigma,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.SumSq,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Min,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Max,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
                {
                    coordinate: 'z',
                    statsType: CARTA.StatsType.Extrema,
                    selectedRawValue64: [0, 0, 0, 248, 127],
                },
            ],
        },
    ],
};

let basepath: string;
describe('REGION_SPECTRAL_PROFILE_ELLIPSE: Testing spectral profiler with ellipse regions', () => {
    const msgController = MessageController.Instance;
    assertItem.openFile.map((openFile, index) => {
        describe(`Register a session`, () => {
            beforeAll(async () => {
                await msgController.connect(testServerUrl);
            }, connectTimeout);

            checkConnection();
            test(`Get basepath and modify the directory path`, async () => {
                msgController.closeFile(-1);
                let fileListResponse = await msgController.getFileList('$BASE', 0);
                basepath = fileListResponse.directory;
                assertItem.openFile[index].directory = basepath + '/' + assertItem.openFile[index].directory;
            });

            let regionHistogramData = [];
            test(
                `[Preparatio of "${openFile.file}"] Open file and Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
                async () => {
                    let regionHistogramDataPromise = new Promise((resolve) => {
                        msgController.histogramStream.subscribe({
                            next: (data) => {
                                regionHistogramData.push(data);
                                resolve(regionHistogramData);
                            },
                        });
                    });
                    let OpenFileResponse = await msgController.loadFile(openFile);
                    let RegionHistogramData = await regionHistogramDataPromise;

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(openFile.file);
                },
                openFileTimeout
            );

            test(
                `[Preparatio of "${openFile.file}"] Return RASTER_TILE_DATA(Stream) and check total length | `,
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
                describe(`${region.regionId < 0 ? 'Creating' : 'Modify'} ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId} on ${JSON.stringify(region.regionInfo.controlPoints)} for ${openFile.file}`, () => {
                    let SetRegionAck: any;
                    test(
                        `SET_REGION_ACK should return within ${regionTimeout} ms`,
                        async () => {
                            SetRegionAck = await msgController.setRegion(
                                region.fileId,
                                region.regionId,
                                region.regionInfo
                            );
                        },
                        regionTimeout
                    );

                    test(`SET_REGION_ACK.success = ${assertItem.regionAck[index].success}`, () => {
                        expect(SetRegionAck.success).toBe(assertItem.regionAck[index].success);
                    });

                    test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[index].regionId}`, () => {
                        expect(SetRegionAck.regionId).toEqual(assertItem.regionAck[index].regionId);
                    });
                });

                describe(`SET SPECTRAL REQUIREMENTS on ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId}`, () => {
                    let SpectralProfileData: any;
                    test(
                        `SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`,
                        async () => {
                            msgController.setSpectralRequirements(assertItem.setSpectralRequirements[index]);
                            SpectralProfileData = await Stream(CARTA.SpectralProfileData, 1);
                            SpectralProfileData = SpectralProfileData[0];
                        },
                        regionTimeout
                    );

                    test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[index].regionId}`, () => {
                        expect(SpectralProfileData.regionId).toEqual(assertItem.spectralProfileData[index].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[index].progress}`, () => {
                        expect(SpectralProfileData.progress).toEqual(assertItem.spectralProfileData[index].progress);
                    });

                    test('Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean', () => {
                        let _meanProfile = SpectralProfileData.profiles.find(
                            (f) => f.statsType === CARTA.StatsType.Mean
                        );
                        let _assertProfile = assertItem.spectralProfileData[index].profile.find(
                            (f) => f.statsType === CARTA.StatsType.Mean
                        );
                        let _assertProfileHdf5 = assertItem.spectralProfileDataHdf5[index].profile.find(
                            (f) => f.statsType === CARTA.StatsType.Mean
                        );
                        if (openFile.file.includes('image')) {
                            assertItem.rawValue64CheckValuesIndex.map((input, inputIndex) => {
                                expect(_meanProfile.rawValuesFp64[input]).toEqual(
                                    _assertProfile.selectedRawValue64[inputIndex]
                                );
                            });
                        } else if (openFile.file.includes('hdf5')) {
                            assertItem.rawValue64CheckValuesIndex.map((input, inputIndex) => {
                                expect(_meanProfile.rawValuesFp64[input]).toEqual(
                                    _assertProfileHdf5.selectedRawValue64[inputIndex]
                                );
                            });
                        }
                    });

                    test('Assert other SPECTRAL_PROFILE_DATA.profiles', () => {
                        if (openFile.file.includes('image')) {
                            assertItem.spectralProfileData[index].profile.map((profile) => {
                                let _returnedProfile = SpectralProfileData.profiles.find(
                                    (f) => f.statsType === profile.statsType
                                );
                                assertItem.rawValue64CheckValuesIndex.map((input, inputIndex) => {
                                    expect(_returnedProfile.rawValuesFp64[input]).toEqual(
                                        profile.selectedRawValue64[inputIndex]
                                    );
                                });
                            });
                        } else if (openFile.file.includes('hdf5')) {
                            assertItem.spectralProfileDataHdf5[index].profile.map((profile) => {
                                let _returnedProfile = SpectralProfileData.profiles.find(
                                    (f) => f.statsType === profile.statsType
                                );
                                assertItem.rawValue64CheckValuesIndex.map((input, inputIndex) => {
                                    expect(_returnedProfile.rawValuesFp64[input]).toEqual(
                                        profile.selectedRawValue64[inputIndex]
                                    );
                                });
                            });
                        }
                    });
                });
            });

            afterAll(() => msgController.closeConnection());
        });
    });
});
