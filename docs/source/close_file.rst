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
    Frontend <--[#red] Backend : <font color="red">2. OPEN_FILE_ACK [Check P1]</font>
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    Frontend -> Backend : 4. SET_CURSOR
    Frontend <--[#red] Backend : <font color="red">5. RASTER_TILE_DATA [Check P2]</font>
    Frontend <--[#red] Backend : <font color="red">5. SPATIAL_PROFILE_DATA [Check P2]</font>
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
    Frontend <--[#red] Backend : <font color="red">8. FILE_LIST_RESPONSE</font>
    deactivate Backend
    User <-- Frontend: Backend confirmed alive
    deactivate Frontend

Common preparation checks
~~~~~~~~~~~~~~~~~~~~~~~~~

Every test below opens one or more images before it closes anything. That preparation, and the checks on it, are the same
for all of them and are declared once in
`CloseFileHelpers.ts <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CloseFileHelpers.ts>`__, so the sections below
refer to these two checks rather than restating them.

:red-text:`Check P1:` the OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of an opened image should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = the requested file name
   - OPEN_FILE_ACK.file_id and REGION_HISTOGRAM_DATA.file_id = the requested file_id

:red-text:`Check P2:` the RASTER_TILE_DATA and SPATIAL_PROFILE_DATA which answer ADD_REQUIRED_TILES, SET_CURSOR and
SET_SPATIAL_REQUIREMENTS should satisfy:

   - Every RASTER_TILE_DATA and RASTER_TILE_SYNC carries the file_id of the file it was requested for
   - The stream opens with RasterTileSync.end_sync = False and closes with RasterTileSync.end_sync = True,
     whose tile_count = the number of requested tiles
   - The SPATIAL_PROFILE_DATA which answers SET_CURSOR carries the requested file_id and the cursor coordinates x and y
   - The SPATIAL_PROFILE_DATA which answers SET_SPATIAL_REQUIREMENTS carries the requested file_id, region_id = 0, and
     the requested profile coordinates ["x", "y"]

Where a check below says that no further message arrives, the message count is required to stay unchanged for 500 ms
(``config.timeout.messageEvent``).

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

:red-text:`Check P1` applies.

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

:red-text:`Check P2` applies, with 3 messages streamed: RasterTileSync start + 1 tile + RasterTileSync end.

7. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = 0

:red-text:`Check 1:` after closing the file:

   - No additional messages should be received from the backend

:red-text:`Check 2:` the backend should remain alive:

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

:red-text:`Check P1` applies.

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

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check P2` applies, with 14 messages streamed: RasterTileSync start + 12 tiles + RasterTileSync end.

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

:red-text:`Check 1:` the START_ANIMATION_ACK should satisfy:

   - START_ANIMATION_ACK.success = True

9. Animation plays for 2 channel frames with **ANIMATION_FLOW_CONTROL** sent per frame

10. Frontend sends: **CLOSE_FILE** (``CloseFile``) during animation (without STOP_ANIMATION)

    .. code-block:: protobuf

      file_id = 0

:red-text:`Check 2:` after closing the file during animation:

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

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA** for each file

:red-text:`Check P1` applies to both files.

3. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = 1

4. Frontend sends: **SET_CURSOR** targeting the closed file

   .. code-block:: protobuf

     file_id = 1
     point = {x: 1, y: 1}

5. Backend returns: **ERROR_DATA** (``ErrorData``)

:red-text:`Check 1:` the ERROR_DATA should satisfy:

   .. code-block:: protobuf

     tags = ["cursor"]
     message = "File id 1 not found"

:red-text:`Check 2:` the backend should remain alive:

   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

6. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR** and **SET_SPATIAL_REQUIREMENTS** for file_id = 0

:red-text:`Check 3:` closing file_id = 1 leaves file_id = 0 working: :red-text:`Check P2` applies to file_id = 0, with 3
messages streamed.

**Case 2: Open → Close → Reopen cycle**

7. Frontend sends: **OPEN_FILE** (file_id = 0), loads tiles and sets cursor

   :red-text:`Check P1` and :red-text:`Check P2` apply.

8. Frontend sends: **CLOSE_FILE** (file_id = 0)

9. Frontend sends: **OPEN_FILE** again (same file, file_id = 0), then **ADD_REQUIRED_TILES**, **SET_CURSOR** and
   **SET_SPATIAL_REQUIREMENTS**

:red-text:`Check 4:` the reopened file should function normally: :red-text:`Check P1` and :red-text:`Check P2` apply
again, with 3 messages streamed.

:red-text:`Check 5:` the backend should remain alive after the cycle:

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

:red-text:`Check P1` applies.

3. Frontend loads tiles, sets cursor and spatial requirements

   :red-text:`Check P2` applies, with 3 messages streamed.

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

:red-text:`Check 1:` the SET_REGION_ACK should satisfy:

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

:red-text:`Check 2:` after closing the file during spectral profile streaming:

   - The backend should remain alive
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

**Case 2: Close during dual image spectral profile streaming**

9. Frontend opens two images:

   .. code-block:: protobuf

     file = "S255_IR_sci.spw29.cube.I.pbcor.fits"  (file_id = 0)
     file = "S255_IR_sci.spw25.cube.I.pbcor.fits"  (file_id = 1)

   :red-text:`Check P1` applies to both images.

10. Frontend loads tiles and sets up spatial requirements for both images

    :red-text:`Check P2` applies to both images, with 3 messages streamed for each.

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

:red-text:`Check 3:` after closing both files:

   - No additional messages should be received from the backend

:red-text:`Check 4:` the backend should remain alive:

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

:red-text:`Check P1` applies.

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

:red-text:`Check P2` applies, with 3 messages streamed: RasterTileSync start + 1 tile + RasterTileSync end.

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

:red-text:`Check 1:` after closing the file during tile streaming:

   - The backend should remain alive
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory should contain "set_QA"

CLOSE_FILE_MULTI_FILES
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CLOSE_FILE_MULTI_FILES.test.ts>`__.

This test verifies that multiple files can be closed in various orders and combinations, that closing one file leaves the
files which are still open untouched, and that the backend remains alive and responsive after each scenario.

CLOSE_FILE is not acknowledged in the ICD, so a closed file is probed with a **SET_SPATIAL_REQUIREMENTS** naming it. A file
which is still open answers with **SPATIAL_PROFILE_DATA**; a file which has been closed answers with **ERROR_DATA** and
nothing else.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 3 files

   .. code-block:: protobuf

     file = "M17_SWex.fits", file_id = 0
     file = "M17_SWex.hdf5", file_id = 1
     file = "M17_SWex.image", file_id = 2

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA** for each file

:red-text:`Check P1` applies to each of the three files.

3. For each file: Frontend sends **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

:red-text:`Check P2` applies to each of the three files, with 3 messages streamed for each.

**Case 1: Close files in reverse order (2 -> 1 -> 0)**

4. Frontend sends: **CLOSE_FILE** (file_id = 2)

:red-text:`Check 1:` CLOSE_FILE draws no message of its own

5. Frontend sends: **SET_SPATIAL_REQUIREMENTS** for file_id = 2, then for file_id = 0 and file_id = 1

:red-text:`Check 2:` the closed file is gone and the others are unaffected:

   - The backend returns ERROR_DATA for file_id = 2, with severity = DEBUG, tags = ["spatial"] and
     message = "File id 2 not found"
   - No SPATIAL_PROFILE_DATA follows for file_id = 2 (the error is the only message received)
   - file_id = 0 and file_id = 1 each return SPATIAL_PROFILE_DATA under their own file_id

6. Frontend sends: **CLOSE_FILE** (file_id = 1)

:red-text:`Check 3:` file_id = 1 now returns "File id 1 not found", while file_id = 0 still returns
SPATIAL_PROFILE_DATA under file_id = 0

7. Frontend sends: **CLOSE_FILE** (file_id = 0)

:red-text:`Check 4:` file_id = 0 now returns "File id 0 not found"

:red-text:`Check 5:` after all files closed:

   - Backend should remain alive: FILE_LIST_RESPONSE.success = True and FILE_LIST_RESPONSE.directory
     should contain "set_QA"
   - No additional ICD messages should arrive

**Case 2: Close two files simultaneously, then close the last**

8. Reopen all 3 files with the same setup, repeating :red-text:`Check P1` and :red-text:`Check P2`

9. Frontend sends: **CLOSE_FILE** (file_id = 0) and **CLOSE_FILE** (file_id = 1) simultaneously

:red-text:`Check 6:` after simultaneous close:

   - No additional ICD messages should arrive
   - file_id = 0 and file_id = 1 each return their own "File id N not found" and no SPATIAL_PROFILE_DATA
   - file_id = 2 still returns SPATIAL_PROFILE_DATA under file_id = 2

10. Frontend sends: **CLOSE_FILE** (file_id = 2)

:red-text:`Check 7:` the backend should remain alive:

    - FILE_LIST_RESPONSE.success = True
    - file_id = 2 now returns "File id 2 not found"
    - No additional ICD messages should arrive

**Case 3: Close all three files simultaneously**

11. Reopen all 3 files with the same setup, repeating :red-text:`Check P1` and :red-text:`Check P2`

12. Frontend sends: **CLOSE_FILE** for file_id = 0, 1, and 2 simultaneously

:red-text:`Check 8:` after simultaneous close of all files:

    - No additional ICD messages should arrive
    - Each of file_id = 0, 1 and 2 returns its own "File id N not found" and no SPATIAL_PROFILE_DATA
    - Backend should remain alive: FILE_LIST_RESPONSE.success = True
