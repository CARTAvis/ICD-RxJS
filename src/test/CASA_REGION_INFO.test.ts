import { CARTA } from "carta-protobuf";
import { checkConnection, Stream} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let listTimeout = config.timeout.listFile;
let readTimeout = config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    regionListRequest: CARTA.IRegionListRequest;
    regionListResponse: CARTA.IRegionListResponse;
    regionFileInfoRequest: CARTA.IRegionFileInfoRequest[];
    regionFileInfoResponse: CARTA.IRegionFileInfoResponse[];
};
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
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
                name: "M17_SWex_regionSet1_pix.crtf",
                type: CARTA.FileType.CRTF,
            },
            {
                name: "M17_SWex_regionSet1_world.crtf",
                type: CARTA.FileType.CRTF,
            },
        ],
    },
    regionFileInfoRequest:
        [
            {
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_world.crtf",
            },
            {
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_pix.crtf",
            },
        ],
    regionFileInfoResponse:
        [
            {
                success: true,
                fileInfo: {
                    name: "M17_SWex_regionSet1_world.crtf",
                    type: CARTA.FileType.CRTF,
                },
                contents: [
                    "#CRTFv0 CASA Region Text Format version 0",
                    "symbol [[275.13653085deg, -16.17909524deg], .] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[275.13683271deg, -16.18844433deg], [30.0324arcsec, 30.0324arcsec]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[275.13818398deg, -16.20138900deg], [54.8867arcsec, 21.7476arcsec]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "rotbox [[275.13848816deg, -16.21922423deg], [69.3851arcsec, 17.6052arcsec], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[275.03678830deg, -16.17664969deg], [20.1942arcsec, 20.1942arcsec], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[275.03783248deg, -16.19319074deg], [11.9094arcsec, 27.9612arcsec], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[275.03827857deg, -16.20613583deg], [7.2492arcsec, 31.5858arcsec], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "poly [[275.03692766deg, -16.21721067deg], [275.04171714deg, -16.23404023deg], [275.02853660deg, -16.22598234deg]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "symbol [[275.10418191deg, -16.18154538deg], .] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[275.10508122deg, -16.18945613deg], [22.7832arcsec, 22.7832arcsec]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[275.10942574deg, -16.19952405deg], [48.6731arcsec, 14.4984arcsec]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "rotbox [[275.11287275deg, -16.21563298deg], [54.8867arcsec, 14.4984arcsec], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[275.06703966deg, -16.18341488deg], [19.6764arcsec, 19.6764arcsec], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[275.06284424deg, -16.19880459deg], [10.3560arcsec, 27.9612arcsec], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[275.06404078deg, -16.21304420deg], [8.8026arcsec, 32.1036arcsec], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "poly [[275.06764385deg, -16.22182373deg], [275.07633134deg, -16.23491317deg], [275.05670656deg, -16.23534275deg]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "",
                ],
            },
            {
                success: true,
                fileInfo: {
                    name: "M17_SWex_regionSet1_pix.crtf",
                    type: CARTA.FileType.CRTF,
                },
                contents: [
                    "#CRTFv0 CASA Region Text Format version 0",
                    "symbol [[-103.8pix, 613.1pix], .] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[-106.4pix, 528.9pix], [75.1pix, 75.1pix]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[-118.0pix, 412.4pix], [137.2pix, 54.4pix]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "rotbox [[-120.6pix, 251.9pix], [173.5pix, 44.0pix], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[758.3pix, 635.1pix], [50.5pix, 50.5pix], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[749.3pix, 486.2pix], [29.8pix, 69.9pix], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[745.4pix, 369.7pix], [18.1pix, 79.0pix], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "poly [[757.0pix, 270.1pix], [715.6pix, 118.6pix], [829.5pix, 191.1pix]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "symbol [[175.8pix, 591.1pix], .] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[168.0pix, 519.9pix], [57.0pix, 57.0pix]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "centerbox [[130.5pix, 429.3pix], [121.7pix, 36.2pix]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "rotbox [[100.7pix, 284.3pix], [137.2pix, 36.2pix], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[496.8pix, 574.3pix], [49.2pix, 49.2pix], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[533.1pix, 435.7pix], [25.9pix, 69.9pix], 0.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "ellipse [[522.7pix, 307.6pix], [22.0pix, 80.3pix], 45.00000000deg] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "poly [[491.6pix, 228.6pix], [416.5pix, 110.8pix], [586.1pix, 106.9pix]] coord=ICRS, corr=[I], linewidth=1, linestyle=-, symsize=1, symthick=1, color=green, font=Helvetica, fontsize=10, fontstyle=bold, usetex=false",
                    "",
                ],
            },
        ],
};

let basepath: string;
describe("CASA_REGION_INFO: Testing CASA region list and info", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath`, async () => {
            let fileListResponse = await msgController.getFileList("$BASE",0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + "/" + assertItem.openFile.directory;
            assertItem.regionListRequest.directory = basepath + "/" + assertItem.regionListRequest.directory;
            assertItem.regionFileInfoRequest[0].directory = basepath + "/" + assertItem.regionFileInfoRequest[0].directory;
            assertItem.regionFileInfoRequest[1].directory = basepath + "/" + assertItem.regionFileInfoRequest[1].directory;
        });

        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
            test(`Preparation: Open image`,async () => {
                msgController.closeFile(-1);
                let OpenFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(OpenFileResponse.success).toEqual(true);
                let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            });

            describe(`Go to "${regionSubdirectory}" and send REGION_LIST_REQUEST`, () => {
                let regionListResponse: any;
                test(`REGION_LIST_RESPONSE should return within ${listTimeout}ms`, async () => {
                    regionListResponse = await msgController.getRegionList(assertItem.regionListRequest.directory, assertItem.regionListRequest.filterMode);
                }, listTimeout);

                test(`REGION_LIST_RESPONSE.success = ${assertItem.regionListResponse.success}`, () => {
                    expect(regionListResponse.success).toBe(assertItem.regionListResponse.success);
                });
    
                test(`REGION_LIST_RESPONSE.directory = ${assertItem.regionListResponse.directory}`, () => {
                    expect(regionListResponse.directory).toContain(assertItem.regionListResponse.directory);
                });
    
                test(`REGION_LIST_RESPONSE.parent is /${assertItem.regionListResponse.parent}`, () => {
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
        });

        assertItem.regionFileInfoResponse.map((fileInfo, idxInfo) => {
            describe(`Read "${assertItem.regionFileInfoRequest[idxInfo].file}"`, () => {
                let regionFileInfoResponse: any;
                test(`REGION_FILE_INFO_RESPONSE should return within ${readTimeout}ms`, async () => {
                    regionFileInfoResponse = await msgController.getRegionFileInfo(assertItem.regionFileInfoRequest[idxInfo].directory, assertItem.regionFileInfoRequest[idxInfo].file)
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
        afterAll(() => msgController.closeConnection());
    });
})