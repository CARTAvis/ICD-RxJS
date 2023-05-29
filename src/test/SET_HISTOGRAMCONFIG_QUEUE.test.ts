import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";
import { take } from 'rxjs/operators';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let repeatSetHistogram = config.repeat.setHistogram;
let dragHistogramNumberBins = config.timeout.dragManyNumberBins;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    setRegion: CARTA.ISetRegion;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    numBinsArray: number[];
    ResponseRegionHistogramData: CARTA.IRegionHistogramData;
    firstBinsArray: number[];
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
            controlPoints: [
                {x: 2846, y: 9898},
                {x: 2362, y: 8506},
                {x: 1756, y: 8597},
                {x: 1938, y: 8112},
                {x: 818, y: 7567},
                {x: 1938, y: 6932},
                {x: 939, y: 6266},
                {x: 1696, y: 5781},
                {x: 969, y: 4570},
                {x: 2422, y: 5085},
                {x: 2210, y: 3541},
                {x: 2604, y: 3934},
                {x: 2876, y: 2300},
                {x: 3542, y: 3632},
                {x: 4057, y: 2542},
                {x: 4057, y: 3632},
                {x: 5631, y: 2996},
                {x: 4904, y: 3723},
                {x: 6569, y: 4056},
                {x: 5298, y: 4267},
                {x: 6297, y: 5085},
                {x: 5147, y: 5145},
                {x: 7054, y: 6387},
                {x: 6025, y: 6356},
                {x: 6933, y: 8112},
                {x: 5934, y: 7416},
                {x: 6691, y: 9020},
                {x: 5601, y: 8203},
                {x: 5752, y: 9474},
                {x: 3936, y: 7961},
                {x: 5056, y: 9989},
                {x: 3966, y: 8506},
                {x: 3966, y: 10413},
                {x: 3270, y: 8657},
                {x: 3361, y: 10292},
            ],
            rotation: 0.0,
        },
    },
    setHistogramRequirements: {
        fileId: 0,
        regionId: 1,
        histograms: [{channel: -1, numBins: 4779, bounds: {min: 0.01625968888401985, max: 78.3388689942658}, coordinate: "z", fixedBounds: true, fixedNumBins: true}]
    },
    numBinsArray: [4779, 4853, 5003, 5078, 5227, 5376, 5526, 5675, 5750, 5899, 5974, 6048],
    ResponseRegionHistogramData: 
    {
        progress: 1,
        regionId: 1,
        config: 
        {
            bounds: {min: 0.01625968888401985, max: 78.3388689942658},
            fixedBounds: true,
            fixedNumBins: true
        },
    },
    firstBinsArray: [1738900, 1703245, 1634588, 1601625, 1539657, 1481300, 1425994, 1373866, 1348887, 1300739, 1277511, 1255213],
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('wait 200ms and send the next setHistogramRequirements!') });
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

            test(`(Step 1) Set a many points polygon region:`, async () => {
                let SetRegionAck: CARTA.ISetRegionAck;
                SetRegionAck = await msgController.setRegion(assertItem.setRegion.fileId, assertItem.setRegion.regionId, assertItem.setRegion.regionInfo);
                expect(SetRegionAck.success).toEqual(true);
                expect(SetRegionAck.regionId).toEqual(1);
            });

            let RegionHistogramDataArray: CARTA.RegionHistogramData[] = [];
            let regionHistogramDataResponse: any = []
            test(`(Step 2) Send sequent setHistogramRequirements with different numBins, to simulate the user drag the Number of bins in the setting of Histogram`, async () => {
                let count = 0;
                let regionHistogramDataPromise = new Promise((resolve)=>{
                    msgController.histogramStream.subscribe({
                        next: (data) => {
                            count = count + 1
                            RegionHistogramDataArray.push(data)
                            if (count === assertItem.numBinsArray.length) {
                                resolve(RegionHistogramDataArray)
                            }
                        }
                    })
                });

                for (let i=0; i<assertItem.numBinsArray.length; i++) {
                    assertItem.setHistogramRequirements.histograms[0].numBins = assertItem.numBinsArray[i];
                    msgController.setHistogramRequirements(assertItem.setHistogramRequirements);
                    await await sleep(repeatSetHistogram);
                }

                regionHistogramDataResponse = await regionHistogramDataPromise;
            }, dragHistogramNumberBins);

            test(`(Step 3) Check the receiveing RegionHistogramData * 12 `, () => {
                expect(regionHistogramDataResponse.length).toEqual(assertItem.numBinsArray.length);
                regionHistogramDataResponse.map((RegionHistogramData,index) => {
                    expect(RegionHistogramData.progress).toEqual(assertItem.ResponseRegionHistogramData.progress);
                    expect(RegionHistogramData.regionId).toEqual(assertItem.ResponseRegionHistogramData.regionId);
                    expect(RegionHistogramData.config.bounds.min).toEqual(assertItem.ResponseRegionHistogramData.config.bounds.min);
                    expect(RegionHistogramData.config.bounds.max).toEqual(assertItem.ResponseRegionHistogramData.config.bounds.max);
                    expect(RegionHistogramData.config.fixedBounds).toEqual(assertItem.ResponseRegionHistogramData.config.fixedBounds);
                    expect(RegionHistogramData.config.fixedNumBins).toEqual(assertItem.ResponseRegionHistogramData.config.fixedNumBins);
                    expect(RegionHistogramData.config.numBins).toEqual(assertItem.numBinsArray[index]);
                    expect(RegionHistogramData.histograms.numBins).toEqual(assertItem.numBinsArray[index]);
                    expect(RegionHistogramData.histograms.bins[0]).toEqual(assertItem.firstBinsArray[index]);
                })
            })

        });

        afterAll(() => msgController.closeConnection());
    });
});