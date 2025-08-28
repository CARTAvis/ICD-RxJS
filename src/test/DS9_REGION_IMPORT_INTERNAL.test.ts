import { CARTA } from 'carta-protobuf';
import config from './config.json';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let readFileTimeout = config.timeout.readFile;
let openFileTimeout: number = config.timeout.openFile;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.IImportRegionAck[];
}

let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: 'M17_SWex.image',
        fileId: 0,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    addTilesRequire: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 0,
    importRegion: [
        {
            groupId: 0,
            type: CARTA.FileType.DS9_REG,
            file: 'M17_SWex_regionSet1_world_v4.reg',
        },
        {
            groupId: 0,
            type: CARTA.FileType.DS9_REG,
            file: 'M17_SWex_regionSet1_pix_v4.reg',
        },
    ],
    importRegionAck: [
        {
            success: true,
            regions: {
                '1': {
                    controlPoints: [{ x: -103.8, y: 613.1 }],
                    regionType: CARTA.RegionType.POINT,
                    rotation: 0,
                },
                '2': {
                    controlPoints: [
                        { x: -106.4, y: 528.9 },
                        { x: 75.1, y: 75.1 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '3': {
                    controlPoints: [
                        { x: -118.0, y: 412.4 },
                        { x: 137.2, y: 54.4 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '4': {
                    controlPoints: [
                        { x: -120.6, y: 251.9 },
                        { x: 173.5, y: 44.0 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '5': {
                    controlPoints: [
                        { x: 758.3, y: 635.1 },
                        { x: 50.5, y: 50.5 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '6': {
                    controlPoints: [
                        { x: 749.3, y: 486.2 },
                        { x: 29.8, y: 69.9 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '7': {
                    controlPoints: [
                        { x: 745.4, y: 369.7 },
                        { x: 18.1, y: 79.0 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '8': {
                    controlPoints: [
                        { x: 757.0, y: 270.1 },
                        { x: 715.6, y: 118.6 },
                        { x: 829.5, y: 191.1 },
                    ],
                    regionType: CARTA.RegionType.POLYGON,
                },
                '9': {
                    controlPoints: [{ x: 175.8, y: 591.1 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '10': {
                    controlPoints: [
                        { x: 168.0, y: 519.9 },
                        { x: 57.0, y: 57.0 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '11': {
                    controlPoints: [
                        { x: 130.5, y: 429.3 },
                        { x: 121.7, y: 36.208 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '12': {
                    controlPoints: [
                        { x: 100.7, y: 284.3 },
                        { x: 137.2, y: 36.2 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '13': {
                    controlPoints: [
                        { x: 496.8, y: 574.3 },
                        { x: 49.2, y: 49.2 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '14': {
                    controlPoints: [
                        { x: 533.1, y: 435.7 },
                        { x: 25.9, y: 69.9 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '15': {
                    controlPoints: [
                        { x: 522.7, y: 307.6 },
                        { x: 22.0, y: 80.3 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '16': {
                    controlPoints: [
                        { x: 491.6, y: 228.6 },
                        { x: 416.5, y: 110.8 },
                        { x: 586.1, y: 106.9 },
                    ],
                    regionType: CARTA.RegionType.POLYGON,
                },
            },
        },
        {
            success: true,
            regions: {
                '17': {
                    controlPoints: [{ x: -103.8, y: 613.1 }],
                    regionType: CARTA.RegionType.POINT,
                    rotation: 0,
                },
                '18': {
                    controlPoints: [
                        { x: -106.4, y: 528.9 },
                        { x: 75.1, y: 75.1 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '19': {
                    controlPoints: [
                        { x: -118.0, y: 412.4 },
                        { x: 137.2, y: 54.4 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '20': {
                    controlPoints: [
                        { x: -120.6, y: 251.9 },
                        { x: 173.5, y: 44.0 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '21': {
                    controlPoints: [
                        { x: 758.3, y: 635.1 },
                        { x: 50.5, y: 50.5 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '22': {
                    controlPoints: [
                        { x: 749.3, y: 486.2 },
                        { x: 29.8, y: 69.9 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '23': {
                    controlPoints: [
                        { x: 745.4, y: 369.7 },
                        { x: 18.1, y: 79.0 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '24': {
                    controlPoints: [
                        { x: 757.0, y: 270.1 },
                        { x: 715.6, y: 118.6 },
                        { x: 829.5, y: 191.1 },
                    ],
                    regionType: CARTA.RegionType.POLYGON,
                },
                '25': {
                    controlPoints: [{ x: 175.8, y: 591.1 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '26': {
                    controlPoints: [
                        { x: 168.0, y: 519.9 },
                        { x: 57.0, y: 57.0 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '27': {
                    controlPoints: [
                        { x: 130.5, y: 429.3 },
                        { x: 121.7, y: 36.208 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                },
                '28': {
                    controlPoints: [
                        { x: 100.7, y: 284.3 },
                        { x: 137.2, y: 36.2 },
                    ],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '29': {
                    controlPoints: [
                        { x: 496.8, y: 574.3 },
                        { x: 49.2, y: 49.2 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '30': {
                    controlPoints: [
                        { x: 533.1, y: 435.7 },
                        { x: 25.9, y: 69.9 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '31': {
                    controlPoints: [
                        { x: 522.7, y: 307.6 },
                        { x: 22.0, y: 80.3 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '32': {
                    controlPoints: [
                        { x: 491.6, y: 228.6 },
                        { x: 416.5, y: 110.8 },
                        { x: 586.1, y: 106.9 },
                    ],
                    regionType: CARTA.RegionType.POLYGON,
                },
            },
        },
    ],
};

describe('DS9_REGION_IMPORT_INTERNAL: Testing import of DS9 region files made with CARTA', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
        test(
            `Get basepath and modify the directory path`,
            async () => {
                let fileListResponse = await msgController.getFileList('$BASE', 0);
                basepath = fileListResponse.directory;
                assertItem.openFile.directory = basepath + '/' + assertItem.openFile.directory;
            },
            readFileTimeout
        );
    });

    describe(`Open the file "${assertItem.openFile.file}"`, () => {
        let regionHistogramData = [];
        test(
            `Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
            async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let regionHistogramDataPromise = new Promise((resolve) => {
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            regionHistogramData.push(data);
                            resolve(regionHistogramData);
                        },
                    });
                });
                OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                let RegionHistogramData = await regionHistogramDataPromise;

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
            },
            openFileTimeout
        );

        assertItem.importRegionAck.map((regionAck, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: any;
                let importRegionAckProperties: any[];
                test(
                    `IMPORT_REGION_ACK should return within ${importTimeout}ms`,
                    async () => {
                        assertItem.importRegion[idxRegion].directory = basepath + '/' + regionSubdirectory;
                        importRegionAck = await msgController.importRegion(
                            assertItem.importRegion[idxRegion].directory,
                            assertItem.importRegion[idxRegion].file,
                            assertItem.importRegion[idxRegion].type,
                            assertItem.importRegion[idxRegion].groupId
                        );
                        importRegionAckProperties = Object.keys(importRegionAck.regions);
                        if (importRegionAck.message != '') {
                            console.log(importRegionAck.message);
                        }
                    },
                    importTimeout
                );

                test(`IMPORT_REGION_ACK.success = ${regionAck.success}`, () => {
                    expect(importRegionAck.success).toBe(regionAck.success);
                });

                test(`Length of IMPORT_REGION_ACK.region = ${Object.keys(regionAck.regions).length}`, () => {
                    expect(importRegionAckProperties.length).toEqual(Object.keys(regionAck.regions).length);
                });

                Object.keys(regionAck.regions).map((region, index) => {
                    test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region}, Type:${CARTA.RegionType[regionAck.regions[region].regionType]}"`, () => {
                        expect(importRegionAckProperties[index]).toEqual(String(region));
                        expect(importRegionAck.regions[importRegionAckProperties[index]].regionType).toEqual(
                            regionAck.regions[region].regionType
                        );
                        if (regionAck.regions[region].rotation) {
                            expect(importRegionAck.regions[importRegionAckProperties[index]].rotation).toBeCloseTo(
                                regionAck.regions[region].rotation
                            );
                        }
                        importRegionAck.regions[importRegionAckProperties[index]].controlPoints.map((point, idx) => {
                            expect(point.x).toBeCloseTo(
                                regionAck.regions[region].controlPoints[idx].x,
                                assertItem.precisionDigits
                            );
                            expect(point.y).toBeCloseTo(
                                regionAck.regions[region].controlPoints[idx].y,
                                assertItem.precisionDigits
                            );
                        });
                    });
                });
            });
        });
    });
    afterAll(() => msgController.closeConnection());
});
