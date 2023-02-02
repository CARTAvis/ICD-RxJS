import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';
let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let changeChannelTimeout = config.timeout.changeChannel;
let regionTimeout = config.timeout.region;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    filelist: CARTA.IFileListRequest;
    cursor: CARTA.ISetCursor;
    spatial: CARTA.ISetSpatialRequirements;
    stats: CARTA.ISetStatsRequirements;
    histogram: CARTA.ISetHistogramRequirements;
    imageChannels: CARTA.ISetImageChannels[];
}
let assertItem: AssertItem = {
    registerViewer:
    {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    precisionDigits: 4,
    cursor: {
        fileId: 0,
        point: { x: 319, y: 378 },
    },
    spatial: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    stats: {
        fileId: 0,
        regionId: -1,
        statsConfigs:[
            {coordinate:"z", statsTypes:[
                CARTA.StatsType.NumPixels,
                CARTA.StatsType.Sum,
                CARTA.StatsType.FluxDensity,
                CARTA.StatsType.Mean,
                CARTA.StatsType.RMS,
                CARTA.StatsType.Sigma,
                CARTA.StatsType.SumSq,
                CARTA.StatsType.Min,
                CARTA.StatsType.Max,
                CARTA.StatsType.Extrema
            ]}
        ],
    },
    histogram: {
        fileId: 0,
        regionId: -1,
        histograms: [{ channel: -1, numBins: -1 }],
    },
    imageChannels: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 12,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
}

let basepath: string;
describe("ANIMATOR_NAVIGATION: Testing using animator to see different frames/channels/stokes", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.filelist.directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open images`, () => {
            test(`Preparation`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
                msgController.setCursor(assertItem.cursor.fileId, assertItem.cursor.point.x, assertItem.cursor.point.y);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);
                msgController.setChannels(assertItem.imageChannels[0]);
                let RasterTileData = await Stream(CARTA.RasterTileData,3);
            });

            describe(`SET SPATIAL REQUIREMENTS`, () => {
                test(`SPATIAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                    msgController.setSpatialRequirements(assertItem.spatial);
                    let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);
                }, regionTimeout);
            });

            describe("SET STATS REQUIREMENTS", () => {
                test(`REGION_STATS_DATA should arrive within ${regionTimeout} ms`, async () => {
                    msgController.setStatsRequirements(assertItem.stats);
                    let RegionStatsDataResponse =  await Stream(CARTA.RegionStatsData,1);
                }, regionTimeout);
            });

            describe(`SET HISTOGRAM REQUIREMENTS`, () => {
                test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                    msgController.setHistogramRequirements(assertItem.histogram);
                    let RegionHistrogramDataResponse2 = await Stream(CARTA.RegionHistogramData,1)
                }, regionTimeout);
            });

            describe("SET IMAGE CHANNELS", () => {
                let lastRegionHistogramData: CARTA.RegionHistogramData[] = []; 
                let lastRegionStatsData: CARTA.RegionStatsData[] = [];
                let lastSpatialProfileData: CARTA.SpatialProfileData[] = [];
                let lastRasterTileData: any = [];
                test(`RASTER_TILE_DATA, SPATIAL_PROFILE_DATA, REGION_HISTOGRAM_DATA & REGION_STATS_DATA should arrive within ${changeChannelTimeout} ms`, async () => {
                    msgController.setChannels(assertItem.imageChannels[1]);
                    msgController.histogramStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            lastRegionHistogramData.push(data)
                        }
                    });
                    msgController.statsStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            lastRegionStatsData.push(data)
                        }
                    })
                    msgController.spatialProfileStream.pipe(take(1)).subscribe({
                        next: (data) => {
                            lastSpatialProfileData.push(data)
                        }
                    })
                    lastRasterTileData = await Stream(CARTA.RasterTileData,3);
                }, changeChannelTimeout);
    
                test(`RASTER_TILE_DATA.channel = ${assertItem.imageChannels[1].channel}`, () => {
                    expect(lastRasterTileData[1].channel).toEqual(assertItem.imageChannels[1].channel);
                });
    
                test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.histogram.regionId}`, () => {
                    expect(lastRegionHistogramData[0].regionId).toEqual(assertItem.histogram.regionId);
                });
    
                test(`REGION_STATS_DATA.region_id = ${assertItem.stats.regionId}`, () => {
                    expect(lastRegionStatsData[0].regionId).toEqual(assertItem.stats.regionId);
                });
    
                test(`REGION_STATS_DATA.channel = ${assertItem.imageChannels[1].channel}`, () => {
                    expect(lastRegionStatsData[0].channel).toEqual(assertItem.imageChannels[1].channel);
                });
    
                test(`SPATIAL_PROFILE_DATA.channel = ${assertItem.imageChannels[1].channel}`, () => {
                    expect(lastSpatialProfileData[0].channel).toEqual(assertItem.imageChannels[1].channel);
                });
    
                test(`SPATIAL_PROFILE_DATA.x = ${assertItem.cursor.point.x}`, () => {
                    expect(lastSpatialProfileData[0].x).toEqual(assertItem.cursor.point.x);
                });
    
                test(`SPATIAL_PROFILE_DATA.y = ${assertItem.cursor.point.y}`, () => {
                    expect(lastSpatialProfileData[0].y).toEqual(assertItem.cursor.point.y);
                });
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});