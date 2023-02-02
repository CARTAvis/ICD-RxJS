import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spectralProfile;

interface AssertItem {
    precisionDigits: number;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    setRegion: CARTA.ISetRegion[];
}

let assertItem: AssertItem = {
    precisionDigits: 4,
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_13CO_2-1.fits",
            fileId: 101,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_C18O_2-1.fits",
            fileId: 102,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            fileId: 103,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 100,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 101,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 102,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 103,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: [
        {
            fileId: 100,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 102,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 103,
            point: { x: 200.0, y: 200.0 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 100,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 101,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 102,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 103,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
    ],
    setSpectralRequirements: [
        {
            fileId: 100,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
        {
            fileId: 101,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
        {
            fileId: 102,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
        {
            fileId: 103,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
    ],
    setRegion: [
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 200, y: 200 }, { x: 200, y: 200 }],
            },
        },
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 30,
                controlPoints: [{ x: 200, y: 200 }, { x: 200, y: 200 }],
            },
        },
    ],
};

let basepath: string;
describe("MATCH_SPECTRAL: Test region spectral profile with spatially and spectrally matched images", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            for (let index = 0; index < assertItem.openFile.length; index++) {
                assertItem.openFile[index].directory = basepath + "/" + assertItem.openFile[index].directory;
            }
        });

        describe(`Prepare images`, () => {
            msgController.closeFile(-1);
            for (const file of assertItem.openFile) {
                test(`Should open image ${file.file} as file_id: ${file.fileId}`, async () => {
                    let OpenFileResponse = await msgController.loadFile(file);
                    expect(OpenFileResponse.success).toEqual(true);
                    let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
                }, openFileTimeout);
            };
            for (const [index, cursor] of assertItem.setCursor.entries()) {
                test(`Prepare image ${index}`, async () => {
                    msgController.addRequiredTiles(assertItem.addTilesReq[index]);
                    let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addTilesReq[index].tiles.length + 2);

                    msgController.setCursor(cursor.fileId, cursor.point.x, cursor.point.y);
                    let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);

                    msgController.setSpatialRequirements(assertItem.setSpatialReq[index]);
                    let SpatialProfileDataResponse2 = await Stream(CARTA.SpatialProfileData,1);
                }, cursorTimeout);
            };
            test(`Should set region 1`, async () => {
                let setRegionAckResponse = await msgController.setRegion(assertItem.setRegion[0].fileId, assertItem.setRegion[0].regionId, assertItem.setRegion[0].regionInfo);
                expect(setRegionAckResponse.success).toEqual(true);
            }, regionTimeout);
        });

        describe(`Test acquire all spectral profiles`, () => {
            let SpectralProfileData: CARTA.SpectralProfileData[] = [];
            test(`Should receive 4 spectral_requirements`, async () => {
                for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                    await msgController.setSpectralRequirements(spectralRequirement);
                    let SpectralProfileDataResponse = await Stream(CARTA.SpectralProfileData);
                    SpectralProfileData.push(SpectralProfileDataResponse[0]);                    
                }
            }, profileTimeout * 3);
    
            test(`Assert all region_id equal to ${assertItem.setSpectralRequirements[0].regionId}`, () => {
                for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                    expect(SpectralProfileData.find(data => data.fileId == spectralRequirement.fileId).regionId).toEqual(spectralRequirement.regionId);
                }
            });
    
            test(`Assert the first profile equal to the last profile`, () => {
                expect(SpectralProfileData.find(data => data.fileId == assertItem.openFile[0].fileId).profiles).toEqual(SpectralProfileData.find(data => data.fileId == assertItem.openFile[3].fileId).profiles);
            });
        });

        describe(`Test acquire all spectral profiles after enlarge region`, () => {
            let SpectralProfileData: CARTA.SpectralProfileData[] = [];
            test(`Should rotate region 1`, async () => {
                await msgController.setRegion(assertItem.setRegion[1].fileId, assertItem.setRegion[1].regionId, assertItem.setRegion[1].regionInfo);
                for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                    let SpectralProfileDataResponse = await Stream(CARTA.SpectralProfileData);
                    SpectralProfileData.push(SpectralProfileDataResponse[0]);                    
                }
            }, profileTimeout * 3);
    
            test(`Assert all region_id`, () => {
                for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                    expect(SpectralProfileData.find(data => data.fileId == spectralRequirement.fileId).regionId).toEqual(spectralRequirement.regionId);
                }
            });
    
            test(`Assert the first profile equal to the last profile`, () => {
                expect(SpectralProfileData.find(data => data.fileId == assertItem.openFile[0].fileId).profiles).toEqual(SpectralProfileData.find(data => data.fileId == assertItem.openFile[3].fileId).profiles);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
})