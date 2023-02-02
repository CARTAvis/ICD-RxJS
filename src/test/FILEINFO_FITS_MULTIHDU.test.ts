import { CARTA } from "carta-protobuf";
import { checkConnection} from './myClient';
import { MessageController } from "./MessageController";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    headerCount: number;
    fileInfoRequest: CARTA.IFileInfoRequest;
    fileInfoExtendedString: string[];
    fileInfoResponse: CARTA.IFileInfoResponse;
};

let assertItem: AssertItem = {
    headerCount: 53,
    fileInfoRequest: {
        file: "spire500_ext.fits",
        hdu: "",
    },
    fileInfoExtendedString: ['1','6','7'],
    fileInfoResponse: {
        success: true,
        message: "",
        fileInfo: {
            name: "spire500_ext.fits",
            type: CARTA.FileType.FITS,
            size: 17591040,
            HDUList: [""],
        },
        fileInfoExtended: {
            '1': {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: "Name", value: "spire500_ext.fits" },
		    { name: "Data type", value: "double" },
                    { name: 'HDU', value: '1' },
                    { name: 'Extension name', value: 'image' },
                    { name: "Shape", value: "[830, 870]" },
                    { name: "Coordinate type", value: "Right Ascension, Declination" },
                    { name: "Projection", value: "TAN" },
                    { name: "Image reference pixels", value: "[371, 421]" },
                    { name: "Image reference coords", value: "[07:09:13.1081, -010.36.38.5952]" },
                    { name: "Image ref coords (deg)", value: "[107.305 deg, -10.6107 deg]" },
                    { name: "Celestial frame", value: "FK5, J2000" },
                    { name: "Pixel unit", value: "MJy/sr" },
                    { name: "Pixel increment", value: "-14\", 14\"" },
                    { name: "RA range", value: "[07:01:55.064, 07:15:06.258]" },
                    { name: "DEC range", value: "[-12.14.22.907, -08.51.38.954]" },
                ],
                headerEntries: [
                    { name: "XTENSION", value: "IMAGE", comment: ' Java FITS: Wed Oct 01 10:15:59 CEST 2014' },
                    { name: "BITPIX", value: "-64", entryType: 2, numericValue: -64 },
                    { name: "NAXIS", value: "2", entryType: 2, numericValue: 2 },
                    { name: "NAXIS1", value: "830", entryType: 2, numericValue: 830 },
                    { name: "NAXIS2", value: "870", entryType: 2, numericValue: 870 },
                    { name: "PCOUNT", value: "0", entryType: 2, comment: " No extra parameters"},
                    { name: "GCOUNT", value: "1", entryType: 2, numericValue:1, comment: " One group"},
                    { name: "LONGSTRN", value: "OGIP 1.0", comment: " The OGIP long string convention may be used."},
                    { name: "EXTNAME", value: "image", comment: " name of this HDU"},
                    { name: "CLASS___", value: "herschel.ia.dataset.ArrayDataset", comment: " java representation" },
                    { name: "INFO____", value: "Image" },
                    { name: "DATA____", value: "herschel.ia.numeric.Double2d", comment:" java Data" },
                    { name: "QTTY____", value: "MJy/sr", comment:" Unit of the data" },
                    { name: "BUNIT", value: "MJy/sr", comment: ' Unit of the data' },
                    {
                        name: "META_0",
                        value: "2",
                        entryType: 2,
                        numericValue: 2,
                        comment: " [] WCS: Number of Axes"
                    },
                    { name: "CRPIX1", value: "371", entryType: 1, numericValue: 371 },
                    { name: "CRPIX2", value: "421", entryType: 1, numericValue: 421 },
                    {
                        name: "CRVAL1",
                        value: "1.073046172702E+02",
                        entryType: 1,
                        numericValue: 107.30461727023817
                    },
                    {
                        name: "CRVAL2",
                        value: "-1.061072089652E+01",
                        entryType: 1,
                        numericValue: -10.610720896516849
                    },
                    {
                        name: "CDELT1",
                        value: "-3.888888888889E-03",
                        entryType: 1,
                        numericValue: -0.003888888888889
                    },
                    {
                        name: "CDELT2",
                        value: "3.888888888889E-03",
                        entryType: 1,
                        numericValue: 0.003888888888889
                    },
                    { name: "CTYPE1", value: "RA---TAN" },
                    { name: "CTYPE2", value: "DEC--TAN" },
                    {
                        name: "EQUINOX",
                        value: "2000",
                        entryType: 1,
                        numericValue: 2000
                    },
                    {
                        name: "CROTA2",
                        value: "0.000000000000E+00",
                        entryType: 1,
                        comment: " [] The Rotation angle"
                    },
                    {
                        name: "META_1",
                        value: "830",
                        entryType: 2,
                        numericValue: 830
                    },
                    {
                        name: "META_2",
                        value: "870",
                        entryType: 2,
                        numericValue: 870
                    },
                ],
            },
            '6': {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: "Name", value: "spire500_ext.fits" },
		    { name: "Data type", value: "double" },
                    { name: 'HDU', value: '6' },
                    { name: 'Extension name', value: 'error' },
                    { name: "Shape", value: "[830, 870]" },
                    { name: "Coordinate type", value: "Right Ascension, Declination" },
                    { name: "Projection", value: "TAN" },
                    { name: "Image reference pixels", value: "[371, 421]" },
                    { name: "Image reference coords", value: "[07:09:13.1081, -010.36.38.5952]" },
                    { name: "Image ref coords (deg)", value: "[107.305 deg, -10.6107 deg]" },
                    { name: "Celestial frame", value: "FK5, J2000" },
                    { name: "Pixel unit", value: "MJy/sr" },
                    { name: "Pixel increment", value: "-14\", 14\"" },
                    { name: "RA range", value: "[07:01:55.064, 07:15:06.258]" },
                    { name: "DEC range", value: "[-12.14.22.907, -08.51.38.954]" },
                ],
                headerEntries: [
                    { name: "XTENSION", value: "IMAGE", comment: ' Java FITS: Wed Oct 01 10:15:59 CEST 2014' },
                    { name: "BITPIX", value: "-64", entryType: 2, numericValue: -64 },
                    { name: "NAXIS", value: "2", entryType: 2, numericValue: 2 },
                    { name: "NAXIS1", value: "830", entryType: 2, numericValue: 830 },
                    { name: "NAXIS2", value: "870", entryType: 2, numericValue: 870 },
                    { name: "PCOUNT", value: "0", entryType: 2, comment: " No extra parameters"},
                    { name: "GCOUNT", value: "1", entryType: 2, numericValue:1, comment: " One group"},
                    { name: "LONGSTRN", value: "OGIP 1.0", comment: " The OGIP long string convention may be used."},
                    { name: "EXTNAME", value: "error", comment: " name of this HDU"},
                    { name: "CLASS___", value: "herschel.ia.dataset.ArrayDataset", comment: " java representation" },
                    { name: "INFO____", value: "Statistical error on the pixel values" },
                    { name: "DATA____", value: "herschel.ia.numeric.Double2d", comment:" java Data" },
                    { name: "QTTY____", value: "MJy/sr", comment:" Unit of the data" },
                    { name: "BUNIT", value: "MJy/sr", comment: ' Unit of the data' },
                    {
                        name: "META_0",
                        value: "2",
                        entryType: 2,
                        numericValue: 2,
                        comment: " [] WCS: Number of Axes"
                    },
                    { name: "CRPIX1", value: "371", entryType: 1, numericValue: 371 },
                    { name: "CRPIX2", value: "421", entryType: 1, numericValue: 421 },
                    {
                        name: "CRVAL1",
                        value: "1.073046172702E+02",
                        entryType: 1,
                        numericValue: 107.30461727023817
                    },
                    {
                        name: "CRVAL2",
                        value: "-1.061072089652E+01",
                        entryType: 1,
                        numericValue: -10.610720896516849
                    },
                    {
                        name: "CDELT1",
                        value: "-3.888888888889E-03",
                        entryType: 1,
                        numericValue: -0.003888888888889
                    },
                    {
                        name: "CDELT2",
                        value: "3.888888888889E-03",
                        entryType: 1,
                        numericValue: 0.003888888888889
                    },
                    { name: "CTYPE1", value: "RA---TAN" },
                    { name: "CTYPE2", value: "DEC--TAN" },
                    {
                        name: "EQUINOX",
                        value: "2000",
                        entryType: 1,
                        numericValue: 2000
                    },
                    {
                        name: "CROTA2",
                        value: "0.000000000000E+00",
                        entryType: 1,
                        comment: " [] The Rotation angle"
                    },
                    {
                        name: "META_1",
                        value: "830",
                        entryType: 2,
                        numericValue: 830
                    },
                    {
                        name: "META_2",
                        value: "870",
                        entryType: 2,
                        numericValue: 870
                    },
                ],
            },
            '7': {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: "Name", value: "spire500_ext.fits" },
		    { name: "Data type", value: "double" },
                    { name: 'HDU', value: '7' },
                    { name: 'Extension name', value: 'coverage' },
                    { name: "Shape", value: "[830, 870]" },
                    { name: "Coordinate type", value: "Right Ascension, Declination" },
                    { name: "Projection", value: "TAN" },
                    { name: "Image reference pixels", value: "[371, 421]" },
                    { name: "Image reference coords", value: "[07:09:13.1081, -010.36.38.5952]" },
                    { name: "Image ref coords (deg)", value: "[107.305 deg, -10.6107 deg]" },
                    { name: "Celestial frame", value: "FK5, J2000" },
                    { name: "Pixel unit", value: "1" },
                    { name: "Pixel increment", value: "-14\", 14\"" },
                    { name: "RA range", value: "[07:01:55.064, 07:15:06.258]" },
                    { name: "DEC range", value: "[-12.14.22.907, -08.51.38.954]" },
                ],
                headerEntries: [
                    { name: "XTENSION", value: "IMAGE", comment: ' Java FITS: Wed Oct 01 10:15:59 CEST 2014' },
                    { name: "BITPIX", value: "-64", entryType: 2, numericValue: -64 },
                    { name: "NAXIS", value: "2", entryType: 2, numericValue: 2 },
                    { name: "NAXIS1", value: "830", entryType: 2, numericValue: 830 },
                    { name: "NAXIS2", value: "870", entryType: 2, numericValue: 870 },
                    { name: "PCOUNT", value: "0", entryType: 2, comment: " No extra parameters"},
                    { name: "GCOUNT", value: "1", entryType: 2, numericValue:1, comment: " One group"},
                    { name: "LONGSTRN", value: "OGIP 1.0", comment: " The OGIP long string convention may be used."},
                    { name: "EXTNAME", value: "coverage", comment: " name of this HDU"},
                    { name: "CLASS___", value: "herschel.ia.dataset.ArrayDataset", comment: " java representation" },
                    { name: "INFO____", value: "Coverage" },
                    { name: "DATA____", value: "herschel.ia.numeric.Double2d", comment:" java Data" },
                    { name: "QTTY____", value: "1", comment:" Unit of the data" },
                    { name: "BUNIT", value: "1", comment: ' Unit of the data' },
                    {
                        name: "META_0",
                        value: "2",
                        entryType: 2,
                        numericValue: 2,
                        comment: " [] WCS: Number of Axes"
                    },
                    { name: "CRPIX1", value: "371", entryType: 1, numericValue: 371 },
                    { name: "CRPIX2", value: "421", entryType: 1, numericValue: 421 },
                    {
                        name: "CRVAL1",
                        value: "1.073046172702E+02",
                        entryType: 1,
                        numericValue: 107.30461727023817
                    },
                    {
                        name: "CRVAL2",
                        value: "-1.061072089652E+01",
                        entryType: 1,
                        numericValue: -10.610720896516849
                    },
                    {
                        name: "CDELT1",
                        value: "-3.888888888889E-03",
                        entryType: 1,
                        numericValue: -0.003888888888889
                    },
                    {
                        name: "CDELT2",
                        value: "3.888888888889E-03",
                        entryType: 1,
                        numericValue: 0.003888888888889
                    },
                    { name: "CTYPE1", value: "RA---TAN" },
                    { name: "CTYPE2", value: "DEC--TAN" },
                    {
                        name: "EQUINOX",
                        value: "2000",
                        entryType: 1,
                        numericValue: 2000
                    },
                    {
                        name: "CROTA2",
                        value: "0.000000000000E+00",
                        entryType: 1,
                        comment: " [] The Rotation angle"
                    },
                    {
                        name: "META_1",
                        value: "830",
                        entryType: 2,
                        numericValue: 830
                    },
                    {
                        name: "META_2",
                        value: "870",
                        entryType: 2,
                        numericValue: 870
                    },
                ],
            },
        },
    },
};

let basepath: string;
describe("FILEINFO_FITS_MULTIHDU: Testing if info of an FITS image file is correctly delivered by the backend", () => {
    const msgController = MessageController.Instance;
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await msgController.connect(testServerUrl);
        }, connectTimeout);

        checkConnection();
        describe(`Go to "${testSubdirectory}" folder`, () => {
            test('Preparation:',async () => {
                let FileListResponse = await msgController.getFileList('$BASE', 0);
                basepath = FileListResponse.directory;
            }, listFileTimeout);
        });

        describe(`query the info of file : ${assertItem.fileInfoRequest.file}`, () => {
            let FileInfoResponse: any;
            test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                FileInfoResponse = await msgController.getFileInfo(`${basepath}/` + testSubdirectory, assertItem.fileInfoRequest.file, assertItem.fileInfoRequest.hdu)
            }, openFileTimeout);

            test("FILE_INFO_RESPONSE.success = true", () => {
                expect(FileInfoResponse.success).toBe(true);
            });

            test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${assertItem.fileInfoResponse.fileInfo.HDUList}]`, () => {
                assertItem.fileInfoResponse.fileInfo.HDUList.map((entry, index) => {
                    expect(FileInfoResponse.fileInfo.HDUList).toContainEqual(entry);
                });
            });

            test(`FILE_INFO_RESPONSE.file_info.name = "${assertItem.fileInfoResponse.fileInfo.name}"`, () => {
                expect(FileInfoResponse.fileInfo.name).toEqual(assertItem.fileInfoResponse.fileInfo.name);
            });

            test(`FILE_INFO_RESPONSE.file_info.size = ${assertItem.fileInfoResponse.fileInfo.size}`, () => {
                expect(FileInfoResponse.fileInfo.size.toString()).toEqual(assertItem.fileInfoResponse.fileInfo.size.toString());
            });

            test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType.FITS}`, () => {
                expect(FileInfoResponse.fileInfo.type).toBe(assertItem.fileInfoResponse.fileInfo.type);
            });

            assertItem.fileInfoExtendedString.map((input, index) => {
                describe(`FileInfoExtended of '${input}':`, () => {
                    test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse.fileInfoExtended[input].dimensions}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].dimensions).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].dimensions);
                    });

                    test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse.fileInfoExtended[input].width}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].width).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].width);
                    });

                    test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse.fileInfoExtended[input].height}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].height).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].height);
                    });

                    if (assertItem.fileInfoResponse.fileInfoExtended[input].dimensions >= 2) {
                        test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse.fileInfoExtended[input].depth}`, () => {
                            expect(FileInfoResponse.fileInfoExtended[input].depth).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].depth);
                        });
                    };

                    if (assertItem.fileInfoResponse.fileInfoExtended[input].dimensions >= 2) {
                        test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse.fileInfoExtended[input].stokes}`, () => {
                            expect(FileInfoResponse.fileInfoExtended[input].stokes).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].stokes);
                        });
                    };

                    test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse.fileInfoExtended[input].stokesVals}]`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].stokesVals).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].stokesVals);
                    });

                    test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.fileInfoResponse.fileInfoExtended[input].computedEntries.length}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].computedEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].computedEntries.length);
                    });

                    test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                        assertItem.fileInfoResponse.fileInfoExtended[input].computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                            if (isNaN(parseFloat(entry.value))){
                                expect(FileInfoResponse.fileInfoExtended[input].computedEntries.find(f => f.name == entry.name).value).toEqual(entry.value);
                            } else {
                                expect(parseFloat(FileInfoResponse.fileInfoExtended[input].computedEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                            }
                            expect(FileInfoResponse.fileInfoExtended[input].computedEntries.find(f => f.name == entry.name).value).toEqual(entry.value);
                        });
                    });

                    test(`len(file_info_extended.header_entries)==${assertItem.headerCount}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].headerEntries.length).toEqual(assertItem.headerCount)
                    });

                    test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                        let FileInfoResponse_value = [];
                        FileInfoResponse.fileInfoExtended[input].headerEntries.map((f) => {
                            let keysNum = Object.keys(f).length;
                            if (keysNum > 1) {
                                FileInfoResponse_value.push(f)
                            };
                        });

                        assertItem.fileInfoResponse.fileInfoExtended[input].headerEntries.map((entry: CARTA.IHeaderEntry, index) => {
                            if (isNaN(parseFloat(entry.value))){
                                expect(FileInfoResponse_value.find(f => f.name == entry.name).value).toEqual(entry.value);
                            } else {
                                expect(parseFloat(FileInfoResponse_value.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                            }
                        });
                    });
                });
            })
        });
        afterAll(() => msgController.closeConnection());
    });
});