Per-Cube Histogram
------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Per-Cube Histogram workflow

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
    Frontend <-- Backend : 5. REGION_HISTOGRAM_DATA
    Frontend <-- Backend : 5. SPATIAL_PROFILE_DATA
    Frontend <-- Backend : 5. RASTER_TILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Request per-cube histogram
    activate Frontend
    Frontend -> Backend : 6. SET_HISTOGRAM_REQUIREMENTS (channel=-2)
    activate Backend

    loop Progress updates
        Frontend <--[#red] Backend : <font color="red">7. REGION_HISTOGRAM_DATA (progress < 1) [Check 1]</font>
    end

    Frontend <--[#red] Backend : <font color="red">8. REGION_HISTOGRAM_DATA (progress=1) [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays per-cube histogram
    deactivate Frontend

PER_CUBE_HISTOGRAM
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PER_CUBE_HISTOGRAM.test.ts>`__.

This test verifies per-cube histogram calculation on a 3D FITS image cube.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "supermosaic.10.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR** at (1, 1)

4. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -2
     histograms = [{channel: -2, num_bins: -1}]

5. Backend streams: **REGION_HISTOGRAM_DATA** with progress updates

:red-text:`Check 1:` at progress > 0.5, the REGION_HISTOGRAM_DATA should satisfy:

   - binWidth = 0.7235205769538879 (4 decimal precision)
   - bins.length = 2775
   - firstBinCenter = -1773.2998046875
   - channel = -2, regionId = -2

:red-text:`Check 2:` at progress = 1.0 (complete), the REGION_HISTOGRAM_DATA should satisfy:

   - bins[2500] = 9359604
   - mean = 18.742310255027036
   - stdDev = 22.534721826342878
   - numBins = 2775

PER_CUBE_HISTOGRAM_HDF5
~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PER_CUBE_HISTOGRAM_HDF5.test.ts>`__.

This test verifies per-cube histogram calculation on an HDF5 image cube with the same data as the FITS test.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "supermosaic.10.hdf5"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2-4. Same cursor, tiles, and histogram requirements as PER_CUBE_HISTOGRAM

:red-text:`Check 1:` at progress = 1.0 (complete), the REGION_HISTOGRAM_DATA should satisfy:

   - binWidth = 0.7235205573004645 (4 decimal precision)
   - bins.length = 2775
   - bins[2500] = 9359604
   - firstBinCenter = -1773.2998608150997
   - numBins = 2775
   - mean = 18.742310241547514 (4 decimal precision)
   - stdDev = 22.534722680160574 (4 decimal precision)
   - regionId = -2, channel = -2

PER_CUBE_HISTOGRAM_CANCELLATION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/PER_CUBE_HISTOGRAM_CANCELLATION.test.ts>`__.

This test verifies histogram computation cancellation and resumption behavior.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "SDC335.579-0.292.spw0-channel-cutted.line.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -2
     histograms = [{channel: -2, num_bins: -1}]

3. Backend streams: **REGION_HISTOGRAM_DATA** with progress > 0

4. After 5 seconds, Frontend cancels by sending: **SET_HISTOGRAM_REQUIREMENTS** with empty histograms

   .. code-block:: protobuf

     file_id = 0
     region_id = -2
     histograms = []

5. Backend returns: **ERROR_DATA** (2 error messages)

:red-text:`Check 1:` the cancellation should satisfy:

   - Initial progress > 0 (computation started)
   - ERROR_DATA received after cancellation

6. After 2-second wait, Frontend retries: **SET_HISTOGRAM_REQUIREMENTS** with original parameters

:red-text:`Check 2:` the resumed computation should satisfy:

   - Final progress = 1.0
   - binWidth = 0.0007966686389409006
   - bins.length = 342
   - bins[170] = 10548
   - firstBinCenter = -0.09137402474880219
   - numBins = 342
   - mean = 0.00005560920907762894
   - stdDev = 0.012523454128847715
