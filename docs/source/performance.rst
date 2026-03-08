Performance Tests
-----------------

The performance test suite measures backend latency and throughput for computationally
intensive operations. Each test uses a Jest timeout as the pass/fail threshold -- if the
backend does not complete the operation within the configured timeout, the test fails.

All performance tests read data files from the ``set_QA_performance`` directory. Three
file formats (FITS, CASA, HDF5) are tested for each operation, enabling cross-format
performance comparison.

Sample images
~~~~~~~~~~~~~

The following data files are used across the performance tests:

.. list-table::
   :header-rows: 1
   :widths: 40 20 20 20

   * - File
     - X (px)
     - Y (px)
     - Z (channels)
   * - ``cube_B_06400_z00100.<fits|image|hdf5>``
     - 6400
     - 6400
     - 100
   * - ``cube_B_03200_z01000.<fits|image|hdf5>``
     - 3200
     - 3200
     - 1000
   * - ``h_m51_b_s05_drz_sci.fits``
     - 8600
     - 12200
     - 1 (2D)
   * - ``S255_IR_sci.spw25.cube.I.pbcor.<fits|image|hdf5>``
     - 1920
     - 1920
     - 480

The synthetic cube files follow a naming convention:

.. code-block:: text

   cube_B_<NNNNN>_z<MMMMM>

where ``B_<NNNNN>`` is the spatial dimension per axis in pixels (square image) and
``z<MMMMM>`` is the number of spectral channels. For example, ``cube_B_06400_z00100``
is a 6400 x 6400 pixel cube with 100 channels.

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
tiles, spatial profiles, and histogram. The elapsed time is measured between the
``OPEN_FILE`` request and the ``REGION_HISTOGRAM_DATA`` response.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_LOAD_IMAGE

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    Client -[#red]> Backend : <font color="red">OPEN_FILE</font>
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    Client <-- Backend : OPEN_FILE_ACK
    Client <--[#red] Backend : <font color="red">REGION_HISTOGRAM_DATA</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client, Backend
        **Timeout starts (openFile: 20,000 ms)**
    end note

    Client -> Backend : ADD_REQUIRED_TILES (9 tiles, ZFP q=11)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (9 tiles + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    note over Client
        **Assert:** OPEN_FILE_ACK.success = True
        **Assert:** RASTER_TILE_DATA count = 9 + 2
    end note

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

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_RASTER_TILE_DATA

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load 1 initial tile ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 2: Request 54 tiles at higher MIP level ==

    note over Client, Backend
        **Timeout starts (readFile: 10,000 ms)**
    end note

    Client -> Backend : ADD_REQUIRED_TILES (54 tiles, ZFP q=11)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA (54 tiles + sync start/end)
    deactivate Backend

    note over Client
        **Assert:** RASTER_TILE_DATA count = 54 + 2
    end note

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
three smoothing modes: NoSmoothing (0), BlockAverage (1), and GaussianBlur (2). The elapsed
time is measured between the ``SET_CONTOUR_PARAMETERS`` request and the last
``CONTOUR_IMAGE_DATA`` response with progress = 1 for all 5 contour levels.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_CONTOUR_DATA

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load initial tiles ==

    Client -> Backend : OPEN_FILE\n(h_m51_b_s05_drz_sci.fits, hdu="0")
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (9 tiles)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (9 tiles + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 2: Set contour parameters ==

    note over Client, Backend
        **Timeout starts (playContour: 12,000 ms)**
    end note

    Client -> Backend : SET_CONTOUR_PARAMETERS (reset)
    Client -[#red]> Backend : <font color="red">SET_CONTOUR_PARAMETERS</font>\n(5 levels, smoothing_mode=<0|1|2>)
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop for each of 5 contour levels
        Client <-- Backend : CONTOUR_IMAGE_DATA (progress < 1)
        Client <--[#red] Backend : <font color="red">CONTOUR_IMAGE_DATA (progress = 1)</font>
    end
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** all 5 levels reach progress = 1
    end note

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
backward channel animation. The elapsed time is measured between the ``START_ANIMATION``
request and the ``STOP_ANIMATION`` request while playing the animation forwardly.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_ANIMATOR_CONTOUR

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Preparation: Open file, load tile, set contours ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync)
    deactivate Backend

    Client -> Backend : SET_CONTOUR_PARAMETERS\n(levels=[-0.01, 0.01], GaussianBlur)
    activate Backend
    Client <-- Backend : CONTOUR_IMAGE_DATA (2 levels)
    deactivate Backend

    == Case 1: Forward animation (channels 1 -> 30) ==

    Client -> Backend : SET_IMAGE_CHANNELS (channel=0)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA
    deactivate Backend

    note over Client, Backend
        **Timeout starts (playAnimator: 300,000 ms)**
    end note

    Client -[#red]> Backend : <font color="red">START_ANIMATION</font>\n(start=ch1, delta=+1, rate=5fps)
    activate Backend
    Client <-- Backend : START_ANIMATION_ACK

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop channel 1 to 30
        Client -> Backend : ADD_REQUIRED_TILES
        Client <-- Backend : RASTER_TILE_DATA (tile + sync)
        Client <-- Backend : CONTOUR_IMAGE_DATA (2 levels)
        Client <-- Backend : REGION_HISTOGRAM_DATA
        Client -> Backend : ANIMATION_FLOW_CONTROL
    end
    deactivate Backend

    Client -[#red]> Backend : <font color="red">STOP_ANIMATION (endFrame=ch30)</font>

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    == Case 2: Backward animation (channels 40 -> 31) ==

    Client -> Backend : SET_IMAGE_CHANNELS (channel=40)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA
    deactivate Backend

    Client -> Backend : START_ANIMATION\n(start=ch40, delta=-1, rate=5fps)
    activate Backend
    Client <-- Backend : START_ANIMATION_ACK

    loop channel 39 down to 31
        Client -> Backend : ADD_REQUIRED_TILES
        Client <-- Backend : RASTER_TILE_DATA (tile + sync)
        Client <-- Backend : CONTOUR_IMAGE_DATA (2 levels)
        Client <-- Backend : REGION_HISTOGRAM_DATA
        Client -> Backend : ANIMATION_FLOW_CONTROL
    end
    deactivate Backend

    Client -> Backend : STOP_ANIMATION (endFrame=ch30)

    note over Client
        **Assert:** channels in ascending order (Case 1)
        **Assert:** channels in descending order (Case 2)
    end note

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
(500 ms vs 300,000 ms) to verify the cached result is returned quickly. The elapsed time
is measured between the ``SET_HISTOGRAM_REQUIREMENTS`` request and the
``REGION_HISTOGRAM_DATA`` response with progress = 1.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_CUBE_HISTOGRAM

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load initial tiles ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (9 tiles)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (9 tiles + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 2: Request cube histogram ==

    note over Client, Backend
        **Timeout starts**
        FITS/CASA: 300,000 ms | HDF5: 500 ms
    end note

    Client -[#red]> Backend : <font color="red">SET_HISTOGRAM_REQUIREMENTS</font>\n(region=-2, channel=-2, num_bins=-1)
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop streaming progress
        Client <-- Backend : REGION_HISTOGRAM_DATA (progress < 1)
    end
    Client <--[#red] Backend : <font color="red">REGION_HISTOGRAM_DATA (progress = 1)</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** progress reaches 1
    end note

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

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_MOMENTS

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file ==

    Client -> Backend : OPEN_FILE\n(S255_IR_sci.spw25.cube.I.pbcor)
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    == Step 2: Load tiles and set spectral profile ==

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=960, y=960)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    Client -> Backend : SET_SPECTRAL_REQUIREMENTS (Sum)
    activate Backend
    loop streaming progress
        Client <-- Backend : SPECTRAL_PROFILE_DATA (progress < 1)
    end
    Client <-- Backend : SPECTRAL_PROFILE_DATA (progress = 1)
    deactivate Backend

    == Step 3: Request 13 moments ==

    note over Client, Backend
        **Timeout starts (momentTimeout: 400,000 ms)**
    end note

    Client -> Backend : MOMENT_REQUEST\n(moments=[0..12], axis=SPECTRAL,\nmask=Include, pixelRange=[0.1,1.0])
    activate Backend
    Client <-- Backend : REGION_HISTOGRAM_DATA x 13\n(one per moment image)
    Client <--[#red] Backend : <font color="red">MOMENT_RESPONSE\n(13 openFileAcks)</font>
    deactivate Backend

    note over Client
        **Assert:** MOMENT_RESPONSE.success = True
        **Assert:** openFileAcks.length = 13
        **Assert:** all openFileAcks[].success = True
    end note

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

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_PV

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1-3: Open file and set up region ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    activate Backend
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 4: Create LINE region ==

    Client -> Backend : SET_REGION\n(LINE, rotation=135)
    activate Backend
    Client <-- Backend : SET_REGION_ACK (regionId=1)
    deactivate Backend

    == Step 5: Request PV diagram ==

    note over Client, Backend
        **Timeout starts (pvTimeout: 200,000 ms)**
    end note

    Client -> Backend : PV_REQUEST\n(fileId=0, regionId=1, width=3)
    activate Backend
    loop streaming progress
        Client <-- Backend : PV_PROGRESS (progress < 1)
    end
    Client <-- Backend : PV_PROGRESS (progress = 1)
    Client <-- Backend : REGION_HISTOGRAM_DATA
    Client <--[#red] Backend : <font color="red">PV_RESPONSE (success = True)</font>
    deactivate Backend

    == Step 6: Load PV output tiles ==

    Client -> Backend : ADD_REQUIRED_TILES\n(fileId=1, 13 tiles)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA (13 tiles + sync start/end)
    deactivate Backend

    note over Client
        **Assert:** PV_RESPONSE.success = True
        **Assert:** PV progress reaches 1
        **Assert:** 1 REGION_HISTOGRAM_DATA
        **Assert:** RASTER_TILE_DATA count = 13 + 2
    end note

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

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_REGION_SPECTRAL_PROFILE

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load initial tile ==

    Client -> Backend : OPEN_FILE\n(cube_B_03200_z01000)
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 2: Create rectangle region ==

    Client -> Backend : SET_REGION\n(RECTANGLE, center=(800,800),\nsize=400x400, rotation=0)
    activate Backend
    Client <-- Backend : SET_REGION_ACK (regionId=1)
    deactivate Backend

    == Step 3: Request spectral profile ==

    note over Client, Backend
        **Timeout starts (120,000 ms)**
    end note

    Client -> Backend : SET_SPECTRAL_REQUIREMENTS\n(regionId=1, stats=[Mean])
    activate Backend
    loop streaming progress
        Client <-- Backend : SPECTRAL_PROFILE_DATA (progress < 1)
    end
    Client <--[#red] Backend : <font color="red">SPECTRAL_PROFILE_DATA (progress = 1)</font>
    deactivate Backend

    note over Client
        **Assert:** SET_REGION_ACK.success = True
        **Assert:** SPECTRAL_PROFILE_DATA progress = 1
    end note

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
