import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import {MessageController, ConnectionStatus} from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.concat_stokes;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;

interface AssertItem {
    ConcatReqShape: CARTA.IConcatStokesFiles;
    ConcatReqDeplicate: CARTA.IConcatStokesFiles;
    ConcatResponse: string[];
};

let assertItem: AssertItem = {
    ConcatReqShape:{
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: 2
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits',
                polarizationType: 3
            },
        ],
    },
    ConcatReqDeplicate:{
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: 2
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits',
                polarizationType: 2
            },
        ],
    },
    ConcatResponse:[
        'are not consistent!',
        'Duplicate Stokes type found'
    ]
};

describe("PERF_ANIMATION_PLAYBACK",() => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();
    let basepath: string;

    describe(`Case 1: Q & axis-degeneracy U, Image shape inconsistent`,()=>{
        test(`(Step 1) Assert FileListRequest |`, async()=>{
            let fileListResponse = await msgController.getFileList("$BASE", 0);
            basepath = fileListResponse.directory;
        });

        let ConcatStokesResponse: any = [];
        test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
            assertItem.ConcatReqShape.stokesFiles.map((input,index) => {
                assertItem.ConcatReqShape.stokesFiles[index].directory = testSubdirectory;
            });
            msgController.closeFile(-1);
            try { 
                ConcatStokesResponse = await msgController.loadStokeFiles(assertItem.ConcatReqShape.stokesFiles, assertItem.ConcatReqShape.fileId, assertItem.ConcatReqShape.renderMode);
            } catch (err) {        
                expect(err).toContain(assertItem.ConcatResponse[0]);
            }
        }, concatStokeTimeout);
    });

    describe(`Case 3: Q & axis-degeneracy Q, duplicated Stokes type`,() => {
        test(`(Step 1) Assert FileListRequest |`, async()=>{
            let fileListResponse = await msgController.getFileList("$BASE", 0);
            basepath = fileListResponse.directory;
        });

        let ConcatStokesResponse: any = [];
        test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
            assertItem.ConcatReqDeplicate.stokesFiles.map((input,index) => {
                assertItem.ConcatReqDeplicate.stokesFiles[index].directory = testSubdirectory;
            });
            msgController.closeFile(-1);
            try { 
                ConcatStokesResponse = await msgController.loadStokeFiles(assertItem.ConcatReqDeplicate.stokesFiles, assertItem.ConcatReqDeplicate.fileId, assertItem.ConcatReqDeplicate.renderMode);
            } catch (err) {        
                expect(err).toContain(assertItem.ConcatResponse[1]);
            }
        }, concatStokeTimeout);
    });

    afterAll(() => msgController.closeConnection());
})