Region Statistics
-----------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Creating a region and set stats requirements

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open a new image
    activate Frontend
    Frontend -> Backend : CLOSE_FILE
    activate Backend
    Frontend -> Backend : OPEN_FILE
    Frontend <-- Backend : OPEN_FILE_ACK
    Frontend -> Backend : ADD_REQUIRED_TILES
    Frontend -> Backend : SET_CURSOR
    Frontend <-- Backend : REGION_HISTOGRAM_DATA
    Frontend <-- Backend : SPATIAL_PROFILE_DATA
    Frontend <-- Backend : RASTER_TILE_SYNC
    Frontend <-- Backend : RASTER_TILE_DATA
    Frontend <-- Backend : RASTER_TILE_SYNC
    deactivate Backend
    User <-- Frontend: Displays image, histogram, \nand spatial profile
    deactivate Frontend

    User -> Frontend: Draws new region
    activate Frontend
    Frontend -> Backend : SET_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">SET_REGION_ACK [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays region overlay
    deactivate Frontend

    User -> Frontend: Set region stats requirements
    activate Frontend
    Frontend -> Backend : SET_STATS_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">REGION_STATS_DATA [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays region stats data
    deactivate Frontend

REGION_STATISTICS_RECTANGLE
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_STATISTICS_RECTANGLE.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     file_id = 0
     hdu = ""
     render_mode = 0

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

      tiles = [0]
      file_id = 0
      compression_quality = 11
      compression_type = 1

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns:

   **REGION_HISTOGRAM_DATA**

   **SPATIAL_PROFILE_DATA**

   **RASTER_TILE_SYNC**

   **RASTER_TILE_DATA**

   **RASTER_TILE_SYNC**

7. Frontend sends: **SET_REGION** (``SetRegion``)

   Case 1:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "rectangle_1"
     region_type = 3
     control_points = [{x: 212, y: 464}, {x: 10, y: 10}]
     rotation = 0

   Case 2:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "rectangle_2"
     region_type = 3
     control_points = [{x: 103, y: 549}, {x: 5, y: 7}]
     rotation = 0

   Case 3:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "rectangle_3"
     region_type = 3
     control_points = [{x: 115, y: 544}, {x: 5, y: 7}]
     rotation = 300

   Case 4:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "rectangle_4"
     region_type = 3
     control_points = [{x: 0, y: 544}, {x: 5, y: 7}]
     rotation = 300

   Case 5: (empty)

8. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 1:` the backend message shoduld satisfies:

   - SET_REGION_ACK should arrives within 100 ms

   - SET_REGION_ACK should contains:

   Case 1:

   .. code-block:: protobuf

     success = True
     region_id = 1

   Case 2:

   .. code-block:: protobuf

     success = True
     region_id = 2

   Case 3:

   .. code-block:: protobuf

     success = True
     region_id = 3

   Case 4:

   .. code-block:: protobuf

     success = True
     region_id = 4

   Case 5:

   .. code-block:: protobuf

     success = True
     region_id = 5

9. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetRegionRequirements``)

   Case 1:

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 2:

   .. code-block:: protobuf

     file_id = 0
     region_id = 2
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 3:

   .. code-block:: protobuf

     file_id = 0
     region_id = 3
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 4:

   .. code-block:: protobuf

     file_id = 0
     region_id = 4
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 5:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

10. Backend returns: **REGION_STATS_DATA** (``RegionStatsData``)

:red-text:`Check 2:` the backend message shoduld satisfies:

   - REGION_STATS_DATA should arrives within 5000 ms

   - REGION_STATS_DATA should contains (precision < %.4E):

   Case 1:

   .. code-block:: protobuf

     region_id = 1
     statistics: [
         CARTA.StatsType.NumPixels = 121,
         CARTA.StatsType.Sum = 0.28389804,
         CARTA.StatsType.FluxDensity = 0.01304297,
         CARTA.StatsType.Mean = 0.00234626,
         CARTA.StatsType.RMS = 0.00388394,
         CARTA.StatsType.Sigma = 0.00310803,
         CARTA.StatsType.SumSq = 0.00182528,
         CARTA.StatsType.Min = -0.00358113,
         CARTA.StatsType.Max = 0.00793927,
         CARTA.StatsType.Extrema = 0.00793926
     ]

   Case 2:

   .. code-block:: protobuf

     region_id = 2
     statistics: [
        CARTA.StatsType.NumPixels = 14,
        CARTA.StatsType.Sum = -0.03493149,
        CARTA.StatsType.FluxDensity = -0.00160484,
        CARTA.StatsType.Mean = -0.00249511,
        CARTA.StatsType.RMS = 0.00586684,
        CARTA.StatsType.Sigma = 0.00551027,
        CARTA.StatsType.SumSq = 0.00048188,
        CARTA.StatsType.Min = -0.0095625,
        CARTA.StatsType.Max = 0.00694707,
        CARTA.StatsType.Extrema = -0.00956249
     ]

   Case 3:

   .. code-block:: protobuf

     region_id = 3
     statistics: [
        CARTA.StatsType.NumPixels = 35,
        CARTA.StatsType.Sum = 0.16957074,
        CARTA.StatsType.FluxDensity = 0.0077905,
        CARTA.StatsType.Mean = 0.00484488,
        CARTA.StatsType.RMS = 0.01209958,
        CARTA.StatsType.Sigma = 0.01124911,
        CARTA.StatsType.SumSq = 0.00512399,
        CARTA.StatsType.Min = -0.01768329,
        CARTA.StatsType.Max = 0.02505673,
        CARTA.StatsType.Extrema = 0.02505672
     ]

   Case 4:

   .. code-block:: protobuf

     region_id = 4
     statistics: [
        CARTA.StatsType.NumPixels = 0,
        CARTA.StatsType.Sum = NaN,
        CARTA.StatsType.FluxDensity = NaN,
        CARTA.StatsType.Mean = NaN,
        CARTA.StatsType.RMS = NaN,
        CARTA.StatsType.Sigma = NaN,
        CARTA.StatsType.SumSq = NaN,
        CARTA.StatsType.Min = NaN,
        CARTA.StatsType.Max = NaN,
        CARTA.StatsType.Extrema = NaN,
     ]

   Case 5:

   .. code-block:: protobuf

     region_id = -1
     statistics: [
        CARTA.StatsType.NumPixels = 216248,
        CARTA.StatsType.Sum = -7.6253559,
        CARTA.StatsType.FluxDensity = -0.35032758,
        CARTA.StatsType.Mean = -3.52620875e-05,
        CARTA.StatsType.RMS = 0.00473442,
        CARTA.StatsType.Sigma = 0.0047343,
        CARTA.StatsType.SumSq = 4.84713562,
        CARTA.StatsType.Min = -0.03958673,
        CARTA.StatsType.Max = 0.04523611,
        CARTA.StatsType.Extrema = 0.04523611,
     ]

REGION_STATISTICS_ELLIPSE
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_STATISTICS_ELLIPSE.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     file_id = 0
     hdu = ""
     render_mode = 0

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

      tiles = [0]
      file_id = 0
      compression_quality = 11
      compression_type = 1

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns:

   **REGION_HISTOGRAM_DATA**

   **SPATIAL_PROFILE_DATA**

   **RASTER_TILE_SYNC**

   **RASTER_TILE_DATA**

   **RASTER_TILE_SYNC**

7. Frontend sends: **SET_REGION** (``SetRegion``)

   Case 1:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "ellipse_1"
     region_type = 4
     control_points = [{x: 114, y: 545}, {x: 4, y: 2}]
     rotation = 0

   Case 2:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "ellipse_2"
     region_type = 4
     control_points = [{x: 83, y: 489}, {x: 4, y: 3}]
     rotation = 30

   Case 3:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "ellipse_3"
     region_type = 4
     control_points = [{x: 0, y: 486}, {x: 4, y: 3}]
     rotation = 30

8. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 1:` the backend message shoduld satisfies:

   - SET_REGION_ACK should arrives within 100 ms

   - SET_REGION_ACK should contains:

   Case 1:

   .. code-block:: protobuf

     success = True
     region_id = 1

   Case 2:

   .. code-block:: protobuf

     success = True
     region_id = 2

   Case 3:

   .. code-block:: protobuf

     success = True
     region_id = 3

9. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetRegionRequirements``)

   Case 1:

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 2:

   .. code-block:: protobuf

     file_id = 0
     region_id = 2
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 3:

   .. code-block:: protobuf

     file_id = 0
     region_id = 3
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

10. Backend returns: **REGION_STATS_DATA** (``RegionStatsData``)

:red-text:`Check 2:` the backend message shoduld satisfies:

   - REGION_STATS_DATA should arrives within 5000 ms

   - REGION_STATS_DATA should contains (precision < %.4E):

   Case 1:

   .. code-block:: protobuf

     region_id = 1
     statistics: [
         CARTA.StatsType.NumPixels = 24,
         CARTA.StatsType.Sum = 0.18536625,
         CARTA.StatsType.FluxDensity = 0.00851618,
         CARTA.StatsType.Mean = 0.00772359,
         CARTA.StatsType.RMS = 0.01397174,
         CARTA.StatsType.Sigma = 0.01189324,
         CARTA.StatsType.SumSq = 0.00468503,
         CARTA.StatsType.Min = -0.01768329,
         CARTA.StatsType.Max = 0.02505673,
         CARTA.StatsType.Extrema = 0.02505672
     ]

   Case 2:

   .. code-block:: protobuf

     region_id = 2
     statistics: [
        CARTA.StatsType.NumPixels = 18,
        CARTA.StatsType.Sum = 0.00485459,
        CARTA.StatsType.FluxDensity = 0.00022303,
        CARTA.StatsType.Mean = 0.0002697,
        CARTA.StatsType.RMS = 0.00307906,
        CARTA.StatsType.Sigma = 0.00315614,
        CARTA.StatsType.SumSq = 0.00017065,
        CARTA.StatsType.Min = -0.00590614,
        CARTA.StatsType.Max = 0.00654556,
        CARTA.StatsType.Extrema = 0.00654555
     ]

   Case 3:

   .. code-block:: protobuf

     region_id = 3
     statistics: [
        CARTA.StatsType.NumPixels = 0,
        CARTA.StatsType.Sum = NaN,
        CARTA.StatsType.FluxDensity = NaN,
        CARTA.StatsType.Mean = NaN,
        CARTA.StatsType.RMS = NaN,
        CARTA.StatsType.Sigma = NaN,
        CARTA.StatsType.SumSq = NaN,
        CARTA.StatsType.Min = NaN,
        CARTA.StatsType.Max = NaN,
        CARTA.StatsType.Extrema = NaN
     ]

REGION_STATISTICS_POLYGON
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_STATISTICS_POLYGON.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     hdu = "0"
     render_mode = 0

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

      tiles = [0]
      file_id = 0
      compression_quality = 11
      compression_type = 1

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns:

   **REGION_HISTOGRAM_DATA**

   **SPATIAL_PROFILE_DATA**

   **RASTER_TILE_SYNC**

   **RASTER_TILE_DATA**

   **RASTER_TILE_SYNC**

7. Frontend sends: **SET_REGION** (``SetRegion``)

   Case 1:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "polygon_1"
     region_type = 6
     control_points = [{x: 155, y: 552}, {x: 134, y: 498}, {x: 185, y: 509}]
     rotation = 0

   Case 2:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "polygon_2"
     region_type = 6
     control_points = [{x: 116, y: 604}, {x: 106, y: 574}, {x: 137, y: 577}]
     rotation = 0

   Case 3:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "polygon_3"
     region_type = 6
     control_points = [{x: 556, y: 167}, {x: 547, y: 130}, {x: 577, y: 139}]
     rotation = 0

   Case 4:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "polygon_4"
     region_type = 6
     control_points = [{x: 65, y: 688}, {x: 69, y: 36}, {x: 602, y: 77}, {x: 562, y: 735}]
     rotation = 0

   Case 5:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "polygon_5"
     region_type = 6
     control_points = [{x: 300.2, y: 300.2}, {x: 300.2, y: 301.0}, {x: 300.7, y: 300.2}]
     rotation = 0

   Case 6:

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_name = "polygon_5"
     region_type = 6
     control_points = [{x: 299.5, y: 300.5}, {x: 299.5, y: 299.5}, {x: 300.5, y: 299.5}, {x: 300.5, y: 300.5}]
     rotation = 0

8. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 1:` the backend message shoduld satisfies:

   - SET_REGION_ACK should arrives within 100 ms

   - SET_REGION_ACK should contains:

   Case 1:

   .. code-block:: protobuf

     success = True
     region_id = 1

   Case 2:

   .. code-block:: protobuf

     success = True
     region_id = 2

   Case 3:

   .. code-block:: protobuf

     success = True
     region_id = 3

   Case 4:

   .. code-block:: protobuf

     success = True
     region_id = 4

   Case 5:

   .. code-block:: protobuf

     success = True
     region_id = 5

   Case 6:

   .. code-block:: protobuf

     success = True
     region_id = 6

9. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetRegionRequirements``)

   Case 1:

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 2:

   .. code-block:: protobuf

     file_id = 0
     region_id = 2
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 3:

   .. code-block:: protobuf

     file_id = 0
     region_id = 3
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 4:

   .. code-block:: protobuf

     file_id = 0
     region_id = 4
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 5:

   .. code-block:: protobuf

     file_id = 0
     region_id = 5
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

   Case 6:

   .. code-block:: protobuf

     file_id = 0
     region_id = 6
     stats = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]

10. Backend returns: **REGION_STATS_DATA** (``RegionStatsData``)

:red-text:`Check 2:` the backend message shoduld satisfies:

   - REGION_STATS_DATA should arrives within 5000 ms

   - REGION_STATS_DATA should contains (precision < %.4E):

   Case 1:

   .. code-block:: protobuf

     region_id = 1
     statistics: [
         CARTA.StatsType.NumPixels = 1265,
         CARTA.StatsType.Sum = 1.2024647,
         CARTA.StatsType.FluxDensity = 0.05524418,
         CARTA.StatsType.Mean = 0.00095056,
         CARTA.StatsType.RMS = 0.00372206,
         CARTA.StatsType.Sigma = 0.00360005,
         CARTA.StatsType.SumSq = 0.01752493,
         CARTA.StatsType.Min = -0.01051447,
         CARTA.StatsType.Max = 0.01217441,
         CARTA.StatsType.Extrema = 0.01217440
     ]

   Case 2:

   .. code-block:: protobuf

     region_id = 2
     statistics: [
        CARTA.StatsType.NumPixels = 132,
        CARTA.StatsType.Sum = -0.09657376,
        CARTA.StatsType.FluxDensity = -0.00443684,
        CARTA.StatsType.Mean = -0.00073162,
        CARTA.StatsType.RMS = 0.00945348,
        CARTA.StatsType.Sigma = 0.00946103,
        CARTA.StatsType.SumSq = 0.01179662,
        CARTA.StatsType.Min = -0.01994896,
        CARTA.StatsType.Max = 0.0235076,
        CARTA.StatsType.Extrema = 0.02350760
     ]

   Case 3:

   .. code-block:: protobuf

     region_id = 3
     statistics: [
        CARTA.StatsType.NumPixels = 0,
        CARTA.StatsType.Sum = NaN,
        CARTA.StatsType.FluxDensity = NaN,
        CARTA.StatsType.Mean = NaN,
        CARTA.StatsType.RMS = NaN,
        CARTA.StatsType.Sigma = NaN,
        CARTA.StatsType.SumSq = NaN,
        CARTA.StatsType.Min = NaN,
        CARTA.StatsType.Max = NaN,
        CARTA.StatsType.Extrema = NaN
     ]

   Case 4:

   .. code-block:: protobuf

     region_id = 4
     statistics: [
        CARTA.StatsType.NumPixels = 216248,
        CARTA.StatsType.Sum = -7.6253559,
        CARTA.StatsType.FluxDensity = -0.35032758,
        CARTA.StatsType.Mean = -3.52620875e-05,
        CARTA.StatsType.RMS = 0.00473442,
        CARTA.StatsType.Sigma = 0.0047343,
        CARTA.StatsType.SumSq = 4.84713562,
        CARTA.StatsType.Min = -0.03958673,
        CARTA.StatsType.Max = 0.04523611,
        CARTA.StatsType.Extrema = 0.04523611,
     ]

   Case 5:

   .. code-block:: protobuf

     region_id = 5
     statistics: [
        CARTA.StatsType.NumPixels = 0,
        CARTA.StatsType.Sum = NaN,
        CARTA.StatsType.FluxDensity = NaN,
        CARTA.StatsType.Mean = NaN,
        CARTA.StatsType.RMS = NaN,
        CARTA.StatsType.Sigma = NaN,
        CARTA.StatsType.SumSq = NaN,
        CARTA.StatsType.Min = NaN,
        CARTA.StatsType.Max = NaN,
        CARTA.StatsType.Extrema = NaN,
     ]

   Case 6:

   .. code-block:: protobuf

     region_id = 6
     statistics: [
        CARTA.StatsType.NumPixels = 1,
        CARTA.StatsType.Sum = -0.00115214,
        CARTA.StatsType.FluxDensity = -5.29322955e-05,
        CARTA.StatsType.Mean = -0.00115214,
        CARTA.StatsType.RMS = 0.00115214,
        CARTA.StatsType.Sigma = 0,
        CARTA.StatsType.SumSq = 1.32743435e-06,
        CARTA.StatsType.Min = -0.00115214,
        CARTA.StatsType.Max = -0.00115214,
        CARTA.StatsType.Extrema = -0.00115214,
     ]
