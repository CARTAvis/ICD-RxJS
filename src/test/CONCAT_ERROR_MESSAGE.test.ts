import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import { stokesFile } from './ConcatStokesHelpers';
import {
    CONCAT_STOKES_TIMEOUT,
    CONNECTION_TIMEOUT,
    QUIET_TIME,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    assertBasePath,
} from './CommonHelpers';

/** The single-Stokes cubes the valid cases are built from, and which CONCAT_STOKES_IMAGES concatenates. */
const stokesCube = {
    I: 'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
    Q: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
    U: 'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
    V: 'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
};

/** The same cubes with the degenerate Stokes axis dropped, so they disagree in shape with the above. */
const droppedAxisCube = {
    Q: 'IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits',
    U: 'IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits',
};

/** An image of another file type, and a name which is on no disk. */
const casaImage = 'M17_SWex.image';
const missingImage = 'no_such_stokes_image.fits';

// Every rejection the backend can answer CONCAT_STOKES_FILES with is raised in
// StokesFilesConnector::OpenStokesFiles or StokesFilesConnector::StokesFilesValid and travels back
// in the message field of an unsuccessful CONCAT_STOKES_FILES_ACK.
interface ErrorCase {
    title: string;
    stokesFiles: CARTA.IStokesFile[];
    expectedError: string;
}

interface AssertItem {
    fileList: CARTA.IFileListRequest;
    errorCases: ErrorCase[];
    validConcat: CARTA.IConcatStokesFiles;
    validConcatName: string;
    setCursor: { x: number; y: number };
    setSpatialReq: CARTA.ISetSpatialRequirements;
    fileNotFoundError: { severity: CARTA.ErrorSeverity; tags: string[] };
}

let assertItem: AssertItem = {
    fileList: { directory: TEST_SUBDIRECTORY },
    errorCases: [
        {
            title: 'Case 1: Q and axis-degeneracy U, image shapes inconsistent',
            stokesFiles: [
                stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY),
                stokesFile(droppedAxisCube.U, 'U', TEST_SUBDIRECTORY),
            ],
            expectedError: 'Image shapes or axes are not consistent!',
        },
        {
            title: 'Case 2: Q and axis-degeneracy Q, duplicated Stokes type',
            stokesFiles: [
                stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY),
                stokesFile(droppedAxisCube.Q, 'Q', TEST_SUBDIRECTORY),
            ],
            expectedError: 'Duplicate Stokes type found!',
        },
        {
            title: 'Case 3: a single file, too few to concatenate',
            stokesFiles: [stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY)],
            expectedError: 'Need at least two files to concatenate!',
        },
        {
            title: 'Case 4: a FITS image and a CASA image, mixed file types',
            stokesFiles: [
                stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY),
                stokesFile(casaImage, 'U', TEST_SUBDIRECTORY),
            ],
            expectedError: 'Different file types can not be concatenated!',
        },
        {
            title: 'Case 5: I, Q and V, a hypercube with a gap in the Stokes axis',
            stokesFiles: [
                stokesFile(stokesCube.I, 'I', TEST_SUBDIRECTORY),
                stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY),
                stokesFile(stokesCube.V, 'V', TEST_SUBDIRECTORY),
            ],
            expectedError: 'Hypercube IQV is not allowed!',
        },
        {
            title: 'Case 6: a file which is not on disk',
            stokesFiles: [
                stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY),
                stokesFile(missingImage, 'U', TEST_SUBDIRECTORY),
            ],
            expectedError: `${missingImage} does not exist.`,
        },
    ],
    validConcat: {
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        stokesFiles: [
            stokesFile(stokesCube.Q, 'Q', TEST_SUBDIRECTORY),
            stokesFile(stokesCube.U, 'U', TEST_SUBDIRECTORY),
        ],
    },
    validConcatName: 'IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits',
    setCursor: { x: 128, y: 128 },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [
            { coordinate: 'x', mip: 1 },
            { coordinate: 'y', mip: 1 },
        ],
    },
    fileNotFoundError: {
        severity: CARTA.ErrorSeverity.DEBUG,
        tags: ['spatial'],
    },
};

// The backend must have sent nothing beyond the CONCAT_STOKES_FILES_ACK itself. A concatenation
// which was refused must not go on to stream REGION_HISTOGRAM_DATA or raster data for an image it
// never opened. That ack is the only message it is allowed to draw, and QUIET_TIME is how long the
// backend is watched for a further one.
async function assertOnlyTheAckArrived(messageCountBeforeRequest: number) {
    const msgController = MessageController.Instance;
    await new Promise((resolve) => setTimeout(resolve, QUIET_TIME));
    expect(msgController.messageReceiving()).toEqual(messageCountBeforeRequest + 1);
}

// Session::OnSetSpatialRequirements answers a request naming a file the session holds no frame for
// with this error and nothing else. Since a refused concatenation is only visible in the ack, this
// is what shows that the file id it asked for was really left free: the frontend keeps its own file
// counter unchanged on a rejection (AppStore.loadConcatStokes), so a half-opened image on the
// backend would put the two out of step.
async function assertFileIdIsFree(fileId: number) {
    const msgController = MessageController.Instance;
    const errorDataStream = Stream(CARTA.ErrorData, 1);
    msgController.setSpatialRequirements(assertItem.setSpatialReq);
    const errorData = await errorDataStream;
    expect(errorData[0].severity).toEqual(assertItem.fileNotFoundError.severity);
    expect(errorData[0].tags).toEqual(assertItem.fileNotFoundError.tags);
    expect(errorData[0].message).toEqual(`File id ${fileId} not found`);
}

describe('CONCAT_ERROR_MESSAGE test: incompatible Stokes images are refused with a message', () => {
    const msgController = MessageController.Instance;
    beforeAll(async () => {
        await msgController.connect(TEST_SERVER_URL);
    }, CONNECTION_TIMEOUT);

    checkConnection();

    test(`Get the base path and prefix the Stokes file directories with it |`, async () => {
        await assertBasePath([
            assertItem.fileList,
            ...assertItem.errorCases.flatMap((errorCase) => errorCase.stokesFiles),
            ...assertItem.validConcat.stokesFiles!,
        ]);
    });

    // Case 6 asks for a file which is not on disk, so the test first has to know that the files the
    // other cases name really are there. Otherwise every refusal below could be the same missing
    // file error wearing a different case title.
    test(`FILE_LIST_RESPONSE should list the Stokes images the cases are built from |`, async () => {
        const fileListResponse = await msgController.getFileList(assertItem.fileList.directory!, 0);
        const fileNames = fileListResponse.files!.map((file) => file.name);
        assertItem.errorCases
            .flatMap((errorCase) => errorCase.stokesFiles)
            .concat(assertItem.validConcat.stokesFiles!)
            .map((request) => request.file!)
            .filter((file) => file !== missingImage)
            .forEach((file) => expect(fileNames).toContain(file));
    });

    assertItem.errorCases.forEach((errorCase) => {
        describe(errorCase.title, () => {
            let messageCountBeforeRequest: number;

            test(
                `(Step 1) CONCAT_STOKES_FILES should be refused with "${errorCase.expectedError}" within ${CONCAT_STOKES_TIMEOUT} ms | `,
                async () => {
                    msgController.closeFile(-1);
                    messageCountBeforeRequest = msgController.messageReceiving();
                    // loadStokeFiles rejects with the message field of an unsuccessful
                    // CONCAT_STOKES_FILES_ACK, so a request which is wrongly accepted fails here
                    // rather than passing unnoticed.
                    await expect(
                        msgController.loadStokeFiles(
                            errorCase.stokesFiles,
                            assertItem.validConcat.fileId!,
                            assertItem.validConcat.renderMode!
                        )
                    ).rejects.toContain(errorCase.expectedError);
                },
                CONCAT_STOKES_TIMEOUT
            );

            test(`(Step 2) The refused CONCAT_STOKES_FILES should draw no other message | `, async () => {
                await assertOnlyTheAckArrived(messageCountBeforeRequest);
            });

            test(`(Step 3) File id ${assertItem.validConcat.fileId} should have been left free | `, async () => {
                await assertFileIdIsFree(assertItem.validConcat.fileId!);
            });
        });
    });

    describe(`Case 7: Q & U after the refusals, a valid concatenation`, () => {
        let concatStokesResponse: CARTA.IConcatStokesFilesAck;

        test(
            `(Step 1) CONCAT_STOKES_FILES_ACK should arrive within ${CONCAT_STOKES_TIMEOUT} ms | `,
            async () => {
                msgController.closeFile(-1);
                const regionHistogramDataStream = Stream(CARTA.RegionHistogramData, 1);
                concatStokesResponse = await msgController.loadStokeFiles(
                    assertItem.validConcat.stokesFiles!,
                    assertItem.validConcat.fileId!,
                    assertItem.validConcat.renderMode!
                );
                const regionHistogramData = await regionHistogramDataStream;
                expect(regionHistogramData[0].fileId).toEqual(assertItem.validConcat.fileId);
            },
            CONCAT_STOKES_TIMEOUT
        );

        // The refusals above each leave the connector holding the loaders they opened until
        // StokesFilesConnector::ClearCache runs. If that were skipped, the Stokes types of a failed
        // attempt would still be registered and this concatenation would be refused as a duplicate.
        test(`(Step 2) The concatenated image should be opened under file id ${assertItem.validConcat.fileId} | `, () => {
            expect(concatStokesResponse.success).toBe(true);
            expect(concatStokesResponse.openFileAck!.success).toBe(true);
            expect(concatStokesResponse.openFileAck!.fileId).toEqual(assertItem.validConcat.fileId);
            expect(concatStokesResponse.openFileAck!.fileInfo!.name).toEqual(assertItem.validConcatName);
        });

        // The same request which drew "File id 0 not found" from every refused case now draws a
        // profile instead, which is the other half of what those cases assert. Session only fills a
        // cursor profile once the cursor has been placed, so the requirements are registered first
        // and the cursor is what triggers the stream.
        test(`(Step 3) SPATIAL_PROFILE_DATA should be streamed for the concatenated image | `, async () => {
            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            const spatialProfileDataStream = Stream(CARTA.SpatialProfileData, 1);
            msgController.setCursor(assertItem.validConcat.fileId!, assertItem.setCursor.x, assertItem.setCursor.y);
            const spatialProfileData = await spatialProfileDataStream;
            expect(spatialProfileData[0].fileId).toEqual(assertItem.validConcat.fileId);
            expect(spatialProfileData[0].regionId).toEqual(assertItem.setSpatialReq.regionId);
            expect(spatialProfileData[0].x).toEqual(assertItem.setCursor.x);
            expect(spatialProfileData[0].y).toEqual(assertItem.setCursor.y);
            expect(spatialProfileData[0].profiles!.map((profile) => profile.coordinate)).toEqual(
                assertItem.setSpatialReq.spatialProfiles!.map((profile) => profile.coordinate)
            );
        });
    });

    afterAll(() => msgController.closeConnection());
});
