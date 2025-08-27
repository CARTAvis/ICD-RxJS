import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion;
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    spectralProfileData: CARTA.ISpectralProfileData;
    setStatsRequirements: CARTA.ISetStatsRequirements;
    regionStatsData: CARTA.IRegionStatsData;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: CARTA.IRegionHistogramData;
}

let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: 'M17_SWex.image',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    addTilesRequire: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setRegion: {
        fileId: 0,
        regionId: 1,
        regionInfo: {
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [
                { x: 302, y: 370 },
                { x: 10, y: 20 },
            ],
            rotation: 30.0,
        },
    },
    regionAck: {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [
            {
                coordinate: 'z',
                statsTypes: [CARTA.StatsType.Mean],
            },
        ],
    },
    spectralProfileData: {
        regionId: 1,
        progress: 1,
    },
    setStatsRequirements: {
        fileId: 0,
        regionId: 1,
        statsConfigs: [{ coordinate: 'z', statsTypes: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
    },
    regionStatsData: {
        regionId: 1,
    },
    setHistogramRequirements: {
        fileId: 0,
        regionId: 1,
        histograms: [{ channel: -1, numBins: -1 }],
    },
    regionHistogramData: {
        regionId: 1,
        progress: 1,
    },
};

let basepath: string;
describe('REGION_DATA_STREAM: Testing data streaming after the regions', () => {
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
                msgController.addRequiredTiles(assertItem.addTilesRequire);
                let RasterTileDataResponse = await Stream(
                    CARTA.RasterTileData,
                    assertItem.addTilesRequire.tiles.length + 2
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

        describe('SET REGION: ', () => {
            let SetRegionAck: any;
            test(
                `SET_REGION_ACK should arrive within ${readFileTimeout} ms`,
                async () => {
                    SetRegionAck = await msgController.setRegion(
                        assertItem.setRegion.fileId,
                        assertItem.setRegion.regionId,
                        assertItem.setRegion.regionInfo
                    );
                },
                readFileTimeout
            );

            test('SET_REGION_ACK.success = true', () => {
                expect(SetRegionAck.success).toBe(true);
            });

            test(`SET_REGION_ACK.region_id = ${assertItem.regionAck.regionId}`, () => {
                expect(SetRegionAck.regionId).toEqual(assertItem.regionAck.regionId);
            });

            let SpectralProfileData: CARTA.SpectralProfileData[] = [];
            test(`SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`, async () => {
                await msgController.setSpectralRequirements(assertItem.setSpectralRequirements);
                let SpectralProfileDataResponse = await Stream(CARTA.SpectralProfileData, 1);
                SpectralProfileData.push(SpectralProfileDataResponse[0]);
            });

            test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData.regionId}`, () => {
                expect(SpectralProfileData[0].regionId).toEqual(assertItem.spectralProfileData.regionId);
            });

            test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData.progress}`, () => {
                expect(SpectralProfileData[0].progress).toEqual(assertItem.spectralProfileData.progress);
            });

            let RegionHistData: CARTA.RegionHistogramData[] = [];
            test(
                `REGION_HISTOGRAM_DATA should returb within ${regionTimeout} ms`,
                async () => {
                    await msgController.setHistogramRequirements(assertItem.setHistogramRequirements);
                    let RegionHistDataResponse = await Stream(CARTA.RegionHistogramData, 1);
                    RegionHistData.push(RegionHistDataResponse[0]);
                },
                regionTimeout
            );

            test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                expect(RegionHistData[0].regionId).toEqual(assertItem.regionHistogramData.regionId);
            });

            test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramData.progress}`, () => {
                expect(RegionHistData[0].progress).toEqual(assertItem.regionHistogramData.progress);
            });

            let RegionStatsData: CARTA.RegionStatsData[] = [];
            test(
                `REGION_STATS_DATA should return within ${regionTimeout} ms`,
                async () => {
                    msgController.setStatsRequirements(assertItem.setStatsRequirements);
                    let RegionHistDataResponse = await Stream(CARTA.RegionStatsData, 1);
                    RegionStatsData.push(RegionHistDataResponse[0]);
                },
                regionTimeout
            );

            test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsData.regionId}`, () => {
                expect(RegionStatsData[0].regionId).toEqual(assertItem.regionStatsData.regionId);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
