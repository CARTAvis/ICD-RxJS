import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface ISpectralProfileDataExt extends CARTA.ISpectralProfileData {
    rawValuesFp32Length?: number;
    rawValuesPoint?: { index?: number[], values?: number[] },
}
interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[][];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    spectralProfileData: ISpectralProfileDataExt[][];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    openFile: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            fileId: 0,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            fileId: 1,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addRequiredTiles: [
        {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    ],
    setCursor: [
        [
            {
                fileId: 0,
                point: { x: 316.0, y: 401.0 },
            },
            {
                fileId: 0,
                point: { x: 106, y: 135 },
            },
            {
                fileId: 0,
                point: { x: -10, y: -10 },
            },
        ],
        [
            {
                fileId: 1,
                point: { x: 316.0, y: 401.0 },
            },
            {
                fileId: 1,
                point: { x: 106, y: 135 },
            },
            {
                fileId: 1,
                point: { x: -10, y: -10 },
            },
        ],
    ],
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 0,
            spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
        },
        {
            fileId: 1,
            regionId: 0,
            spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
        },
    ],
    spectralProfileData: [
        [
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{ coordinate: "z", statsType: CARTA.StatsType.Sum }],
                rawValuesFp32Length: 100,
                rawValuesPoint: {index: [0, 25, 50, 75, 99], values: [99, 250, 179, 58, 58]},
            },
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{ coordinate: "z", statsType: CARTA.StatsType.Sum }],
                rawValuesFp32Length: 100,
                rawValuesPoint: {index: [0, 25, 50, 75, 99], values: [0, 0, 192, 127, 127]},
            },
        ],
        [
            {
                fileId: 1,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{ coordinate: "z", statsType: CARTA.StatsType.Sum }],
                rawValuesFp32Length: 100,
                rawValuesPoint: {index: [0, 25, 50, 75, 99], values: [99, 250, 179, 58, 58]},
            },
            {
                fileId: 1,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{ coordinate: "z", statsType: CARTA.StatsType.Sum }],
                rawValuesFp32Length: 100,
                rawValuesPoint: {index: [0, 25, 50, 75, 99], values: [255, 255, 255, 255, 255]},
            },
        ],
    ],
    precisionDigits: 4,
}

describe("CURSOR_SPATIAL_PROFILE: Testing if full resolution cursor spectral profile with/out NaN channels is delivered correctly", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    assertItem.openFile.map((openFile, index) => {
        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            test(`Get basepath and modify the directory path`, async () => {
                let fileListResponse = await msgController.getFileList("$BASE",0);
                basepath = fileListResponse.directory;
                assertItem.openFile[index].directory = basepath + "/" + assertItem.openFile[index].directory;
            }, readFileTimeout);
        });

        describe(`read the file "${openFile.file}"`, () => {
            let regionHistogramData = [];
            test(`Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile[index]);
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data)
                            resolve(regionHistogramData)
                        }
                    })
                });
                OpenFileResponse = await msgController.loadFile(assertItem.openFile[index]);
                let RegionHistogramData = await regionHistogramDataPromise;
        
                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile[index].file);
            }, openFileTimeout);

            assertItem.spectralProfileData[index].map((spectralProfile, idx) => {
                describe(`set cursor on {${assertItem.setCursor[index][idx].point.x}, ${assertItem.setCursor[index][idx].point.y}}`, () => {
                    test(`set addRequiredTiles & set Cursor`, async () => {
                        msgController.addRequiredTiles(assertItem.addRequiredTiles[index]);
                        let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.addRequiredTiles[index].tiles.length + 2);
                        msgController.setCursor(assertItem.setCursor[index][idx].fileId, assertItem.setCursor[index][idx].point.x, assertItem.setCursor[index][idx].point.y);
                        let SpatialProfileDataResponse1 = await Stream(CARTA.SpatialProfileData,1);
                    }, cursorTimeout);

                    let SpectralProfileDataResponse: any;
                    test(`SPECTRAL_PROFILE_DATA should not arrive within ${cursorTimeout} ms`, async () => {
                        msgController.setSpectralRequirements(assertItem.setSpectralRequirements[index]);
                        let SpectralProfileDataStreamPromise = new Promise((resolve) => {
                            msgController.spectralProfileStream.subscribe({
                                next: (data) => {
                                    if (data.progress === 1) {
                                        resolve(data)
                                    }
                                }
                            })
                        })
                        SpectralProfileDataResponse = await SpectralProfileDataStreamPromise;
                        expect(SpectralProfileDataResponse.progress).toEqual(spectralProfile.progress);
                    }, cursorTimeout);

                    test(`SPECTRAL_PROFILE_DATA.file_id = ${spectralProfile.fileId}`, () => {
                        expect(SpectralProfileDataResponse.fileId).toEqual(spectralProfile.fileId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.region_id = ${spectralProfile.regionId}`, () => {
                        expect(SpectralProfileDataResponse.regionId).toEqual(spectralProfile.regionId);
                    });

                    if (spectralProfile.stokes) {
                        test(`SPECTRAL_PROFILE_DATA.stokes = ${spectralProfile.stokes}`, () => {
                            expect(SpectralProfileDataResponse.stokes).toEqual(spectralProfile.stokes);
                        });
                    }

                    test(`Length of SPECTRAL_PROFILE_DATA.profiles = ${spectralProfile.profiles.length}`, () => {
                        expect(SpectralProfileDataResponse.profiles.length).toEqual(spectralProfile.profiles.length);
                    });

                    test(`SPECTRAL_PROFILE_DATA.profiles.coordinate = "${spectralProfile.profiles[0].coordinate}"`, () => {
                        expect(SpectralProfileDataResponse.profiles.find(f => f.coordinate === "z").coordinate).toEqual(spectralProfile.profiles.find(f => f.coordinate === "z").coordinate);
                    });

                    test(`SPECTRAL_PROFILE_DATA.profiles.statsType = ${CARTA.StatsType[spectralProfile.profiles[0].statsType]}`, () => {
                        expect(SpectralProfileDataResponse.profiles.find(f => f.coordinate === "z").statsType).toEqual(spectralProfile.profiles.find(f => f.coordinate === "z").statsType);
                    });

                    test(`Length of SPECTRAL_PROFILE_DATA.profiles.rawValuesFp32.values = ${spectralProfile.rawValuesFp32Length}`, () => {
                        expect(SpectralProfileDataResponse.profiles.find(f => f.coordinate === "z").rawValuesFp32.length).toEqual(spectralProfile.rawValuesFp32Length);
                    });

                    test("Check SPECTRAL_PROFILE_DATA.profiles.rawValuesFp32 value of z coordinate", () => {
                        spectralProfile.rawValuesPoint.index.map((f, index) => {
                            expect(SpectralProfileDataResponse.profiles.find(f => f.coordinate === "z").rawValuesFp32[f]).toEqual(spectralProfile.rawValuesPoint.values[index])
                        })
                    });
                })
            });
        });
    })

    afterAll(() => msgController.closeConnection());
});