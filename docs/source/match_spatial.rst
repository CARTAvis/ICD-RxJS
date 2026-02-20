Match Spatial & Spectral
------------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Spatial/Spectral Matching workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open reference image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Open matched image
    activate Frontend
    Frontend -> Backend : 3. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 4. OPEN_FILE_ACK
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Set cursor / region
    activate Frontend
    Frontend -> Backend : 5. SET_CURSOR / SET_REGION
    activate Backend
    Frontend -> Backend : 6. SET_SPATIAL_REQUIREMENTS / SET_STATS_REQUIREMENTS
    Frontend <--[#red] Backend : <font color="red">7. SPATIAL_PROFILE_DATA / REGION_STATS_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays matched results
    deactivate Frontend

MATCH_SPATIAL
~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_SPATIAL.test.ts>`__.

This test verifies cursor value and spatial profile consistency with spatially matched images across 4 related image files.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 4 images

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 100
     file = "HD163296_13CO_2-1.fits", file_id = 101
     file = "HD163296_C18O_2-1.fits", file_id = 102
     file = "HD163296_CO_2_1.image", file_id = 103

2. Frontend sends: **SET_CURSOR** (``SetCursor``) at (200.0, 200.0)

3. Frontend sends: **SET_SPATIAL_REQUIREMENTS** (``SetSpatialRequirements``) for x and y coordinates

4. Backend returns: **SPATIAL_PROFILE_DATA** (``SpatialProfileData``) for all images

:red-text:`Check 1:` the spatial profile data should satisfy:

   - Cursor value for fileId 100 = -0.0023265306372195482

   - Spatial profile data matches across all 4 images with 4 decimal precision

   - x coordinate raw profile values at indices [0, 500, 1000, 1500] = [36, 242, 86, 48]

   - y coordinate raw profile values at indices [0, 500, 1000, 1500] = [84, 163, 231, 66]

   - Profiles array has end = 432 for both x and y

MATCH_SPECTRAL
~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_SPECTRAL.test.ts>`__.

This test verifies region spectral profile consistency with spatially and spectrally matched images.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 4 images (same as MATCH_SPATIAL)

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 100
     file = "HD163296_13CO_2-1.fits", file_id = 101
     file = "HD163296_C18O_2-1.fits", file_id = 102
     file = "HD163296_CO_2_1.image", file_id = 103

2. Frontend sends: **SET_REGION** (``SetRegion``) with an ellipse region

   .. code-block:: protobuf

     region_type = ELLIPSE
     rotation = 0

3. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     coordinate = "z"
     stats_type = Mean

4. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``)

:red-text:`Check 1:` the spectral profile data should satisfy:

   - Spectral profiles from fileId 100 (FITS) equal to fileId 103 (CASA image)

5. Frontend sends: **SET_REGION** with updated rotation = 30 degrees

:red-text:`Check 2:` after region rotation:

   - Spectral profiles remain equal between matched files

MATCH_STATS
~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS.test.ts>`__.

This test verifies region statistics consistency between FITS and CASA format images using 4 different region shapes.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 2 images

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 100
     file = "HD163296_CO_2_1.image", file_id = 101

2. Frontend creates 4 regions:

   Region 1 (Rectangle, rotation 0):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 250, y: 200}, {x: 300, y: 300}]
     rotation = 0

   Region 2 (Rectangle, rotation 25):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 354, y: 343}, {x: 100, y: 150}]
     rotation = 25

   Region 3 (Circle, rotation 25):

   .. code-block:: protobuf

     region_type = CIRCLE
     control_points = [{x: 150, y: 150}, {x: 60, y: 100}]
     rotation = 25

   Region 4 (Polygon):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 100, y: 150}, {x: 400, y: 400}, {x: 300, y: 30}]

3. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetStatsRequirements``) for each region

   .. code-block:: protobuf

     coordinate = "z"
     stats_types = [NumPixels, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max]

:red-text:`Check 1:` for each of the 4 regions:

   - All 9 stat types match between FITS and CASA image with 4 decimal precision
   - NaN values handled correctly via Object.is() comparison

MATCH_STATS_BORDERLINE
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS_BORDERLINE.test.ts>`__.

This test verifies region statistics with regions that extend to or beyond image boundaries.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 2 images

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 0
     file = "HD163296_CO_2_1.image", file_id = 1

2. Frontend creates 4 borderline regions touching/crossing image edges

   Region 3 (Circle at boundary):

   .. code-block:: protobuf

     region_type = CIRCLE
     control_points = [{x: 110, y: 250}, {x: 100, y: 200}]
     rotation = 45

   Region 4 (Polygon extending beyond edges):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 100, y: 150}, {x: 429, y: 429}, {x: 300, y: 30}]

:red-text:`Check 1:` for each of the 4 regions:

   - All 9 stat types match between FITS and CASA image with 4 decimal precision
   - NaN values handled correctly

MATCH_STATS_WIDE
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS_WIDE.test.ts>`__.

This test verifies region statistics with wide-field astronomical images across FITS and CASA formats.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 2 wide-field images

   .. code-block:: protobuf

     file = "casa_wideField.fits", file_id = 0
     file = "casa_wideField.image", file_id = 1

2. Frontend creates 4 regions with wide-field coordinates

   Region 1 (Rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 400, y: 1800}, {x: 800, y: 800}]
     rotation = 0

   Region 2 (Rectangle, rotated):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 1800, y: 800}, {x: 1000, y: 1000}]
     rotation = 45

   Region 3 (Circle):

   .. code-block:: protobuf

     region_type = CIRCLE
     control_points = [{x: 1800, y: 1300}, {x: 230, y: 300}]
     rotation = 22

   Region 4 (Polygon):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 3300, y: 1300}, {x: 3400, y: 120}, {x: 2200, y: 100}]

:red-text:`Check 1:` all 9 stat types match between FITS and CASA with 4 decimal precision

MATCH_STATS_WIDE_BORDERLINE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS_WIDE_BORDERLINE.test.ts>`__.

This test verifies region statistics with wide-field images where regions cross boundaries, with special handling for boundary pixel differences.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 2 wide-field images

   .. code-block:: protobuf

     file = "casa_wideField.fits", file_id = 0
     file = "casa_wideField.image", file_id = 1

2. Frontend creates 4 borderline regions extending beyond wide-field image edges

   Region 4 (Polygon beyond edges):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 3500, y: 1300}, {x: 3599, y: -1.5}, {x: 2200, y: 100}]

:red-text:`Check 1:` the statistics comparison should satisfy:

   - NumPixels: allows difference <= 2 pixels at boundaries (accounts for rasterization differences)
   - Other stat types: match with 4 decimal precision
   - NaN values handled correctly
