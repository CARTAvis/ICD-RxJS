import { filter, firstValueFrom, ReplaySubject, Subscription } from 'rxjs';
import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number; value: number }[];
    mean: number;
    stdDev: number;
}
interface AssertItem {
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: 'supermosaic.10.fits',
        fileId: 0,
        hdu: '0',
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [
            {
                bounds: { min: 0, max: 0 },
                channel: -2,
                numBins: -1,
                fixedBounds: false,
                fixedNumBins: false,
            },
        ],
    },
    regionHistogramData: {
        regionId: -2,
        channel: -2,
        histograms: {
            numBins: 2775,
            binWidth: 0.7235205769538879,
            firstBinCenter: -1773.2998046875,
        },
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 }],
        mean: 18.742310255027036,
        stdDev: 22.534721826342878,
    },
    precisionDigits: 4,
};

let basepath: string;
let zarrAssertItem: AssertItem = {
    ...assertItem,
    openFile: { ...assertItem.openFile, file: 'supermosaic.10.zarr', hdu: 'SKY' },
};

describe.each([
    ['FITS', assertItem],
    ['Zarr', zarrAssertItem],
])('PER_CUBE_HISTOGRAM (%s): Calculate the per-cube histogram', (_format, assertItem) => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        test(`Get basepath and modify the directory path`, async () => {
            let fileListResponse = await msgController.getFileList('$BASE', 0);
            basepath = fileListResponse.directory;
            assertItem.openFile.directory = basepath + '/' + assertItem.openFile.directory;
        });

        test(
            `OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `,
            async () => {
                msgController.closeFile(-1);
                const imageHistogram = Stream(CARTA.RegionHistogramData, 1);
                const openFileResponse = await msgController.loadFile(assertItem.openFile);
                expect(openFileResponse.success).toBe(true);
                expect(openFileResponse.fileInfo.name).toEqual(assertItem.openFile.file);
                await imageHistogram;
            },
            openFileTimeout
        );

        test(
            `return RASTER_TILE_DATA(Stream) and check total length | `,
            async () => {
                const rasterStream = Stream(CARTA.RasterTileData, assertItem.addTilesReq.tiles.length + 2);
                msgController.addRequiredTiles(assertItem.addTilesReq);
                const rasterTileData = await rasterStream;

                const spatialStream = Stream(CARTA.SpatialProfileData, 1);
                msgController.setCursor(
                    assertItem.setCursor.fileId,
                    assertItem.setCursor.point.x,
                    assertItem.setCursor.point.y
                );
                await spatialStream;

                expect(rasterTileData).toHaveLength(assertItem.addTilesReq.tiles.length + 2);
            },
            readFileTimeout
        );

        describe('Set cube histogram requirements', () => {
            const cubeUpdates = new ReplaySubject<CARTA.RegionHistogramData>(1);
            const expected = assertItem.regionHistogramData;
            let subscription: Subscription;

            afterAll(() => subscription?.unsubscribe());

            test('REGION_HISTOGRAM_DATA reports progress for the full cube', async () => {
                // Subscribe once so updates arriving between Jest tests remain available.
                subscription = msgController.histogramStream
                    .pipe(
                        filter(
                            (data) => data.fileId === assertItem.openFile.fileId && data.regionId === expected.regionId
                        )
                    )
                    .subscribe(cubeUpdates);

                expect(msgController.setHistogramRequirements(assertItem.setHistogramRequirements)).toBe(true);
                const update = await firstValueFrom(cubeUpdates.pipe(filter((data) => data.progress > 0)));
                expect(update.regionId).toEqual(expected.regionId);
                expect(update.channel).toEqual(expected.channel);
                expect(update.progress).toBeGreaterThan(0);
            }, 3000);

            test(
                'REGION_HISTOGRAM_DATA has valid bins after the statistics pass',
                async () => {
                    const update = await firstValueFrom(cubeUpdates.pipe(filter((data) => data.progress > 0.5)));
                    expect(update.channel).toEqual(expected.channel);
                    expect(update.histograms.bins).toHaveLength(expected.lengthOfHistogramBins);
                    expect(update.histograms.numBins).toEqual(expected.histograms.numBins);
                    expect(update.histograms.binWidth).toBeCloseTo(
                        expected.histograms.binWidth,
                        assertItem.precisionDigits
                    );
                    expect(update.histograms.firstBinCenter).toBeCloseTo(
                        expected.histograms.firstBinCenter,
                        assertItem.precisionDigits
                    );
                },
                cubeHistogramTimeout
            );

            test(
                'The completed cube histogram has the expected bins and statistics',
                async () => {
                    const update = await firstValueFrom(cubeUpdates.pipe(filter((data) => data.progress === 1)));
                    expect(update.regionId).toEqual(expected.regionId);
                    expect(update.channel).toEqual(expected.channel);
                    expect(update.histograms.bins).toHaveLength(expected.lengthOfHistogramBins);
                    expect(update.histograms.numBins).toEqual(expected.histograms.numBins);
                    expect(update.histograms.binWidth).toBeCloseTo(
                        expected.histograms.binWidth,
                        assertItem.precisionDigits
                    );
                    expect(update.histograms.firstBinCenter).toBeCloseTo(
                        expected.histograms.firstBinCenter,
                        assertItem.precisionDigits
                    );
                    expected.binValues.forEach(({ index, value }) => {
                        expect(update.histograms.bins[index]).toEqual(value);
                    });
                    expect(update.histograms.mean).toBeCloseTo(expected.mean, assertItem.precisionDigits);
                    expect(update.histograms.stdDev).toBeCloseTo(expected.stdDev, assertItem.precisionDigits);
                },
                cubeHistogramTimeout
            );
        });

        afterAll(() => msgController.closeConnection());
    });
});
