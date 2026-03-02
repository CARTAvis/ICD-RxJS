Region Data
-----------

.. uml::

    skinparam style strictuml
    hide footbox
    title Region data workflow

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

    User -> Frontend: Request region data
    activate Frontend
    Frontend -> Backend : 8. SET_HISTOGRAM_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">9. REGION_HISTOGRAM_DATA [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays histogram
    deactivate Frontend

REGION_DATA_STREAM
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_DATA_STREAM.test.ts>`__.

This test verifies that spectral profile data, histogram data, and statistics data are all streamed correctly after creating a region.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.image"

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

4. Frontend sends: **SET_REGION** (``SetRegion``) for an ellipse region

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     region_type = ELLIPSE
     control_points = [{x: 302, y: 370}, {x: 10, y: 20}]
     rotation = 30.0

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True
   - SET_REGION_ACK.region_id = 1

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

7. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``)

:red-text:`Check 3:` the SPECTRAL_PROFILE_DATA should satisfy:

   - Should arrive within 5000 ms
   - SPECTRAL_PROFILE_DATA.region_id = 1
   - SPECTRAL_PROFILE_DATA.progress = 1

8. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     histograms = [{channel: -1, num_bins: -1}]

9. Backend returns: **REGION_HISTOGRAM_DATA** (``RegionHistogramData``)

:red-text:`Check 4:` the REGION_HISTOGRAM_DATA should satisfy:

   - Should arrive within 5000 ms
   - REGION_HISTOGRAM_DATA.region_id = 1
   - REGION_HISTOGRAM_DATA.progress = 1

10. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetStatsRequirements``)

    .. code-block:: protobuf

      file_id = 0
      region_id = 1
      stats_configs = [{coordinate: "z", stats_types: [Count, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max, Extrema]}]

11. Backend returns: **REGION_STATS_DATA** (``RegionStatsData``)

:red-text:`Check 5:` the REGION_STATS_DATA should satisfy:

    - Should arrive within 5000 ms
    - REGION_STATS_DATA.region_id = 1

REGION_HISTOGRAM
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_HISTOGRAM.test.ts>`__.

This test verifies that region histograms are computed correctly for rectangle regions with different rotations, comparing results across CASA IMAGE and HDF5 formats.

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

4. Frontend sends: **SET_REGION** (``SetRegion``) for 3 rectangle regions

   Region 1 (no rotation):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 98, y: 541}, {x: 7, y: 7}]
     rotation = 0

   Region 2 (90 degree rotation):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 98, y: 541}, {x: 7, y: 7}]
     rotation = 90

   Region 3 (out-of-bounds, 45 degree rotation):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 0, y: 524}, {x: 7, y: 7}]
     rotation = 45

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``) for each region

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True
   - region_id = 1, 2, 3 respectively

6. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``) for each region

   .. code-block:: protobuf

     file_id = 0
     region_id = <1-3>
     histograms = [{channel: -1, num_bins: -1}]

7. Backend returns: **REGION_HISTOGRAM_DATA** (``RegionHistogramData``) for each region

:red-text:`Check 3:` the REGION_HISTOGRAM_DATA should satisfy:

   - Should arrive within 5000 ms

   - Region 1 (no rotation):

     .. code-block:: protobuf

       region_id = 1
       progress = 1
       numBins = 7
       binWidth = 0.003347359
       firstBinCenter = -0.007536160
       bins = [5, 2, 1, 0, 4, 1, 3]

   - Region 2 (90 degree rotation): same histogram data as Region 1 (symmetric region)

     .. code-block:: protobuf

       region_id = 2
       progress = 1
       numBins = 7
       binWidth = 0.003347359
       firstBinCenter = -0.007536160
       bins = [5, 2, 1, 0, 4, 1, 3]

   - Region 3 (out-of-bounds): empty histogram

     .. code-block:: protobuf

       region_id = 3
       progress = 1
       numBins = 1
       bins = [0]

   - Results should be consistent between CASA IMAGE and HDF5 formats

REGION_HISTOGRAM_ITERATION
~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_HISTOGRAM_ITERATION.test.ts>`__.

This test verifies that region histograms change correctly when a region is iteratively rotated. It tests both rectangle and ellipse regions with 5 rotation angles each.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "supermosaic.10.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "supermosaic.10.fits"

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

**Rectangle region iterations (region #1):**

4. Frontend sends: **SET_REGION** (``SetRegion``) to create a rectangle region, then modifies it with 4 additional rotations

   Initial creation (rotation = 0):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 303, y: 607}, {x: 5, y: 10}]
     rotation = 0

   Subsequent modifications (region_id = 1) with rotations: 25, 50, 75, 100 degrees

5. For each rotation, frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     histograms = [{channel: -1, num_bins: -1}]

6. Backend returns: **REGION_HISTOGRAM_DATA** (``RegionHistogramData``) for each rotation

:red-text:`Check 2:` the REGION_HISTOGRAM_DATA for rectangle should satisfy:

   - Should arrive within 5000 ms for each rotation

   - Rotation 0: numBins = 7, bins = [3, 12, 7, 13, 8, 7, 5]

   - Rotation 25: numBins = 9, bins = [1, 1, 11, 9, 10, 6, 4, 5, 4]

   - Rotation 50: numBins = 9, bins = [2, 2, 6, 11, 9, 5, 3, 6, 7]

   - Rotation 75: numBins = 8, bins = [2, 3, 9, 9, 3, 8, 8, 9]

   - Rotation 100: numBins = 8, bins = [3, 1, 8, 5, 5, 10, 9, 10]

**Ellipse region iterations (region #2):**

7. Frontend sends: **SET_REGION** (``SetRegion``) to create an ellipse region, then modifies it with 4 additional rotations

   Initial creation (rotation = 0):

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = ELLIPSE
     control_points = [{x: 303, y: 607}, {x: 3, y: 7}]
     rotation = 0

   Subsequent modifications (region_id = 2) with rotations: 25, 50, 75, 100 degrees

8. For each rotation, frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 2
     histograms = [{channel: -1, num_bins: -1}]

9. Backend returns: **REGION_HISTOGRAM_DATA** (``RegionHistogramData``) for each rotation

:red-text:`Check 3:` the REGION_HISTOGRAM_DATA for ellipse should satisfy:

   - Should arrive within 5000 ms for each rotation

   - Rotation 0: numBins = 9, bins = [4, 4, 5, 8, 6, 5, 8, 11, 13]

   - Rotation 25: numBins = 15, bins = [1, 1, 2, 2, 5, 6, 3, 5, 3, 9, 7, 9, 1, 11, 2]

   - Rotation 50: numBins = 15, bins = [3, 4, 5, 2, 4, 6, 5, 7, 6, 8, 6, 1, 6, 3, 1]

   - Rotation 75: numBins = 15, bins = [5, 6, 8, 3, 5, 6, 6, 4, 7, 5, 5, 1, 5, 2, 1]

   - Rotation 100: numBins = 15, bins = [1, 1, 1, 4, 7, 10, 6, 8, 7, 5, 3, 2, 5, 4, 3]

REGION_REGISTER
~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/REGION_REGISTER.test.ts>`__.

This test verifies region creation, modification, and removal on an image.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.fits"

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

**Creating 7 new regions:**

4. Frontend sends: **SET_REGION** (``SetRegion``) for 7 new regions (region_id = -1)

   Region 1 (rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 197, y: 489}, {x: 10, y: 10}]
     rotation = 0.0

   Region 2 (rectangle, rotated):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 306, y: 670}, {x: 20, y: 48}]
     rotation = 27.0

   Region 3 (ellipse):

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 551, y: 330}, {x: 30, y: 15}]
     rotation = 0.0

   Region 4 (rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 580, y: 240}, {x: 35, y: 35}]
     rotation = 0.0

   Region 5 (rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 552, y: 184}, {x: 350, y: 18}]
     rotation = 0.0

   Region 6 (rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 635, y: 128}, {x: 25, y: 48}]
     rotation = 0.0

   Region 7 (rectangle):

   .. code-block:: protobuf

     region_type = RECTANGLE
     control_points = [{x: 694, y: 80}, {x: 25, y: 33}]
     rotation = 0.0

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``) for each region

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True
   - region_id = 1, 2, 3, 4, 5, 6, 7 respectively

**Modifying region #1 (moving across the image):**

6. Frontend sends: **SET_REGION** (``SetRegion``) to modify region #1 multiple times

   Move 1: center at (84, 491)

   .. code-block:: protobuf

     region_id = 1
     region_type = RECTANGLE
     control_points = [{x: 84, y: 491}, {x: 10, y: 10}]
     rotation = 0.0

   Move 2: center at (43, 491)

   .. code-block:: protobuf

     region_id = 1
     control_points = [{x: 43, y: 491}, {x: 10, y: 10}]

   Move 3: center at (-1, 491) (partially out-of-bounds)

   .. code-block:: protobuf

     region_id = 1
     control_points = [{x: -1, y: 491}, {x: 10, y: 10}]

   Move 4: center at (-14, 491) (fully out-of-bounds)

   .. code-block:: protobuf

     region_id = 1
     control_points = [{x: -14, y: 491}, {x: 10, y: 10}]

   Move 5: back to original position (197, 489)

   .. code-block:: protobuf

     region_id = 1
     control_points = [{x: 197, y: 489}, {x: 10, y: 10}]

:red-text:`Check 3:` each SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True
   - SET_REGION_ACK.region_id = 1

**Removing region #3 and creating a replacement:**

7. Frontend sends: **REMOVE_REGION** to remove region #3

:red-text:`Check 4:` after removing region #3:

   - No ICD messages should be returned from the backend within 500 ms

8. Frontend sends: **SET_REGION** (``SetRegion``) to create a new ellipse region (region_id = -1)

   .. code-block:: protobuf

     region_type = ELLIPSE
     control_points = [{x: 551, y: 330}, {x: 30, y: 15}]
     rotation = 30.0

9. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 5:` the SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True
   - SET_REGION_ACK.region_id = 8 (next available ID after 7 previously created regions)
