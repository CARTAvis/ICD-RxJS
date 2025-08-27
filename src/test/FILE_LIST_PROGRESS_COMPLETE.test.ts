import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from 'utilities/MyClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.large_files;
let testBackendSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openLargeFilesTimeout: number = config.timeout.openLargeFiles;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    checkBackendlist: CARTA.IFileListRequest;
}

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
    checkBackendlist: { directory: testBackendSubdirectory },
};

let basepath: string;
describe('FILE_LIST_PROGRESS_COMPLETE test: Test ListProgress with loading the folder which contains many files and wait until loading all files.', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            let registerViewerAck = await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.filelist.directory = basepath + '/' + assertItem.filelist.directory;
            assertItem.checkBackendlist.directory = basepath + '/' + assertItem.checkBackendlist.directory;
        });

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            beforeAll(async () => {
                msgController.closeFile(-1);
            }, connectTimeout);

            let Response: any;
            test(
                `Receive a series of ListProgress until the backend sent FileListResponse:`,
                async () => {
                    Response = await msgController.getFileList(
                        assertItem.filelist.directory,
                        assertItem.filelist.filterMode
                    );
                    expect(Response.success).toEqual(true);
                },
                openLargeFilesTimeout
            );

            test(`Check the backend is still alive:`, async () => {
                //check the backend is still alive
                let BackendStatus = await msgController.getFileList(
                    assertItem.checkBackendlist.directory,
                    assertItem.checkBackendlist.filterMode
                );
                expect(BackendStatus).toBeDefined();
                expect(BackendStatus.success).toBe(true);
                expect(BackendStatus.directory).toContain('set_QA');
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
