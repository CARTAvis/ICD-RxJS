import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    setRegion: CARTA.ISetRegion;
    setHistogramRequirements: CARTA.ISetHistogramRequirements[];
    ResponseRegionHistogramData: CARTA.IRegionHistogramData[];
};

let assertItem: AssertItem = {
    openFile:
    {
        directory: testSubdirectory,
        file: "h_m51_b_s05_drz_sci.fits",
        fileId: 0,
        hdu: "0",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 6,
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
        regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 155, y: 552 }, { x: 134, y: 498 }, { x: 185, y: 509 }],
            rotation: 0.0,
        },
    },
    setHistogramRequirements: [
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     histograms: [{channel: -1, numBins: -1, bounds: {min: 0, max: 0}, coordinate: "z", fixedBounds: false, fixedNumBins: false}]
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     histograms: [{channel: -1, numBins: 2, bounds: {min: -1, max: 0.1376738934777677}, coordinate: "Qz", fixedBounds: true, fixedNumBins: true}]
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     histograms: [{channel: -1, numBins: -1, bounds: {min: 0, max: 0}, coordinate: "Qz", fixedBounds: false, fixedNumBins: false}]
        // }
    ],
    ResponseRegionHistogramData: 
    [
        // {
        //     progress: 1,
        //     regionId: -1,
        //     config: 
        //     {
        //         bounds: {},
        //         numBins: -1
        //     },
        //     histograms: 
        //     {
        //         binWidth: 0.0002482116688042879,
        //         firstBinCenter: -0.12420587241649628,
        //         mean: 0.000008066841056845398,
        //         numBins: 1049,
        //         stdDev: 0.014460244218400708,
        //     }
        // },
        // {
        //     progress: 1,
        //     regionId: -1,
        //     stokes: 1,
        //     config: 
        //     {
        //         bounds:{min: -1, max: 0.1376738934777677},
        //         fixedBounds: true, 
        //         fixedNumBins: true, 
        //         numBins: 2
        //     },
        //     histograms: 
        //     {
        //         binWidth: 0.5688369274139404,
        //         bins: [0, 736448],
        //         firstBinCenter: -0.7155815362930298,
        //         mean: -0.0000026881257400475778,
        //         numBins: 2,
        //         stdDev: 0.0142919735819505,
        //     }
        // },
        // {
        //     channel: 3,
        //     progress: 1,
        //     regionId: -1,
        //     stokes: 1,
        //     config: 
        //     {
        //         bounds:{min: -1, max: 0.1376738934777677},
        //         fixedBounds: true, 
        //         fixedNumBins: true, 
        //         numBins: 2
        //     },
        //     histograms: 
        //     {
        //         binWidth: 0.5688369274139404,
        //         bins: [0, 736705],
        //         firstBinCenter: -0.7155815362930298,
        //         mean: 0.000002222024835655828,
        //         numBins: 2,
        //         stdDev: 0.002096762523721388,
        //     }
        // },
        // {
        //     channel: 3,
        //     progress: 1,
        //     regionId: -1,
        //     stokes: 1,
        //     config: 
        //     {
        //         bounds:{},
        //         numBins: -1
        //     },
        //     histograms: 
        //     {
        //         binWidth: 0.00003724902853718959,
        //         firstBinCenter: -0.016793109476566315,
        //         mean: 0.000002222024835655828,
        //         numBins: 1049,
        //         stdDev: 0.002096762523721388,
        //     }
        // }
    ]
}

let basepath: string;
describe("Testing the large image with multi-polygon region and set_histogram_requirement, let the region_histogram_data in queue:", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        afterAll(() => msgController.closeConnection());

        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
            test(`Preparation: Open image`,async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);;
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);

                let receiveNumber1 = msgController.messageReceiving()
                msgController.addRequiredTiles(assertItem.addTilesRequire);
                let RasterTileDataResponse = await Stream(CARTA.RasterTileData,3);
                let receiveNumber2 = msgController.messageReceiving();
                
                expect(receiveNumber2 - receiveNumber1).toEqual(3);
            }, openFileTimeout);

        });

        afterAll(() => msgController.closeConnection());
    });
});