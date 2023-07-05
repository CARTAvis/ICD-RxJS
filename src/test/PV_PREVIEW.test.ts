import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import exp from "constants";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest[];
    pvResponse: CARTA.IPvResponse;
    histogramBinsIndex: Number[];
    histogramBinsValue: Number[];
    imageDataIndex: Number[];
    imageDataValue: Number[];
    precisionDigits: number;
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    closepvpreview: CARTA.IClosePvPreview;
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],  
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            previewRegion: false,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 79, y: 77 }, { x: 362, y: 360 }],
                rotation: 135,
            }
        },
    ],
    setPVRequest: [
        {
            fileId: 0,
            regionId: 1,
            width: 3,
            keep: true,
            reverse: false,
            spectralRange: {min: 0, max: 249},
            previewSettings: {
                animationCompressionQuality: 9,
                compressionType: CARTA.CompressionType.ZFP,
                imageCompressionQuality: 11,
                previewId: 0,
                rebinXy: 1,
                rebinZ: 1,
                regionId: -1,
            }
        }
    ],
    pvResponse: {
        success: true,
        previewData: {
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            height: 250,
            width: 401,
            histogram: {
                binWidth: 0.0022617133799940348,
                firstBinCenter: -0.04723597317934036,
                mean: 0.004336727754377657,
                numBins: 316,
                stdDev: 0.040239019771367436,
            },
            histogramBounds: {
                max: 0.6663346290588379,
                min: -0.04836682975292206,
            },
            imageInfo: {
                axesNumbers: {
                    spatialX: 1,
                    spectral: 2,
                    stokes: 3,
                }
            },
            nanEncodings: new Uint8Array([154, 135, 1, 0]),
        },
    },
    histogramBinsIndex: [0, 100, 200, 300],
    histogramBinsValue: [4, 8, 4, 1],
    imageDataIndex: [0, 5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000],
    imageDataValue: [241, 69, 198, 204, 61, 200, 226, 216, 77],
    precisionDigits: 8,
    setSpatialReq: [
        {
            fileId: -2,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1, width: undefined}, {coordinate:"y", mip:1, width: undefined}]
        }
    ],
    closepvpreview: {
        previewId: 0
    }
};

let basepath: string;
describe("PV_PREVIEW test: Testing PV preview with FITS, CASA, and HDF5 file", () => {
    for (let i=0; i<assertItem.fileOpen.length; i++) {
        describe(`Case ${i+1}: Test PV preview with "${assertItem.fileOpen[i].file}"`, () => {
            const msgController = MessageController.Instance;
            beforeAll(async ()=> {
                await msgController.connect(testServerUrl);
            }, connectTimeout);

            checkConnection();
            test(`Get basepath`, async () => {
                let fileListResponse = await msgController.getFileList("$BASE",0);
                basepath = fileListResponse.directory;
                assertItem.fileOpen[i].directory = basepath + "/" + assertItem.filelist.directory;
            });

            test(`(Step 1): Open image`, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[i]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen[i].file);
                expect(RegionHistogramData.length).toEqual(1);
            }, openFileTimeout);

            test(`(Stpe 2): Set cursor and add required tiles`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);

                msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);
            });

            test(`(Step 3): set region`, async () => {
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            let pVProgressData = [];
            test(`(Step 4): set PV request`, async () => {
                let pvProgressPromise = new Promise((resolve)=>{
                    msgController.pvProgressStream.subscribe({
                        next: (data) => {
                            pVProgressData.push(data)
                            resolve(pVProgressData)
                        }
                    })
                });
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest[0]);

                expect(pVProgressData[pVProgressData.length-1].progress).toEqual(1);
                expect(PVresponse.success).toEqual(assertItem.pvResponse.success);
                expect(PVresponse.previewData.compressionQuality).toEqual(assertItem.pvResponse.previewData.compressionQuality);
                expect(PVresponse.previewData.compressionType).toEqual(assertItem.pvResponse.previewData.compressionType);
                expect(PVresponse.previewData.height).toEqual(assertItem.pvResponse.previewData.height);
                expect(PVresponse.previewData.width).toEqual(assertItem.pvResponse.previewData.width);
                expect(PVresponse.previewData.histogram.binWidth).toBeCloseTo(assertItem.pvResponse.previewData.histogram.binWidth, assertItem.precisionDigits);
                assertItem.histogramBinsIndex.map((input, index) => {
                    expect(PVresponse.previewData.histogram.bins[input]).toEqual(assertItem.histogramBinsValue[index]);
                });
                expect(PVresponse.previewData.histogram.firstBinCenter).toBeCloseTo(assertItem.pvResponse.previewData.histogram.firstBinCenter, assertItem.precisionDigits);
                expect(PVresponse.previewData.histogram.mean).toBeCloseTo(assertItem.pvResponse.previewData.histogram.mean, assertItem.precisionDigits);
                expect(PVresponse.previewData.histogram.numBins).toEqual(assertItem.pvResponse.previewData.histogram.numBins);
                expect(PVresponse.previewData.histogram.stdDev).toBeCloseTo(assertItem.pvResponse.previewData.histogram.stdDev, assertItem.precisionDigits);
                expect(PVresponse.previewData.histogramBounds.max).toBeCloseTo(assertItem.pvResponse.previewData.histogramBounds.max, assertItem.precisionDigits);
                expect(PVresponse.previewData.histogramBounds.min).toBeCloseTo(assertItem.pvResponse.previewData.histogramBounds.min, assertItem.precisionDigits);
                assertItem.imageDataIndex.map((input, index) => {
                    expect(PVresponse.previewData.imageData[input]).toEqual(assertItem.imageDataValue[index]);
                });
                expect(PVresponse.previewData.imageInfo.axesNumbers.spatialX).toEqual(assertItem.pvResponse.previewData.imageInfo.axesNumbers.spatialX);
                expect(PVresponse.previewData.imageInfo.axesNumbers.spectral).toEqual(assertItem.pvResponse.previewData.imageInfo.axesNumbers.spectral);
                expect(PVresponse.previewData.imageInfo.axesNumbers.stokes).toEqual(assertItem.pvResponse.previewData.imageInfo.axesNumbers.stokes);
                for (i=0; i<assertItem.pvResponse.previewData.nanEncodings.length; i++) {
                    expect(PVresponse.previewData.nanEncodings[i]).toEqual(assertItem.pvResponse.previewData.nanEncodings[i])
                }
            });

            test(`(Step 5): set spatial requirement`, async () => {
                msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
                let ErrorResponse = await Stream(CARTA.ErrorData,1);
                expect(ErrorResponse[0].message).toContain("File id -2 not found");
            });

            test(`(Step 6): close the pv preview and NO message from the backend (timeout of 1000ms)`, done => {
                let receiveNumberCurrent = msgController.messageReceiving();
                msgController.closePvPreview(assertItem.closepvpreview.previewId);
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Have received number is equal during 1000 ms
                    done();
                }, 1000)
            });

            afterAll(() => msgController.closeConnection());
        });
    }
});