import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;
let momentTimeout = config.timeout.moment;
const setFileId = 200;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setRegion: CARTA.ISetRegion;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    momentRequest: CARTA.IMomentRequest;
    imageDataLength: number[];
    nanEncodingsLength: number[];
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
        hdu: "",
        fileId: setFileId,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: {
        fileId: setFileId,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 218, y: 218.0 }, { x: 200.0, y: 200.0 }],
            rotation: 0,
        },
    },
    setSpectralRequirements: {
        fileId: setFileId,
        regionId: 1,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    momentRequest: {
        fileId: setFileId,
        regionId: 1,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
    imageDataLength: [72560, 72480, 59320, 67560, 74128, 32720, 68424, 72080, 70576, 67496, 32752, 76904, 61848],
    nanEncodingsLength: [1424, 1424, 1424, 1424, 1424, 1424, 1448, 1424, 1424, 1424, 1424, 1424, 1424],
};
const momentName = [
    "average", "integrated", "weighted_coord", "weighted_dispersion_coord",
    "median", "median_coord", "standard_deviation", "rms", "abs_mean_dev",
    "maximum", "maximum_coord", "minimum", "minimum_coord",
];
const imageData5000 = [ // Testing the compressed imageData[5000] of each moment image
109, 213, 248, 83,
124, 15, 0, 99, 31,
97, 0, 175, 26,
];

const imageData10000 = [ // Testing the compressed imageData[10000] of each moment image
124, 177, 5, 42,
229, 1, 121, 15, 8,
228, 21, 92, 199,
];

const imageData20000 = [ // Testing the compressed imageData[20000] of each moment image
174, 31, 4, 12,
151, 82, 226, 141, 131,
101, 60, 103, 0,
];

const imageData30000 = [ // Testing the compressed imageData[30000] of each moment image
23, 44, 145, 127,
180, 64, 63, 51, 202,
67, 160, 25, 227,
];

let basepath: string;
describe("MOMENTS_GENERATOR_FITS: Testing moments generator for a given region on a fits image", () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Preparation`, () => {
            test(`Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            }, readFileTimeout);
    
            test(`Set region`, async () => {
                let SetRegionAck = await msgController.setRegion(assertItem.setRegion.fileId, assertItem.setRegion.regionId, assertItem.setRegion.regionInfo)
                msgController.setSpectralRequirements(assertItem.setSpectralRequirements);
                let spectralProfileDataResponse = await Stream(CARTA.SpectralProfileData, 1);
            }, regionTimeout * 10);
        });

        let FileId: number[] = [];
        let regionHistogramDataArray = [];
        let momentResponse: any;
        let regionHistogramDataResponse: any;
        describe(`Moment generator`, () => {
            test(`Receive a series of moment progress`, async () => {
                await sleep(200);
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramDataArray.push(data)
                            resolve(regionHistogramDataArray)
                        }
                    })
                });
                momentResponse = await msgController.requestMoment(assertItem.momentRequest);
                regionHistogramDataResponse = await regionHistogramDataPromise;
                FileId = regionHistogramDataResponse.map(data => data.fileId);
            }, momentTimeout);

            test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, () => {
                expect(regionHistogramDataResponse.length).toEqual(assertItem.momentRequest.moments.length);
            });

            test(`Assert MomentResponse.success = true`, () => {
                expect(momentResponse.success).toBe(true);
            });

            test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`, () => {
                expect(momentResponse.openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
            });

            test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
                momentResponse.openFileAcks.map(ack => {
                    expect(ack.success).toBe(true);
                });
            });

            test(`Assert all openFileAcks[].fileId > 0`, () => {
                momentResponse.openFileAcks.map(ack => {
                    expect(ack.fileId).toBeGreaterThan(0);
                });
            });

            test(`Assert openFileAcks[].fileInfo.name`, () => {
                momentResponse.openFileAcks.map((ack, index) => {
                    expect(ack.fileInfo.name).toEqual(assertItem.openFile.file + ".moment." + momentName[index]);
                });
            });

            test(`Assert openFileAcks[].fileInfoExtended`, () => {
                momentResponse.openFileAcks.map(ack => {
                    const coord = assertItem.setRegion.regionInfo.controlPoints;
                    expect(ack.fileInfoExtended.height).toEqual(coord[1].y + 1);
                    expect(ack.fileInfoExtended.width).toEqual(coord[1].x + 1);
                    expect(ack.fileInfoExtended.dimensions).toEqual(4);
                    expect(ack.fileInfoExtended.depth).toEqual(1);
                    expect(ack.fileInfoExtended.stokes).toEqual(1);
                });
            });

            test(`Assert openFileAcks[].fileInfoExtended.headerEntries.length = 85`, () => {
                momentResponse.openFileAcks.map((ack, index) => {
                    expect(ack.fileInfoExtended.headerEntries.length).toEqual(85);
                });
            });

            test(`Assert openFileAcks[].fileInfoExtended.computedEntries.length = 21`, () => {
                momentResponse.openFileAcks.map((ack, index) => {
                    expect(ack.fileInfoExtended.computedEntries.length).toEqual(21);
                });
            });
        });

        describe(`Requset moment image`, () => {
            let RasterTileSync: CARTA.RasterTileSync[] = [];
            let RasterTileData: CARTA.RasterTileData[] = [];
            test(`Receive all image data until RasterTileSync.endSync = true`, async () => {
                for (let idx = 0; idx < FileId.length; idx++) {
                    msgController.addRequiredTiles({
                        fileId: FileId[idx],
                        tiles: [0],
                        compressionType: CARTA.CompressionType.ZFP,
                        compressionQuality: 0,
                    })
                    let RasterTileDataResponse = await Stream(CARTA.RasterTileData, 3);
                    RasterTileSync.push(RasterTileDataResponse[2]);
                    RasterTileData.push(RasterTileDataResponse[1]);
                }
                RasterTileSync.map(ack => {
                    expect(ack.endSync).toBe(true);
                });
            }, readFileTimeout * FileId.length);

            test(`Assert RASTER_TILE_SYNC.fileId`, () => {
                RasterTileSync.map((ack, index) => {
                    expect(ack.fileId).toEqual(FileId[index]);
                });
            });

            test(`Receive RASTER_TILE_DATA`, () => {
                expect(RasterTileData.length).toEqual(FileId.length);
            });
    
            test(`Assert RASTER_TILE_DATA.fileId`, () => {
                RasterTileData.map((ack, index) => {
                    expect(ack.fileId).toEqual(FileId[index]);
                });
            });

            test(`Assert RASTER_TILE_DATA.tiles`, () => {
                RasterTileData.map((ack, index) => {
                    expect(ack.tiles[0].height).toEqual(201);
                    expect(ack.tiles[0].width).toEqual(201);
                    expect(ack.tiles[0].imageData.length).toEqual(assertItem.imageDataLength[index]);
                    expect(ack.tiles[0].nanEncodings.length).toEqual(assertItem.nanEncodingsLength[index]);
                });
            });
    
            test(`Assert RASTER_TILE_DATA.tiles[0].imageData[5000], imageData[10000], imageData[20000], and imageData[30000]`, () => {
                RasterTileData.map((ack, index) => {
                    expect(ack.tiles[0].imageData[5000]).toEqual(imageData5000[index]);
                    expect(ack.tiles[0].imageData[10000]).toEqual(imageData10000[index]);
                    expect(ack.tiles[0].imageData[20000]).toEqual(imageData20000[index]);
                    expect(ack.tiles[0].imageData[30000]).toEqual(imageData30000[index]);
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});