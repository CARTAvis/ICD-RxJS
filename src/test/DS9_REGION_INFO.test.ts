import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let listTimeout = config.timeout.listFile;
let readTimeout = config.timeout.readFile;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    regionListRequest: CARTA.IRegionListRequest;
    regionListResponse: CARTA.IRegionListResponse;
    regionFileInfoRequest: CARTA.IRegionFileInfoRequest[];
    regionFileInfoResponse: CARTA.IRegionFileInfoResponse[];
};
let assertItem: AssertItem = {
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    precisionDigits: 4,
    regionListRequest:
    {
        directory: regionSubdirectory,
    },
    regionListResponse:
    {
        success: true,
        directory: regionSubdirectory,
        parent: testSubdirectory,
        subdirectories: [],
        files: [
            {
                name: "M17_SWex_regionSet1_pix_v4.reg",
                type: CARTA.FileType.DS9_REG,
            },
            {
                name: "M17_SWex_regionSet1_world_v4.reg",
                type: CARTA.FileType.DS9_REG,
            },
        ],
    },
    regionFileInfoRequest:
        [
            {
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_world_v4.reg",
            },
            {
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_pix_v4.reg",
            },
        ],
    regionFileInfoResponse:
        [
            {
                success: true,
                fileInfo: {
                    name: "M17_SWex_regionSet1_world_v4.reg",
                    type: CARTA.FileType.DS9_REG,
                },
                contents: [
                    `# Region file format: DS9 CARTA 4.0.0-rc.0`,
                    `global color=green dashlist=8 3 width=1 font="helvetica 10 normal roman" select=1 highlite=1 dash=0 fixed=0 edit=1 move=1 delete=1 include=1 source=1`,
                    `icrs`,
                    `point(275.136530737, -16.179094380) # color=#2EE6D6 width=2`,
                    `box(275.136833877, -16.188449861, 30.0400", 30.0400", 0) # color=#2EE6D6 width=2`,
                    `box(275.138179306, -16.201393995, 54.8800", 21.7600", 0) # color=#2EE6D6 width=2`,
                    `box(275.138484755, -16.219227256, 69.4000", 17.6000", 45) # color=#2EE6D6 width=2`,
                    `circle(275.036792342, -16.176649544, 20.2000") # color=#2EE6D6 width=2`,
                    `ellipse(275.037829405, -16.193194229, 11.9200", 27.9600", 90) # color=#2EE6D6 width=2`,
                    `ellipse(275.038277405, -16.206138778, 7.2400", 31.6000", 135) # color=#2EE6D6 width=2`,
                    `polygon(275.036932344, -16.217205132, 275.041719054, -16.234039546, 275.028540344, -16.225980761) # color=#2EE6D6 width=2`,
                    `point(275.104183150, -16.181543796) # color=#2EE6D6 width=2`,
                    `box(275.105086273, -16.189454829, 22.8000", 22.8000", 0) # color=#2EE6D6 width=2`,
                    `box(275.109426110, -16.199521099, 48.6800", 14.4832", 0) # color=#2EE6D6 width=2`,
                    `box(275.112876196, -16.215631829, 54.8800", 14.4800", 45) # color=#2EE6D6 width=2`,
                    `circle(275.067045016, -16.183410134, 19.6800") # color=#2EE6D6 width=2`,
                    `ellipse(275.062843342, -16.198809688, 10.3600", 27.9600", 90) # color=#2EE6D6 width=2`,
                    `ellipse(275.064044973, -16.213043157, 8.8000", 32.1200", 135) # color=#2EE6D6 width=2`,
                    `polygon(275.067642763, -16.221821300, 275.076332455, -16.234910821, 275.056705285, -16.235342229) # color=#2EE6D6 width=2`,
                    ``,
                ],
            },
            {
                success: true,
                fileInfo: {
                    name: "M17_SWex_regionSet1_pix_v4.reg",
                    type: CARTA.FileType.DS9_REG,
                },
                contents: [
                    `# Region file format: DS9 CARTA 4.0.0-rc.0`,
                    `global color=green dashlist=8 3 width=1 font="helvetica 10 normal roman" select=1 highlite=1 dash=0 fixed=0 edit=1 move=1 delete=1 include=1 source=1`,
                    `image`,
                    `point(-102.80, 614.10) # color=#2EE6D6 width=2`,
                    `box(-105.40, 529.90, 75.10, 75.10, 0) # color=#2EE6D6 width=2`,
                    `box(-117.00, 413.40, 137.20, 54.40, 0) # color=#2EE6D6 width=2`,
                    `box(-119.60, 252.90, 173.50, 44.00, 45) # color=#2EE6D6 width=2`,
                    `circle(759.30, 636.10, 50.50) # color=#2EE6D6 width=2`,
                    `ellipse(750.30, 487.20, 29.80, 69.90, 90) # color=#2EE6D6 width=2`,
                    `ellipse(746.40, 370.70, 18.10, 79.00, 135) # color=#2EE6D6 width=2`,
                    `polygon(758.00, 271.10, 716.60, 119.60, 830.50, 192.10) # color=#2EE6D6 width=2`,
                    `point(176.80, 592.10) # color=#2EE6D6 width=2`,
                    `box(169.00, 520.90, 57.00, 57.00, 0) # color=#2EE6D6 width=2`,
                    `box(131.50, 430.30, 121.70, 36.21, 0) # color=#2EE6D6 width=2`,
                    `box(101.70, 285.30, 137.20, 36.20, 45) # color=#2EE6D6 width=2`,
                    `circle(497.80, 575.30, 49.20) # color=#2EE6D6 width=2`,
                    `ellipse(534.10, 436.70, 25.90, 69.90, 90) # color=#2EE6D6 width=2`,
                    `ellipse(523.70, 308.60, 22.00, 80.30, 135) # color=#2EE6D6 width=2`,
                    `polygon(492.60, 229.60, 417.50, 111.80, 587.10, 107.90) # color=#2EE6D6 width=2`,
                    ``,
                ],
            },
        ],
};

describe("DS9_REGION_INFO: Testing DS9_REG region list and info", () => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    let basepath: string;
    describe(`Go to "${assertItem.openFile.directory}" folder`, () => {
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
        }, readFileTimeout);

        let regionHistogramData = [];
        test(`Check OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
            msgController.closeFile(-1);
            let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let regionHistogramDataPromise = new Promise((resolve)=>{
                msgController.histogramStream.subscribe({
                    next: (data) => {
                        regionHistogramData.push(data)
                        resolve(regionHistogramData)
                    }
                })
            });
            OpenFileResponse = await msgController.loadFile(assertItem.openFile);
            let RegionHistogramData = await regionHistogramDataPromise;
    
            expect(OpenFileResponse.success).toBe(true);
            expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
        }, openFileTimeout);

        let regionListResponse: CARTA.IRegionListResponse;
        describe(`Go to "${regionSubdirectory}" and send REGION_LIST_REQUEST`, () => {
            test(`REGION_LIST_RESPONSE should return within ${listTimeout}ms`, async () => {
                regionListResponse = await msgController.getRegionList(assertItem.regionListRequest.directory, assertItem.regionListRequest.filterMode);
            }, listTimeout);

            test(`REGION_LIST_RESPONSE.success = ${assertItem.regionListResponse.success}`, () => {
                expect(regionListResponse.success).toBe(assertItem.regionListResponse.success);
            });

            test(`REGION_LIST_RESPONSE.directory = ${assertItem.regionListResponse.directory}`, () => {
                expect(regionListResponse.directory).toEqual(assertItem.regionListResponse.directory);
            });

            test(`REGION_LIST_RESPONSE.parent = ${assertItem.regionListResponse.parent}`, () => {
                expect(regionListResponse.parent).toMatch(new RegExp(`${regionListResponse.parent}$`));
            });

            test(`REGION_LIST_RESPONSE.subdirectories = ${JSON.stringify(assertItem.regionListResponse.subdirectories)}`, () => {
                expect(regionListResponse.subdirectories).toEqual(assertItem.regionListResponse.subdirectories);
            });

            assertItem.regionListResponse.files.map(file => {
                test(`REGION_LIST_RESPONSE.file should contain "${file.name}" in type of ${CARTA.FileType[file.type]}`, () => {
                    expect(regionListResponse.files.find(f => f.name == file.name).type).toEqual(file.type);
                });
            });
        });

        assertItem.regionFileInfoResponse.map((fileInfo, idxInfo) => {
            describe(`Read "${assertItem.regionFileInfoRequest[idxInfo].file}"`, () => {
                let regionFileInfoResponse: CARTA.IRegionFileInfoResponse;
                test(`REGION_FILE_INFO_RESPONSE should return within ${readTimeout}ms`, async () => {
                    // await Connection.send(CARTA.RegionFileInfoRequest, assertItem.regionFileInfoRequest[idxInfo]);
                    regionFileInfoResponse = await msgController.getRegionFileInfo(assertItem.regionFileInfoRequest[idxInfo].directory, assertItem.regionFileInfoRequest[idxInfo].file);
                    // regionFileInfoResponse = await Connection.receive(CARTA.RegionFileInfoResponse) as CARTA.RegionFileInfoResponse;
                }, readTimeout);

                test(`REGION_FILE_INFO_RESPONSE.success = ${fileInfo.success}`, () => {
                    expect(regionFileInfoResponse.success).toBe(fileInfo.success);
                });

                test(`REGION_FILE_INFO_RESPONSE.fileinfo.name = "${fileInfo.fileInfo.name}"`, () => {
                    expect(regionFileInfoResponse.fileInfo.name).toEqual(fileInfo.fileInfo.name);
                });

                test(`REGION_FILE_INFO_RESPONSE.fileinfo.type = ${CARTA.FileType[fileInfo.fileInfo.type]}`, () => {
                    expect(regionFileInfoResponse.fileInfo.type).toEqual(fileInfo.fileInfo.type);
                });

                test(`Length of REGION_FILE_INFO_RESPONSE.contents = ${fileInfo.contents.length}`, () => {
                    expect(regionFileInfoResponse.contents.length).toEqual(fileInfo.contents.length);
                });

                fileInfo.contents.map((message, index) => {
                    test(`REGION_FILE_INFO_RESPONSE.contents[${index}] = "${message.slice(0, 45)}${message.length < 45 ? "" : "..."}"`, () => {
                        expect(regionFileInfoResponse.contents[index]).toEqual(message);
                    });
                });
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});