import { CARTA } from 'carta-protobuf';
import * as zlib from 'zlib';
import { MessageController } from './MessageController';

/**
 * Zstd landed in node's zlib in 22.15, which is newer than the @types/node this repository pins, so
 * the binding is reached without the typings. The backend compresses contour coordinates with Zstd
 * and there is no other decompressor here.
 */
const zstdDecompressSync: (buffer: ArrayBuffer) => Buffer = (zlib as any).zstdDecompressSync;

/**
 * Shared steps for the CONTOUR_* tests. What CONTOUR_IMAGE_DATA carries is an encoded vertex list,
 * so the tests need the decoder before they can check anything about the contours themselves; the
 * rest is the streaming behaviour, which every one of them observes the same way.
 *
 * These are plain assertions rather than jest tests: the test titles and timeouts belong to the
 * test files, so that every test( ) a file registers can be read there.
 */

/** A contour set with its coordinates decoded, as the frontend would draw them. */
export interface DecodedContourSet {
    level: number;
    /** Image coordinates, [x0, y0, x1, y1, …]. */
    vertices: Float32Array;
    /** Index into vertices of the first coordinate of each polyline. */
    startIndices: Int32Array;
    /**
     * The decimation factor the backend reported, which is also how it says which encoding it used:
     * 1 or more for Zstd, 0 for plain little-endian float32.
     */
    decimationFactor: number;
}

/** Copy a protobuf bytes field out of the decoder's buffer, which is a view into a larger one. */
function copyBytes(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Undo Compression.cc's RoundAndEncodeVertices: Zstd, then the byte shuffle of each block of four
 * int32s, then the per-axis delta encoding, then the scale back from 1/Nths of a pixel. This is
 * carta_computation.cc decodeArray(), which is what the frontend runs on these bytes.
 */
function decodeZstdCoordinates(
    rawCoordinates: Uint8Array,
    uncompressedCoordinatesSize: number,
    decimationFactor: number
): Float32Array {
    if (!zstdDecompressSync) {
        throw new Error(
            'node 22.15 or newer is needed to decode Zstd-compressed contour coordinates ' +
                `(running ${process.version})`
        );
    }
    const bytes = zstdDecompressSync(copyBytes(rawCoordinates));
    expect(bytes.length).toEqual(uncompressedCoordinatesSize);

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = uncompressedCoordinatesSize / 4;
    const coordinates = new Float32Array(count);
    const scale = 1 / decimationFactor;
    const blockedLength = 4 * Math.floor(count / 4);

    let v = 0;
    for (v = 0; v < blockedLength; v += 4) {
        const block = 4 * v;
        for (let value = 0; value < 4; value++) {
            // The four bytes of one int32 were written a stride of four apart
            const bits =
                view.getUint8(block + value) |
                (view.getUint8(block + value + 4) << 8) |
                (view.getUint8(block + value + 8) << 16) |
                (view.getUint8(block + value + 12) << 24) |
                0;
            coordinates[v + value] = bits * scale;
        }
    }
    // The tail shorter than a block is left unshuffled by the encoder
    for (; v < count; v++) {
        coordinates[v] = view.getInt32(4 * v, true) * scale;
    }

    let lastX = 0;
    let lastY = 0;
    for (let i = 0; i < count - 1; i += 2) {
        lastX += coordinates[i];
        lastY += coordinates[i + 1];
        coordinates[i] = lastX;
        coordinates[i + 1] = lastY;
    }
    return coordinates;
}

/**
 * The coordinates of one contour set, whichever of the two encodings the backend chose. A backend
 * built with DisableContourCompression sends plain float32 and reports decimation_factor = 0; the
 * default build Zstd-compresses and reports the factor it rounded to.
 */
export function decodeContourSet(contourSet: CARTA.IContourSet): DecodedContourSet {
    const decimationFactor = contourSet.decimationFactor!;
    const rawCoordinates = contourSet.rawCoordinates;
    let vertices: Float32Array;

    if (!rawCoordinates || rawCoordinates.byteLength === 0) {
        // A level which crosses no pixel of the image is answered with the level alone
        vertices = new Float32Array(0);
    } else if (decimationFactor >= 1) {
        vertices = decodeZstdCoordinates(rawCoordinates, contourSet.uncompressedCoordinatesSize!, decimationFactor);
    } else {
        expect(rawCoordinates.byteLength).toEqual(contourSet.uncompressedCoordinatesSize);
        vertices = new Float32Array(copyBytes(rawCoordinates));
    }

    const rawStartIndices = contourSet.rawStartIndices;
    const startIndices =
        rawStartIndices && rawStartIndices.byteLength ? new Int32Array(copyBytes(rawStartIndices)) : new Int32Array(0);

    return { level: contourSet.level!, vertices, startIndices, decimationFactor };
}

/**
 * The vertices as [x, y] pairs on the 1/Nth pixel grid the request asked for. A Zstd-encoded set is
 * already there, and rounding a plain float32 set the same way is what makes one expected geometry
 * serve both encodings.
 */
export function verticesOnGrid(decoded: DecodedContourSet, decimationFactor: number): number[][] {
    const pairs: number[][] = [];
    for (let i = 0; i < decoded.vertices.length; i += 2) {
        pairs.push([
            Math.round(decoded.vertices[i] * decimationFactor) / decimationFactor,
            Math.round(decoded.vertices[i + 1] * decimationFactor) / decimationFactor,
        ]);
    }
    return pairs;
}

/** The fields of CONTOUR_IMAGE_DATA which say what the contours are of, rather than what they are. */
export function assertContourImageDataHeader(
    contourImageData: CARTA.IContourImageData,
    expected: { fileId: number; referenceFileId: number; channel: number; stokes: number }
) {
    expect(contourImageData.fileId).toEqual(expected.fileId);
    expect(contourImageData.referenceFileId).toEqual(expected.referenceFileId);
    expect(contourImageData.channel).toEqual(expected.channel);
    expect(contourImageData.stokes).toEqual(expected.stokes);
    // One set per message: the backend fills a message per level per chunk, never several at once
    expect(contourImageData.contourSets!.length).toEqual(1);
}

/**
 * A Zstd-encoded set has already been rounded to 1/Nth of a pixel by the backend, so nothing is left
 * for verticesOnGrid to move. This is the rounding contract itself, and it can only be checked on a
 * build which compresses.
 */
export function assertVerticesAreOnGrid(decoded: DecodedContourSet) {
    if (decoded.decimationFactor < 1) {
        return;
    }
    for (let i = 0; i < decoded.vertices.length; i++) {
        const onGrid = Math.round(decoded.vertices[i] * decoded.decimationFactor) / decoded.decimationFactor;
        expect(decoded.vertices[i]).toBeCloseTo(onGrid, 6);
    }
}

/**
 * The decimation factor the backend reports is how it says which encoding it used, so the only two
 * answers a request for N can draw are N itself, from a build which compresses, and 0, from one
 * built with DisableContourCompression. Anything else would leave the frontend decoding the
 * coordinates on the wrong branch of ProcessContourSet.
 */
export function assertReportedDecimationFactor(decoded: DecodedContourSet, requested: number) {
    expect([0, requested]).toContain(decoded.decimationFactor);
}

/**
 * start_indices is what subdivides the coordinate list into polylines, so it has to address pairs
 * inside that list and never run past its end. A contour is drawn from the first index onwards.
 */
export function assertPolylineIndices(decoded: DecodedContourSet) {
    expect(decoded.startIndices.length).toBeGreaterThan(0);
    expect(decoded.startIndices[0]).toEqual(0);
    decoded.startIndices.forEach((startIndex, polyline) => {
        // An index addresses a coordinate, and a vertex is two of them
        expect(startIndex % 2).toEqual(0);
        expect(startIndex).toBeLessThan(decoded.vertices.length);
        if (polyline > 0) {
            expect(startIndex).toBeGreaterThan(decoded.startIndices[polyline - 1]);
        }
    });
}

/** Every vertex lies inside the bounds the contour was requested for. */
export function assertVerticesWithinBounds(decoded: DecodedContourSet, imageBounds: CARTA.IImageBounds) {
    for (let i = 0; i < decoded.vertices.length; i += 2) {
        expect(Number.isNaN(decoded.vertices[i])).toBe(false);
        expect(Number.isNaN(decoded.vertices[i + 1])).toBe(false);
        expect(decoded.vertices[i]).toBeGreaterThanOrEqual(imageBounds.xMin!);
        expect(decoded.vertices[i]).toBeLessThanOrEqual(imageBounds.xMax!);
        expect(decoded.vertices[i + 1]).toBeGreaterThanOrEqual(imageBounds.yMin!);
        expect(decoded.vertices[i + 1]).toBeLessThanOrEqual(imageBounds.yMax!);
    }
}

/**
 * Collect CONTOUR_IMAGE_DATA until every requested level has reported progress = 1. Call this
 * before sending SET_CONTOUR_PARAMETERS: the stream has to be subscribed first or the messages of a
 * small image arrive before anything is listening.
 */
export function streamContourImageData(levelCount: number): Promise<CARTA.IContourImageData[]> {
    const messages: CARTA.IContourImageData[] = [];
    let completed = 0;
    return new Promise((resolve) => {
        const subscription = MessageController.Instance.contourStream.subscribe({
            next: (contourImageData: CARTA.ContourImageData) => {
                messages.push(contourImageData);
                if (contourImageData.progress === 1 && ++completed === levelCount) {
                    subscription.unsubscribe();
                    resolve(messages);
                }
            },
        });
    });
}

/** The messages which carry one level, in the order they arrived. */
export function messagesOfLevel(messages: CARTA.IContourImageData[], level: number): CARTA.IContourImageData[] {
    return messages.filter((message) => message.contourSets![0].level === level);
}

/** The vertices of one level, summed over the chunks it was streamed in. */
export function vertexCountOfLevel(messages: CARTA.IContourImageData[], level: number): number {
    return messagesOfLevel(messages, level).reduce(
        (total, message) => total + (message.contourSets![0].uncompressedCoordinatesSize || 0) / 8,
        0
    );
}

/**
 * One level arrives as a run of chunks which ends in progress = 1. TraceLevel clamps a partial to
 * 0.99, so the final message is the only one which can report the level complete, and the partials
 * before it have to make progress or the stream would never be reporting anything new.
 */
export function assertProgressSequence(messages: CARTA.IContourImageData[], level: number) {
    const forLevel = messagesOfLevel(messages, level);
    expect(forLevel.length).toBeGreaterThan(0);

    const progressValues = forLevel.map((message) => message.progress!);
    expect(progressValues.filter((progress) => progress === 1).length).toEqual(1);
    expect(progressValues[progressValues.length - 1]).toEqual(1);

    const partials = progressValues.slice(0, -1);
    partials.forEach((progress, index) => {
        expect(progress).toBeGreaterThan(0);
        expect(progress).toBeLessThanOrEqual(0.99);
        if (index > 0) {
            expect(progress).toBeGreaterThan(partials[index - 1]);
        }
    });
}
