import { CARTA } from 'carta-protobuf';
import { checkConnection, Stream } from './MyClient';
import { MessageController } from './MessageController';
import config from './config.json';

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    openFile: CARTA.IOpenFile;
    openFileAck: CARTA.IOpenFileAck;
}

let assertItem: AssertItem = {
    openFile: {
        directory: testSubdirectory,
        file: 'SDC335.579-0.292.spw0.line.image',
        hdu: '',
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    openFileAck: {
        success: true,
        message: '',
        fileInfo: {
            name: 'SDC335.579-0.292.spw0.line.image',
            type: CARTA.FileType.CASA,
            HDUList: [''],
        },
        beamTable: [
            {
                majorAxis: 5.9266767501831055,
                minorAxis: 4.055838584899902,
                pa: -73.86445617675781,
            },
            {
                channel: 10,
                majorAxis: 6.08517599105835,
                minorAxis: 4.214560031890869,
                pa: -76.3934555053711,
            },
            {
                channel: 200,
                majorAxis: 6.153921127319336,
                minorAxis: 4.467309951782227,
                pa: -80.17245483398438,
            },
            {
                channel: 1000,
                majorAxis: 6.155673027038574,
                minorAxis: 4.468430995941162,
                pa: -80.17401885986328,
            },
            {
                channel: 2000,
                majorAxis: 6.157838821411133,
                minorAxis: 4.469924449920654,
                pa: -80.17420959472656,
            },
            {
                channel: 3839,
                majorAxis: 6.357765197753906,
                minorAxis: 4.731705188751221,
                pa: -85.61576080322266,
            },
        ],
    },
};

let basepath: string;
describe('OPEN_FILE_CASA_BEAMTABLE: Testing if file info of beam tables of a CASA image is correctly delivered by the backend', () => {
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

        describe(`query the info of opened file: ${assertItem.openFile.file}`, () => {
            let OpenFileAck: any;
            test(
                `OPEN_FILE_ACK & RegionHistogramData should arrive within ${openFileTimeout} ms".`,
                async () => {
                    OpenFileAck = await msgController.loadFile(assertItem.openFile);
                    let RegionHistogramData = await Stream(CARTA.RegionHistogramData, 1);

                    expect(OpenFileAck.success).toBe(true);
                    expect(OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
                },
                openFileTimeout
            );

            test('OPEN_FILE_ACK.success = true', () => {
                expect(OpenFileAck.success).toBe(true);
            });

            test(`OPEN_FILE_ACK.file_info.HDU_List = [${assertItem.openFileAck.fileInfo.HDUList}]`, () => {
                expect(OpenFileAck.fileInfo.HDUList[0]).toBe(assertItem.openFileAck.fileInfo.HDUList[0]);
            });

            test(`OPEN_FILE_ACK.file_info.name = "${assertItem.openFileAck.fileInfo.name}"`, () => {
                expect(OpenFileAck.fileInfo.name).toEqual(assertItem.openFileAck.fileInfo.name);
            });

            test(`OPEN_FILE_ACK.file_info.type = ${CARTA.FileType.FITS}`, () => {
                expect(OpenFileAck.fileInfo.type).toBe(assertItem.openFileAck.fileInfo.type);
            });

            test(`Assert number of OPEN_FILE_ACK.beam_table = ${assertItem.openFileAck.beamTable.slice(-1)[0].channel + 1}`, () => {
                expect(OpenFileAck.beamTable.length).toEqual(assertItem.openFileAck.beamTable.slice(-1)[0].channel + 1);
            });

            test(`Assert OPEN_FILE_ACK.beam_table`, () => {
                for (const [index, openFileAck] of assertItem.openFileAck.beamTable.entries()) {
                    expect(OpenFileAck.beamTable[openFileAck.channel || 0]).toMatchObject(openFileAck);
                }
            });
        });

        afterAll(() => msgController.closeConnection());
    });
});
