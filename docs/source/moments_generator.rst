Moments Generator
-----------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Moments Generator workflow

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
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Set region & spectral requirements
    activate Frontend
    Frontend -> Backend : 3. SET_REGION
    Frontend -> Backend : 4. SET_SPECTRAL_REQUIREMENTS
    activate Backend
    Frontend <-- Backend : 5. SET_REGION_ACK
    Frontend <-- Backend : 6. SPECTRAL_PROFILE_DATA
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Request moment generation
    activate Frontend
    Frontend -> Backend : 7. MOMENT_REQUEST
    activate Backend
    Frontend <-- Backend : 8. MOMENT_PROGRESS (stream)
    Frontend <--[#red] Backend : <font color="red">9. MOMENT_RESPONSE [Check]</font>
    Frontend <-- Backend : 10. REGION_HISTOGRAM_DATA (per moment)
    deactivate Backend
    User <-- Frontend: Displays moment images
    deactivate Frontend

MOMENTS_GENERATOR_FITS
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MOMENTS_GENERATOR_FITS.test.ts>`__.

This test verifies generation of all 13 moment types on a FITS image, checking the moment response metadata and the resulting raster tile data for each generated moment image.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     hdu = ""
     file_id = 200
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.fits"

4. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 200
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 218, y: 218}, {x: 200, y: 200}]
     rotation = 0

5. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     file_id = 200
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Sum]}]

6. Backend returns: **SET_REGION_ACK** and **SPECTRAL_PROFILE_DATA**

7. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``)

   .. code-block:: protobuf

     file_id = 200
     region_id = 1
     axis = SPECTRAL
     mask = Include
     moments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
     pixel_range = {min: 0.1, max: 1.0}
     spectral_range = {min: 73, max: 114}
     rest_freq = 230538000000

8. Backend streams: **MOMENT_PROGRESS** and returns **MOMENT_RESPONSE** (``MomentResponse``) with 13 **REGION_HISTOGRAM_DATA**

:red-text:`Check 2:` the MOMENT_RESPONSE should satisfy:

   - MOMENT_RESPONSE.success = True
   - MOMENT_RESPONSE.openFileAcks.length = 13
   - All openFileAcks[].success = True
   - All openFileAcks[].fileId > 0

:red-text:`Check 3:` each openFileAcks[] should satisfy:

   - fileInfo.name = "HD163296_CO_2_1.fits.moment.<moment_name>"
   - Moment names: average, integrated, weighted_coord, weighted_dispersion_coord, median, median_coord, standard_deviation, rms, abs_mean_dev, maximum, maximum_coord, minimum, minimum_coord

:red-text:`Check 4:` each openFileAcks[].fileInfoExtended should satisfy:

   .. code-block:: protobuf

     height = 201
     width = 201
     dimensions = 4
     depth = 1
     stokes = 1
     header_entries.length = 85
     computed_entries.length = 21

9. Frontend sends: **ADD_REQUIRED_TILES** for each moment image

10. Backend returns: **RASTER_TILE_DATA** for each moment image

:red-text:`Check 5:` each RASTER_TILE_DATA should satisfy:

    - tiles[0].height = 201
    - tiles[0].width = 201
    - tiles[0].imageData.length matches expected values per moment type
    - tiles[0].nanEncodings.length matches expected values
    - Specific imageData byte values at indices 5000, 10000, 20000, 30000 should match expected values

MOMENTS_GENERATOR_CASA
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MOMENTS_GENERATOR_CASA.test.ts>`__.

This test is identical in structure to MOMENTS_GENERATOR_FITS, but uses a CASA image file (.image) instead of FITS. It verifies that moment generation produces the same results regardless of file format.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.image"
     file_id = 200
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.image"

3-10. Same workflow as MOMENTS_GENERATOR_FITS

:red-text:`Checks 2-5:` same assertions as MOMENTS_GENERATOR_FITS

MOMENTS_GENERATOR_HDF5
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MOMENTS_GENERATOR_HDF5.test.ts>`__.

This test is identical in structure to MOMENTS_GENERATOR_FITS, but uses an HDF5 image file (.hdf5) instead of FITS. It verifies that moment generation produces the same results regardless of file format.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.hdf5"
     file_id = 200
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.hdf5"

3-10. Same workflow as MOMENTS_GENERATOR_FITS

:red-text:`Checks 2-5:` same assertions as MOMENTS_GENERATOR_FITS, except:

   - headerEntries.length = 90 (instead of 85 for HDF5 format)

MOMENTS_GENERATOR_CANCEL
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MOMENTS_GENERATOR_CANCEL.test.ts>`__.

This test verifies that an in-progress moment generation request can be cancelled, and that a subsequent moment request still succeeds.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     hdu = ""
     file_id = 200
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.fits"

**Step 1: Request moment generation, then cancel**

4. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``)

   .. code-block:: protobuf

     file_id = 200
     region_id = 0
     axis = SPECTRAL
     mask = Include
     moments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
     pixel_range = {min: 0.1, max: 1.0}
     spectral_range = {min: 73, max: 114}
     rest_freq = 230538000000

5. Backend streams: **MOMENT_PROGRESS** (``MomentProgress``)

6. After receiving 5 progress updates, Frontend sends: **STOP_MOMENT_CALC** (``StopMomentCalc``)

   .. code-block:: protobuf

     file_id = 200

:red-text:`Check 2:` the MOMENT_PROGRESS should satisfy:

   - All progress values < 1.0

:red-text:`Check 3:` after cancellation:

   - No additional messages should arrive within 500 ms
   - Connection should remain ACTIVE

:red-text:`Check 4:` the MOMENT_RESPONSE should satisfy:

   - MOMENT_RESPONSE.success = True
   - MOMENT_RESPONSE.cancel = True
   - MOMENT_RESPONSE.openFileAcks = [] (empty)

**Step 2: Request moment generation again and let it complete**

7. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``) for moment type 12 only

   .. code-block:: protobuf

     file_id = 200
     moments = [12]

8. Backend returns: **MOMENT_RESPONSE** (``MomentResponse``)

:red-text:`Check 5:` the MOMENT_RESPONSE should satisfy:

   - MOMENT_RESPONSE.success = True
   - openFileAcks[0].fileInfo.name = "HD163296_CO_2_1.fits.moment.minimum_coord"
   - openFileAcks[0].fileInfoExtended.height = 432
   - openFileAcks[0].fileInfoExtended.width = 432
   - openFileAcks[0].fileInfoExtended.dimensions = 4
   - openFileAcks[0].fileInfoExtended.depth = 1
   - openFileAcks[0].fileInfoExtended.stokes = 1

MOMENTS_GENERATOR_EXCEPTION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MOMENTS_GENERATOR_EXCEPTION.test.ts>`__.

This test verifies that the moments generator handles edge cases correctly: requesting moments with an invalid region (regionId = -1), then re-requesting with a valid configuration, and finally verifying that the backend remains responsive by requesting spatial profile data.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "HD163296_CO_2_1.fits"

**Step 1: Request 3 moment images with regionId = -1**

4. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     axis = SPECTRAL
     mask = Include
     moments = [1, 0, 2]
     pixel_range = {min: 0.1, max: 1.0}
     spectral_range = {min: 73, max: 114}
     rest_freq = 230538000000

5. Backend returns: 3 **REGION_HISTOGRAM_DATA** and **MOMENT_RESPONSE**

**Step 2: Request 2 moment images again (replacing previous)**

6. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     moments = [0, 1]

7. Backend returns: **MOMENT_PROGRESS**, 2 **REGION_HISTOGRAM_DATA**, and **MOMENT_RESPONSE**

:red-text:`Check 2:` the MOMENT_RESPONSE should satisfy:

   - MOMENT_RESPONSE.success = True
   - MOMENT_RESPONSE.openFileAcks.length = 2
   - All openFileAcks[].success = True

**Step 3: Request image data and verify backend is responsive**

8. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR** for a moment image

9. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 3:` the SPATIAL_PROFILE_DATA should satisfy:

   - SpatialProfileData[0].value = 1.8132938 (precision = 4 digits)
   - Backend connection should remain ACTIVE

MOMENTS_GENERATOR_SAVE
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MOMENTS_GENERATOR_SAVE.test.ts>`__.

This test verifies that generated moment images can be saved to disk in both FITS and CASA formats.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

4. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     axis = SPECTRAL
     mask = Include
     moments = [0, 1]
     pixel_range = {min: 0.1, max: 1.0}
     spectral_range = {min: 73, max: 114}
     rest_freq = 230538000000

5. Backend returns: **MOMENT_RESPONSE** and **REGION_HISTOGRAM_DATA**

:red-text:`Check 2:` the MOMENT_RESPONSE should satisfy:

   - MOMENT_RESPONSE.success = True
   - MOMENT_RESPONSE.openFileAcks.length = 2
   - All openFileAcks[].success = True

**Save as FITS:**

6. Frontend sends: **SAVE_FILE** (``SaveFile``) for each moment image

   .. code-block:: protobuf

     output_file_name = "HD163296_CO_2_1.fits.moment.average.fits"
     output_file_type = FITS

   .. code-block:: protobuf

     output_file_name = "HD163296_CO_2_1.fits.moment.integrated.fits"
     output_file_type = FITS

:red-text:`Check 3:` all SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = True

**Save as CASA:**

7. Frontend sends: **SAVE_FILE** (``SaveFile``) for each moment image

   .. code-block:: protobuf

     output_file_name = "HD163296_CO_2_1.fits.moment.average.image"
     output_file_type = CASA

   .. code-block:: protobuf

     output_file_name = "HD163296_CO_2_1.fits.moment.integrated.image"
     output_file_type = CASA

:red-text:`Check 4:` all SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = True
