import { CARTA } from 'carta-protobuf';
import { checkConnection } from 'utilities/myClient';
import { MessageController } from 'utilities/MessageController';
import config from 'utilities/config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let expectBasePath = config.path.base;
let connectTimeout = config.timeout.connection;
let fileListTimeout = config.timeout.listFile;

interface AssertItem {
    filelistGroup: CARTA.IFileListRequest[];
    fileListResponseGroup: CARTA.IFileListResponse[];
    errorFileList: CARTA.IFileListRequest;
    errorFileListResponse: string;
}
let assertItem: AssertItem = {
    filelistGroup: [
        { directory: expectBasePath, filterMode: 0 },
        { directory: testSubdirectory, filterMode: 0 },
        { directory: testSubdirectory + '/tmp', filterMode: 0 },
    ],
    fileListResponseGroup: [
        {
            success: true,
            subdirectories: ['set_QA'],
        },
        {
            success: true,
            directory: testSubdirectory,
            files: [{ name: 'M17_SWex.fits' }],
            subdirectories: ['tmp'],
        },
        {
            success: true,
            directory: testSubdirectory + '/tmp',
            parent: testSubdirectory,
        },
    ],
    errorFileList: { directory: '/unknown/path', filterMode: 0 },
    errorFileListResponse: 'File list failed',
};

let basepath: string;
describe('GET_FILELIST_DEFAULT_PATH tests: Testing generation of a file list at default path ($BASE)', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            let registerViewerAck = await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.filelistGroup[1].directory = basepath + '/' + assertItem.filelistGroup[1].directory;
            assertItem.filelistGroup[2].directory = basepath + '/' + assertItem.filelistGroup[2].directory;
        });

        assertItem.filelistGroup.map((filelist, index) => {
            describe(`access folder "${filelist.directory}"`, () => {
                let FileListResponseTemp: any;
                test(
                    `should get "FILE_LIST_RESPONSE" within ${fileListTimeout} ms.`,
                    async () => {
                        FileListResponseTemp = await msgController.getFileList(filelist.directory, filelist.filterMode);
                    },
                    fileListTimeout
                );

                test(`FILE_LIST_RESPONSE.success = ${assertItem.fileListResponseGroup[index].success}`, () => {
                    expect(FileListResponseTemp.success).toBe(assertItem.fileListResponseGroup[index].success);
                });

                if (assertItem.fileListResponseGroup[index].parent !== undefined) {
                    test(`FILE_LIST_RESPONSE.parent is "${assertItem.fileListResponseGroup[index].parent}"`, () => {
                        expect(FileListResponseTemp.parent).toEqual(assertItem.fileListResponseGroup[index].parent);
                    });
                }

                if (assertItem.fileListResponseGroup[index].directory !== undefined) {
                    test(`FILE_LIST_RESPONSE.directory = "${assertItem.fileListResponseGroup[index].directory}"`, () => {
                        expect(FileListResponseTemp.directory).toContain(
                            assertItem.fileListResponseGroup[index].directory
                        );
                    });
                }

                if (assertItem.fileListResponseGroup[index].files !== undefined) {
                    assertItem.fileListResponseGroup[index].files.map((file) => {
                        test(`check FILE_LIST_RESPONSE.files[] should contain ${JSON.stringify(file)}`, () => {
                            let FileListResponseTempFilename = FileListResponseTemp.files.map((f) => f.name);
                            expect(FileListResponseTempFilename).toEqual(expect.arrayContaining([file.name]));
                        });
                    });
                }

                if (assertItem.fileListResponseGroup[index].subdirectories !== undefined) {
                    assertItem.fileListResponseGroup[index].subdirectories.map((subdir) => {
                        test(`check FILE_LIST_RESPONSE.subdirectories[] should contain ${JSON.stringify(subdir)}`, () => {
                            let FileListResponseTempSubdirectories = FileListResponseTemp.subdirectories.map(
                                (f) => f.name
                            );
                            expect(FileListResponseTempSubdirectories).toEqual(expect.arrayContaining([subdir]));
                        });
                    });
                }
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});

describe('GET_FILELIST_UNKNOWN_PATH tests: Testing error handle of file list generation if the requested path does not exist', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            let registerViewerAck = await msgController.connect(testServerUrl);
        }, connectTimeout);

        let FileListResponseTemp: any;
        describe(`access folder "/unknown/path"`, () => {
            let _message: any;
            test(
                `should get "FILE_LIST_RESPONSE" within ${fileListTimeout} ms.`,
                async () => {
                    try {
                        let fileListResponse = await msgController.getFileList(
                            assertItem.errorFileList.directory,
                            assertItem.errorFileList.filterMode
                        );
                    } catch (err) {
                        _message = err;
                    }
                },
                fileListTimeout
            );

            test('FILE_LIST_RESPONSE.message is an error message', () => {
                expect(_message).toContain(assertItem.errorFileListResponse);
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
