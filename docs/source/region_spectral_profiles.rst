Region Spectral Profiles
------------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Region spectral profile workflow

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
    Frontend <-- Backend : 5. RASTER_TILE_DATA
    Frontend <-- Backend : 5. SPATIAL_PROFILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Draw region
    activate Frontend
    Frontend -> Backend : 6. SET_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">7. SET_REGION_ACK [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays region
    deactivate Frontend

    User -> Frontend: Request spectral profile
    activate Frontend
    Frontend -> Backend : 8. SET_SPECTRAL_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">9. SPECTRAL_PROFILE_DATA [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays spectral profile
    deactivate Frontend

REGION_SPECTRAL_PROFILE_RECTANGLE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_SPECTRAL_PROFILE_RECTANGLE.test.ts>`__.

This test verifies that spectral profiles are computed correctly for rectangle regions, comparing results across CASA IMAGE and HDF5 formats.

**For each file format (M17_SWex.image and M17_SWex.hdf5):**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image" / "M17_SWex.hdf5"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

4. Frontend sends: **SET_REGION** (``SetRegion``) for 4 rectangle regions

   Case 1 (no rotation):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 83, y: 489}, {x: 4, y: 6}]
     rotation = 0.0

   Case 2 (rotated 50 degrees):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 92, y: 522}, {x: 4, y: 6}]
     rotation = 50.0

   Case 3 (sub-pixel size):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 360, y: 490}, {x: 0.5, y: 0.5}]
     rotation = 0.0

   Case 4 (out-of-bounds, rotated):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 0, y: 522}, {x: 4, y: 6}]
     rotation = 50.0

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``) for each region

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True
   - region_id = 1, 2, 3, 4 respectively

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``) for each region

   .. code-block:: protobuf

     file_id = 0
     region_id = <1-4>
     spectral_profiles = [{
         coordinate: "z",
         stats_types: [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max, Extrema]
     }]

7. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``) for each region

:red-text:`Check 3:` the SPECTRAL_PROFILE_DATA should satisfy:

   - Should arrive within 5000 ms

   - Cases 1-3: progress = 1, with valid rawValuesFp64 values at indices [0, 50, 100, 150, 199] matching expected byte arrays for each stats type

   - Case 3 (sub-pixel region): profile length = 25, Sigma values = [0, 0, 0, 0, 0] (single pixel)

   - Case 4 (out-of-bounds): all stats return NaN values

   - Results should be consistent between CASA IMAGE and HDF5 formats (minor differences allowed for RMS and SumSq)

REGION_SPECTRAL_PROFILE_ELLIPSE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_SPECTRAL_PROFILE_ELLIPSE.test.ts>`__.

This test verifies that spectral profiles are computed correctly for ellipse regions, comparing results across CASA IMAGE and HDF5 formats.

**For each file format (M17_SWex.image and M17_SWex.hdf5):**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image" / "M17_SWex.hdf5"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

4. Frontend sends: **SET_REGION** (``SetRegion``) for 2 ellipse regions

   Case 1 (valid region, rotated 30 degrees):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = ELLIPSE
     control_points = [{x: 89, y: 516}, {x: 5, y: 3}]
     rotation = 30.0

   Case 2 (out-of-bounds, rotated 30 degrees):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = ELLIPSE
     control_points = [{x: 0, y: 516}, {x: 5, y: 3}]
     rotation = 30.0

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``) for each region

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True
   - region_id = 1, 2 respectively

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``) for each region

   .. code-block:: protobuf

     file_id = 0
     region_id = <1-2>
     spectral_profiles = [{
         coordinate: "z",
         stats_types: [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max, Extrema]
     }]

7. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``) for each region

:red-text:`Check 3:` the SPECTRAL_PROFILE_DATA should satisfy:

   - Should arrive within 5000 ms

   - Case 1: progress = 1, profile length = 25, with valid rawValuesFp64 values at indices [0, 50, 100, 150, 199] matching expected byte arrays for each stats type

   - Case 2 (out-of-bounds): all stats return NaN values

   - Results should be consistent between CASA IMAGE and HDF5 formats (minor differences allowed for RMS and SumSq)

REGION_SPECTRAL_PROFILE_POLYGON
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_SPECTRAL_PROFILE_POLYGON.test.ts>`__.

This test verifies that spectral profiles are computed correctly for polygon regions, comparing results across CASA IMAGE and HDF5 formats.

**For each file format (M17_SWex.image and M17_SWex.hdf5):**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image" / "M17_SWex.hdf5"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

4. Frontend sends: **SET_REGION** (``SetRegion``) for 2 polygon regions

   Case 1 (valid region):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = POLYGON
     control_points = [{x: 547, y: 284}, {x: 543, y: 279}, {x: 551, y: 275}]
     rotation = 0.0

   Case 2 (out-of-bounds region):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = POLYGON
     control_points = [{x: 647, y: 272}, {x: 630, y: 262}, {x: 648, y: 253}]
     rotation = 0.0

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``) for each region

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True
   - region_id = 1, 2 respectively

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``) for each region

   .. code-block:: protobuf

     file_id = 0
     region_id = <1-2>
     spectral_profiles = [{
         coordinate: "z",
         stats_types: [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max, Extrema]
     }]

7. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``) for each region

:red-text:`Check 3:` the SPECTRAL_PROFILE_DATA should satisfy:

   - Should arrive within 5000 ms

   - Case 1: progress = 1, profile length = 25, with valid rawValuesFp64 values at indices [0, 50, 100, 150, 199] matching expected byte arrays for each stats type

   - Case 2 (out-of-bounds): all stats return NaN values

   - Results should be consistent between CASA IMAGE and HDF5 formats (minor differences allowed for RMS and SumSq)

REGION_SPECTRAL_PROFILE_STOKES
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_SPECTRAL_PROFILE_STOKES.test.ts>`__.

This test verifies that spectral profiles are computed correctly for regions across different Stokes parameters, comparing results across FITS and HDF5 formats.

**For each file format (HH211_IQU.fits and HH211_IQU.hdf5):**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits" / "HH211_IQU.hdf5"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

4. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 522, y: 522}, {x: 10, y: 10}]
     rotation = 0.0

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True
   - region_id = 1

**Case 1: Stokes I spectral profile (coordinate "z")**

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

7. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``)

:red-text:`Check 3:` the SPECTRAL_PROFILE_DATA should satisfy:

   - region_id = 1, progress = 1, profile length = 5

   - rawValuesFp64 values at indices [0, 10, 20, 30, 39] should match expected byte arrays

**Case 2: Change to Stokes Q (stokes = 1)**

8. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``)

   .. code-block:: protobuf

     file_id = 0
     channel = 0
     stokes = 1
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 11}

9. Backend returns: **SPECTRAL_PROFILE_DATA** (auto-updated)

:red-text:`Check 4:` the SPECTRAL_PROFILE_DATA should satisfy:

   - region_id = 1, progress = 1, profile length = 5

   - rawValuesFp64 values at indices [0, 10, 20, 30, 39] should match expected byte arrays (different from Stokes I)

**Case 3: Stokes U spectral profile (coordinate "Uz")**

10. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

    .. code-block:: protobuf

      file_id = 0
      region_id = 1
      spectral_profiles = [{coordinate: "Uz", stats_types: [Mean]}]

11. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``)

:red-text:`Check 5:` the SPECTRAL_PROFILE_DATA should satisfy:

    - region_id = 1, progress = 1, profile length = 5

    - rawValuesFp64 values at indices [0, 10, 20, 30, 39] should match expected byte arrays

**Case 4: Invalid Stokes V spectral profile (coordinate "Vz")**

12. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

    .. code-block:: protobuf

      file_id = 0
      region_id = 1
      spectral_profiles = [{coordinate: "Vz", stats_types: [Mean]}]

13. Backend returns: **ERROR_DATA** (``ErrorData``)

:red-text:`Check 6:` the ERROR_DATA should satisfy:

    .. code-block:: protobuf

      message = "Spectral requirements not valid for region id 1"
      severity = 3
      tags = ["spectral"]
