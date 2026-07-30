import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let regionSubdirectory: string = config.path.region;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let regionTimeout: number = config.timeout.region;
let exportTimeout: number = config.timeout.export;

interface AssertItem {
    fileOpen: CARTA.IOpenFile;
    setRegion: CARTA.ISetRegion;
    regionStyle: CARTA.IRegionStyle;
    exportRegion: CARTA.IExportRegion[];
    exportRegionAck: CARTA.IExportRegionAck[];
}

let assertItem: AssertItem = {
    fileOpen: {
        directory: testSubdirectory,
        file: 'M17_SWex.image',
        hdu: '',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            rotation: 0,
            controlPoints: [
                { x: 200.0, y: 400.0 },
                { x: 100.0, y: 100.0 },
            ],
        },
    },
    regionStyle: {
        name: '',
        color: '#2EE6D6',
        lineWidth: 2,
        dashList: [],
    },
    exportRegion: [
        {
            // The export path resolves to an existing directory
            directory: testSubdirectory,
            file: 'regionTest',
            type: CARTA.FileType.CRTF,
            coordType: CARTA.CoordinateType.PIXEL,
            fileId: 0,
            overwrite: true,
        },
        {
            // The export path resolves to an existing file
            directory: regionSubdirectory,
            file: 'M17_SWex_regionSet1_pix.crtf',
            type: CARTA.FileType.CRTF,
            coordType: CARTA.CoordinateType.PIXEL,
            fileId: 0,
            overwrite: false,
        },
    ],
    exportRegionAck: [
        {
            success: false,
            message: 'Export region failed: cannot overwrite existing directory.',
            overwriteConfirmationRequired: false,
        },
        {
            success: false,
            message: 'Export region failed: cannot overwrite existing file.',
            overwriteConfirmationRequired: true,
        },
    ],
};

let basepath: string;
describe('EXPORT_REGION_OVERWRITE: Exporting regions to a path which cannot be overwritten', () => {
    const msgController = MessageController.Instance;

    // The backend rejects the request through EXPORT_REGION_ACK.success = false, and the message
    // controller turns an unsuccessful ack into a rejection carrying the whole ack.
    const exportRegion = async (
        input: CARTA.IExportRegion,
        regionStyles: Map<number, CARTA.IRegionStyle>
    ): Promise<CARTA.IExportRegionAck> => {
        try {
            return await msgController.exportRegion(
                input.directory,
                input.file,
                input.type,
                input.coordType,
                input.fileId,
                regionStyles,
                input.overwrite
            );
        } catch (err) {
            return err as CARTA.IExportRegionAck;
        }
    };

    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();

        // The basepath is empty when the backend starts in its own top level folder, so only
        // insert the separator when there is something to separate
        const resolveDirectory = (subdirectory: string): string =>
            basepath ? basepath + '/' + subdirectory : subdirectory;

        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.directory = resolveDirectory(assertItem.fileOpen.directory);
            assertItem.exportRegion.map((exportRegionInput) => {
                exportRegionInput.directory = resolveDirectory(exportRegionInput.directory);
            });
        });

        test(
            `Open the image "${assertItem.fileOpen.file}"`,
            async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.fileOpen);
                await Stream(CARTA.RegionHistogramData, 1);

                expect(OpenFileResponse.success).toBe(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen.file);
            },
            openFileTimeout
        );

        let regionStyles = new Map<number, CARTA.IRegionStyle>();
        test(
            `Set a region to export`,
            async () => {
                let SetRegionAck = await msgController.setRegion(
                    assertItem.setRegion.fileId,
                    assertItem.setRegion.regionId,
                    assertItem.setRegion.regionInfo
                );
                expect(SetRegionAck.success).toBe(true);
                regionStyles.set(SetRegionAck.regionId, assertItem.regionStyle);
            },
            regionTimeout
        );

        assertItem.exportRegion.map((exportRegionInput, index) => {
            const expectedAck = assertItem.exportRegionAck[index];
            describe(`Export the regions to "${exportRegionInput.file}" with overwrite = ${exportRegionInput.overwrite}`, () => {
                let exportRegionAck: CARTA.IExportRegionAck;
                test(
                    `EXPORT_REGION_ACK should arrive within ${exportTimeout} ms`,
                    async () => {
                        exportRegionAck = await exportRegion(exportRegionInput, regionStyles);
                    },
                    exportTimeout
                );

                test(`EXPORT_REGION_ACK.success = ${expectedAck.success}`, () => {
                    expect(exportRegionAck.success).toEqual(expectedAck.success);
                });

                test(`EXPORT_REGION_ACK.message = "${expectedAck.message}"`, () => {
                    expect(exportRegionAck.message).toEqual(expectedAck.message);
                });

                test(`EXPORT_REGION_ACK.overwrite_confirmation_required = ${expectedAck.overwriteConfirmationRequired}`, () => {
                    expect(exportRegionAck.overwriteConfirmationRequired).toEqual(
                        expectedAck.overwriteConfirmationRequired
                    );
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
