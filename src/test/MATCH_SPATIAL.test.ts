import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spatralProfile;

interface IIndexValue {
    index: number;
    value: number;
}
interface ISingleProfile {
    coordinate: string;
    inrawValuesFp32: IIndexValue[];
}
interface AssertItem {
    precisionDigits: number;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: CARTA.ISpatialProfileData[];
    setSpatialRequirements: CARTA.ISetSpatialRequirements[];
    profiles: CARTA.ISpatialProfile[];
    testProfile: ISingleProfile[];
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
    setCursor: [
        {
            fileId: 100,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
        {
            fileId: 102,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
        {
            fileId: 103,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
    ],
    spatialProfileData: [
        {
            profiles: [],
            fileId: 100,
            x: 200,
            y: 200,
            value: -0.0023265306372195482,
        },
        {
            profiles: [],
            fileId: 101,
            x: 200,
            y: 200,
            value: -0.003293930785730481,
        },
        {
            profiles: [],
            fileId: 102,
            x: 200,
            y: 200,
            value: 0.00045203242916613817,
        },
        {
            profiles: [],
            fileId: 103,
            x: 200,
            y: 200,
            value: -0.0023265306372195482,
        },
    ],
    setSpatialRequirements: [
        {
            fileId: 100,
            regionId: 0,
            spatialProfiles: [{coordinate:"x",mip:1}, {coordinate:"y",mip:1}],
        },
        {
            fileId: 100,
            regionId: 0,
            spatialProfiles: [],
        },
        {
            fileId: 103,
            regionId: 0,
            spatialProfiles: [{coordinate:"x",mip:1}, {coordinate:"y",mip:1}],
        },
    ],
    profiles: [
        {
            coordinate: 'x', end: 432,
        },
        {
            coordinate: 'y', end: 432,
        },
    ],
    testProfile: [
        {
            coordinate: 'x',
            inrawValuesFp32: [
                {
                    index: 0,
                    value: 36,
                },
                {
                    index: 500,
                    value: 242,
                },
                {
                    index: 1000,
                    value: 86,
                },
                {
                    index: 1500,
                    value: 48,
                },
            ],
        },
        {
            coordinate: 'y',
            inrawValuesFp32: [
                {
                    index: 0,
                    value: 84,
                },
                {
                    index: 500,
                    value: 163,
                },
                {
                    index: 1000,
                    value: 231,
                },
                {
                    index: 1500,
                    value: 66,
                },
            ],
        },
    ],
};

let basepath: string;
describe("MATCH_SPATIAL: Test cursor value and spatial profile with spatially matched images", () => {
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
            }
        });

        for (const [index, cursor] of assertItem.setCursor.entries()) {
            describe(`Set cursor ${index}`, () => {
                test(`Assert SpatialProfileData ${JSON.stringify(assertItem.spatialProfileData[index])}`, async () => {
                    await msgController.setCursor(cursor.fileId, cursor.point.x, cursor.point.y);
                    let spatialProfileData = await Stream(CARTA.SpatialProfileData,1);
                    expect(spatialProfileData[0]).toMatchObject(assertItem.spatialProfileData[index]);
                    expect(spatialProfileData[0].regionId).toEqual(0);
                }, cursorTimeout);
            });
        }

        let spatialProfileData0: CARTA.SpatialProfileData;
        describe(`Set Spatial Requirements for file_id = ${assertItem.setSpatialRequirements[0].fileId}`, () => {
            let spatialProfileData: CARTA.SpatialProfileData;
            test(`Assert SpatialProfileData`, async () => {
                await msgController.setSpatialRequirements(assertItem.setSpatialRequirements[0]);
                spatialProfileData = await Stream(CARTA.SpatialProfileData,1);
                spatialProfileData0 = spatialProfileData[0];
                expect(spatialProfileData[0].profiles).toMatchObject(assertItem.profiles);
                expect(spatialProfileData[0].regionId).toEqual(0);
                let testingArrayX = spatialProfileData[0].profiles.find(profile => profile.coordinate == 'x').rawValuesFp32;
                assertItem.testProfile[0].inrawValuesFp32.map(Coordinates => {
                    expect(testingArrayX[Coordinates.index]).toEqual(Coordinates.value)
                });
                let testingArrayY = spatialProfileData[0].profiles.find(profile => profile.coordinate == 'y').rawValuesFp32;
                assertItem.testProfile[1].inrawValuesFp32.map(Coordinates => {
                    expect(testingArrayY[Coordinates.index]).toEqual(Coordinates.value)
                });
            }, profileTimeout);
        });

        describe(`Set Spatial Requirements for file_id = ${assertItem.setSpatialRequirements[2].fileId}`, () => {
            let spatialProfileData: CARTA.SpatialProfileData[];
            test(`Should receive SpatialProfileData x2`, async () => {
                await msgController.setSpatialRequirements(assertItem.setSpatialRequirements[1]);
                await msgController.setSpatialRequirements(assertItem.setSpatialRequirements[2]);
                spatialProfileData = await Stream(CARTA.SpatialProfileData,2);
            }, profileTimeout);
    
            test(`Assert SPATIAL_PROFILE_DATA[first, last].profiles.length = [0, 2]`, () => {
                expect(spatialProfileData.find(data => data.fileId==assertItem.openFile[0].fileId).profiles.length).toEqual(0);
                expect(spatialProfileData.find(data => data.fileId==assertItem.openFile[3].fileId).profiles.length).toEqual(2);
            });
    
            test(`Assert SPATIAL_PROFILE_DATA of file_id:${assertItem.setSpatialRequirements[0].fileId} & file_id:${assertItem.setSpatialRequirements[2].fileId} are equal`, () => {
                let spatialProfileData1 = spatialProfileData.find(data => data.fileId==assertItem.openFile[3].fileId);
                delete spatialProfileData1.fileId;
                const spatialProfileData2 = spatialProfileData0;
                delete spatialProfileData2.fileId;
                expect(spatialProfileData1).toStrictEqual(spatialProfileData2);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
})