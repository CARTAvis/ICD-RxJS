import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.region;
let imagedirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;

type IRegionAck = {
    success: boolean;
    message: string;
    regionNumber: number;
    regionStyles: CARTA.IRegionStyle;
};
interface AssertItem {
    openFile: CARTA.IOpenFile;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: IRegionAck[];
    errorImportRegion: CARTA.IImportRegion;
    errorImportRegionAck: CARTA.IErrorData;
}

let assertItem: AssertItem = {
    openFile: {
        directory: imagedirectory,
        file: 'M17_SWex.image',
        fileId: 100,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },
    importRegion: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex_regionSet1_pix.crtf',
            groupId: 100,
            type: CARTA.FileType.CRTF,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex_regionSet1_world.crtf',
            groupId: 100,
            type: CARTA.FileType.CRTF,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex_regionSet1_pix.reg',
            groupId: 100,
            type: CARTA.FileType.DS9_REG,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex_regionSet1_world.reg',
            groupId: 100,
            type: CARTA.FileType.DS9_REG,
            contents: [],
        },
    ],
    importRegionAck: [
        {
            success: true,
            message: '',
            regionNumber: 16,
            regionStyles: { color: 'green', lineWidth: 1 },
        },
        {
            success: true,
            message: '',
            regionNumber: 16,
            regionStyles: { color: 'green', lineWidth: 1 },
        },
        {
            success: true,
            message: '',
            regionNumber: 16,
            regionStyles: { color: 'green', lineWidth: 1 },
        },
        {
            success: true,
            message: '',
            regionNumber: 16,
            regionStyles: { color: 'green', lineWidth: 1 },
        },
    ],
    errorImportRegion: {
        directory: testSubdirectory,
        file: 'M17_SWex.image',
        groupId: 100,
        type: CARTA.FileType.CASA,
        contents: [],
    },
    errorImportRegionAck: {
        message: 'Import region failed:',
    },
};

let basepath: string;
describe('IMPORT_MULTIPLE_REGION: Opening multiple region files at once', () => {
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

        describe(`Open ${assertItem.openFile.file}`, () => {
            let OpenFileAck: any;
            let RegionHistogramData: any;
            test(
                `OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,
                async () => {
                    OpenFileAck = await msgController.loadFile(assertItem.openFile);
                    RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileAck.success).toBe(true);
                    expect(OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
                },
                openFileTimeout
            );
        });

        assertItem.importRegion.map((region, index) => {
            describe(`import region file : ${region.file}`, () => {
                let importRegionAck: any;
                test(
                    `IMPORT_REGION_ACK should arrive within ${openFileTimeout} ms".`,
                    async () => {
                        importRegionAck = await msgController.importRegion(
                            region.directory,
                            region.file,
                            region.type,
                            region.groupId
                        );
                    },
                    regionTimeout
                );

                test(`IMPORT_REGION_ACK.success = ${assertItem.importRegionAck[index].success}`, () => {
                    expect(importRegionAck.success).toBe(assertItem.importRegionAck[index].success);
                });

                test(`IMPORT_REGION_ACK.regionStyles = ${JSON.stringify(assertItem.importRegionAck[index].regionStyles)}`, () => {
                    Object.values(importRegionAck.regionStyles).map((style) => {
                        for (let key in Object(assertItem.importRegionAck[index].regionStyles)) {
                            expect(style[key]).toEqual(assertItem.importRegionAck[index].regionStyles[key]);
                        }
                    });
                });

                test(`IMPORT_REGION_ACK.region.length = ${assertItem.importRegionAck[index].regionNumber}`, () => {
                    expect(Object.keys(importRegionAck.regions).length).toEqual(
                        assertItem.importRegionAck[index].regionNumber
                    );
                });

                test(`IMPORT_REGION_ACK.message = "${assertItem.importRegionAck[index].message}"`, () => {
                    expect(importRegionAck.message).toEqual(assertItem.importRegionAck[index].message);
                });
            });
        });

        describe(`Check the error import region request`, () => {
            let importRegionAck: any;
            test(`Request the wrong catalog formate to catalog file info request and match the error message`, async () => {
                try {
                    importRegionAck = await msgController.importRegion(
                        assertItem.errorImportRegion.directory,
                        assertItem.errorImportRegion.file,
                        assertItem.errorImportRegion.type,
                        assertItem.errorImportRegion.groupId
                    );
                } catch (err) {
                    expect(err).toContain(assertItem.errorImportRegionAck.message);
                }
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
