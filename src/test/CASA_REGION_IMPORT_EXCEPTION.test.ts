import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;

interface AssertItem {
    openFile: CARTA.IOpenFile;
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
    precisionDigits: 4,
    importRegion: [
        {
            contents: [],
            // directory: regionSubdirectory,
            file: 'M17_SWex_regionSet2_pix.crtf',
            groupId: 0,
            type: CARTA.FileType.CRTF,
        },
        {
            contents: [],
            // directory: regionSubdirectory,
            file: 'M17_SWex_regionSet2_world.crtf',
            groupId: 0,
            type: CARTA.FileType.CRTF,
        },
    ],
    importRegionAck: [
        {
            success: true,
            message: 'symbol import failed.',
            regions: { '1': { regionType: CARTA.RegionType.POINT, controlPoints: [{ x: -133.8, y: 613.1 }] } },
        },
        {
            success: true,
            message: 'symbol import failed.',
            regions: {
                '2': { regionType: CARTA.RegionType.POINT, controlPoints: [{ x: -103.80097859, y: 613.09223508 }] },
            },
        },
    ],
};

let basepath: string;
let zarrAssertItem: AssertItem = {
    ...assertItem,
    openFile: { ...assertItem.openFile, file: 'M17_SWex-casa.zarr', hdu: 'SKY' },
};

describe.each([
    ['CASA image', assertItem],
    ['Zarr image', zarrAssertItem],
])('CASA_REGION_IMPORT_EXCEPTION (%s)', (_format, assertItem) => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + '/' + assertItem.openFile.directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
            test(`Preparation: Open image`, async () => {
                msgController.closeFile(-1);
                const histogramStream = Stream(CARTA.RegionHistogramData, 1);
                const openFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(openFileResponse.success).toBe(true);
                expect(openFileResponse.fileInfo.name).toBe(assertItem.openFile.file);
                await histogramStream;
            });

            assertItem.importRegionAck.map((regionAck, idxRegion) => {
                describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                    test(
                        `IMPORT_REGION_ACK should report the invalid symbol and return the valid point within ${importTimeout}ms`,
                        async () => {
                            const response = await msgController.importRegion(
                                basepath + '/' + regionSubdirectory,
                                assertItem.importRegion[idxRegion].file,
                                assertItem.importRegion[idxRegion].type,
                                assertItem.importRegion[idxRegion].groupId
                            );
                            expect(response.success).toBe(regionAck.success);
                            expect(response.message.trim()).toBe(regionAck.message);
                            expect(Object.keys(response.regions)).toEqual(Object.keys(regionAck.regions));
                            const [regionId] = Object.keys(regionAck.regions);
                            const region = response.regions[regionId];
                            const expected = regionAck.regions[regionId];
                            expect(region.regionType).toBe(expected.regionType);
                            expect(region.controlPoints).toHaveLength(1);
                            const [point] = region.controlPoints;
                            expect(point.x).toBeCloseTo(expected.controlPoints[0].x, assertItem.precisionDigits);
                            expect(point.y).toBeCloseTo(expected.controlPoints[0].y, assertItem.precisionDigits);
                        },
                        importTimeout
                    );
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
