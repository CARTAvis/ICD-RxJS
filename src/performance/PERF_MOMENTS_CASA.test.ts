import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.performance;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.performance.openFile;
let setSpectralReqTimeout = config.performance.setSpectralReqTimeout;
let momentTimeout = config.performance.momentTimeout;

interface AssertItem {
    precisionDigit: number;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    momentRequest: CARTA.IMomentRequest;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    openFile: [
       {
           directory: testSubdirectory + "/cube_B",
           file: "S255_IR_sci.spw25.cube.I.pbcor.image",
           hdu: "0",
           fileId: 0,
           renderMode: CARTA.RenderMode.RASTER,
       },
    ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 960, y: 960 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}]
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 0, max: 400 },
    },
};
const momentName = [
    "average", "integrated", "weighted_coord", "weighted_dispersion_coord",
    "median", "median_coord", "standard_deviation", "rms", "abs_mean_dev",
    "maximum", "maximum_coord", "minimum", "minimum_coord",
];
const intensity = [ // Testing intensity at the (5, 5) of each moment image
    0.86652, 2.27450, 302.11578, 31.72338,
    0.91866, 305.16903, 0.18203, 0.88238, 0.09988,
    0.95470, 305.16903, 0.67406, 251.49975,
];

let basepath: string;
describe("PERF_MOMENT_GENERATOR",()=>{
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile[0].directory = basepath + "/" + assertItem.openFile[0].directory;
        });

        describe(`Initialization: open the image`, () => {
            test(`(Step 1)"${assertItem.openFile[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            test(`(Step 2)"${assertItem.openFile[0].file}" Set SET_SPECTRAL_REQUIREMENTS, the responses should arrive within ${setSpectralReqTimeout} ms`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq.tiles.length + 2);

                msgController.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setSpatialRequirements(assertItem.setSpatialReq);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(RasterTileDataResponse.length).toEqual(assertItem.addTilesReq.tiles.length + 2);

                msgController.setSpectralRequirements(assertItem.setSpectralRequirements);
                let SpectralProfileDataStreamPromise = new Promise((resolve) => {
                    msgController.spectralProfileStream.subscribe({
                        next: (data) => {
                            if (data.progress === 1) {
                                resolve(data)
                            }
                        }
                    })
                })
                let SpectralProfileDataResponse = await SpectralProfileDataStreamPromise as CARTA.SpectralProfileData;
                expect(SpectralProfileDataResponse.progress).toEqual(1);
            }, setSpectralReqTimeout);

            let FileId: number[] = [];
            let regionHistogramDataArray = [];
            let momentResponse: any;
            let regionHistogramDataResponse: any;
            describe(`Moment generator`, () => {
                test(`(Step 3)"${assertItem.openFile[0].file}": Receive a series of moment progress within ${momentTimeout}ms`, async () => {
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

                test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`,()=>{
                    expect(FileId.length).toEqual(assertItem.momentRequest.moments.length);
                });

                test(`Assert MomentResponse.success = true`,()=>{
                    expect(momentResponse.success).toBe(true);
                });

                test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`,()=>{
                    expect(momentResponse.openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
                });

                test(`Assert all MomentResponse.openFileAcks[].success = true`,()=>{
                    momentResponse.openFileAcks.map(ack => {
                        expect(ack.success).toBe(true);
                    });
                });

                test(`Assert all openFileAcks[].fileId > 0`,()=>{
                    momentResponse.openFileAcks.map(ack => {
                        expect(ack.fileId).toBeGreaterThan(0);
                    });
                });

                test(`Assert openFileAcks[].fileInfo.name`,()=>{
                    momentResponse.openFileAcks.map((ack,index)=>{
                        expect(ack.fileInfo.name).toEqual(assertItem.openFile[0].file + ".moment." + momentName[index])
                    });
                });

            });

        });

        afterAll(() => msgController.closeConnection());
    });
});