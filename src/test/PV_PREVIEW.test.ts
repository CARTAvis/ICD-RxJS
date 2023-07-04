import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

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
    ]
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
            });

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

            let regionHistogramData = [];
            test(`(Step 4): set PV request`, async () => {
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                let PVresponse = await msgController.requestPV(assertItem.setPVRequest[0]);
                // console.log(PVresponse);
                // console.log(regionHistogramDataPromise);
            });

            afterAll(() => msgController.closeConnection());
        });
    }
});