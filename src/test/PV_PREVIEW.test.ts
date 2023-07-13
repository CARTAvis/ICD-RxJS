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
    spatialProfileDataResponse: CARTA.ISpatialProfileData[];
    spatialProfileDataRawValueIndex: Number[];
    spatialProfileDataRawValue: Number[];
    pvPreviewStream: CARTA.IPvPreviewData[];
    pvPreviewStreamImageDataIndex: Number[];
    pvPreviewStreamImageDataValue: Number[];
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
        {
            fileId: 0,
            regionId: 1,
            previewRegion: false,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 30, y: 30 }, { x: 300, y: 300 }],
                rotation: 135,
            }
        },
        {
            fileId: 0,
            regionId: 1,
            previewRegion: true,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{x: 106, y: 34}, {x: 376, y: 304}],
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
        },
        {
            fileId: -2,
            regionId: 0,
            spatialProfiles: []
        },
        {
            fileId: 0,
            regionId: 1,
            spatialProfiles: [{coordinate: "", mip: 1, width: 3}]
        },
    ],
    closepvpreview: {
        previewId: 0
    },
    spatialProfileDataResponse: [
        {
            regionId: 1,
            profiles: [{
                end: 400,
                lineAxis: {
                    cdelt: 0.05000000074505806,
                    crpix: 200,
                    unit: "arcsec"
                }
            }]
        },
        {
            regionId: 1,
            profiles: [{
                end: 380,
                lineAxis: {
                    cdelt: 0.04999999701976776,
                    crpix: 190,
                    unit: "arcsec"
                }
            }]
        }
    ],    
    spatialProfileDataRawValueIndex: [0,500,1000,1500, 1603],
    spatialProfileDataRawValue: [152, 10, 220, 106, 186],
    pvPreviewStream: [
        {
            height: 250,
            width: 381, 
            histogram: {
                binWidth: 0.0022551496513187885,
                firstBinCenter: -0.04696602001786232,
                mean: 0.004437232558026276,
                numBins: 308,
                stdDev: 0.04092432589528144
            },
            histogramBounds: {
                max: 0.6464924812316895,
                min: -0.04809359461069107,
            },
            nanEncodings: new Uint8Array([18, 116, 1, 0]),
        },
        {
            height: 250,
            width: 381, 
            histogramBounds: {
                max: 0.3305862545967102,
                min: -0.04476132243871689,
            },
            nanEncodings: new Uint8Array([18, 116, 1, 0]),
        },
    ],
    pvPreviewStreamImageDataIndex: [0, 50, 100, 200, 300],
    pvPreviewStreamImageDataValue: [3, 25, 9, 4, 8]
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

            test(`(Step 3): Set region`, async () => {
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo, assertItem.setRegion[0].previewRegion);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            });

            let pVProgressData = [];
            test(`(Step 4): Set PV request`, async () => {
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

            test(`(Step 5): Set spatial requirement`, async () => {
                msgController.setSpatialRequirements(assertItem.setSpatialReq[0]);
                let ErrorResponse = await Stream(CARTA.ErrorData,1);
                expect(ErrorResponse[0].message).toContain("File id -2 not found");
            });

            test(`(Step 6): the SET_SPATIAL_REQUIREMENTS of frontend after closing the pv previes`, async () => {
                msgController.setSpatialRequirements(assertItem.setSpatialReq[1]);
                let ErrorResponse = await Stream(CARTA.ErrorData,1);
                expect(ErrorResponse[0].message).toContain("File id -2 not found");

                msgController.setSpatialRequirements(assertItem.setSpatialReq[2]);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);

                expect(SpatialProfileDataResponse[0].regionId).toEqual(assertItem.spatialProfileDataResponse[0].regionId);
                expect(SpatialProfileDataResponse[0].profiles[0].end).toEqual(assertItem.spatialProfileDataResponse[0].profiles[0].end);
                expect(SpatialProfileDataResponse[0].profiles[0].lineAxis.cdelt).toEqual(assertItem.spatialProfileDataResponse[0].profiles[0].lineAxis.cdelt);
                expect(SpatialProfileDataResponse[0].profiles[0].lineAxis.crpix).toEqual(assertItem.spatialProfileDataResponse[0].profiles[0].lineAxis.crpix);
                expect(SpatialProfileDataResponse[0].profiles[0].lineAxis.unit).toEqual(assertItem.spatialProfileDataResponse[0].profiles[0].lineAxis.unit);
                assertItem.spatialProfileDataRawValueIndex.map((input, index) => {
                    expect(SpatialProfileDataResponse[0].profiles[0].rawValuesFp32[input]).toEqual(assertItem.spatialProfileDataRawValue[index]);
                });
            });

            test(`(Step 7): Moving SET_REGION with previewRegion = false`, async () => {           
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[1].fileId, assertItem.setRegion[1].regionId, assertItem.setRegion[1].regionInfo, assertItem.setRegion[1].previewRegion);
                let pVPreviewStream = [];
                let SpatialProfileData  = [];
                let pVPreviewStreamPromise = new Promise((resolve)=>{
                    msgController.pvPreviewStream.subscribe({
                        next: (data) => {
                            pVPreviewStream.push(data)
                            resolve(pVPreviewStream)
                        }
                    })
                });
                let SpatialProfileDataPromise = new Promise((resolve)=>{
                    msgController.spatialProfileStream.subscribe({
                        next: (data) => {
                            SpatialProfileData.push(data)
                            resolve(SpatialProfileData)
                        }
                    })
                });
                let pVPreviewStreamResponse = await pVPreviewStreamPromise;
                let SpatialProfileDataResponse = await SpatialProfileDataPromise;

                expect(setRegionAckResponse.success).toEqual(true);
                expect(setRegionAckResponse.regionId).toEqual(assertItem.setRegion[1].regionId);
                expect(pVPreviewStream[0].height).toEqual(assertItem.pvPreviewStream[0].height);
                expect(pVPreviewStream[0].width).toEqual(assertItem.pvPreviewStream[0].width);
                expect(pVPreviewStream[0].histogram.binWidth).toEqual(assertItem.pvPreviewStream[0].histogram.binWidth);
                assertItem.pvPreviewStreamImageDataIndex.map((input, index) => {
                    expect(pVPreviewStream[0].histogram.bins[input]).toEqual(assertItem.pvPreviewStreamImageDataValue[index]);
                });
                expect(pVPreviewStream[0].histogram.firstBinCenter).toEqual(assertItem.pvPreviewStream[0].histogram.firstBinCenter);
                expect(pVPreviewStream[0].histogram.mean).toEqual(assertItem.pvPreviewStream[0].histogram.mean);
                expect(pVPreviewStream[0].histogram.numBins).toEqual(assertItem.pvPreviewStream[0].histogram.numBins);
                expect(pVPreviewStream[0].histogram.stdDev).toEqual(assertItem.pvPreviewStream[0].histogram.stdDev);
                expect(pVPreviewStream[0].histogramBounds.max).toBeCloseTo(assertItem.pvPreviewStream[0].histogramBounds.max, assertItem.precisionDigits);
                expect(pVPreviewStream[0].histogramBounds.min).toBeCloseTo(assertItem.pvPreviewStream[0].histogramBounds.min, assertItem.precisionDigits);
                expect(pVPreviewStream[0].imageData.length).toEqual(68224);
                for (i=0; i<assertItem.pvPreviewStream[0].nanEncodings.length; i++) {
                    expect(pVPreviewStream[0].nanEncodings[i]).toEqual(assertItem.pvPreviewStream[0].nanEncodings[i]);
                }
                expect(SpatialProfileData[0].regionId).toEqual(assertItem.spatialProfileDataResponse[1].regionId);
                expect(SpatialProfileData[0].profiles[0].end).toEqual(assertItem.spatialProfileDataResponse[1].profiles[0].end);
                expect(SpatialProfileData[0].profiles[0].lineAxis.cdelt).toEqual(assertItem.spatialProfileDataResponse[1].profiles[0].lineAxis.cdelt);
                expect(SpatialProfileData[0].profiles[0].lineAxis.crpix).toEqual(assertItem.spatialProfileDataResponse[1].profiles[0].lineAxis.crpix);
                expect(SpatialProfileData[0].profiles[0].lineAxis.unit).toEqual(assertItem.spatialProfileDataResponse[1].profiles[0].lineAxis.unit);
            });

            test(`(Step 8): Moving SET_REGION with previewRegion = true`, async () => {
                msgController.spectialSetRegion(assertItem.setRegion[2].fileId, assertItem.setRegion[2].regionId, assertItem.setRegion[2].regionInfo, assertItem.setRegion[2].previewRegion);
                let pVPreviewStream = [];
                let pVPreviewStreamPromise = new Promise((resolve)=>{
                    msgController.pvPreviewStream.subscribe({
                        next: (data) => {
                            pVPreviewStream.push(data)
                            resolve(pVPreviewStream)
                        }
                    })
                });
                let pVPreviewStreamResponse = await pVPreviewStreamPromise;
                
                expect(pVPreviewStream[0].height).toEqual(assertItem.pvPreviewStream[1].height);
                expect(pVPreviewStream[0].width).toEqual(assertItem.pvPreviewStream[1].width);
                expect(pVPreviewStream[0].histogram).toEqual(null);
                expect(pVPreviewStream[0].histogramBounds.max).toBeCloseTo(assertItem.pvPreviewStream[1].histogramBounds.max, assertItem.precisionDigits);
                expect(pVPreviewStream[0].histogramBounds.min).toBeCloseTo(assertItem.pvPreviewStream[1].histogramBounds.min, assertItem.precisionDigits);
                expect(pVPreviewStream[0].imageData.length).toEqual(49792);
                for (i=0; i<assertItem.pvPreviewStream[1].nanEncodings.length; i++) {
                    expect(pVPreviewStream[0].nanEncodings[i]).toEqual(assertItem.pvPreviewStream[1].nanEncodings[i]);
                }
            });

            test(`(Step 9): Close the pv preview and NO message from the backend (timeout of 1000ms)`, done => {
                let receiveNumberCurrent = msgController.messageReceiving();
                msgController.closePvPreview(assertItem.closepvpreview.previewId);
                setTimeout(() => {
                    let receiveNumberLatter = msgController.messageReceiving();
                    expect(receiveNumberCurrent).toEqual(receiveNumberLatter); //Received the number is equal during 1000 ms
                    done();
                }, 1000)
            });

            afterAll(() => msgController.closeConnection());
        });
    }
});