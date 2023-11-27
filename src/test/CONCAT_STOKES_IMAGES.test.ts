import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import {MessageController, ConnectionStatus} from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.concat_stokes;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;

interface ConcatStokesFilesAckExt extends CARTA.IConcatStokesFilesAck {
    OpenFileAckBeamLength: number
}

interface AssertItem {
    fileInfoReq: CARTA.IFileInfoRequest[];
    ConcatReq: CARTA.IConcatStokesFiles;
    ConcatReqIV: CARTA.IConcatStokesFiles;
    ConcatReqQU: CARTA.IConcatStokesFiles;
    ConcatReqIQU: CARTA.IConcatStokesFiles;
    ConcatReqQUV: CARTA.IConcatStokesFiles;
    ConcatResponse: ConcatStokesFilesAckExt[];
};

let assertItem: AssertItem = {
    fileInfoReq:[
        {
            file:"IRCp10216_sci.spw0.cube.I.manual.pbcor.fits",
            hdu: "",
        },
        {
            file:"IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits",
            hdu: "",
        },
        {
            file:"IRCp10216_sci.spw0.cube.U.manual.pbcor.fits",
            hdu: "",
        },
        {
            file:"IRCp10216_sci.spw0.cube.V.manual.pbcor.fits",
            hdu: "",
        },
    ],
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
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: 2
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                polarizationType: 1
            },
        ],
    },
    ConcatReqIV: {
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
                file:'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                polarizationType: 1
            },
        ],
    },
    ConcatReqQU: {
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                polarizationType: 3
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: 2
            },
        ],
    },
    ConcatReqIQU: 
    {
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                polarizationType: 3
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: 2
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                polarizationType: 1
            },
        ],
    },
    ConcatReqQUV: {
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
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: 2
            },
        ],
    },
    ConcatResponse:[
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_IQUV.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 4,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 1920,
    },
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_IV.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 2,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 960,
    },
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 2,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 960,
    },
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_IQU.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 3,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 1440,
    },
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_QUV.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 3,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 1440,
    }
    ]
};