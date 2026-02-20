File Browser
------------

.. uml::

    skinparam style strictuml
    hide footbox
    title File browsing and opening workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Loads app/page
    activate Frontend
    Frontend -> Backend : Connects to backend (WS)
    activate Backend
    Frontend <-- Backend : Connection response (WS)
    Frontend -> Backend : 1. REGISTER_VIEWER
    Frontend <-- Backend : 2. REGISTER_VIEWER_ACK
    deactivate Backend
    User <-- Frontend: Connection established
    deactivate Frontend

    User -> Frontend: Browse files
    activate Frontend
    Frontend -> Backend : 3. FILE_LIST_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. FILE_LIST_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays file list
    deactivate Frontend

    User -> Frontend: Select a file
    activate Frontend
    Frontend -> Backend : 5. FILE_INFO_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. FILE_INFO_RESPONSE [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays file info
    deactivate Frontend

    User -> Frontend: Open a file
    activate Frontend
    Frontend -> Backend : 7. OPEN_FILE
    activate Backend
    Frontend <--[#red] Backend : <font color="red">8. OPEN_FILE_ACK [Check 3]</font>
    Frontend -> Backend : 9. ADD_REQUIRED_TILES
    Frontend <-- Backend : 10. RASTER_TILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

ACCESS_WEBSOCKET
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_WEBSOCKET.test.ts>`__.

This test verifies raw WebSocket connectivity to the CARTA backend without using the ICD protocol layer.

1. Frontend creates: **WebSocket** connection to the server URL

:red-text:`Check 1:` the WebSocket state transitions should satisfy:

   - Immediately after construction: ``readyState = CONNECTING (0)``

   - After the ``onopen`` event fires: ``readyState = OPEN (1)``

   - After calling ``close()``: ``readyState = CLOSING (2)``

   - After the ``onclose`` event fires: ``readyState = CLOSED (3)``

   - All transitions should complete within 1100 ms

GET_FILELIST_ROOTPATH_CONCURRENT
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/GET_FILELIST_ROOTPATH_CONCURRENT.test.ts>`__.

This test verifies that multiple concurrent clients receive consistent file listings from the backend.

1. N clients connect and send: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: protobuf

     session_id = 0
     client_feature_flags = 5

2. Each client sends: **FILE_LIST_REQUEST** (``FileListRequest``)

   .. code-block:: protobuf

     directory = "$BASE"

3. Backend returns to each client: **FILE_LIST_RESPONSE** (``FileListResponse``)

:red-text:`Check 1:` the backend messages should satisfy:

   - Every FILE_LIST_RESPONSE.success = True

   - All FILE_LIST_RESPONSE.files[] arrays are identical across all N clients

   - All FILE_LIST_RESPONSE.subdirectories[] arrays are identical across all N clients

FILEINFO_FITS_MULTIHDU
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FILEINFO_FITS_MULTIHDU.test.ts>`__.

1. Frontend sends: **REGISTER_VIEWER** and gets basepath via **FILE_LIST_REQUEST**

2. Frontend sends: **FILE_INFO_REQUEST** (``FileInfoRequest``)

   .. code-block:: protobuf

     file = "spire500_ext.fits"
     hdu = ""

3. Backend returns: **FILE_INFO_RESPONSE** (``FileInfoResponse``)

:red-text:`Check 1:` the FILE_INFO_RESPONSE should satisfy:

   - FILE_INFO_RESPONSE.success = True

   - FILE_INFO_RESPONSE.file_info should contain:

   .. code-block:: protobuf

     name = "spire500_ext.fits"
     type = FITS
     size = 17591040
     HDU_List = [""]

:red-text:`Check 2:` the file_info_extended for HDU '1' (image) should satisfy:

   .. code-block:: protobuf

     dimensions = 2
     width = 830
     height = 870
     depth = 1
     stokes = 1
     stokes_vals = []

   - Computed entries should include:

   .. code-block:: text

     Name = "spire500_ext.fits"
     Data type = "double"
     HDU = "1"
     Extension name = "image"
     Shape = "[830, 870] (RA, DEC)"
     Coordinate type = "Right Ascension, Declination"
     Projection = "TAN"
     Image reference pixels = "[371, 421]"
     Celestial frame = "FK5, J2000"
     Pixel unit = "MJy/sr"
     Pixel increment = "-14", 14""

   - Header entries count = 53

:red-text:`Check 3:` the file_info_extended for HDU '6' (error) should satisfy:

   .. code-block:: protobuf

     dimensions = 2
     width = 830
     height = 870
     depth = 1
     stokes = 1
     stokes_vals = []

   - Computed entries should include:

   .. code-block:: protobuf

     Extension name = "error"
     Pixel unit = "MJy/sr"

   - Header entries count = 53

:red-text:`Check 4:` the file_info_extended for HDU '7' (coverage) should satisfy:

   .. code-block:: protobuf

     dimensions = 2
     width = 830
     height = 870
     depth = 1
     stokes = 1
     stokes_vals = []

   - Computed entries should include:

   .. code-block:: protobuf

     Extension name = "coverage"
     Pixel unit = "1"

   - Header entries count = 53

FILEINFO_EXCEPTIONS
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FILEINFO_EXCEPTIONS.test.ts>`__.

1. Frontend sends: **REGISTER_VIEWER** and gets basepath via **FILE_LIST_REQUEST**

2. Frontend sends: **FILE_INFO_REQUEST** (``FileInfoRequest``) for invalid files

   Case 1 (non-existent file):

   .. code-block:: protobuf

     file = "no_such_file.image"
     hdu = "0"

   Case 2 (corrupted file):

   .. code-block:: protobuf

     file = "broken_header.miriad"
     hdu = "0"

3. Backend returns: error response

:red-text:`Check 1:` the error responses should satisfy:

   - Case 1: error message = "File no_such_file.image does not exist."

   - Case 2: error message = "Image must be 2D, 3D or 4D."

OPEN_SWAPPED_IMAGES
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/OPEN_SWAPPED_IMAGES.test.ts>`__.

This test verifies that images with non-standard axis orderings can be opened and navigated correctly.

**Case 1: RA-Freq-Dec-Stokes axis ordering**

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU-swap-rfds.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   .. code-block:: protobuf

     success = True
     file_info.name = "HH211_IQU-swap-rfds.image"
     file_info_extended.dimensions = 4
     file_info_extended.width = 1049
     file_info_extended.height = 5
     file_info_extended.depth = 1049
     file_info_extended.stokes = 3
     file_info_extended.axes_numbers = {
         spatial_x: 1, spatial_y: 3, spectral: 2, stokes: 4, depth: 3
     }

3. Frontend sends: **SET_IMAGE_CHANNELS** to channel 500, then **SET_CURSOR**

   .. code-block:: protobuf

     channel = 500
     point = {x: 510, y: 2}

:red-text:`Check 2:` the SPATIAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     channel = 500
     x = 510
     y = 2
     value = 0.0015299528604373336

**Case 2: RA-Stokes-Dec-Freq axis ordering (two images)**

4. Frontend opens two images:

   .. code-block:: protobuf

     file = "HH211_IQU-swap-rsdf.image"  (file_id = 0)
     file = "HH211_IQU.fits"             (file_id = 1)

:red-text:`Check 3:` the OPEN_FILE_ACK for the swapped image should satisfy:

   .. code-block:: protobuf

     success = True
     file_info.name = "HH211_IQU-swap-rsdf.image"
     file_info_extended.dimensions = 4
     file_info_extended.width = 1049
     file_info_extended.height = 1049
     file_info_extended.depth = 5
     file_info_extended.stokes = 3
     file_info_extended.axes_numbers = {
         spatial_x: 1, spatial_y: 3, spectral: 4, stokes: 2, depth: 4
     }

5. Frontend sends: **SET_CURSOR** on both images at the same point

   .. code-block:: protobuf

     point = {x: 555, y: 586}

:red-text:`Check 4:` the SPATIAL_PROFILE_DATA from both images should satisfy:

   - Both return the same pixel value at (555, 586):

   .. code-block:: protobuf

     value = 0.00048562639858573675

**Case 3: Freq-Dec-Stokes-RA axis ordering**

6. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     file = "HH211_IQU-swap-fdsr.image"
     file_id = 0

:red-text:`Check 5:` the OPEN_FILE_ACK should satisfy:

   .. code-block:: protobuf

     success = True
     file_info_extended.width = 5
     file_info_extended.height = 1049
     file_info_extended.depth = 1049
     file_info_extended.stokes = 3
     file_info_extended.axes_numbers = {
         spatial_x: 4, spatial_y: 2, spectral: 1, stokes: 3, depth: 4
     }

7. Frontend sends: **SET_IMAGE_CHANNELS** to channel 522, then **SET_CURSOR**

   .. code-block:: protobuf

     channel = 522
     point = {x: 4, y: 521}

:red-text:`Check 6:` the SPATIAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     channel = 522
     x = 4
     y = 521
     value = 0.03848038613796234

**Case 4: Stokes-glon-vard-glat axis ordering**

8. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     file = "supermosaic.10-cutted-stokes-glon-vard-glat.image"
     file_id = 0

:red-text:`Check 7:` the OPEN_FILE_ACK should satisfy:

   .. code-block:: protobuf

     success = True
     file_info_extended.width = 483
     file_info_extended.height = 51
     file_info_extended.depth = 403
     file_info_extended.stokes = 1
     file_info_extended.axes_numbers = {
         spatial_x: 2, spatial_y: 4, spectral: 3, stokes: 1, depth: 4
     }

9. Frontend sends: **SET_IMAGE_CHANNELS** to channel 112, then **SET_CURSOR**

   .. code-block:: protobuf

     channel = 112
     point = {x: 477, y: 12}

:red-text:`Check 8:` the SPATIAL_PROFILE_DATA should satisfy:

   .. code-block:: protobuf

     channel = 112
     x = 477
     y = 12
     value = 20.193593978881836
