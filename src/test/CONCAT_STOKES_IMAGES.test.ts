import { CARTA } from 'carta-protobuf';
import config from './config.json';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;
let changeChannelTimeout = config.timeout.changeChannel;

type StokesLetter = 'I' | 'Q' | 'U' | 'V';

// One Stokes cube, and the REGION_HISTOGRAM_DATA the backend answers with when that cube is opened
// on its own. The four histograms are what tells the planes of a hypercube apart, so the test can
// say which image ended up on which Stokes plane rather than only counting the planes.
interface StokesImage {
    file: string;
    polarizationType: CARTA.PolarizationType;
    histogram: CARTA.IHistogram;
}

interface ConcatCase {
    title: string;
    // StokesFilesConnector iterates its loaders in polarization order, so the Stokes axis it builds
    // is sorted no matter how the request was ordered. Every case is requested out of order to hold
    // the backend to that.
    requestOrder: StokesLetter[];
    expectedPlanes: StokesLetter[];
    hypercubeName: string;
}

interface AssertItem {
    fileList: CARTA.IFileListRequest;
    stokesImages: Record<StokesLetter, StokesImage>;
    concatCases: ConcatCase[];
    fileId: number;
    renderMode: CARTA.RenderMode;
    imageShape: { dimensions: number; width: number; height: number; depth: number };
    regionHistogram: { regionId: number; progress: number; numBins: number; histogramNumBins: number };
    requiredTiles: CARTA.IAddRequiredTiles;
    precisionDigits: number;
}

let assertItem: AssertItem = {
    fileList: { directory: testSubdirectory },
    stokesImages: {
        I: {
            file: 'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
            polarizationType: CARTA.PolarizationType.I,
            histogram: {
                binWidth: 0.004779201466590166,
                firstBinCenter: -0.11032065749168396,
                mean: 0.0014072911570091893,
                stdDev: 0.05368401551544901,
            },
        },
        Q: {
            file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
            polarizationType: CARTA.PolarizationType.Q,
            histogram: {
                binWidth: 0.00016267175669781864,
                firstBinCenter: -0.018377140164375305,
                mean: -0.00003742659352908538,
                stdDev: 0.003869341538017443,
            },
        },
        U: {
            file: 'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
            polarizationType: CARTA.PolarizationType.U,
            histogram: {
                binWidth: 0.00016493673319928348,
                firstBinCenter: -0.02082323282957077,
                mean: 0.00012091044507226787,
                stdDev: 0.004009951489450122,
            },
        },
        V: {
            file: 'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
            polarizationType: CARTA.PolarizationType.V,
            histogram: {
                binWidth: 0.00016941891226451844,
                firstBinCenter: -0.020163865759968758,
                mean: 0.000017799031213005305,
                stdDev: 0.003931388177191896,
            },
        },
    },
    concatCases: [
        {
            title: 'Case 1: Combine I, Q, U & V',
            requestOrder: ['V', 'U', 'Q', 'I'],
            expectedPlanes: ['I', 'Q', 'U', 'V'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_IQUV.manual.pbcor.fits',
        },
        {
            title: 'Case 2: Combine I & V',
            requestOrder: ['V', 'I'],
            expectedPlanes: ['I', 'V'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_IV.manual.pbcor.fits',
        },
        {
            title: 'Case 3: Combine Q & U',
            requestOrder: ['U', 'Q'],
            expectedPlanes: ['Q', 'U'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits',
        },
        {
            title: 'Case 4: Combine I, Q & U',
            requestOrder: ['U', 'Q', 'I'],
            expectedPlanes: ['I', 'Q', 'U'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_IQU.manual.pbcor.fits',
        },
        {
            title: 'Case 5: Combine Q, U & V',
            requestOrder: ['V', 'U', 'Q'],
            expectedPlanes: ['Q', 'U', 'V'],
            hypercubeName: 'IRCp10216_sci.spw0.cube.hypercube_QUV.manual.pbcor.fits',
        },
    ],
    fileId: 0,
    renderMode: CARTA.RenderMode.RASTER,
    // Every input cube has this shape, and concatenation only adds the Stokes axis to it.
    imageShape: { dimensions: 4, width: 256, height: 256, depth: 480 },
    regionHistogram: { regionId: -1, progress: 1, numBins: -1, histogramNumBins: 256 },
    requiredTiles: {
        fileId: 0,
        tiles: [0],
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
    },
    precisionDigits: 6,
};

let basepath: string;

// The whole point of a hypercube is that the plane the viewer asks for is the image which went into
// it, so each plane is compared against the histogram of the single-Stokes cube it came from.
function assertHistogramMatchesStokesImage(
    regionHistogramData: CARTA.IRegionHistogramData,
    stokesLetter: StokesLetter
) {
    const expected = assertItem.stokesImages[stokesLetter].histogram;
    expect(regionHistogramData.fileId).toEqual(assertItem.fileId);
    expect(regionHistogramData.regionId).toEqual(assertItem.regionHistogram.regionId);
    expect(regionHistogramData.progress).toEqual(assertItem.regionHistogram.progress);
    expect(regionHistogramData.config!.numBins).toEqual(assertItem.regionHistogram.numBins);
    expect(regionHistogramData.histograms!.numBins).toEqual(assertItem.regionHistogram.histogramNumBins);
    expect(regionHistogramData.histograms!.binWidth).toBeCloseTo(expected.binWidth!, assertItem.precisionDigits);
    expect(regionHistogramData.histograms!.firstBinCenter).toBeCloseTo(
        expected.firstBinCenter!,
        assertItem.precisionDigits
    );
    expect(regionHistogramData.histograms!.mean).toBeCloseTo(expected.mean!, assertItem.precisionDigits);
    expect(regionHistogramData.histograms!.stdDev).toBeCloseTo(expected.stdDev!, assertItem.precisionDigits);
}

describe('CONCAT_STOKES_IMAGES test: concatenate different stokes images into single image', () => {
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
                    `(Step 2-${index + 1}) FILE_INFO_RESPONSE for the Stokes ${stokesLetter} cube should arrive within ${openFileTimeout} ms | `,
                    async () => {
                        const stokesImage = assertItem.stokesImages[stokesLetter];
                        const fileInfoResponse = await msgController.getFileInfo(
                            assertItem.fileList.directory!,
                            stokesImage.file,
                            ''
                        );
                        expect(fileInfoResponse.success).toEqual(true);
                        expect(fileInfoResponse.fileInfo!.name).toEqual(stokesImage.file);
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
                        concatCase.requestOrder.map((stokesLetter) => ({
                            directory: assertItem.fileList.directory,
                            hdu: '',
                            file: assertItem.stokesImages[stokesLetter].file,
                            polarizationType: assertItem.stokesImages[stokesLetter].polarizationType,
                        })),
                        assertItem.fileId,
                        assertItem.renderMode
                    );
                    const regionHistogramData = await regionHistogramDataStream;
                    // The hypercube opens on its first plane, which is the lowest polarization of
                    // the set rather than the one which happened to be requested first.
                    expect(regionHistogramData[0].stokes).toEqual(0);
                    assertHistogramMatchesStokesImage(regionHistogramData[0], concatCase.expectedPlanes[0]);
                },
                concatStokeTimeout
            );

            test(`(Step 4) CONCAT_STOKES_FILES_ACK should describe the hypercube | `, () => {
                const openFileAck = concatStokesResponse.openFileAck!;
                const fileInfoExtended = openFileAck.fileInfoExtended!;
                expect(concatStokesResponse.success).toEqual(true);
                expect(openFileAck.success).toEqual(true);
                expect(openFileAck.fileId).toEqual(assertItem.fileId);
                expect(openFileAck.fileInfo!.name).toEqual(concatCase.hypercubeName);
                expect(fileInfoExtended.dimensions).toEqual(assertItem.imageShape.dimensions);
                expect(fileInfoExtended.width).toEqual(assertItem.imageShape.width);
                expect(fileInfoExtended.height).toEqual(assertItem.imageShape.height);
                expect(fileInfoExtended.depth).toEqual(assertItem.imageShape.depth);
                expect(fileInfoExtended.stokes).toEqual(concatCase.expectedPlanes.length);
                // StokesFilesConnector::DoConcat rebuilds the beam table as one beam per channel per
                // Stokes plane, so its length is the shape of the hypercube restated.
                expect(openFileAck.beamTable!.length).toEqual(
                    assertItem.imageShape.depth * concatCase.expectedPlanes.length
                );
            });

            // Plane 0 was covered by the histogram which came with the ack. The remaining planes are
            // reached with SET_IMAGE_CHANNELS, which is what the Stokes selector in the frontend
            // sends. A concatenation which put the images on the wrong planes, or which silently
            // repeated one of them, fails here and nowhere else.
            concatCase.expectedPlanes.slice(1).forEach((stokesLetter, index) => {
                const stokes = index + 1;
                test(
                    `(Step 5-${stokes}) Stokes plane ${stokes} should hold the ${stokesLetter} image within ${changeChannelTimeout} ms | `,
                    async () => {
                        const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
                        msgController.setChannels({
                            fileId: assertItem.fileId,
                            channel: 0,
                            stokes: stokes,
                            requiredTiles: assertItem.requiredTiles,
                        });
                        const regionHistogramData = await regionHistogramDataStream;
                        expect(regionHistogramData[0].stokes).toEqual(stokes);
                        expect(regionHistogramData[0].channel).toEqual(0);
                        assertHistogramMatchesStokesImage(regionHistogramData[0], stokesLetter);
                    },
                    changeChannelTimeout
                );
            });
        });
    });

    afterAll(() => msgController.closeConnection());
});
