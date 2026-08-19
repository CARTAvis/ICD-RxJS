import { CARTA } from 'carta-protobuf';
import config from './config.json';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let concatStokeTimeout = config.timeout.concatStokes;
// CONCAT_STOKES_FILES_ACK is the only message a rejected concatenation is allowed to draw, and
// this is how long the backend is watched for a further one.
let quietTime: number = config.timeout.messageEvent;

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
    fileList: { directory: testSubdirectory },
    errorCases: [
        {
            title: 'Case 1: Q and axis-degeneracy U, image shapes inconsistent',
            stokesFiles: [
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.U,
                },
            ],
            expectedError: 'Image shapes or axes are not consistent!',
        },
        {
            title: 'Case 2: Q and axis-degeneracy Q, duplicated Stokes type',
            stokesFiles: [
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
            ],
            expectedError: 'Duplicate Stokes type found!',
        },
        {
            title: 'Case 3: a single file, too few to concatenate',
            stokesFiles: [
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
            ],
            expectedError: 'Need at least two files to concatenate!',
        },
        {
            title: 'Case 4: a FITS image and a CASA image, mixed file types',
            stokesFiles: [
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'M17_SWex.image',
                    polarizationType: CARTA.PolarizationType.U,
                },
            ],
            expectedError: 'Different file types can not be concatenated!',
        },
        {
            title: 'Case 5: I, Q and V, a hypercube with a gap in the Stokes axis',
            stokesFiles: [
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.I,
                },
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.V,
                },
            ],
            expectedError: 'Hypercube IQV is not allowed!',
        },
        {
            title: 'Case 6: a file which is not on disk',
            stokesFiles: [
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                    polarizationType: CARTA.PolarizationType.Q,
                },
                {
                    directory: testSubdirectory,
                    hdu: '',
                    file: 'no_such_stokes_image.fits',
                    polarizationType: CARTA.PolarizationType.U,
                },
            ],
            expectedError: 'no_such_stokes_image.fits does not exist.',
        },
    ],
    validConcat: {
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        stokesFiles: [
            {
                directory: testSubdirectory,
                hdu: '',
                file: 'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                polarizationType: CARTA.PolarizationType.Q,
            },
            {
                directory: testSubdirectory,
                hdu: '',
                file: 'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                polarizationType: CARTA.PolarizationType.U,
            },
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

let basepath: string;

// The backend must have sent nothing beyond the CONCAT_STOKES_FILES_ACK itself. A concatenation
// which was refused must not go on to stream REGION_HISTOGRAM_DATA or raster data for an image it
// never opened.
async function assertOnlyTheAckArrived(messageCountBeforeRequest: number) {
    const msgController = MessageController.Instance;
    await new Promise((resolve) => setTimeout(resolve, quietTime));
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
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();

    test(`Get the base path and prefix the Stokes file directories with it |`, async () => {
        const fileListResponse = await msgController.getFileList('$BASE', 0);
        basepath = fileListResponse.directory;
        assertItem.fileList.directory = basepath + '/' + assertItem.fileList.directory;
        assertItem.errorCases.forEach((errorCase) => {
            errorCase.stokesFiles.forEach((stokesFile) => {
                stokesFile.directory = basepath + '/' + stokesFile.directory;
            });
        });
        assertItem.validConcat.stokesFiles!.forEach((stokesFile) => {
            stokesFile.directory = basepath + '/' + stokesFile.directory;
        });
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
            .map((stokesFile) => stokesFile.file!)
            .filter((file) => file !== 'no_such_stokes_image.fits')
            .forEach((file) => expect(fileNames).toContain(file));
    });

    assertItem.errorCases.forEach((errorCase) => {
        describe(errorCase.title, () => {
            let messageCountBeforeRequest: number;

            test(
                `(Step 1) CONCAT_STOKES_FILES should be refused with "${errorCase.expectedError}" within ${concatStokeTimeout} ms | `,
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
                concatStokeTimeout
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
            `(Step 1) CONCAT_STOKES_FILES_ACK should arrive within ${concatStokeTimeout} ms | `,
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
            concatStokeTimeout
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
