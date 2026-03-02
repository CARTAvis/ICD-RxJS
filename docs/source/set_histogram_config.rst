Set Histogram Config
--------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Set Histogram Config workflow

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

    User -> Frontend: Configure histogram
    activate Frontend
    Frontend -> Backend : 3. SET_HISTOGRAM_REQUIREMENTS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. REGION_HISTOGRAM_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Histogram displayed
    deactivate Frontend

SET_HISTOGRAMCONFIG
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SET_HISTOGRAMCONFIG.test.ts>`__.

This test verifies that histogram configuration changes (custom bounds, number of bins, Stokes parameter) are correctly applied and that the backend returns updated histogram data.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA** (default histogram)

:red-text:`Check 1:` the default REGION_HISTOGRAM_DATA should satisfy:

   - progress = 1, region_id = -1

   - config.num_bins = -1 (auto)

   - histograms.num_bins = 1049

   - histograms.bin_width = 0.000248212

   - histograms.mean = 0.00000806684

**Case 1: Set custom bounds and num_bins for Stokes Q**

3. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     coordinate = "Qz"
     num_bins = 2
     bounds = {min: -1, max: 0.1377}
     fixed_bounds = true
     fixed_num_bins = true

4. Backend returns: **REGION_HISTOGRAM_DATA**

:red-text:`Check 2:` the REGION_HISTOGRAM_DATA should satisfy:

   - progress = 1, region_id = -1, stokes = 1

   - config.bounds = {min: -1, max: 0.1377}

   - config.fixed_bounds = true, config.fixed_num_bins = true

   - histograms.num_bins = 2

   - histograms.bins = [0, 736448]

   - histograms.bin_width = 0.568837

   - histograms.mean = -0.00000268813

**Case 2: Change image channel and verify histogram updates**

5. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``)

   .. code-block:: protobuf

     file_id = 0
     channel = 3
     stokes = 1

6. Backend returns: **REGION_HISTOGRAM_DATA** x2 (one for custom config, one for default) + **RASTER_TILE_DATA**

:red-text:`Check 3:` the histogram data should satisfy:

   - Custom config histogram: num_bins = 2, bins = [0, 736705], mean = 0.00000222202

   - Default config histogram: num_bins = 1049, mean = 0.00000222202

   - RASTER_TILE_DATA.channel = 3, stokes = 1

**Case 3: Reset histogram to default**

7. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** with default values

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     coordinate = "Qz"
     num_bins = -1
     fixed_bounds = false
     fixed_num_bins = false

:red-text:`Check 4:` the REGION_HISTOGRAM_DATA should return to default:

   - histograms.num_bins = 1049

   - histograms.mean = 0.00000222202

SET_HISTOGRAMCONFIG_QUEUE
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SET_HISTOGRAMCONFIG_QUEUE.test.ts>`__.

This test verifies that the backend correctly handles queued histogram requests when multiple configurations are sent in rapid succession, simulating a user dragging the "Number of bins" slider.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "h_m51_b_s05_drz_sci.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``) — a complex 35-point polygon region

3. Frontend sends 12 sequential **SET_HISTOGRAM_REQUIREMENTS** with different num_bins values (simulating slider drag)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     coordinate = "z"
     bounds = {min: 0.01625969, max: 78.3388690}
     fixed_bounds = true
     fixed_num_bins = true
     num_bins = <4779, 4853, 5003, 5078, 5227, 5376, 5526, 5675, 5750, 5899, 5974, 6048>

4. Backend returns: **REGION_HISTOGRAM_DATA** x12

:red-text:`Check 1:` all 12 REGION_HISTOGRAM_DATA responses should satisfy:

   - Total response count = 12

   - Each response: progress = 1, region_id = 1

   - Each config.bounds.min = 0.01625969, config.bounds.max = 78.3388690

   - Each config.fixed_bounds = true, config.fixed_num_bins = true

   - Each config.num_bins is one of the 12 requested values

   - Each histograms.num_bins is one of the 12 requested values

   - Each histograms.bins[0] matches the corresponding expected first bin count
