Animator
--------

.. uml::

    skinparam style strictuml
    hide footbox
    title Animation workflow

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

    User -> Frontend: Set up contours (optional)
    activate Frontend
    Frontend -> Backend : 6. SET_CONTOUR_PARAMETERS
    activate Backend
    Frontend <-- Backend : 7. CONTOUR_IMAGE_DATA
    deactivate Backend
    User <-- Frontend: Displays contours
    deactivate Frontend

    User -> Frontend: Start animation
    activate Frontend
    Frontend -> Backend : 8. START_ANIMATION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">9. START_ANIMATION_ACK [Check 1]</font>

    loop Animation frames
        Frontend <-- Backend : 10. RASTER_TILE_DATA
        Frontend <-- Backend : 10. REGION_HISTOGRAM_DATA
        Frontend <-- Backend : 10. CONTOUR_IMAGE_DATA (if contours set)
        Frontend -> Backend : 11. ANIMATION_FLOW_CONTROL
    end

    Frontend -> Backend : 12. STOP_ANIMATION
    deactivate Backend
    User <-- Frontend: Animation stopped
    deactivate Frontend

ANIMATOR_DATA_STREAM
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ANIMATOR_DATA_STREAM.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

4. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 319, y: 378}

5. Frontend sends: **SET_SPATIAL_REQUIREMENTS** (``SetSpatialRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 0
     spatial_profiles = [{coordinate: "x"}, {coordinate: "y"}]

6. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetStatsRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     stats_configs = [{
         coordinate: "z",
         stats_types: [NumPixels, Sum, FluxDensity, Mean, RMS, Sigma, SumSq, Min, Max, Extrema]
     }]

7. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     histograms = [{channel: -1, num_bins: -1}]

8. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``)

   .. code-block:: protobuf

     file_id = 0
     channel = 12
     stokes = 0
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 11}

9. Backend returns: **RASTER_TILE_DATA**, **REGION_HISTOGRAM_DATA**, **REGION_STATS_DATA**, **SPATIAL_PROFILE_DATA**

:red-text:`Check 1:` the backend messages should satisfy:

   - RASTER_TILE_DATA, SPATIAL_PROFILE_DATA, REGION_HISTOGRAM_DATA, and REGION_STATS_DATA should all arrive within 3000 ms

   - RASTER_TILE_DATA should contain:

   .. code-block:: protobuf

     channel = 12

   - REGION_HISTOGRAM_DATA should contain:

   .. code-block:: protobuf

     region_id = -1

   - REGION_STATS_DATA should contain:

   .. code-block:: protobuf

     region_id = -1
     channel = 12

   - SPATIAL_PROFILE_DATA should contain:

   .. code-block:: protobuf

     channel = 12
     x = 319
     y = 378

ANIMATOR_NAVIGATION
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ANIMATOR_NAVIGATION.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   File 1:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.hdf5"
     file_id = 0
     hdu = "0"
     render_mode = RASTER

   File 2:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.hdf5"
     file_id = 1
     hdu = "0"
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) for each file

4. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) for each file to load initial tiles

5. Frontend navigates channels/stokes on each file:

   Case 1 (file 0, channel 2, stokes 1):

   .. code-block:: protobuf

     file_id = 0
     channel = 2
     stokes = 1
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 11}

   Case 2 (file 1, channel 12, stokes 0):

   .. code-block:: protobuf

     file_id = 1
     channel = 12
     stokes = 0
     required_tiles = {file_id: 1, tiles: [0], compression_type: ZFP, compression_quality: 11}

   Case 3 (file 0, invalid channel 100, stokes 3 — no required tiles):

   .. code-block:: protobuf

     file_id = 0
     channel = 100
     stokes = 3

   Case 4 (file 1, invalid channel 100, stokes 1 — no required tiles):

   .. code-block:: protobuf

     file_id = 1
     channel = 100
     stokes = 1

   Case 5 (invalid file 2):

   .. code-block:: protobuf

     file_id = 2
     channel = 0
     stokes = 0

   Case 6 (file 0, return to channel 0, stokes 0):

   .. code-block:: protobuf

     file_id = 0
     channel = 0
     stokes = 0
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 11}

:red-text:`Check 1:` the backend messages should satisfy:

   - For valid navigation (Cases 1, 2, 6): REGION_HISTOGRAM_DATA and RASTER_TILE_DATA should arrive within 3000 ms

   - Case 1 REGION_HISTOGRAM_DATA should contain:

   .. code-block:: protobuf

     region_id = -1
     stokes = 1
     channel = 2

   - Case 1 RASTER_TILE_DATA should contain:

   .. code-block:: protobuf

     file_id = 0
     channel = 2
     stokes = 1

   - Case 2 REGION_HISTOGRAM_DATA should contain:

   .. code-block:: protobuf

     region_id = -1
     stokes = 0
     channel = 12

   - Case 2 RASTER_TILE_DATA should contain:

   .. code-block:: protobuf

     file_id = 1
     channel = 12
     stokes = 0

   - For invalid navigation (Cases 3, 4, 5): ERROR_DATA should be returned instead

   - Case 6 REGION_HISTOGRAM_DATA should contain:

   .. code-block:: protobuf

     region_id = -1
     stokes = 0
     channel = 0

   - Case 6 RASTER_TILE_DATA should contain:

   .. code-block:: protobuf

     file_id = 0
     channel = 0
     stokes = 0

ANIMATOR_CONTOUR
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ANIMATOR_CONTOUR.test.ts>`__.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

3. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

4. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 640, y_min: 0, y_max: 800}
     levels = [-0.01, 0.01]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

5. Backend returns: **CONTOUR_IMAGE_DATA** (for each contour level)

**Case 1: Forward animation (channels 1 → 10)**

6. Frontend sends: **START_ANIMATION** (``StartAnimation``)

   .. code-block:: protobuf

     file_id = 0
     start_frame = {channel: 1, stokes: 0}
     first_frame = {channel: 0, stokes: 0}
     last_frame = {channel: 24, stokes: 0}
     delta_frame = {channel: 1, stokes: 0}
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 9}
     looping = false
     reverse = false
     frame_rate = 5

7. Backend returns: **START_ANIMATION_ACK** (``StartAnimationAck``)

:red-text:`Check 1:` the backend messages should satisfy:

   - START_ANIMATION_ACK.success = True

   - For each animated frame: RASTER_TILE_DATA, REGION_HISTOGRAM_DATA, and CONTOUR_IMAGE_DATA should arrive in channel sequence

   - Received RasterTileData channels should be in ascending order (1, 2, 3, ...)

   - Received ContourData channels should be in ascending order, with 2 contour levels per channel

   - Received RegionHistogramData channels should be in ascending order

8. Frontend sends: **STOP_ANIMATION** (``StopAnimation``)

   .. code-block:: protobuf

     file_id = 0
     end_frame = {channel: 10, stokes: 0}

**Case 2: Backward animation (channels 20 → 10)**

9. Frontend sends: **START_ANIMATION** (``StartAnimation``)

   .. code-block:: protobuf

     file_id = 0
     start_frame = {channel: 20, stokes: 0}
     first_frame = {channel: 0, stokes: 0}
     last_frame = {channel: 24, stokes: 0}
     delta_frame = {channel: -1, stokes: 0}
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 9}
     looping = false
     reverse = false
     frame_rate = 5

:red-text:`Check 2:` the backend messages should satisfy:

   - START_ANIMATION_ACK.success = True

   - Received RasterTileData channels should be in descending order (19, 18, 17, ...)

   - Received ContourData channels should be in descending order

   - Received RegionHistogramData channels should be in descending order

10. Frontend sends: **STOP_ANIMATION** (``StopAnimation``)

    .. code-block:: protobuf

      file_id = 0
      end_frame = {channel: 10, stokes: 0}

ANIMATOR_CONTOUR_MATCH
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ANIMATOR_CONTOUR_MATCH.test.ts>`__.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   File 1:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

   File 2:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 1
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) for each file

3. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

4. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``) for cross-file matching

   Contour on file 0, referenced to file 1:

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 1
     image_bounds = {x_min: 0, x_max: 640, y_min: 0, y_max: 800}
     levels = [-0.01, 0.01]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

   Contour on file 1, referenced to file 1:

   .. code-block:: protobuf

     file_id = 1
     reference_file_id = 1
     image_bounds = {x_min: 0, x_max: 640, y_min: 0, y_max: 800}
     levels = [-0.01, 0.01]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

5. Frontend sends: **START_ANIMATION** (``StartAnimation``) with matched frames

   .. code-block:: protobuf

     file_id = 0
     start_frame = {channel: 1, stokes: 0}
     first_frame = {channel: 0, stokes: 0}
     last_frame = {channel: 24, stokes: 0}
     delta_frame = {channel: 1, stokes: 0}
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 9}
     looping = false
     reverse = false
     frame_rate = 5
     matched_frames = {1: {frame_numbers: [0, 1, 2, ..., 24]}}

6. Backend returns: **START_ANIMATION_ACK** (``StartAnimationAck``)

:red-text:`Check 1:` the backend messages should satisfy:

   - START_ANIMATION_ACK.success = True

   - For each animated channel: ContourImageData should arrive for both file_id = 0 and file_id = 1

   - All ContourImageData.reference_file_id = 1

   - Total ContourImageData count = stop_channel * num_levels * num_files

   - Received image channels should be in ascending order

7. Frontend sends: **STOP_ANIMATION** (``StopAnimation``)

   .. code-block:: protobuf

     file_id = 0
     end_frame = {channel: 10, stokes: 0}

CHANNEL_MAP
~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CHANNEL_MAP.test.ts>`__.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for four image formats

   File 1 (FITS):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

   File 2 (CASA IMAGE):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 1
     render_mode = RASTER

   File 3 (MIRIAD):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.miriad"
     hdu = ""
     file_id = 2
     render_mode = RASTER

   File 4 (HDF5):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.hdf5"
     hdu = ""
     file_id = 3
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) for each file

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   .. code-block:: protobuf

     success = True
     file_id = <matching file_id>

3. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for each file

   .. code-block:: protobuf

     file_id = <0-3>
     tiles = [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722]
     compression_type = ZFP
     compression_quality = 11

4. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) stream

:red-text:`Check 2:` the RASTER_TILE_DATA should satisfy:

   - Total messages = tiles.length + 2 (including RasterTileSync start and end)

   - RASTER_TILE_DATA should contain:

   .. code-block:: protobuf

     file_id = <matching file_id>
     channel = 0
     stokes = 0

5. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) with channel map enabled (channels 1-3)

   .. code-block:: protobuf

     file_id = <0-3>
     channel = 0
     stokes = 0
     required_tiles = {file_id: 0, tiles: [9 tiles], compression_type: ZFP, compression_quality: 11}
     channel_range = {min: 1, max: 3}
     current_range = {min: 0, max: 3}
     channel_map_enabled = true

6. Backend returns: **RASTER_TILE_DATA** streams for 3 channels

:red-text:`Check 3:` the channel map RASTER_TILE_DATA should satisfy:

   - Three sets of RASTER_TILE_DATA arrive (one per channel in range)

   - 1st set: channel = 1, 2nd set: channel = 2, 3rd set: channel = 3

   - All sets share the same file_id and stokes = 0

   - Each tile should contain: layer = 2, x in [0, 1, 2], y in [0, 1, 2], width in [128, 256], height = 256

7. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) with updated channel range (channel 4)

   .. code-block:: protobuf

     file_id = <0-3>
     channel = 4
     stokes = 0
     required_tiles = {file_id: 0, tiles: [9 tiles], compression_type: ZFP, compression_quality: 11}
     channel_range = {min: 4, max: 4}
     current_range = {min: 1, max: 4}
     channel_map_enabled = true

:red-text:`Check 4:` the new channel map RASTER_TILE_DATA should satisfy:

   - One set of RASTER_TILE_DATA arrives for channel 4

   - RASTER_TILE_DATA.channel = 4, stokes = 0

   - Tile properties: layer = 2, x in [0, 1, 2], y in [0, 1, 2], width in [128, 256], height = 256
