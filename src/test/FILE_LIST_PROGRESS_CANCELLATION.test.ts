import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './myClient';
import { MessageController } from './MessageController';
import config from './config.json';

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
    filelist: { directory: testSubdirectory, filterMode: 0 },
    checkBackendlist: { directory: testBackendSubdirectory, filterMode: 0 },
};

let basepath: string;
describe('FILE_LIST_PROGRESS_CANCELLATION test: Test ListProgress & StopFileList ICD with loading the folder which contains many files.', () => {
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

            let temp: any;
            test(
                `Receive a series of *One* ListProgress than requst StopFileList:`,
                async () => {
                    msgController.getFileList(assertItem.filelist.directory, assertItem.filelist.filterMode);
                    temp = await Stream(CARTA.ListProgress, 1);
                    if (temp[0].percentage != undefined) {
                        console.log('List Progress: ', temp[0].percentage, '%');
                    }
                    msgController.cancelRequestingFileList(0);
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
