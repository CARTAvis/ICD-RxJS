import { CARTA } from 'carta-protobuf';
import { Stream } from './MyClient';
import { MessageController } from './MessageController';

/**
 * Shared fixtures and assertions for the CONCAT_STOKES_* tests. Both of them concatenate the same
 * four single-Stokes cubes into the same five hypercubes, one from cubes which carry a degenerate
 * Stokes axis and one from cubes which do not, so everything except the file names and the shape
 * of the inputs is the same on both sides.
 *
 * These are plain assertions rather than jest tests: the test titles and timeouts belong to the
 * test files, so that every test( ) a file registers can be read there.
 */

export type StokesLetter = 'I' | 'Q' | 'U' | 'V';

/**
 * One Stokes cube, and the REGION_HISTOGRAM_DATA the backend answers with when that cube is opened
 * on its own. The four histograms are what tells the planes of a hypercube apart, so a test can say
 * which image ended up on which Stokes plane rather than only counting the planes.
 */
export interface StokesImage {
    file: string;
    polarizationType: CARTA.PolarizationType;
    histogram: CARTA.IHistogram;
}

export interface ConcatCase {
    title: string;
    /**
     * StokesFilesConnector iterates its loaders in polarization order, so the Stokes axis it builds
     * is sorted no matter how the request was ordered. Every case is requested out of order to hold
     * the backend to that.
     */
    requestOrder: StokesLetter[];
    expectedPlanes: StokesLetter[];
    hypercubeName: string;
}

export interface ImageShape {
    dimensions: number;
    width: number;
    height: number;
    depth: number;
}

export const POLARIZATION_TYPES: Record<StokesLetter, CARTA.PolarizationType> = {
    I: CARTA.PolarizationType.I,
    Q: CARTA.PolarizationType.Q,
    U: CARTA.PolarizationType.U,
    V: CARTA.PolarizationType.V,
};

/**
 * The REGION_HISTOGRAM_DATA of each single-Stokes cube opened on its own. One copy serves both
 * tests: dropping the degenerate axis changes the shape of a file, not its pixels.
 */
export const STOKES_HISTOGRAMS: Record<StokesLetter, CARTA.IHistogram> = {
    I: {
        binWidth: 0.004779201466590166,
        firstBinCenter: -0.11032065749168396,
        mean: 0.0014072911570091893,
        stdDev: 0.05368401551544901,
    },
    Q: {
        binWidth: 0.00016267175669781864,
        firstBinCenter: -0.018377140164375305,
        mean: -0.00003742659352908538,
        stdDev: 0.003869341538017443,
    },
    U: {
        binWidth: 0.00016493673319928348,
        firstBinCenter: -0.02082323282957077,
        mean: 0.00012091044507226787,
        stdDev: 0.004009951489450122,
    },
    V: {
        binWidth: 0.00016941891226451844,
        firstBinCenter: -0.020163865759968758,
        mean: 0.000017799031213005305,
        stdDev: 0.003931388177191896,
    },
};

/** The fields of REGION_HISTOGRAM_DATA the backend fills the same way for every plane of every image. */
const REGION_HISTOGRAM = { regionId: -1, progress: 1, numBins: -1, histogramNumBins: 256 };

/** The bin width and the moments are floats the backend computes, so they are compared to this many digits. */
const PRECISION_DIGITS = 6;

/**
 * The Stokes image table of one variant: the four file names it is built from, with the
 * polarization types and the histograms, which do not vary between the variants.
 */
export function stokesImages(files: Record<StokesLetter, string>): Record<StokesLetter, StokesImage> {
    const images = {} as Record<StokesLetter, StokesImage>;
    (Object.keys(files) as StokesLetter[]).forEach((stokesLetter) => {
        images[stokesLetter] = {
            file: files[stokesLetter],
            polarizationType: POLARIZATION_TYPES[stokesLetter],
            histogram: STOKES_HISTOGRAMS[stokesLetter],
        };
    });
    return images;
}

/**
 * One entry of a CONCAT_STOKES_FILES request: a file, and the Stokes type it is offered to the
 * backend as. The two are given separately because a request may name a file which is not the
 * Stokes cube it claims to be, or which is not there at all, and CONCAT_ERROR_MESSAGE is built
 * out of exactly those.
 */
export function stokesFile(file: string, stokesLetter: StokesLetter, directory: string): CARTA.IStokesFile {
    return {
        directory: directory,
        hdu: '',
        file: file,
        polarizationType: POLARIZATION_TYPES[stokesLetter],
    };
}

/**
 * The whole point of a hypercube is that the plane the viewer asks for is the image which went into
 * it, so each plane is compared against the histogram of the single-Stokes cube it came from.
 */
export function assertHistogramMatchesStokesImage(
    regionHistogramData: CARTA.IRegionHistogramData,
    stokesLetter: StokesLetter,
    fileId: number
) {
    const expected = STOKES_HISTOGRAMS[stokesLetter];
    expect(regionHistogramData.fileId).toEqual(fileId);
    expect(regionHistogramData.regionId).toEqual(REGION_HISTOGRAM.regionId);
    expect(regionHistogramData.progress).toEqual(REGION_HISTOGRAM.progress);
    expect(regionHistogramData.config!.numBins).toEqual(REGION_HISTOGRAM.numBins);
    expect(regionHistogramData.histograms!.numBins).toEqual(REGION_HISTOGRAM.histogramNumBins);
    expect(regionHistogramData.histograms!.binWidth).toBeCloseTo(expected.binWidth!, PRECISION_DIGITS);
    expect(regionHistogramData.histograms!.firstBinCenter).toBeCloseTo(expected.firstBinCenter!, PRECISION_DIGITS);
    expect(regionHistogramData.histograms!.mean).toBeCloseTo(expected.mean!, PRECISION_DIGITS);
    expect(regionHistogramData.histograms!.stdDev).toBeCloseTo(expected.stdDev!, PRECISION_DIGITS);
}

/** The hypercube the ack describes: its name, its shape, and one Stokes plane per image which went in. */
export function assertHypercubeAck(
    concatStokesResponse: CARTA.IConcatStokesFilesAck,
    expected: { fileId: number; name: string; shape: ImageShape; planes: StokesLetter[] }
) {
    const openFileAck = concatStokesResponse.openFileAck!;
    const fileInfoExtended = openFileAck.fileInfoExtended!;
    expect(concatStokesResponse.success).toEqual(true);
    expect(openFileAck.success).toEqual(true);
    expect(openFileAck.fileId).toEqual(expected.fileId);
    expect(openFileAck.fileInfo!.name).toEqual(expected.name);
    expect(fileInfoExtended.dimensions).toEqual(expected.shape.dimensions);
    expect(fileInfoExtended.width).toEqual(expected.shape.width);
    expect(fileInfoExtended.height).toEqual(expected.shape.height);
    expect(fileInfoExtended.depth).toEqual(expected.shape.depth);
    expect(fileInfoExtended.stokes).toEqual(expected.planes.length);
    // StokesFilesConnector::DoConcat rebuilds the beam table as one beam per channel per Stokes
    // plane, so its length is the shape of the hypercube restated.
    expect(openFileAck.beamTable!.length).toEqual(expected.shape.depth * expected.planes.length);
}

/**
 * Reach one plane of the open hypercube with SET_IMAGE_CHANNELS, which is what the Stokes selector
 * in the frontend sends, and check that the image which went in on that plane is the one which
 * comes back. A concatenation which put the images on the wrong planes, or which silently repeated
 * one of them, fails here and nowhere else.
 */
export async function assertStokesPlane(fileId: number, stokes: number, stokesLetter: StokesLetter) {
    const msgController = MessageController.Instance;
    const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
    msgController.setChannels({
        fileId: fileId,
        channel: 0,
        stokes: stokes,
        requiredTiles: {
            fileId: fileId,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    });
    const regionHistogramData = await regionHistogramDataStream;
    expect(regionHistogramData[0].stokes).toEqual(stokes);
    expect(regionHistogramData[0].channel).toEqual(0);
    assertHistogramMatchesStokesImage(regionHistogramData[0], stokesLetter, fileId);
}
