import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    openFileAckResponse: CARTA.IOpenFileAck[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setSpatialRequirements: CARTA.ISetSpatialRequirements[];
    setCursor: CARTA.ISetCursor[];
    setImageChannel: CARTA.ISetImageChannels[];
    spatialProfileData: CARTA.ISpatialProfileData[];
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-rfds.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-rsdf.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU.fits",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-fdsr.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "supermosaic.10-cutted-stokes-glon-vard-glat.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    openFileAckResponse:[
        {
            success: true,
            fileInfo: {name: "HH211_IQU-swap-rfds.image"},
            fileInfoExtended: {
                axesNumbers: {depth: 3, spatialX: 1, spatialY: 3, spectral: 2, stokes: 4},
                depth: 1049,
                dimensions: 4,
                height: 5,
                stokes: 3,
                width: 1049
            },
        },
        {
            success: true,
            fileInfo: {name: "HH211_IQU-swap-rsdf.image"},
            fileInfoExtended: {
                axesNumbers: {depth: 4, spatialX: 1, spatialY: 3, spectral: 4, stokes: 2},
                depth: 5,
                dimensions: 4,
                height: 1049,
                stokes: 3,
                width: 1049
            },
        },
        {
            success: true,
            fileInfo: {name: "HH211_IQU.fits"},
            fileInfoExtended: {
                axesNumbers: {depth: 3, spatialX: 1, spatialY: 2, spectral: 3, stokes: 4},
                depth: 5,
                dimensions: 4,
                height: 1049,
                stokes: 3,
                width: 1049
            },
        }
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [50331650, 50331649, 50331651, 50331648, 50331652],
        },
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [50339842, 50339841, 50335746, 50335745, 50343938, 50339843, 50343937, 50335747, 50339840, 50331650,  50335744,  50331649, 50343939, 50343936, 50331651, 50331648, 50348034, 50339844,50348033, 50335748, 50348035, 50343940, 50348032, 50331652,50348036],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [50339842, 50339841, 50335746, 50335745, 50343938, 50339843, 50343937, 50335747, 50339840, 50331650,  50335744,  50331649, 50343939, 50343936, 50331651, 50331648, 50348034, 50339844,50348033, 50335748, 50348035, 50343940, 50348032, 50331652, 50348036],
        },
    ],  
    setSpatialRequirements: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{coordinate:"Ix", mip:1, width: undefined}, {coordinate:"Iy", mip:1, width: undefined}],
        }, 
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: [{coordinate:"Ix", mip:1, width: undefined}, {coordinate:"Iy", mip:1, width: undefined}],
        },  
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 510, y: 2 },
        },
        {
            fileId: 0,
            point: { x: 555, y: 586 },
        },
        {
            fileId: 1,
            point: { x: 555, y: 586 },
        },
    ],
    setImageChannel:
    [
        {
            fileId: 0,
            channel: 500,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [50331650, 50331649, 50331651, 50331648, 50331652],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },    
    ],
    spatialProfileData: [
        {
            channel: 500,
            value: 0.0015299528604373336,
            x: 510,
            y: 2,
        },
        {
            value: 0.00048562639858573675,
            x: 555,
            y: 586,
        },
        {
            fileId: 1,
            value: 0.00048562639858573675,
            x: 555,
            y: 586,
        }
    ]
};

let basepath: string;
describe("OPEN_SWAPPED_IMAGES test: Testing open swapped images in different axes sequences", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let i=0; i<assertItem.fileOpen.length; i++) {
                assertItem.fileOpen[i].directory = basepath + "/" + assertItem.filelist.directory;
            }
        });

        describe(`Case 1: Open the image with axes sequence of RA-Freq-Dec-Stokes and test basic change image channel and set cursor info`,()=>{
            test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms and check correctness`,async () => {
                msgController.closeFile(-1);
                let iniRegionHistogramData: any = []
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    iniRegionHistogramData.push(data);
                })
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFileAckResponse[0].fileInfo.name);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.depth).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.axesNumbers.depth);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spatialX).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.axesNumbers.spatialX);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spatialY).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.axesNumbers.spatialY);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spectral).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.axesNumbers.spectral);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.stokes).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.axesNumbers.stokes);
                expect(OpenFileResponse.fileInfoExtended.depth).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.depth);
                expect(OpenFileResponse.fileInfoExtended.dimensions).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.dimensions);
                expect(OpenFileResponse.fileInfoExtended.height).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.height);
                expect(OpenFileResponse.fileInfoExtended.stokes).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.stokes);
                expect(OpenFileResponse.fileInfoExtended.width).toEqual(assertItem.openFileAckResponse[0].fileInfoExtended.width);
                
                // REGION_HISTOGRAM_DATA because the bins is empty [0]
                expect(iniRegionHistogramData[0].histograms.numBins).toEqual(1);
                expect(Number(iniRegionHistogramData[0].histograms.bins[0])).toEqual(0);
            }, openFileTimeout);

            test(`(Step 2)"${assertItem.fileOpen[0].file}" add tile request and receive RASTER_TILE_DATA(Stream) and check total length`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);
                expect(RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length + 2);
                expect(RasterTileData.slice(-1)[0].endSync).toEqual(true);
                msgController.setSpatialRequirements(assertItem.setSpatialRequirements[0]);
            });

            test(`(Step 3)"${assertItem.fileOpen[0].file}" SET_IMAGE_CHANNELS and check the 7 stream, all channels of 500`, async () => {
                let RasterTileArray: any = [];
                let RasterSyncArray: any = [];
                let RegionHistogramResponse: any = []
                msgController.rasterSyncStream.pipe(take(1)).subscribe(data => {
                    RasterSyncArray.push(data)
                });
                msgController.histogramStream.pipe(take(1)).subscribe(data => {
                    RegionHistogramResponse.push(data);
                })
                msgController.setChannels(assertItem.setImageChannel[0]);
                let RasterTileDataPromise = new Promise((resolve)=>{
                    msgController.rasterTileStream.subscribe({
                        next: (data) => {
                            RasterTileArray.push(data)
                            if (RasterTileArray.length === 5) {
                                resolve(RasterTileArray)
                            }
                        }
                    })
                });
                msgController.rasterSyncStream.pipe(take(1)).subscribe(data => {
                    RasterSyncArray.push(data)
                });
                let rasterTileDataResponse = await RasterTileDataPromise;

                expect(RegionHistogramResponse[0].channel).toEqual(assertItem.setImageChannel[0].channel);
                for (let i=0; i< RasterSyncArray.length; i++) {
                    expect(RasterSyncArray[i].channel).toEqual(assertItem.setImageChannel[0].channel)
                }
                for (let i=0; i< RasterTileArray.length; i++) {
                    expect(RasterTileArray[i].channel).toEqual(assertItem.setImageChannel[0].channel)
                }
            });

            test(`(Step 4) Set Cursor and check return SPATIAL_PROFILE_DATA (stream)`, async () => {
                msgController.setCursor(assertItem.setCursor[0].fileId, assertItem.setCursor[0].point.x, assertItem.setCursor[0].point.y);
                let SpatialProfileDataResponse = await Stream(CARTA.SpatialProfileData,1);

                expect(SpatialProfileDataResponse[0].channel).toEqual(assertItem.spatialProfileData[0].channel);
                expect(SpatialProfileDataResponse[0].value).toEqual(assertItem.spatialProfileData[0].value);
                expect(SpatialProfileDataResponse[0].x).toEqual(assertItem.spatialProfileData[0].x);
                expect(SpatialProfileDataResponse[0].y).toEqual(assertItem.spatialProfileData[0].y);
            });
        });

        describe(`Case 2: Open two images, one is normal, another one the swapped axis is RA-Stokes-Dec-Freq, the result of set_cursor should be consistent to the normal one. Currently we ignore Stokes.`,()=>{
            test(`(Step 1)"Open the first image: ${assertItem.fileOpen[1].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms and check correctness`, async () => {
                msgController.closeFile(-1);
                msgController.closeFile(0);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[1]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFileAckResponse[1].fileInfo.name);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.depth).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.axesNumbers.depth);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spatialX).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.axesNumbers.spatialX);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spatialY).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.axesNumbers.spatialY);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spectral).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.axesNumbers.spectral);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.stokes).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.axesNumbers.stokes);
                expect(OpenFileResponse.fileInfoExtended.depth).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.depth);
                expect(OpenFileResponse.fileInfoExtended.dimensions).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.dimensions);
                expect(OpenFileResponse.fileInfoExtended.height).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.height);
                expect(OpenFileResponse.fileInfoExtended.stokes).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.stokes);
                expect(OpenFileResponse.fileInfoExtended.width).toEqual(assertItem.openFileAckResponse[1].fileInfoExtended.width);
            });

            test(`(Step 2) The first image adds tile request and receive RASTER_TILE_DATA(Stream) and check total length`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[1]);
                let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[1].tiles.length + 2);
                expect(RasterTileData.length).toEqual(assertItem.addTilesReq[1].tiles.length + 2);
                expect(RasterTileData.slice(-1)[0].endSync).toEqual(true);
                msgController.setSpatialRequirements(assertItem.setSpatialRequirements[0]);
            });

            test(`(Step 3)"Open the second image: ${assertItem.fileOpen[2].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms and check correctness`, async () => {
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[2]);
                let RegionHistogramData = await Stream(CARTA.RegionHistogramData,1);

                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFileAckResponse[2].fileInfo.name);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.depth).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.axesNumbers.depth);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spatialX).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.axesNumbers.spatialX);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spatialY).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.axesNumbers.spatialY);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.spectral).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.axesNumbers.spectral);
                expect(OpenFileResponse.fileInfoExtended.axesNumbers.stokes).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.axesNumbers.stokes);
                expect(OpenFileResponse.fileInfoExtended.depth).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.depth);
                expect(OpenFileResponse.fileInfoExtended.dimensions).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.dimensions);
                expect(OpenFileResponse.fileInfoExtended.height).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.height);
                expect(OpenFileResponse.fileInfoExtended.stokes).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.stokes);
                expect(OpenFileResponse.fileInfoExtended.width).toEqual(assertItem.openFileAckResponse[2].fileInfoExtended.width);
            });

            test(`(Step 4) The second image adds tile request and receive RASTER_TILE_DATA(Stream) and check total length`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[2]);
                let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[2].tiles.length + 2);
                expect(RasterTileData.length).toEqual(assertItem.addTilesReq[2].tiles.length + 2);
                expect(RasterTileData.slice(-1)[0].endSync).toEqual(true);
                msgController.setSpatialRequirements(assertItem.setSpatialRequirements[1]);
            });

            test(`(Step 5) Set cursor on two images, the return values should be the same`, async () => {
                msgController.setCursor(assertItem.setCursor[1].fileId, assertItem.setCursor[1].point.x, assertItem.setCursor[1].point.y);
                let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                msgController.setCursor(assertItem.setCursor[2].fileId, assertItem.setCursor[2].point.x, assertItem.setCursor[2].point.y);
                let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);

                expect(SpatialProfileDataResponse1[0].x).toEqual(assertItem.spatialProfileData[1].x);
                expect(SpatialProfileDataResponse1[0].y).toEqual(assertItem.spatialProfileData[1].y);
                expect(SpatialProfileDataResponse1[0].value).toEqual(assertItem.spatialProfileData[1].value);
                expect(SpatialProfileDataResponse2[0].x).toEqual(assertItem.spatialProfileData[2].x);
                expect(SpatialProfileDataResponse2[0].y).toEqual(assertItem.spatialProfileData[2].y);
                expect(SpatialProfileDataResponse2[0].value).toEqual(assertItem.spatialProfileData[2].value);

                expect(SpatialProfileDataResponse1[0].profiles[0]).toEqual(SpatialProfileDataResponse2[0].profiles[0]);
                expect(SpatialProfileDataResponse1[0].profiles[1]).toEqual(SpatialProfileDataResponse2[0].profiles[1]);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});