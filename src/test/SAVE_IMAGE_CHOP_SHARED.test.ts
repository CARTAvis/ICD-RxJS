import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout = config.timeout.connection;
let tmpdirectory: string = config.path.save;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let saveFileTimeout: number = config.timeout.saveFile;

interface AssertItem {
    fileOpen: CARTA.IOpenFile[];
    setRegion: CARTA.ISetRegion[];
    saveFile: CARTA.ISaveFile[];
    exportedFileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels;
    shapeSize: string[];
}

let assertItem: AssertItem = {
    fileOpen: [
        {
            directory: testSubdirectory,
            file: 'M17_SWex.fits',
            hdu: '',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: 'M17_SWex.image',
            hdu: '',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 200.0, y: 600.0 },
                    { x: 350.0, y: 350.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [
                    { x: 25.0, y: 775.0 },
                    { x: 375.0, y: 775.0 },
                    { x: 375.0, y: 425.0 },
                    { x: 25.0, y: 425.0 },
                ],
                rotation: 0.0,
            },
        },
    ],
    saveFile: [
        {
            fileId: 1,
            outputFileName: 'M17_SWex_Chop_Shared.fits',
            outputFileType: CARTA.FileType.FITS,
            keepDegenerate: true,
        },
        {
            fileId: 1,
            outputFileName: 'M17_SWex_Chop_Shared.image',
            outputFileType: CARTA.FileType.CASA,
            keepDegenerate: true,
        },
    ],
    exportedFileOpen: [
        {
            file: 'M17_SWex_Chop_Shared.fits',
            hdu: '',
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: 'M17_SWex_Chop_Shared.image',
            hdu: '',
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: {
        fileId: 2,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 2,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    },
    shapeSize: ['[351, 351, 25, 1]', '[351, 351, 25, 1]'],
};

let basepath: string;
describe('SAVE_IMAGE_CHOP_SHARED: Exporting of a chopped image via the shared region', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.fileOpen.map((input, index) => {
                assertItem.fileOpen[index].directory = basepath + '/' + assertItem.fileOpen[index].directory;
            });
            msgController.closeFile(-1);
        });

        assertItem.fileOpen.map((input, index) => {
            test(
                `Open image of "${input.file}"`,
                async () => {
                    let OpenFileResponse = await msgController.loadFile(input);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileResponse.success).toBe(true);
                    expect(OpenFileResponse.fileInfo.name).toEqual(assertItem.fileOpen[index].file);
                },
                readFileTimeout
            );
        });

        assertItem.setRegion.map((region, regionIndex) => {
            describe(`set a ${CARTA.RegionType[region.regionInfo.regionType]} region`, () => {
                let SetRegionAck: any;
                test(
                    `set region`,
                    async () => {
                        SetRegionAck = await msgController.setRegion(region.fileId, region.regionId, region.regionInfo);
                        expect(SetRegionAck.success).toEqual(true);
                    },
                    saveFileTimeout
                );

                assertItem.saveFile.map((saveFile, fileIndex) => {
                    describe(`try to save image "${saveFile.outputFileName}"`, () => {
                        let OpenFileAck: CARTA.IOpenFileAck;
                        test(
                            `save image`,
                            async () => {
                                let saveFileResponse = await msgController.saveFile(
                                    saveFile.fileId,
                                    tmpdirectory,
                                    saveFile.outputFileName,
                                    saveFile.outputFileType,
                                    SetRegionAck.regionId,
                                    null,
                                    null,
                                    saveFile.keepDegenerate,
                                    null
                                );
                            },
                            saveFileTimeout
                        );

                        describe(`reopen the exported file "${saveFile.outputFileName}"`, () => {
                            test(
                                `OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,
                                async () => {
                                    let OpenFileResponse = await msgController.loadFile({
                                        directory: basepath + '/' + tmpdirectory,
                                        ...assertItem.exportedFileOpen[fileIndex],
                                    });
                                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);
                                    expect(OpenFileResponse.fileId).toEqual(RegionHistogramData[0].fileId);
                                    OpenFileAck = OpenFileResponse;
                                },
                                openFileTimeout
                            );

                            test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [351, 351, 25, 1]`, () => {
                                expect(
                                    OpenFileAck.fileInfoExtended.computedEntries.find((o) => o.name == 'Shape').value
                                ).toContain(assertItem.shapeSize[fileIndex]);
                            });
                        });

                        describe(`request raster image of the file "${saveFile.outputFileName}"`, () => {
                            test(
                                `RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`,
                                async () => {
                                    msgController.setChannels(assertItem.setImageChannel);
                                    let RasterTileDataTemp = await Stream(
                                        CARTA.RasterTileData,
                                        assertItem.setImageChannel.requiredTiles.tiles.length + 2
                                    ); //RasterTileerTile * 1 + RasterTileSync * 2(start & end)
                                    expect(RasterTileDataTemp.find((input) => input.tiles).tiles.length).toEqual(
                                        assertItem.setImageChannel.requiredTiles.tiles.length
                                    );
                                },
                                readFileTimeout
                            );
                        });
                    });
                });
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
