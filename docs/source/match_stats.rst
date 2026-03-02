Match Stats
-----------

.. uml::

    skinparam style strictuml
    hide footbox
    title Match Stats workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open matched images
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE (x2)
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK (x2)
    deactivate Backend
    User <-- Frontend: Images loaded
    deactivate Frontend

    User -> Frontend: Set regions
    activate Frontend
    Frontend -> Backend : 3. SET_REGION (x4)
    activate Backend
    Frontend <-- Backend : 4. SET_REGION_ACK (x4)
    deactivate Backend

    Frontend -> Backend : 5. SET_STATS_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. REGION_STATS_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Stats displayed
    deactivate Frontend

MATCH_STATS
~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS.test.ts>`__.

This test verifies that region statistics are consistent between spatially and spectrally matched FITS and CASA images using various region types (rectangle, ellipse, polygon).

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 100
     file = "HD163296_CO_2_1.image", file_id = 101

2. Backend returns: **OPEN_FILE_ACK** for each file

3. Frontend sends: **SET_REGION** (``SetRegion``) for 4 regions on file 100

   Region 1 (Rectangle):

   .. code-block:: protobuf

     region_id = 1
     region_type = RECTANGLE
     control_points = [{x: 250, y: 200}, {x: 300, y: 300}]
     rotation = 0

   Region 2 (Rotated Rectangle):

   .. code-block:: protobuf

     region_id = 2
     region_type = RECTANGLE
     control_points = [{x: 350, y: 350}, {x: 100, y: 150}]
     rotation = 25

   Region 3 (Ellipse):

   .. code-block:: protobuf

     region_id = 3
     region_type = ELLIPSE
     control_points = [{x: 150, y: 150}, {x: 60, y: 100}]
     rotation = 25

   Region 4 (Polygon):

   .. code-block:: protobuf

     region_id = 4
     region_type = POLYGON
     control_points = [{x: 100, y: 150}, {x: 400, y: 400}, {x: 300, y: 30}]

4. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetStatsRequirements``) for each region on both files

   .. code-block:: protobuf

     file_id = <100 or 101>
     region_id = <1-4>
     stats_types = [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max]
     coordinate = "z"

5. Backend returns: **REGION_STATS_DATA** (``RegionStatsData``) for each region/file combination

:red-text:`Check 1:` the REGION_STATS_DATA should satisfy:

   - Each response has statistics.length > 0

   - For each of the 4 regions, and for each of the 9 stats types: the value for file 100 (FITS) should be equal to the value for file 101 (CASA) within precision of 4 digits

   - If either value is NaN, both must be NaN

MATCH_STATS_BORDERLINE
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS_BORDERLINE.test.ts>`__.

This test verifies region statistics consistency between FITS and CASA images when regions are positioned at or near image boundaries.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 0
     file = "HD163296_CO_2_1.image", file_id = 1

2. Frontend sends: **SET_REGION** (``SetRegion``) for 4 boundary regions on file 0

   Region 1 (Rectangle at boundary):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 200, y: 150}, {x: 300, y: 300}]
     rotation = 0

   Region 2 (Rotated Rectangle at boundary):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 354, y: 343}, {x: 100, y: 150}]
     rotation = 25

   Region 3 (Ellipse at boundary):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 110, y: 250}, {x: 100, y: 200}]
     rotation = 45

   Region 4 (Polygon at boundary):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 100, y: 150}, {x: 429, y: 429}, {x: 300, y: 30}]

3. Frontend sends: **SET_STATS_REQUIREMENTS** for each region on both files

   .. code-block:: protobuf

     stats_types = [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max]
     coordinate = "z"

:red-text:`Check 1:` the statistics for file 0 (FITS) and file 1 (CASA) should be equal within precision of 4 digits for all regions and stats types

MATCH_STATS_WIDE
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS_WIDE.test.ts>`__.

This test verifies region statistics consistency between FITS and CASA wide-field images using various region types.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   .. code-block:: protobuf

     file = "casa_wideField.fits", file_id = 0
     file = "casa_wideField.image", file_id = 1

2. Frontend sends: **SET_REGION** (``SetRegion``) for 4 regions on file 0

   Region 1 (Rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 400, y: 1800}, {x: 800, y: 800}]
     rotation = 0

   Region 2 (Rotated Rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 1800, y: 800}, {x: 1000, y: 1000}]
     rotation = 45

   Region 3 (Ellipse):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 1800, y: 1300}, {x: 230, y: 300}]
     rotation = 22

   Region 4 (Polygon):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 3300, y: 1300}, {x: 3400, y: 120}, {x: 2200, y: 100}]

3. Frontend sends: **SET_STATS_REQUIREMENTS** for each region on both files

:red-text:`Check 1:` the statistics for file 0 (FITS) and file 1 (CASA) should be equal within precision of 4 digits for all regions and stats types

MATCH_STATS_WIDE_BORDERLINE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_STATS_WIDE_BORDERLINE.test.ts>`__.

This test verifies region statistics consistency between FITS and CASA wide-field images when regions cross image boundaries.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   .. code-block:: protobuf

     file = "casa_wideField.fits", file_id = 0
     file = "casa_wideField.image", file_id = 1

2. Frontend sends: **SET_REGION** (``SetRegion``) for 4 boundary-crossing regions on file 0

   Region 1 (Rectangle near origin):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 300, y: 200}, {x: 400, y: 400}]
     rotation = 0

   Region 2 (Rotated Rectangle at edge):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 1800, y: 659.2}, {x: 1000, y: 1000}]
     rotation = 25

   Region 3 (Large Ellipse crossing boundary):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 1800, y: 1200}, {x: 800, y: 2000}]
     rotation = 330

   Region 4 (Polygon with negative coordinate):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 3500, y: 1300}, {x: 3599, y: -1.5}, {x: 2200, y: 100}]

3. Frontend sends: **SET_STATS_REQUIREMENTS** for each region on both files

:red-text:`Check 1:` the statistics for file 0 (FITS) and file 1 (CASA) should satisfy:

   - For NumPixels: the absolute difference should be <= 2 (allowing slight pixel count differences due to wide-field projections at boundaries)

   - For all other stats types (Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max): values should be equal within precision of 4 digits
