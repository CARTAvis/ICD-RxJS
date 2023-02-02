import { CARTA } from "carta-protobuf";
import { BackendService } from "./MessageController-concurrent";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let expectRootPath = config.path.root;
let testNumber = config.repeat.concurrent;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: {
        directory: config.path.base,
    },
}
let client: BackendService[] = Array(testNumber);
let fileListResponse: any[] = new Array(testNumber);
describe("GET_FILELIST_ROOTPATH_CONCURRENT test: Testing generation of a file list at root path from multiple concurrent users.", () => {
    for (let i = 0; i< client.length; i++) {
        describe(`establish #${i} connections to "${testServerUrl}`, () => {
            test(`Ask RegisterViewerAck:`, async() => {
                client[i] = new BackendService;
                await client[i].connect(testServerUrl);
            });

            test(`Ask FileListResponse`, async()=>{
                fileListResponse[i] = await client[i].getFileList('$BASE', 0);
            })

            test(`assert every FILE_LIST_RESPONSE.success to be True.`, () => {
                expect(fileListResponse[i].success).toBe(true);
            })

            // test(`assert every FILE_LIST_RESPONSE.parent is None.`, () => {
            //     expect(fileListResponse[i].parent).toBe(""); 
            // });

            // test(`assert every FILE_LIST_RESPONSE.directory is "${expectRootPath}".`, () => {
            //     expect(fileListResponse[i].directory).toBe(expectRootPath);
            // });

            test(`assert all FILE_LIST_RESPONSE.files[] are identical.`, () => {
                expect(fileListResponse[0]).toBeDefined();
                expect(JSON.stringify(fileListResponse[i].files)).toEqual(JSON.stringify(fileListResponse[0].files))
            });

            test(`assert all FILE_LIST_RESPONSE.subdirectories[] are identical.`, () => {
                expect(fileListResponse[0]).toBeDefined();
                expect(JSON.stringify(fileListResponse[i].subdirectories)).toEqual(JSON.stringify(fileListResponse[0].subdirectories))
            });
        })
    }

    afterAll( async () => {
        for (let i = 0; i< client.length; i++) {
            await client[i].closeConnection();
        }
    });
});
