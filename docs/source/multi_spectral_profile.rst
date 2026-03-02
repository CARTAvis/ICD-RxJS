Multi-Spectral Profile
----------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Multi-Spectral Profile workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open image(s)
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    Frontend <-- Backend : 4. REGION_HISTOGRAM_DATA
    Frontend <-- Backend : 4. RASTER_TILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Define region
    activate Frontend
    Frontend -> Backend : 5. SET_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. SET_REGION_ACK [Check 1]</font>
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Request spectral profile
    activate Frontend
    Frontend -> Backend : 7. SET_SPECTRAL_REQUIREMENTS
    activate Backend

    loop Progress updates
        Frontend <-- Backend : 8. SPECTRAL_PROFILE_DATA (progress < 1)
    end

    Frontend <--[#red] Backend : <font color="red">9. SPECTRAL_PROFILE_DATA (progress=1) [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays spectral profile
    deactivate Frontend

MULTI_SPECTRAL_PROFILE_IMAGE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MULTI-SPECTRAL-PROFILE-IMAGE.test.ts>`__.

This test verifies plotting spectral profiles with two matched images open simultaneously.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 2 images

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 0
     file = "HD163296_13CO_2-1.fits", file_id = 1

2. Backend returns: **OPEN_FILE_ACK** for each file

3. Frontend sends: **SET_CURSOR** at (216, 216) on both files

4. Backend returns: **SPATIAL_PROFILE_DATA**

:red-text:`Check 1:` cursor values should satisfy:

   - fileId 0: value = 0.004661305341869593
   - fileId 1: value = 0.0016310831997543573

5. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 213, y: 277}, {x: 100, y: 100}]
     rotation = 0

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** for each file

   .. code-block:: protobuf

     coordinate = "z"
     stats_type = Mean

7. Backend returns: **SPECTRAL_PROFILE_DATA** for each file

:red-text:`Check 2:` the spectral profile data should satisfy:

   - Progress = 1.0 for both files
   - Raw values at indices [0, 100, 200, 300, 400, 500, 600, 700, 800] = [101, 95, 225, 189, 117, 237, 74, 88, 52]

MULTI_SPECTRAL_PROFILE_POLARIZATION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MULTI-SPECTRAL-PROFILE-POLARIZATION.test.ts>`__.

This test verifies plotting multiple Stokes polarization components (I, Q, U) within a single region.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 520, y: 520}, {x: 100, y: 100}]
     rotation = 0

:red-text:`Check 1:` SET_REGION_ACK.success = True, regionId = 1

3. Frontend sends sequential **SET_SPECTRAL_REQUIREMENTS** requests to build up the Stokes profile set:

   Request 1: Stokes I only

   .. code-block:: protobuf

     coordinate = "Iz"
     stats_type = Mean

   Request 2: Stokes Q + I

   .. code-block:: protobuf

     coordinates = ["Qz", "Iz"]
     stats_types = [Mean]

   Request 3: Stokes U + Q + I

   .. code-block:: protobuf

     coordinates = ["Uz", "Qz", "Iz"]
     stats_types = [Mean, Mean, Mean]

:red-text:`Check 2:` the raw spectral profile values at indices [0, 5, 10, 15, 20, 25, 30, 35, 39]:

   - Iz: [202, 58, 229, 63, 220, 156, 70, 189, 63]
   - Qz: [10, 1, 168, 190, 232, 120, 204, 28, 190]
   - Uz: [211, 167, 75, 62, 249, 74, 233, 192, 63]

MULTI_SPECTRAL_PROFILE_REGION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MULTI-SPECTRAL-PROFILE-REGION.test.ts>`__.

This test verifies plotting spectral profiles from two different regions within the same image.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``) for 2 regions

   Region 1:

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 210, y: 220}, {x: 50, y: 50}]

   Region 2:

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 150, y: 170}, {x: 35, y: 35}]

3. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** for each region

   .. code-block:: protobuf

     coordinate = "z"
     stats_type = Mean

4. Backend returns: **SPECTRAL_PROFILE_DATA** for each region

:red-text:`Check 1:` the spectral profile data should satisfy:

   - Both regions reach progress = 1.0
   - regionId matches in spectral responses

:red-text:`Check 2:` raw values at indices [0, 100, 300, 900, 1200, 1500, 1800, 1900, 1999]:

   - Region 2: [116, 88, 207, 169, 228, 162, 0, 0, 0]
   - Region 1: [232, 201, 141, 49, 140, 163, 0, 0, 0]

MULTI_SPECTRAL_PROFILE_STATISTIC
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MULTI-SPECTRAL-PROFILE-STATISTIC.test.ts>`__.

This test verifies plotting multiple statistical measurements (Mean, RMS, Sigma) for the same spectral coordinate.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 210, y: 220}, {x: 100, y: 100}]
     rotation = 0

3. Frontend sends sequential **SET_SPECTRAL_REQUIREMENTS** with different stats:

   Request 1:

   .. code-block:: protobuf

     coordinate = "z"
     stats_type = Mean

   Request 2:

   .. code-block:: protobuf

     coordinate = "z"
     stats_type = RMS

   Request 3:

   .. code-block:: protobuf

     coordinate = "z"
     stats_types = [RMS, Sigma]

4. Backend returns: **SPECTRAL_PROFILE_DATA** for each request

:red-text:`Check 1:` raw values at indices [0, 300, 600, 900, 1000, 1200, 1500, 1800, 1900]:

   - Mean: [137, 109, 45, 117, 155, 140, 36, 0, 0]
   - RMS: [125, 53, 60, 185, 122, 183, 124, 0, 0]
   - Sigma: [25, 80, 41, 210, 250, 176, 70, 0, 0]
