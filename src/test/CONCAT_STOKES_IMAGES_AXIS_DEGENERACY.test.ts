import { CARTA } from 'carta-protobuf';
import config from './config.json';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import {
    ConcatCase,
    ImageShape,
    StokesImage,
    StokesLetter,
    assertHistogramMatchesStokesImage,
    assertHypercubeAck,
    assertStokesPlane,
    stokesFile,
    stokesImages,
} from './ConcatStokesHelpers';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;
let changeChannelTimeout = config.timeout.changeChannel;

interface AssertItem {
    fileList: CARTA.IFileListRequest;
    stokesImages: Record<StokesLetter, StokesImage>;
    concatCases: ConcatCase[];
    fileId: number;
    renderMode: CARTA.RenderMode;
    // The inputs carry no Stokes axis of their own, which is the premise of this test: DoConcat has
    // to build a Stokes coordinate and extend every image before it can concatenate them.
    inputShape: ImageShape & { stokes: number };
    hypercubeShape: ImageShape;
}

let assertItem: AssertItem = {
    fileList: { directory: testSubdirectory },
    stokesImages: stokesImages({
        I: 'IRCp10216_sci.spw0.cube.I.dropdeg.manual.pbcor.fits',
        Q: 'IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits',
        U: 'IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits',
        V: 'IRCp10216_sci.spw0.cube.V.dropdeg.manual.pbcor.fits',
    }),
    concatCases: [
        {
            title: 'Case 1: Combine I, Q, U & V',
            requestOrder: ['V', 'U', 'Q', 'I'],
            expectedPlanes: ['I', 'Q', 'U', 'V'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_IQUV.dropdeg.manual.pbcor.fits',
        },
        {
            title: 'Case 2: Combine I & V',
            requestOrder: ['V', 'I'],
            expectedPlanes: ['I', 'V'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_IV.dropdeg.manual.pbcor.fits',
        },
        {
            title: 'Case 3: Combine Q & U',
            requestOrder: ['U', 'Q'],
            expectedPlanes: ['Q', 'U'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_QU.dropdeg.manual.pbcor.fits',
        },
        {
            title: 'Case 4: Combine I, Q & U',
            requestOrder: ['U', 'Q', 'I'],
            expectedPlanes: ['I', 'Q', 'U'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_IQU.dropdeg.manual.pbcor.fits',
        },
        {
            title: 'Case 5: Combine Q, U & V',
            requestOrder: ['V', 'U', 'Q'],
            expectedPlanes: ['Q', 'U', 'V'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_QUV.dropdeg.manual.pbcor.fits',
        },
    ],
    fileId: 0,
    renderMode: CARTA.RenderMode.RASTER,
    inputShape: { dimensions: 3, width: 256, height: 256, depth: 480, stokes: 1 },
    hypercubeShape: { dimensions: 4, width: 256, height: 256, depth: 480 },
};

let basepath: string;

describe('CONCAT_STOKES_IMAGES_AXIS_DEGENERACY test: Concatenate different axis-degeneracy stokes images into a single image.', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    test(`Get the base path and prefix the image directory with it |`, async () => {
        const fileListResponse = await msgController.getFileList('$BASE', 0);
        basepath = fileListResponse.directory;
        assertItem.fileList.directory = basepath + '/' + assertItem.fileList.directory;
    });

    assertItem.concatCases.forEach((concatCase) => {
        describe(`${concatCase.title} |`, () => {
            let concatStokesResponse: CARTA.IConcatStokesFilesAck;

            test(`(Step 1) FILE_LIST_RESPONSE should list the input images |`, async () => {
                const fileListResponse = await msgController.getFileList(assertItem.fileList.directory!, 0);
                expect(fileListResponse.success).toEqual(true);
                const fileNames = fileListResponse.files!.map((file) => file.name);
                concatCase.requestOrder.forEach((stokesLetter) =>
                    expect(fileNames).toContain(assertItem.stokesImages[stokesLetter].file)
                );
            });

            concatCase.requestOrder.forEach((stokesLetter, index) => {
                test(
                    `(Step 2-${index + 1}) FILE_INFO_RESPONSE for the Stokes ${stokesLetter} cube should show a dropped Stokes axis within ${openFileTimeout} ms | `,
                    async () => {
                        const stokesImage = assertItem.stokesImages[stokesLetter];
                        const fileInfoResponse = await msgController.getFileInfo(
                            assertItem.fileList.directory!,
                            stokesImage.file,
                            ''
                        );
                        expect(fileInfoResponse.success).toEqual(true);
                        expect(fileInfoResponse.fileInfo!.name).toEqual(stokesImage.file);
                        // The inputs have to really be degenerate-axis-dropped, otherwise this test
                        // would quietly become a copy of CONCAT_STOKES_IMAGES.
                        const fileInfoExtended = fileInfoResponse.fileInfoExtended!['0'];
                        expect(fileInfoExtended.dimensions).toEqual(assertItem.inputShape.dimensions);
                        expect(fileInfoExtended.width).toEqual(assertItem.inputShape.width);
                        expect(fileInfoExtended.height).toEqual(assertItem.inputShape.height);
                        expect(fileInfoExtended.depth).toEqual(assertItem.inputShape.depth);
                        expect(fileInfoExtended.stokes).toEqual(assertItem.inputShape.stokes);
                    },
                    openFileTimeout
                );
            });

            test(
                `(Step 3) CONCAT_STOKES_FILES_ACK and REGION_HISTOGRAM_DATA should arrive within ${concatStokeTimeout} ms | `,
                async () => {
                    msgController.closeFile(-1);
                    const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
                    concatStokesResponse = await msgController.loadStokeFiles(
                        concatCase.requestOrder.map((stokesLetter) =>
                            stokesFile(
                                assertItem.stokesImages[stokesLetter].file,
                                stokesLetter,
                                assertItem.fileList.directory!
                            )
                        ),
                        assertItem.fileId,
                        assertItem.renderMode
                    );
                    const regionHistogramData = await regionHistogramDataStream;
                    // The hypercube opens on its first plane, which is the lowest polarization of
                    // the set rather than the one which happened to be requested first.
                    expect(regionHistogramData[0].stokes).toEqual(0);
                    assertHistogramMatchesStokesImage(
                        regionHistogramData[0],
                        concatCase.expectedPlanes[0],
                        assertItem.fileId
                    );
                },
                concatStokeTimeout
            );

            // The inputs were three-dimensional; the Stokes axis of the hypercube is one DoConcat
            // added.
            test(`(Step 4) CONCAT_STOKES_FILES_ACK should describe the hypercube | `, () => {
                assertHypercubeAck(concatStokesResponse, {
                    fileId: assertItem.fileId,
                    name: concatCase.hypercubeName,
                    shape: assertItem.hypercubeShape,
                    planes: concatCase.expectedPlanes,
                });
            });

            // Plane 0 was covered by the histogram which came with the ack. The remaining planes are
            // reached with SET_IMAGE_CHANNELS.
            concatCase.expectedPlanes.slice(1).forEach((stokesLetter, index) => {
                const stokes = index + 1;
                test(
                    `(Step 5-${stokes}) Stokes plane ${stokes} should hold the ${stokesLetter} image within ${changeChannelTimeout} ms | `,
                    async () => {
                        await assertStokesPlane(assertItem.fileId, stokes, stokesLetter);
                    },
                    changeChannelTimeout
                );
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});
