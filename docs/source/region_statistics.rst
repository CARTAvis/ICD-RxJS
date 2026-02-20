Region Statistics
-----------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Region Statistics workflow

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

    User -> Frontend: Create region
    activate Frontend
    Frontend -> Backend : 3. SET_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. SET_REGION_ACK [Check 1]</font>
    deactivate Backend

    Frontend -> Backend : 5. SET_STATS_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. REGION_STATS_DATA [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Statistics displayed
    deactivate Frontend

REGION_STATISTICS_ELLIPSE
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_STATISTICS_ELLIPSE.test.ts>`__.

This test verifies that statistics are correctly computed for ellipse regions, including regions that fall outside the image.

Tested on both ``M17_SWex.image`` and ``M17_SWex.hdf5``.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image" (or "M17_SWex.hdf5")
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

3. Frontend sends: **SET_REGION** (``SetRegion``) for 3 ellipse regions

   Ellipse 1 (inside image):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 114, y: 545}, {x: 4, y: 2}]
     rotation = 0.0

   Ellipse 2 (rotated):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 83, y: 489}, {x: 4, y: 3}]
     rotation = 30.0

   Ellipse 3 (outside image):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 0, y: 486}, {x: 4, y: 3}]
     rotation = 30.0

:red-text:`Check 1:` each SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True

   - SET_REGION_ACK.region_id = 1, 2, 3 respectively

4. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetStatsRequirements``) for each region

   .. code-block:: protobuf

     region_id = <1-3>
     stats_types = [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max, Extrema]
     coordinate = "z"

:red-text:`Check 2:` the REGION_STATS_DATA should satisfy:

   - Region 1: NumPixels = 24, Mean = 0.00772359, Min = -0.01768329, Max = 0.02505673

   - Region 2: NumPixels = 18, Mean = 0.0002697, Min = -0.00590614, Max = 0.00654556

   - Region 3 (outside image): NumPixels = 0, all other statistics = NaN

REGION_STATISTICS_POLYGON
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_STATISTICS_POLYGON.test.ts>`__.

This test verifies that statistics are correctly computed for polygon regions, including regions outside the image, sub-pixel polygons, and single-pixel polygons.

Tested on both ``M17_SWex.fits`` and ``M17_SWex.hdf5``.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits" (or "M17_SWex.hdf5")
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``) for 6 polygon regions

   Polygon 1 (triangle):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 155, y: 552}, {x: 134, y: 498}, {x: 185, y: 509}]

   Polygon 2 (small triangle):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 116, y: 604}, {x: 106, y: 574}, {x: 137, y: 577}]

   Polygon 3 (outside image):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 556, y: 167}, {x: 547, y: 130}, {x: 577, y: 139}]

   Polygon 4 (large quadrilateral):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 65, y: 688}, {x: 69, y: 36}, {x: 602, y: 77}, {x: 562, y: 735}]

   Polygon 5 (sub-pixel triangle):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 300.2, y: 300.2}, {x: 300.2, y: 301.0}, {x: 300.7, y: 300.2}]

   Polygon 6 (single-pixel square):

   .. code-block:: protobuf

     region_type = POLYGON
     control_points = [{x: 299.5, y: 300.5}, {x: 299.5, y: 299.5}, {x: 300.5, y: 299.5}, {x: 300.5, y: 300.5}]

:red-text:`Check 1:` the REGION_STATS_DATA should satisfy:

   - Region 1: NumPixels = 1265, Mean = 0.00095056

   - Region 2: NumPixels = 132, Mean = -0.00073162

   - Region 3 (outside image): NumPixels = 0, all stats = NaN

   - Region 4 (large): NumPixels = 216248, Mean = -3.52620875e-5

   - Region 5 (sub-pixel): NumPixels = 0, all stats = NaN

   - Region 6 (single pixel): NumPixels = 1, Mean = -0.00115214, Sigma = 0

REGION_STATISTICS_RECTANGLE
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_STATISTICS_RECTANGLE.test.ts>`__.

This test verifies that statistics are correctly computed for rectangle regions, including rotated rectangles, regions outside the image, and full-image statistics.

Tested on both ``M17_SWex.image`` and ``M17_SWex.hdf5``.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image" (or "M17_SWex.hdf5")
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``) for 4 rectangle regions

   Rectangle 1:

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 212, y: 464}, {x: 10, y: 10}]
     rotation = 0.0

   Rectangle 2:

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 103, y: 549}, {x: 5, y: 7}]
     rotation = 0.0

   Rectangle 3 (rotated 300 degrees):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 115, y: 544}, {x: 5, y: 7}]
     rotation = 300.0

   Rectangle 4 (outside image):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 0, y: 544}, {x: 5, y: 7}]
     rotation = 300.0

:red-text:`Check 1:` the REGION_STATS_DATA should satisfy:

   - Region 1: NumPixels = 121, Mean = 0.00234626

   - Region 2: NumPixels = 14, Mean = -0.00249511

   - Region 3 (rotated): NumPixels = 35, Mean = 0.00484488

   - Region 4 (outside image): NumPixels = 0, all stats = NaN

**Full image statistics (region_id = -1):**

:red-text:`Check 2:` the REGION_STATS_DATA for region_id = -1 should satisfy:

   - NumPixels = 216248, Mean = -3.52620875e-5, Min = -0.03958673, Max = 0.04523611
