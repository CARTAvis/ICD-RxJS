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
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU-swap-dsrf.image",
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

    ],
    openFileAckResponse:[
        {
            success: true,
            fileInfo: {name: "HH211_IQU-swap-dsrf.image"},
            fileInfoExtended: {
                axesNumbers: {depth: 4, spatialX: 3, spatialY: 1, spectral: 4, stokes: 2},
                depth: 5,
                dimensions: 4,
                height: 1049,
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
    ],
    addTilesReq: [
        {
            fileId: 0,
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
    ],
};

let basepath: string;
describe("ANIMATOR_SWAPPED_IMAGES test: Testing the channel and stokes animation for swapped image", () => {
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

        describe(`Case 1: Open the image with axes sequence of Dec-Stokes-RA-Channel and test basic animator of  channel`,()=>{
            test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms and check correctness`,async () => {
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
                let RegionHistogramDataResponse = await Stream(CARTA.RegionHistogramData,1);

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
            }, openFileTimeout);

            test(`(Step 2)"${assertItem.fileOpen[0].file}" add tile request and receive RASTER_TILE_DATA(Stream) and check total length`, async () => {
                msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                let RasterTileData = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[0].tiles.length + 2);
                expect(RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length + 2);
                expect(RasterTileData.slice(-1)[0].endSync).toEqual(true);
                msgController.setSpatialRequirements(assertItem.setSpatialRequirements[0]);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});