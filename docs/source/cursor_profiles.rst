Cursor Profiles
---------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Cursor profile workflow

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
    Frontend <-- Backend : 4. RASTER_TILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Set cursor position
    activate Frontend
    Frontend -> Backend : 5. SET_CURSOR
    activate Backend
    Frontend -> Backend : 6. SET_SPATIAL_REQUIREMENTS
    Frontend <--[#red] Backend : <font color="red">7. SPATIAL_PROFILE_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays spatial profile
    deactivate Frontend

    User -> Frontend: Request spectral profile
    activate Frontend
    Frontend -> Backend : 8. SET_SPECTRAL_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">9. SPECTRAL_PROFILE_DATA [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays spectral profile
    deactivate Frontend

CURSOR_SPATIAL_PROFILE
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CURSOR_SPATIAL_PROFILE.test.ts>`__.

This test verifies that full resolution cursor spatial profiles are delivered correctly.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "qa_xyProfiler.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "qa_xyProfiler.fits"

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 51, y: 51}

6. Frontend sends: **SET_SPATIAL_REQUIREMENTS** (``SetSpatialRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     spatial_profiles = [{coordinate: "x", mip: 1}, {coordinate: "y", mip: 1}]

7. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

**Center cursor positions (near pixel 50, 50)**

8. Frontend sends: **SET_CURSOR** for 5 positions near the center:

   .. code-block:: protobuf

     point = {x: 50.0, y: 50.0}
     point = {x: 49.5, y: 49.5}
     point = {x: 49.5, y: 50.49}
     point = {x: 50.49, y: 49.5}
     point = {x: 50.49, y: 50.49}

:red-text:`Check 3:` for each center cursor position, SPATIAL_PROFILE_DATA should satisfy:

   - Should arrive within 3000 ms

   - value = 1

   - x = 50.0, y = 50.0 (pixel coordinates snap to integer)

   - rawValuesFp32 length in x = 400, rawValuesFp32 length in y = 400

   - rawValuesFp32 values at specific indices should match expected byte values

**Corner cursor positions**

9. Frontend sends: **SET_CURSOR** for 4 corner positions:

   .. code-block:: protobuf

     point = {x: 0.0, y: 0.0}
     point = {x: 0.0, y: 99.0}
     point = {x: 99.0, y: 0.0}
     point = {x: 99.0, y: 99.0}

:red-text:`Check 4:` for each corner cursor position, SPATIAL_PROFILE_DATA should satisfy:

   - Should arrive within 3000 ms

   - rawValuesFp32 length in x = 400, rawValuesFp32 length in y = 400

   - Corner (0, 0): value = 1
   - Corner (0, 99): value = 0
   - Corner (99, 0): value = 0
   - Corner (99, 99): value = 1

   - rawValuesFp32 values at specific indices should match expected byte values

**Out-of-bounds cursor position**

10. Frontend sends: **SET_CURSOR** to an invalid position:

    .. code-block:: protobuf

      file_id = 0
      point = {x: 200.0, y: 200.0}

:red-text:`Check 5:` the backend should handle the out-of-bounds cursor:

    - No SPATIAL_PROFILE_DATA should be returned (no additional messages within 1000 ms)

    - The backend should remain alive (FILE_LIST_RESPONSE.success = True)

CURSOR_SPATIAL_PROFILE_NaN
~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CURSOR_SPATIAL_PROFILE_NaN.test.ts>`__.

This test verifies that full resolution cursor spatial profiles with NaN data are delivered correctly.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.fits"

4. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 321, y: 401}
     spatial_profiles = [{coordinate: "x", mip: 1}, {coordinate: "y", mip: 1}]

5. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

**Case 1: Cursor at position with valid data**

6. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 314.0, y: 393.0}

:red-text:`Check 3:` the SPATIAL_PROFILE_DATA should satisfy:

   - Should arrive within 3000 ms

   .. code-block:: protobuf

     x = 314.0
     y = 393.0
     value = -0.004026404581964016 (precision < 4 digits)

   - rawValuesFp32 length in x = 2560 (640 pixels * 4 bytes)
   - rawValuesFp32 length in y = 3200 (800 pixels * 4 bytes)

   - rawValuesFp32 values at specific indices should match expected byte values

**Case 2: Cursor at position with NaN data**

7. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 596.0, y: 292.0}

:red-text:`Check 4:` the SPATIAL_PROFILE_DATA should satisfy:

   - Should arrive within 3000 ms

   .. code-block:: protobuf

     x = 596.0
     y = 292.0
     value = NaN

   - rawValuesFp32 length in x = 2560
   - rawValuesFp32 length in y = 3200

   - rawValuesFp32 values at specific indices should match expected byte values

CURSOR_SPECTRAL_PROFILE
~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CURSOR_SPECTRAL_PROFILE.test.ts>`__.

This test verifies that full resolution cursor spectral profiles are delivered correctly, comparing results across CASA IMAGE and HDF5 formats.

**File 1: CASA IMAGE format**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.image"

4. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 316.0, y: 401.0}

5. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     spectral_profiles = [{coordinate: "z", stats_types: [Sum]}]

6. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``)

:red-text:`Check 2:` the SPECTRAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     stokes = 0
     progress = 1
     profiles.length = 1
     profiles[0].coordinate = "z"
     profiles[0].stats_type = Sum

   - rawValuesFp32 length = 100 (25 channels * 4 bytes)

   - rawValuesFp32 values at indices [0, 25, 50, 75, 99] = [99, 250, 179, 58, 58]

**Cursor at NaN position (File 1)**

7. Frontend sends: **SET_CURSOR** and **SET_SPECTRAL_REQUIREMENTS** at NaN position

   .. code-block:: protobuf

     point = {x: 106, y: 135}

:red-text:`Check 3:` the SPECTRAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     stokes = 0
     progress = 1

   - rawValuesFp32 length = 100

   - rawValuesFp32 values at indices [0, 25, 50, 75, 99] = [0, 0, 192, 127, 127]

**File 2: HDF5 format**

8. Frontend sends: **CLOSE_FILE** and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.hdf5"
     hdu = "0"
     file_id = 1
     render_mode = RASTER

9. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 4:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.hdf5"

10. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPECTRAL_REQUIREMENTS**

    .. code-block:: protobuf

      file_id = 1
      tiles = [0]
      point = {x: 316.0, y: 401.0}
      spectral_profiles = [{coordinate: "z", stats_types: [Sum]}]

:red-text:`Check 5:` the SPECTRAL_PROFILE_DATA should satisfy:

    .. code-block:: protobuf

      file_id = 1
      region_id = 0
      stokes = 0
      progress = 1

    - rawValuesFp32 length = 100

    - rawValuesFp32 values at indices [0, 25, 50, 75, 99] = [99, 250, 179, 58, 58] (same as CASA IMAGE)

**Cursor at NaN position (File 2)**

11. Frontend sends: **SET_CURSOR** and **SET_SPECTRAL_REQUIREMENTS** at NaN position

    .. code-block:: protobuf

      point = {x: 106, y: 135}

:red-text:`Check 6:` the SPECTRAL_PROFILE_DATA should satisfy:

    .. code-block:: protobuf

      file_id = 1
      region_id = 0
      stokes = 0
      progress = 1

    - rawValuesFp32 length = 100

    - rawValuesFp32 values at indices [0, 25, 50, 75, 99] = [255, 255, 255, 255, 255]

CURSOR_SPECTRAL_PROFILE_NaN
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CURSOR_SPECTRAL_PROFILE_NaN.test.ts>`__.

This test verifies that full resolution cursor spectral profiles with NaN channels are delivered correctly, comparing results across FITS and HDF5 formats.

**File 1: FITS format**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "HH211_IQU.fits"

4. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1006, y: 478}

5. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     spectral_profiles = [{coordinate: "z", stats_types: [Sum]}]

6. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``)

:red-text:`Check 2:` the SPECTRAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     progress = 1
     profiles.length = 1
     profiles[0].coordinate = "z"
     profiles[0].stats_type = Sum

   - rawValuesFp32 length = 20 (5 channels * 4 bytes)

   - rawValuesFp32 values at indices [0, 5, 10, 15, 19] = [255, 255, 155, 187, 59]

**File 2: HDF5 format**

7. Frontend sends: **CLOSE_FILE** and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.hdf5"
     hdu = "0"
     file_id = 1
     render_mode = RASTER

8. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 3:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "HH211_IQU.hdf5"

9. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPECTRAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 1
     tiles = [0]
     point = {x: 1006, y: 478}
     spectral_profiles = [{coordinate: "z", stats_types: [Sum]}]

:red-text:`Check 4:` the SPECTRAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 1
     region_id = 0
     progress = 1
     profiles.length = 1
     profiles[0].coordinate = "z"
     profiles[0].stats_type = Sum

   - rawValuesFp32 length = 20

   - rawValuesFp32 values at indices [0, 5, 10, 15, 19] = [255, 255, 155, 187, 59] (same as FITS)
