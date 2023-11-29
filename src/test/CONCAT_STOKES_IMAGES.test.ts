import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import {MessageController, ConnectionStatus} from "./MessageController";
import exp from "constants";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.concat_stokes;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;

interface ConcatStokesFilesAckExt extends CARTA.IConcatStokesFilesAck {
    OpenFileAckBeamLength: number
}

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    fileInfoReq: CARTA.IFileInfoRequest[];
    ConcatReq: CARTA.IConcatStokesFiles;
    RegionHistogramDataResponseIQUV: CARTA.IRegionHistogramData;
    ConcatReqIV: CARTA.IConcatStokesFiles;
    ConcatReqQU: CARTA.IConcatStokesFiles;
    ConcatReqIQU: CARTA.IConcatStokesFiles;
    ConcatReqQUV: CARTA.IConcatStokesFiles;
    ConcatResponse: ConcatStokesFilesAckExt[];
    precisionDigits: number;
};

let assertItem: AssertItem = {
    filelist: { directory: testSubdirectory },
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
    RegionHistogramDataResponseIQUV: {
        progress: 1,
        regionId: -1,
        config: {
            numBins: -1
        },
        histograms: {
            binWidth: 0.004779201466590166,
            firstBinCenter: -0.11032065749168396,
            numBins: 256,
            stdDev: 0.05368401551544911,
            mean: 0.0014072911570091893
        }
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
    ],
    precisionDigits: 6,
};

describe("CONCAT_STOKES_IMAGES test: concatenate different stokes images into single image", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    describe(`Case 1: Combine I,Q,U,V |`,()=>{
        test(`(Step 1) Assert FileListRequest |`, async()=>{
            let FileListResponse = await msgController.getFileList(assertItem.filelist.directory, 0);
            expect(FileListResponse.success).toEqual(true);
        });

        assertItem.fileInfoReq.map((input,index)=>{
            test(`FILE_INFO_RESPONSE-${index+1} should arrive within ${openFileTimeout} ms" | `, async () => {
                let FileInfoResponse = await msgController.getFileInfo(testSubdirectory, input.file, input.hdu)
                expect(FileInfoResponse.success).toEqual(true);
            }, openFileTimeout);
        });

        let ConcatStokesResponse: any = [];
        test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
            assertItem.ConcatReq.stokesFiles.map((input,index)=>{
                assertItem.ConcatReq.stokesFiles[index].directory = testSubdirectory;
            });
            msgController.closeFile(-1);
            let regionHistogramDataArray = [];
            let regionHistogramDataPromise = new Promise((resolve)=>{
                msgController.histogramStream.subscribe({
                    next: (data) => {
                        regionHistogramDataArray.push(data)
                        resolve(regionHistogramDataArray)
                    }
                })
            });
            ConcatStokesResponse = await msgController.loadStokeFiles(assertItem.ConcatReq.stokesFiles, assertItem.ConcatReq.fileId, assertItem.ConcatReq.renderMode);
            let RegionHistogramData = await regionHistogramDataPromise;

            expect(RegionHistogramData[0].regionId).toEqual(assertItem.RegionHistogramDataResponseIQUV.regionId);
            expect(RegionHistogramData[0].progress).toEqual(assertItem.RegionHistogramDataResponseIQUV.progress);
            expect(RegionHistogramData[0].config.numBins).toEqual(assertItem.RegionHistogramDataResponseIQUV.config.numBins);
            expect(RegionHistogramData[0].histograms.binWidth).toEqual(assertItem.RegionHistogramDataResponseIQUV.histograms.binWidth);
            expect(RegionHistogramData[0].histograms.firstBinCenter).toEqual(assertItem.RegionHistogramDataResponseIQUV.histograms.firstBinCenter);
            expect(RegionHistogramData[0].histograms.mean).toEqual(assertItem.RegionHistogramDataResponseIQUV.histograms.mean);
            expect(RegionHistogramData[0].histograms.numBins).toEqual(assertItem.RegionHistogramDataResponseIQUV.histograms.numBins);
            expect(RegionHistogramData[0].histograms.stdDev).toEqual(assertItem.RegionHistogramDataResponseIQUV.histograms.stdDev); 
        },concatStokeTimeout);

        test(`(Step 3) Check CONCAT_STOKES_FILES_ACK response | `,()=>{
            expect(ConcatStokesResponse.success).toEqual(assertItem.ConcatResponse[0].success);
            expect(ConcatStokesResponse.openFileAck.success).toEqual(assertItem.ConcatResponse[0].openFileAck.success);
            expect(ConcatStokesResponse.openFileAck.beamTable.length).toEqual(assertItem.ConcatResponse[0].OpenFileAckBeamLength);
            expect(ConcatStokesResponse.openFileAck.fileInfo.name).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfo.name);
            expect(ConcatStokesResponse.openFileAck.fileInfoExtended.dimensions).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.dimensions);
            expect(ConcatStokesResponse.openFileAck.fileInfoExtended.stokes).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.stokes);
            expect(ConcatStokesResponse.openFileAck.fileInfoExtended.width).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.width);
            expect(ConcatStokesResponse.openFileAck.fileInfoExtended.height).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.height);
            expect(ConcatStokesResponse.openFileAck.fileInfoExtended.depth).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.depth);
        })
    });

    afterAll(() => msgController.closeConnection());
});