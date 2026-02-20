PV Generator
------------

.. uml::

    skinparam style strictuml
    hide footbox
    title PV Generator workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    Frontend -> Backend : 4. SET_CURSOR
    Frontend <-- Backend : 5. REGION_HISTOGRAM_DATA
    Frontend <-- Backend : 5. SPATIAL_PROFILE_DATA
    Frontend <-- Backend : 5. RASTER_TILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Draw PV line
    activate Frontend
    Frontend -> Backend : 6. SET_REGION (LINE)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">7. SET_REGION_ACK [Check 1]</font>
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Generate PV image
    activate Frontend
    Frontend -> Backend : 8. PV_REQUEST
    activate Backend

    loop Progress updates
        Frontend <-- Backend : 9. PV_PROGRESS
    end

    Frontend <--[#red] Backend : <font color="red">10. PV_RESPONSE [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays PV image
    deactivate Frontend

PV_GENERATOR_FITS
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_FITS.test.ts>`__.

This test verifies PV (Position-Velocity) image generation from a FITS format image cube.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.fits"

3. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

4. Frontend sends: **SET_SPATIAL_REQUIREMENTS** (``SetSpatialRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     spatial_profiles = [{coordinate: "x", mip: 1}, {coordinate: "y", mip: 1}]

5. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = LINE
     control_points = [{x: 79, y: 77}, {x: 362, y: 360}]
     rotation = 135

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True
   - SET_REGION_ACK.region_id = 1

6. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     width = 3

7. Backend returns: **PV_RESPONSE** (``PvResponse``) with the generated PV image

:red-text:`Check 3:` the PV_RESPONSE should satisfy:

   - PV_RESPONSE.success = True
   - PV_RESPONSE.openFileAck.fileInfo.name = "HD163296_CO_2_1_pv.fits"

8. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for the PV image

9. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``)

:red-text:`Check 4:` the RASTER_TILE_DATA should satisfy:

   - Tile width = 145 or 256
   - Image data at indices [0, 2500, 5000, 7500, 10000, 15000, 20000, 25000] = [241, 125, 53, 100, 216, 50, 129, 121]

PV_GENERATOR_CASA
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_CASA.test.ts>`__.

This test verifies PV image generation from a CASA format image cube with identical parameters and expected results as the FITS test.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.image"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.image"

3-6. Same LINE region and PV request steps as PV_GENERATOR_FITS

:red-text:`Check 2:` the PV_RESPONSE and tile data should match the same expected values as the FITS test

PV_GENERATOR_HDF5_COMPARED_FITS
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_HDF5_COMPARED_FITS.test.ts>`__.

This test compares PV generator output between HDF5 and FITS files of the same astronomical data to verify format-independent consistency.

**Part 1: HDF5 file**

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.hdf5"
     file_id = 0
     render_mode = RASTER

2-6. Same LINE region and PV request steps

**Part 2: FITS file**

7. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 2
     render_mode = RASTER

8-12. Same LINE region and PV request steps for the FITS file

:red-text:`Check 1:` the comparison should satisfy:

   - Both PV images generate successfully
   - Spatial profile values from HDF5 PV image match FITS PV image exactly

PV_GENERATOR_CANCEL
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_CANCEL.test.ts>`__.

This test verifies PV generation cancellation and subsequent retry behavior.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sets up cursor, tiles, spatial requirements, and LINE region (same as PV_GENERATOR_FITS)

3. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     width = 3

4. After receiving 3 progress events, Frontend sends: **STOP_PV_CALC** (``StopPvCalc``)

   .. code-block:: protobuf

     file_id = 0

:red-text:`Check 1:` the cancellation should satisfy:

   - PV_RESPONSE returns error containing "PV image generator cancelled"

5. After a 5-second wait, Frontend retries: **PV_REQUEST** (``PvRequest``) with same parameters

:red-text:`Check 2:` the retry should satisfy:

   - PV_RESPONSE.success = True
   - Tile data matches expected values

PV_GENERATOR_NaN
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_NaN.test.ts>`__.

This test verifies PV generator handling of NaN values and pixels outside valid regions.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = LINE
     control_points = [{x: -54, y: 325}, {x: 206, y: 325}]
     rotation = 90

3. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     width = 3

:red-text:`Check 1:` the PV tile data should satisfy:

   - Tile dimensions: width = 5, height = 25 (or width = 256, height = 25)
   - Image data at NaN region indices = [0, 0, 0, 0, 0, 0, 0, 0]

:red-text:`Check 2:` cursor values in the PV image should satisfy:

   - Cursor at (260, 11): SpatialProfileData.value = NaN
   - Cursor at (64, 8): SpatialProfileData.value = -0.0035615740343928337

PV_GENERATOR_WIDE
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_WIDE.test.ts>`__.

This test verifies PV generator with wide (all-sky) images using two different LINE regions.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "Gaussian-cutted.fits"
     file_id = 0
     render_mode = RASTER

**Region 1:**

2. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_type = LINE
     control_points = [{x: 74, y: 190}, {x: 164, y: 190}]
     rotation = 90

3. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     width = 3

:red-text:`Check 1:` the first PV response should satisfy:

   - openFileAck.fileId = 1
   - fileInfo.name = "Gaussian-cutted_pv.fits"
   - fileInfoExtended.height = 16, width = 182
   - progress = 1

**Region 2:**

4. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_type = LINE
     control_points = [{x: 769, y: 190}, {x: 859, y: 190}]
     rotation = 90

5. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 2
     width = 3

:red-text:`Check 2:` the second PV response should satisfy:

   - openFileAck.fileId = 2
   - fileInfo.name = "Gaussian-cutted_pv.fits"
   - fileInfoExtended.height = 16, width = 94
   - progress = 1

PV_GENERATOR_MATCH_SPATIAL
~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_GENERATOR_MATCH_SPATIAL.test.ts>`__.

This test verifies PV generator with two spatially matched images and compares their spatial profile data.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two images

   File 1:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 0
     render_mode = RASTER

   File 2:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.image"
     file_id = 1
     render_mode = RASTER

2. Frontend creates identical LINE regions on both files and generates PV images

:red-text:`Check 1:` the PV responses should satisfy:

   - First PV: openFileAck.fileId = 2, fileInfo.name = "HD163296_CO_2_1_pv.fits"
   - Second PV: openFileAck.fileId = 3, fileInfo.name = "HD163296_CO_2_1_pv.image"

:red-text:`Check 2:` the spatial profile data should satisfy:

   - SpatialProfileData.end = 400
   - lineAxis.cdelt = 0.05000000074505806, crpix = 200
   - Profile values at indices [100, 500, 1000, 1500] = [85, 10, 220, 106]

PV_PREVIEW
~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_PREVIEW.test.ts>`__.

This test verifies PV preview functionality (streaming preview data during PV generation) with FITS, CASA, and HDF5 files.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for each of 3 file formats (FITS, CASA, HDF5)

2. Frontend sends: **SET_REGION** (``SetRegion``) with LINE region

3. Frontend sends: **PV_REQUEST** (``PvRequest``) with preview settings

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     width = 3
     spectral_range = {min: 0, max: 249}
     preview_settings = {
         preview_id: 0,
         rebin_xy: 1,
         rebin_z: 1,
         animation_compression_quality: 9,
         image_compression_quality: 11
     }

:red-text:`Check 1:` the PV preview response should satisfy:

   - pvResponse.success = True
   - previewData.compressionQuality = 11, compressionType = ZFP
   - previewData.height = 250, width = 401

:red-text:`Check 2:` the preview histogram should satisfy:

   - binWidth approximately 0.00226
   - numBins = 316
   - mean approximately 0.00434
   - stdDev approximately 0.04024
   - bounds: max approximately 0.6663, min approximately -0.0484

4. Frontend moves region with previewRegion = true and verifies updated preview stream

5. Frontend sends: **CLOSE_PV_PREVIEW** (``ClosePvPreview``)

   .. code-block:: protobuf

     preview_id = 0

:red-text:`Check 3:` after closing preview, no additional preview messages should be received within 1000 ms

PV_PREVIEW_CANCEL
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PV_PREVIEW_CANCEL.test.ts>`__.

This test verifies cancellation of PV preview requests.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "S255_IR_sci.spw25.cube.I.pbcor.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** and **PV_REQUEST** with preview settings (rebinXy: 4, rebinZ: 4, width: 5)

3. On first progress event, Frontend sends: **CANCEL_REQUESTING_PV** and **STOP_PV_PREVIEW**

:red-text:`Check 1:` the cancellation should satisfy:

   - PV request throws error containing "PV image preview cancelled"
   - pvProgressData[0].progress < 1 (cancelled before completion)
