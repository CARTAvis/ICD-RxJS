import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/myClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.catalogArtificial;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;

type IOpenCatalogFileAck = {
    success: boolean;
    dataSize?: number;
    system?: string;
    headerLength?: number;
};
interface AssertItem {
    openFile: CARTA.IOpenFile;
    openCatalogFile: CARTA.IOpenCatalogFile[];
    OpenCatalogFileAck: IOpenCatalogFileAck[];
    errorCatalogFileInfoRequest: CARTA.ICatalogFileInfoRequest;
    errorCatalogFileInfoResponse: CARTA.ICatalogFileInfoResponse;
}

let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: 'Gaussian_J2000.fits',
        fileId: 100,
        hdu: '',
        renderMode: CARTA.RenderMode.RASTER,
    },
    openCatalogFile: [
        {
            directory: testSubdirectory,
            name: 'artificial_catalog_B1950.xml',
            fileId: 101,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: 'artificial_catalog_Ecliptic.xml',
            fileId: 102,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: 'artificial_catalog_Galactic.xml',
            fileId: 103,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: 'artificial_catalog_J2000.xml',
            fileId: 104,
            previewDataSize: 0,
        },
    ],
    OpenCatalogFileAck: [
        {
            success: true,
            dataSize: 29,
            system: 'FK4',
            headerLength: 235,
        },
        {
            success: true,
            dataSize: 29,
            system: 'Ecliptic',
            headerLength: 235,
        },
        {
            success: true,
            dataSize: 29,
            system: 'Galactic',
            headerLength: 235,
        },
        {
            success: true,
            dataSize: 29,
            system: 'FK5',
            headerLength: 235,
        },
    ],
    errorCatalogFileInfoRequest: {
        directory: testSubdirectory,
        name: 'Gaussian_J2000.fits',
    },
    errorCatalogFileInfoResponse: {
        headers: [],
        message: 'File does not contain a FITS table!',
    },
};

let basepath: string;
describe('IMPORT_MULTIPLE_CATALOG: Opening multiple region files at once', () => {
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

        assertItem.openCatalogFile.map((catalogFile, index) => {
            describe(`open catalog file : ${catalogFile.name}`, () => {
                let openCatalogFileAck: any;
                test(
                    `OPEN_CATALOG_FILEACK should arrive within ${openFileTimeout} ms".`,
                    async () => {
                        openCatalogFileAck = await msgController.loadCatalogFile(
                            catalogFile.directory,
                            catalogFile.name,
                            catalogFile.fileId,
                            catalogFile.previewDataSize
                        );
                    },
                    regionTimeout
                );

                test(`OPEN_CATALOG_FILEACK.success = ${assertItem.OpenCatalogFileAck[index].success}`, () => {
                    expect(openCatalogFileAck.success).toBe(assertItem.OpenCatalogFileAck[index].success);
                });

                if (assertItem.OpenCatalogFileAck[index].success) {
                    test(`OPEN_CATALOG_FILEACK.dataSize = ${assertItem.OpenCatalogFileAck[index].dataSize}`, () => {
                        expect(openCatalogFileAck.dataSize).toEqual(assertItem.OpenCatalogFileAck[index].dataSize);
                    });

                    test(`OPEN_CATALOG_FILEACK.fileInfo.coosys[0].system = ${assertItem.OpenCatalogFileAck[index].system}`, () => {
                        expect(openCatalogFileAck.fileInfo.coosys[0].system).toEqual(
                            assertItem.OpenCatalogFileAck[index].system
                        );
                    });

                    test(`OPEN_CATALOG_FILEACK.header.length = ${assertItem.OpenCatalogFileAck[index].headerLength}`, () => {
                        expect(openCatalogFileAck.headers.length).toEqual(
                            assertItem.OpenCatalogFileAck[index].headerLength
                        );
                    });
                }
            });
        });

        describe(`Check the error catalog file info request`, () => {
            let catalogFileInfoResponse: any;
            test(`Request the wrong catalog formate to catalog file info request and match the error message`, async () => {
                try {
                    catalogFileInfoResponse = await msgController.getCatalogFileInfo(
                        assertItem.errorCatalogFileInfoRequest.directory,
                        assertItem.errorCatalogFileInfoRequest.name
                    );
                } catch (err) {
                    expect(err).toContain(assertItem.errorCatalogFileInfoResponse.message);
                }
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
