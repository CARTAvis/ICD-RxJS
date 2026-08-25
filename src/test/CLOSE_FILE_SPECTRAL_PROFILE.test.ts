import { CARTA } from 'carta-protobuf';
import { checkConnection } from './MyClient';
import { MessageController } from './MessageController';
import {
    CONNECTION_TIMEOUT,
    TEST_SERVER_URL,
    TEST_SUBDIRECTORY,
    assertBackendIsAlive,
    assertNoFurtherMessage,
    testBackendIsAlive,
    testBasePath,
    testOpenFile,
    testTilesAndProfiles,
} from './CloseFileHelpers';
import config from './config.json';

let largeImageTimeout = config.timeout.readLargeImage;

interface AssertItem {
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
}

let assertItem: AssertItem = {
    filelist: { directory: TEST_SUBDIRECTORY },
    openFile: [
        {
            directory: TEST_SUBDIRECTORY,
            file: 'S255_IR_sci.spw29.cube.I.pbcor.fits',
            hdu: '0',
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: TEST_SUBDIRECTORY,
            file: 'S255_IR_sci.spw25.cube.I.pbcor.fits',
            hdu: '0',
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addRequiredTiles: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1,
            point: { x: 1, y: 1 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
        },
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: [{ coordinate: 'x' }, { coordinate: 'y' }],
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 630.0, y: 1060.0 },
                    { x: 600.0, y: 890.0 },
                ],
                rotation: 0.0,
            },
        },
        {
            fileId: 1,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    { x: 630.0, y: 1060.0 },
                    { x: 600.0, y: 890.0 },
                ],
                rotation: 0.0,
            },
        },
    ],
    regionAck: {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [],
        },
        {
            fileId: 1,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: 'z',
                    statsTypes: [CARTA.StatsType.Mean],
                },
            ],
        },
    ],
};

// Set the region the spectral profile is asked for. Every case sets it on file 0, which the
// backend answers with the first region id it hands out.
async function assertSetRegion(setRegion: CARTA.ISetRegion) {
    const setRegionAck = await MessageController.Instance.setRegion(
        setRegion.fileId,
        setRegion.regionId,
        setRegion.regionInfo
    );
    expect(setRegionAck.regionId).toEqual(assertItem.regionAck.regionId);
    expect(setRegionAck.success).toEqual(assertItem.regionAck.success);
}

// SPECTRAL_PROFILE_DATA of a cube arrives in parts, so the point at which the file is closed
// is chosen by progress rather than by a message count. The messages received up to that
// point are returned so that the caller can report the progress they carried.
function streamSpectralProfileUntilProgress(minimumProgress: number): Promise<CARTA.SpectralProfileData[]> {
    const spectralProfileData: CARTA.SpectralProfileData[] = [];
    return new Promise((resolve) => {
        MessageController.Instance.spectralProfileStream.subscribe({
            next: (data) => {
                spectralProfileData.push(data);
                if (data.progress > minimumProgress) {
                    resolve(spectralProfileData);
                }
            },
        });
    });
}

function logProgress(label: string, spectralProfileData: CARTA.SpectralProfileData[]) {
    spectralProfileData.forEach((data) => {
        console.log(`${label} SPECTRAL_PROFILE progress :`, data.progress);
    });
}

const CLOSE_AT_PROGRESS = 0.3;

describe('[Case 1] Request SPECTRAL_REQUIREMENTS and then CLOSE_FILE when data is still streaming :', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        testBasePath([assertItem.openFile[0], assertItem.openFile[1], assertItem.filelist]);
        testOpenFile('(Step 1)', assertItem.openFile[0], -1);
        testTilesAndProfiles(
            '(Step 2)',
            assertItem.addRequiredTiles[0],
            assertItem.setCursor[0],
            assertItem.setSpatialReq[0]
        );

        test(
            `(Step 3) Set REGION & SPECTRAL_PROFILE streaming, once progress>${CLOSE_AT_PROGRESS} then CLOSE_FILE & Check whether the backend is alive:`,
            async () => {
                await assertSetRegion(assertItem.setRegion[0]);

                //Set SPECTRAL_PROFILE streaming
                const spectralProfileDataPromise = streamSpectralProfileUntilProgress(CLOSE_AT_PROGRESS);
                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
                logProgress(assertItem.openFile[0].file, await spectralProfileDataPromise);

                //Once progress>0.3, then CLOSE_FILE
                msgController.closeFile(0);

                //Check whether the backend is alive?
                await assertBackendIsAlive(assertItem.filelist);
            },
            largeImageTimeout
        );

        afterAll(() => msgController.closeConnection());
    });
});

describe('[Case 2] Request SPECTRAL_REQUIREMENTS of TWO images and then CLOSE_FILE when the SECOND data is still streaming :', () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(TEST_SERVER_URL);
        }, CONNECTION_TIMEOUT);

        checkConnection();
        testOpenFile('(Step 1) IMAGE 1 :', assertItem.openFile[0], -1);
        testTilesAndProfiles(
            '(Step 2) IMAGE 1 :',
            assertItem.addRequiredTiles[0],
            assertItem.setCursor[0],
            assertItem.setSpatialReq[0]
        );
        testOpenFile('(Step 3) IMAGE 2 :', assertItem.openFile[1], 1);
        testTilesAndProfiles(
            '(Step 4) IMAGE 2 :',
            assertItem.addRequiredTiles[1],
            assertItem.setCursor[1],
            assertItem.setSpatialReq[1]
        );

        test(
            `(Step 5) Set REGION & SPECTRAL_PROFILE streaming, once progress1>${CLOSE_AT_PROGRESS} -> progress2>${CLOSE_AT_PROGRESS} -> CLOSE_FILE two images`,
            async () => {
                await assertSetRegion(assertItem.setRegion[0]);

                //Set 1st image SPECTRAL_PROFILE streaming
                const firstImagePromise = streamSpectralProfileUntilProgress(CLOSE_AT_PROGRESS);
                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
                logProgress(`(Case 2) 1st image:${assertItem.openFile[0].file}`, await firstImagePromise);

                // Stop the 1st image streaming before the 2nd one is asked for, so that the
                // progress which is waited for below belongs to the 2nd image only.
                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[1]);

                // Set 2nd image SPECTRAL_PROFILE streaming
                const secondImagePromise = streamSpectralProfileUntilProgress(CLOSE_AT_PROGRESS);
                msgController.setSpectralRequirements(assertItem.setSpectralRequirements[2]);
                logProgress(`(Case 2) 2nd image:${assertItem.openFile[1].file}`, await secondImagePromise);

                //Once ReceiveProgress2>0.3, then CLOSE_FILE to 1st & 2nd image
                msgController.closeFile(0);
                msgController.closeFile(1);
            },
            largeImageTimeout
        );

        test(`(Step 6) check there is no receiving message`, async () => {
            msgController.closeFile(0);
            await assertNoFurtherMessage(msgController.messageReceiving());
        });

        testBackendIsAlive(assertItem.filelist);

        afterAll(() => msgController.closeConnection());
    });
});
