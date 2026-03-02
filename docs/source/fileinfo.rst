File Info
---------

.. uml::

    skinparam style strictuml
    hide footbox
    title File Info workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Request file info
    activate Frontend
    Frontend -> Backend : 1. FILE_INFO_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">2. FILE_INFO_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays file info
    deactivate Frontend

FILEINFO_EXCEPTIONS
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FILEINFO_EXCEPTIONS.test.ts>`__.

This test verifies that appropriate error messages are returned when requesting info for files that do not exist or have broken headers.

1. Frontend sends: **FILE_INFO_REQUEST** for a non-existent file

   .. code-block:: protobuf

     directory = "set_QA"
     file = "no_such_file.image"
     hdu = "0"

:red-text:`Check 1:` the FILE_INFO_RESPONSE should return error:

   - Error message = "File no_such_file.image does not exist."

2. Frontend sends: **FILE_INFO_REQUEST** for a file with a broken header

   .. code-block:: protobuf

     directory = "set_QA"
     file = "broken_header.miriad"
     hdu = "0"

:red-text:`Check 2:` the FILE_INFO_RESPONSE should return error:

   - Error message = "Image must be 2D, 3D or 4D."

FILEINFO_FITS_MULTIHDU
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FILEINFO_FITS_MULTIHDU.test.ts>`__.

This test verifies that file info for a multi-HDU FITS image is correctly delivered, including computed entries and header entries for each HDU extension.

1. Frontend sends: **FILE_INFO_REQUEST**

   .. code-block:: protobuf

     directory = "set_QA"
     file = "spire500_ext.fits"
     hdu = ""

2. Backend returns: **FILE_INFO_RESPONSE** (``FileInfoResponse``)

:red-text:`Check 1:` the FILE_INFO_RESPONSE should satisfy:

   - FILE_INFO_RESPONSE.success = True

   - FILE_INFO_RESPONSE.file_info.name = "spire500_ext.fits"

   - FILE_INFO_RESPONSE.file_info.size = 17591040

   - FILE_INFO_RESPONSE.file_info.type = CARTA.FileType.FITS

**For each HDU extension ('1' = "image", '6' = "error", '7' = "coverage"):**

:red-text:`Check 2:` the file_info_extended should satisfy:

   - dimensions = 2

   - width = 830

   - height = 870

   - depth = 1

   - stokes = 1

   - len(computed_entries) = 15

   - Computed entries include: Name, Data type, HDU, Extension name, Shape, Coordinate type, Projection, Image reference pixels, Image reference coords, Image ref coords (deg), Celestial frame, Pixel unit, Pixel increment, RA range, DEC range

   - len(header_entries) = 53

   - Header entries include: XTENSION, BITPIX, NAXIS, NAXIS1, NAXIS2, PCOUNT, GCOUNT, EXTNAME, BUNIT, CRPIX1, CRPIX2, CRVAL1, CRVAL2, CDELT1, CDELT2, CTYPE1, CTYPE2, EQUINOX, CROTA2
