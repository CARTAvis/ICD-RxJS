import { CARTA } from "carta-protobuf";
import { checkConnection} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    message: string[];
};

let assertItem: AssertItem = {
    message: [
        "File no_such_file.image does not exist.",
        "Image must be 2D, 3D or 4D."
    ]
};

let basepath: string;
describe("FILEINFO_EXCEPTIONS: Testing error handle of file info generation", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        describe(`Go to "${testSubdirectory}" folder`, () => {
            test('Preparation:',async () => {
                let FileListResponse = await msgController.getFileList('$BASE', 0);
                basepath = FileListResponse.directory;
            }, listFileTimeout);
        });

        ["no_such_file.image", "broken_header.miriad"].map((fileName: string, index) => {
            describe(`query the info of file : ${fileName}`, () => {
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms" and check the message`, async () => {
                    // const data = await msgController.getFileInfo(`${basepath}/` + testSubdirectory, fileName, "0")
                    
                    // .then((data) => {console.log(data)})
                    // .catch((err) => console.log(err))
                    try {
                        await msgController.getFileInfo(`${basepath}/` + testSubdirectory, fileName, "0");
                    } catch (err) {
                        console.log(err);
                        expect(err).toEqual(assertItem.message[index])
                    }
                }, openFileTimeout);
            });
        });
        afterAll(() => msgController.closeConnection());
    });
});