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
    ConcatReq: CARTA.IConcatStokesFiles;
    ConcatReqShape: CARTA.IConcatStokesFiles;
    ConcatReqDeplicate: CARTA.IConcatStokesFiles;
    ConcatResponse: string[];
};

let assertItem: AssertItem = {
    ConcatReq:{
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
                polarizationType: 4
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                polarizationType: 3
            },
        ],
    },
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
        'is not allowed!',
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

    describe(`Case 1: U & V`,()=>{
        test(`(Step 1) Get basepath`, async()=>{
            let fileListResponse = await msgController.getFileList("$BASE", 0);
            basepath = fileListResponse.directory;
        });

        test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
            assertItem.ConcatReq.stokesFiles.map((input,index)=>{
                assertItem.ConcatReq.stokesFiles[index].directory = basepath + `/` + testSubdirectory; 
            });
            console.log(assertItem.ConcatReq.stokesFiles);
        }, concatStokeTimeout);
    });

    afterAll(() => msgController.closeConnection());
})