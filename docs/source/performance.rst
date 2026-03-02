Performance Tests
-----------------

The performance test suite measures backend latency and throughput for computationally
intensive operations. Each test uses a Jest timeout as the pass/fail threshold -- if the
backend does not complete the operation within the configured timeout, the test fails.

All performance tests read data files from the ``set_QA_performance`` directory. Three
file formats (FITS, CASA, HDF5) are tested for each operation, enabling cross-format
performance comparison.

Timeout values are configured in ``src/test/config.json`` under the ``performance`` key:

.. code-block:: json

   {
     "performance": {
       "openFile": 20000,
       "readFile": 10000,
       "playContour": 12000,
       "playAnimator": 300000,
       "setSpectralReqTimeout": 10000,
       "momentTimeout": 400000,
       "pvTimeout": 200000
     }
   }

.. uml::

    skinparam style strictuml
    hide footbox
    title Performance test measurement pattern

    actor Tester

    box "Client-side" #EDEDED
            participant "Test Runner"
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    Tester -> "Test Runner": Start test
    activate "Test Runner"
    "Test Runner" -> Backend : OPEN_FILE
    activate Backend
    "Test Runner" <-- Backend : OPEN_FILE_ACK
    "Test Runner" -> Backend : <operation request>
    note right
        Timeout starts here.
        If the operation does not
        complete within the configured
        threshold, the test fails.
    end note
    "Test Runner" <-- Backend : <streaming responses>
    "Test Runner" <--[#red] Backend : <font color="red">Final response (progress = 1) [Pass]</font>
    deactivate Backend
    Tester <-- "Test Runner": Test result
    deactivate "Test Runner"

PERF_LOAD_IMAGE
~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_LOAD_IMAGE_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_LOAD_IMAGE_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_LOAD_IMAGE_HDF5.test.ts>`__

Measures the end-to-end latency of opening an image and receiving the initial raster
tiles, spatial profiles, and histogram.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "cube_B_06400_z00100.<fits|image|hdf5>"
     file_id = 0

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA**

3. Frontend sends: **ADD_REQUIRED_TILES** (9 tiles), **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: text

     tiles = [33558529, 33558528, 33554433, 33554432, 33562625,
              33558530, 33562624, 33554434, 33562626]
     compression_type = ZFP
     compression_quality = 11
     point = {x: 1, y: 1}

4. Backend returns: **RASTER_TILE_DATA** stream and **SPATIAL_PROFILE_DATA**

:red-text:`Check 1:` within the ``openFile`` timeout (20,000 ms):

   - OPEN_FILE_ACK.success = True
   - RASTER_TILE_DATA stream length = 9 + 2 (9 tiles + RasterTileSync start and end)

PERF_RASTER_TILE_DATA
~~~~~~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_RASTER_TILE_DATA_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_RASTER_TILE_DATA_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_RASTER_TILE_DATA_HDF5.test.ts>`__

Measures bulk raster tile delivery throughput by requesting 54 tiles at a higher zoom
level after the initial image load.

1. Frontend opens ``cube_B_06400_z00100.<fits|image|hdf5>`` and loads 1 initial tile

2. Frontend sends: **ADD_REQUIRED_TILES** (54 tiles at higher MIP level)

   .. code-block:: text

     tiles = [67125252, 67129348, 67125253, ... (54 tiles)]
     compression_type = ZFP
     compression_quality = 11

3. Backend returns: **RASTER_TILE_DATA** stream

:red-text:`Check 1:` within the ``readFile`` timeout (10,000 ms):

   - RASTER_TILE_DATA stream length = 54 + 2 (54 tiles + RasterTileSync start and end)

PERF_CONTOUR_DATA
~~~~~~~~~~~~~~~~~

See the source code:
`Mode 0 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CONTOUR_DATA_Mode0.test.ts>`__ |
`Mode 1 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CONTOUR_DATA_Mode1.test.ts>`__ |
`Mode 2 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CONTOUR_DATA_Mode2.test.ts>`__

Measures contour computation time on a large 2D Hubble image (8600 x 12200 pixels) across
three smoothing modes: NoSmoothing (0), BlockAverage (1), and GaussianBlur (2).

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "h_m51_b_s05_drz_sci.fits"
     hdu = "0"
     file_id = 0

2. Frontend loads 9 initial tiles and sets cursor

3. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: text

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.1, 0.36, 0.72, 1.09, 1.46]
     smoothing_mode = <0 | 1 | 2>
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

4. Backend streams: **CONTOUR_IMAGE_DATA** with increasing progress

:red-text:`Check 1:` within the ``playContour`` timeout (12,000 ms):

   - All 5 contour levels reach progress = 1

PERF_ANIMATOR_CONTOUR
~~~~~~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_ANIMATOR_CONTOUR_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_ANIMATOR_CONTOUR_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_ANIMATOR_CONTOUR_HDF5.test.ts>`__

Measures animation playback performance with contour overlays, testing both forward and
backward channel animation.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "cube_B_06400_z00100.<fits|image|hdf5>"
     file_id = 0

2. Frontend loads initial tiles and sets contour parameters

   .. code-block:: text

     levels = [-0.01, 0.01]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4

**Case 1: Forward animation (channels 1 to 30)**

3. Frontend sends: **START_ANIMATION** (``StartAnimation``)

   .. code-block:: text

     start_frame = {channel: 1, stokes: 0}
     first_frame = {channel: 0, stokes: 0}
     last_frame = {channel: 44, stokes: 0}
     delta_frame = {channel: 1, stokes: 0}
     frame_rate = 5

4. Animation plays with **ANIMATION_FLOW_CONTROL** per frame, stops at channel 30

:red-text:`Check 1:` within the ``playAnimator`` timeout (300,000 ms):

   - START_ANIMATION_ACK.success = True
   - RASTER_TILE_DATA channels are in ascending order
   - CONTOUR_IMAGE_DATA channels are in ascending order (2 levels per channel)
   - REGION_HISTOGRAM_DATA channels are in ascending order

**Case 2: Backward animation (channels 40 to 31)**

5. Frontend sends: **START_ANIMATION** with delta_frame = {channel: -1}

:red-text:`Check 2:` within the ``playAnimator`` timeout (300,000 ms):

   - RASTER_TILE_DATA channels are in descending order
   - CONTOUR_IMAGE_DATA channels are in descending order
   - REGION_HISTOGRAM_DATA channels are in descending order

PERF_CUBE_HISTOGRAM
~~~~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CUBE_HISTOGRAM_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CUBE_HISTOGRAM_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CUBE_HISTOGRAM_HDF5.test.ts>`__

Measures the time to compute a full cube histogram across all channels. The HDF5 format
pre-computes histograms at write time, so the HDF5 variant uses a much tighter timeout
(500 ms vs 300,000 ms) to verify the cached result is returned quickly.

1. Frontend opens ``cube_B_06400_z00100.<fits|image|hdf5>`` and loads initial tiles

2. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: text

     file_id = 0
     region_id = -2
     histograms = [{channel: -2, num_bins: -1}]

3. Backend streams: **REGION_HISTOGRAM_DATA** with increasing progress

:red-text:`Check 1:` within the cube histogram timeout:

   - FITS/CASA: 300,000 ms
   - HDF5: 500 ms (pre-computed)
   - REGION_HISTOGRAM_DATA reaches progress = 1

PERF_MOMENTS
~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_MOMENTS_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_MOMENTS_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_MOMENTS_HDF5.test.ts>`__

Measures the time to generate all 13 moment images from a spectral cube.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "S255_IR_sci.spw25.cube.I.pbcor.<fits|image|hdf5>"
     file_id = 0

2. Frontend loads tiles, sets cursor at (960, 960), and requests spectral profile

3. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``) for all 13 moments

   .. code-block:: text

     file_id = 0
     moments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
     axis = SPECTRAL
     mask = Include
     pixel_range = {min: 0.1, max: 1.0}
     spectral_range = {min: 0, max: 400}
     rest_freq = 335500000000

   The 13 moment types: Average, Integrated, Weighted Coordinate, Weighted Dispersion
   Coordinate, Median, Median Coordinate, Standard Deviation, RMS, Abs Mean Deviation,
   Maximum, Maximum Coordinate, Minimum, Minimum Coordinate.

4. Backend returns: **MOMENT_RESPONSE** with 13 ``openFileAcks``

:red-text:`Check 1:` within the ``momentTimeout`` (400,000 ms):

   - MOMENT_RESPONSE.success = True
   - MOMENT_RESPONSE.openFileAcks.length = 13
   - All openFileAcks[].success = True

PERF_PV
~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_PV_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_PV_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_PV_HDF5.test.ts>`__

Measures the time to generate a position-velocity (PV) diagram from a spectral cube.

1. Frontend opens ``cube_B_06400_z00100.<fits|image|hdf5>`` and loads initial tiles

2. Frontend sends: **SET_REGION** (``SetRegion``) with a LINE region

   .. code-block:: text

     region_type = LINE
     control_points = [(3719.18, 3663.72), (5897.90, 5842.44)]
     rotation = 135

3. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: text

     file_id = 0
     region_id = 1
     width = 3

4. Backend streams: **PV_PROGRESS** with increasing progress, then **PV_RESPONSE**

5. Frontend requests 13 tiles on the PV output image (file_id = 1)

:red-text:`Check 1:` within the ``pvTimeout`` (200,000 ms):

   - PV_RESPONSE.success = True
   - PV progress reaches 1
   - PV output image produces 1 REGION_HISTOGRAM_DATA
   - Raster tiles for PV image: stream length = 13 + 2

PERF_REGION_SPECTRAL_PROFILE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_REGION_SPECTRAL_PROFILE_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_REGION_SPECTRAL_PROFILE_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_REGION_SPECTRAL_PROFILE_HDF5.test.ts>`__

Measures the time to compute a mean spectral profile over a large rectangular region on a
1000-channel cube.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "cube_B_03200_z01000.<fits|image|hdf5>"
     file_id = 0

2. Frontend loads tiles and sets cursor at (1, 1)

3. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: text

     region_type = RECTANGLE
     control_points = [{x: 800, y: 800}, {x: 400, y: 400}]
     rotation = 0

4. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: text

     file_id = 0
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

5. Backend streams: **SPECTRAL_PROFILE_DATA** with increasing progress

:red-text:`Check 1:` within 120,000 ms:

   - SET_REGION_ACK.success = True
   - SPECTRAL_PROFILE_DATA reaches progress = 1
