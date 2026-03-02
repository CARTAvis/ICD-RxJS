Close File
----------

.. uml::

    skinparam style strictuml
    hide footbox
    title Close file workflow

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

    User -> Frontend: Close image
    activate Frontend
    Frontend -> Backend : 6. CLOSE_FILE
    activate Backend
    deactivate Backend
    deactivate Frontend

    note over Frontend, Backend
        After CLOSE_FILE, the backend should
        stop sending messages for the closed file.
        The backend should remain alive and responsive.
    end note

    User -> Frontend: Verify backend alive
    activate Frontend
    Frontend -> Backend : 7. FILE_LIST_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">8. FILE_LIST_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Backend confirmed alive
    deactivate Frontend

CLOSE_FILE_SINGLE
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_SINGLE.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.fits"

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

7. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = 0

:red-text:`Check 3:` after closing the file:

   - No additional messages should be received from the backend (message count should not change after 1000 ms)

:red-text:`Check 4:` the backend should remain alive:

   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

CLOSE_FILE_ANIMATION
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_ANIMATION.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "M17_SWex.fits"

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [33558529, 33558528, 33562625, 33554433, 33562624,
              33558530, 33554432, 33562626, 33554434, 33566721,
              33566720, 33566722]

5. Frontend sends: **SET_CURSOR** and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     point = {x: 320, y: 400}

6. Backend returns: **RASTER_TILE_DATA** stream (12 tiles + 2 sync = 14 messages)

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 14 (12 tiles + RasterTileSync start + RasterTileSync end)

7. Frontend sends: **START_ANIMATION** (``StartAnimation``)

   .. code-block:: protobuf

     file_id = 0
     start_frame = {channel: 1, stokes: 0}
     first_frame = {channel: 0, stokes: 0}
     last_frame = {channel: 24, stokes: 0}
     delta_frame = {channel: 1, stokes: 0}
     required_tiles = {file_id: 0, tiles: [12 tiles], compression_type: ZFP, compression_quality: 9}
     looping = true
     reverse = false
     frame_rate = 5

8. Backend returns: **START_ANIMATION_ACK** (``StartAnimationAck``)

:red-text:`Check 3:` the START_ANIMATION_ACK should satisfy:

   - START_ANIMATION_ACK.success = True

9. Animation plays for 2 channel frames with **ANIMATION_FLOW_CONTROL** sent per frame

10. Frontend sends: **CLOSE_FILE** (``CloseFile``) during animation (without STOP_ANIMATION)

    .. code-block:: protobuf

      file_id = 0

:red-text:`Check 4:` after closing the file during animation:

   - The backend should remain alive
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

CLOSE_FILE_ERROR
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_ERROR.test.ts>`__.

**Case 1: Requesting ICD message of a closed file**

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two files

   File 1:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

   File 2:

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.hdf5"
     hdu = "0"
     file_id = 1
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** for each file

:red-text:`Check 1:` both OPEN_FILE_ACK should satisfy:

   - success = True

3. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = 1

4. Frontend sends: **SET_CURSOR** targeting the closed file

   .. code-block:: protobuf

     file_id = 1
     point = {x: 1, y: 1}

5. Backend returns: **ERROR_DATA** (``ErrorData``)

:red-text:`Check 2:` the ERROR_DATA should satisfy:

   .. code-block:: protobuf

     tags = ["cursor"]
     message = "File id 1 not found"

:red-text:`Check 3:` the backend should remain alive:

   - FILE_LIST_RESPONSE.success = True

:red-text:`Check 4:` file_id = 0 should still function normally:

   - ADD_REQUIRED_TILES, SET_CURSOR, and SET_SPATIAL_REQUIREMENTS should all receive valid responses
   - RASTER_TILE_DATA stream length = 3

**Case 2: Open → Close → Reopen cycle**

6. Frontend sends: **OPEN_FILE** (file_id = 0), loads tiles and sets cursor

7. Frontend sends: **CLOSE_FILE** (file_id = 0)

8. Frontend sends: **OPEN_FILE** again (same file, file_id = 0)

:red-text:`Check 5:` the reopened file should function normally:

   - OPEN_FILE_ACK.success = True
   - ADD_REQUIRED_TILES, SET_CURSOR, and SET_SPATIAL_REQUIREMENTS receive valid responses
   - RASTER_TILE_DATA stream length = 3

:red-text:`Check 6:` the backend should remain alive after the cycle:

   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

CLOSE_FILE_SPECTRAL_PROFILE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_SPECTRAL_PROFILE.test.ts>`__.

**Case 1: Close during single image spectral profile streaming**

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "S255_IR_sci.spw29.cube.I.pbcor.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - success = True

3. Frontend loads tiles, sets cursor and spatial requirements

4. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_info = {
         region_type = RECTANGLE,
         control_points = [{x: 630.0, y: 1060.0}, {x: 600.0, y: 890.0}],
         rotation = 0.0
     }

5. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 2:` the SET_REGION_ACK should satisfy:

   .. code-block:: protobuf

     success = True
     region_id = 1

6. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

7. Backend streams: **SPECTRAL_PROFILE_DATA** with increasing progress

8. Once progress > 0.3, Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = 0

:red-text:`Check 3:` after closing the file during spectral profile streaming:

   - The backend should remain alive
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

**Case 2: Close during dual image spectral profile streaming**

9. Frontend opens two images:

   .. code-block:: protobuf

     file = "S255_IR_sci.spw29.cube.I.pbcor.fits"  (file_id = 0)
     file = "S255_IR_sci.spw25.cube.I.pbcor.fits"  (file_id = 1)

10. Frontend loads tiles and sets up spatial requirements for both images

11. Frontend sends: **SET_REGION** on file_id = 0

12. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** on file_id = 0

    .. code-block:: protobuf

      file_id = 0
      region_id = 1
      spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

13. Once progress > 0.3, cancel first image spectral requirements

14. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** on file_id = 1 (via matching region)

    .. code-block:: protobuf

      file_id = 1
      region_id = 1
      spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

15. Once progress > 0.3, Frontend sends: **CLOSE_FILE** for both images

    .. code-block:: protobuf

      file_id = 0
      file_id = 1

:red-text:`Check 4:` after closing both files:

   - No additional messages should be received from the backend

:red-text:`Check 5:` the backend should remain alive:

   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

CLOSE_FILE_TILE
~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_TILE.test.ts>`__.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - success = True

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

7. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) to trigger large tile streaming

   .. code-block:: protobuf

     file_id = 0
     channel = 10
     stokes = 0
     required_tiles = {
         file_id: 0,
         compression_type: ZFP,
         compression_quality: 11,
         tiles: [33558529, 33558528, 33562625, 33554433, 33562624,
                 33558530, 33554432, 33562626, 33554434, 33566721,
                 33566720, 33566722]
     }

8. During tile streaming, Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = 0

:red-text:`Check 3:` after closing the file during tile streaming:

   - The backend should remain alive
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

CLOSE_FILE_MULTI_FILES
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_MULTI_FILES.test.ts>`__.

This test verifies that multiple files can be closed in various orders and combinations, and that the backend remains alive and responsive after each scenario.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 3 files

   .. code-block:: protobuf

     file = "M17_SWex.fits", file_id = 0
     file = "M17_SWex.hdf5", file_id = 1
     file = "M17_SWex.image", file_id = 2

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA** for each file

3. For each file: Frontend sends **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

**Case 1: Close files in reverse order (2 -> 1 -> 0)**

4. Frontend sends: **CLOSE_FILE** (file_id = 2), then verifies remaining files respond to spatial requirements

5. Frontend sends: **CLOSE_FILE** (file_id = 1), then verifies remaining file responds

6. Frontend sends: **CLOSE_FILE** (file_id = 0)

:red-text:`Check 1:` after all files closed:

   - Backend should remain alive: FILE_LIST_RESPONSE.success = True
   - No additional ICD messages should arrive (message count stable for 500 ms)

**Case 2: Close two files simultaneously, then close the last**

7. Reopen all 3 files with the same setup

8. Frontend sends: **CLOSE_FILE** (file_id = 0) and **CLOSE_FILE** (file_id = 1) simultaneously

:red-text:`Check 2:` after simultaneous close:

   - No additional ICD messages should arrive (message count stable for 500 ms)

9. Frontend sends: **CLOSE_FILE** (file_id = 2)

:red-text:`Check 3:` the backend should remain alive:

   - FILE_LIST_RESPONSE.success = True

**Case 3: Close all three files simultaneously**

10. Reopen all 3 files with the same setup

11. Frontend sends: **CLOSE_FILE** for file_id = 0, 1, and 2 simultaneously

:red-text:`Check 4:` after simultaneous close of all files:

    - Backend should remain alive: FILE_LIST_RESPONSE.success = True
    - No additional ICD messages should arrive (message count stable for 500 ms)
