Tile Data Request
-----------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Tile Data Request workflow

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

    User -> Frontend: Request tiles at zoom level
    activate Frontend
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. RASTER_TILE_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Tiles rendered
    deactivate Frontend

TILE_DATA_REQUEST
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/TILE_DATA_REQUEST.test.ts>`__.

This test verifies that raster tile data is correctly returned for multiple tile requests at different zoom layers, including validation of tile coordinates and completeness.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "cluster_04096.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``)

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for 4 tiles at layer 1

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = NONE
     tiles = [16777216, 16781312, 16777217, 16781313]

4. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) stream with RasterTileSync start/end

:red-text:`Check 2:` the RASTER_TILE_DATA should satisfy:

   - 4 tiles returned, each with tiles.length = 1

   - Tiles have coordinates: (0,0), (1,0), (0,1), (1,1) — all at layer 1

   - RASTER_TILE_DATA.file_id = 0

   - RASTER_TILE_DATA.channel = 0

   - RASTER_TILE_DATA.stokes = 0

   - RASTER_TILE_DATA.compression_type = NONE

**Layer 2 tiles with ZFP compression**

5. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for 3 tiles at layer 2

   .. code-block:: protobuf

     file_id = 0
     compression_type = ZFP
     compression_quality = 11
     tiles = [33558529, 33562626, 33566723]

6. Backend returns: **RASTER_TILE_DATA** stream

:red-text:`Check 3:` the RASTER_TILE_DATA should satisfy:

   - 3 tiles returned: (1,1,layer=2), (2,2,layer=2), (3,3,layer=2)

   - Each tile has tiles.length = 1

TILE_DATA_INACTIVE_FILE
~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/TILE_DATA_INACTIVE_FILE.test.ts>`__.

This test verifies SET_IMAGE_CHANNELS against a second image, one which is not the image the user is
currently working on. The frontend updates the channel and the stokes of every visible frame rather
than only the active one, and it sends a different message depending on whether the frame is being
rendered: a visible frame gets a SET_IMAGE_CHANNELS carrying a full tile request, while a frame
which is not visible gets one whose ``required_tiles`` field is empty. The backend must move the
channel and the stokes of the image in both cases, must leave the other image alone, and must serve
tiles at the new position when they are requested later.

.. note::

   Two images are opened. ``M17_SWex.hdf5`` stands in for the active image and ``HH211_IQU.hdf5``
   for the inactive one; the latter carries both a spectral and a Stokes axis so that the channel
   and the stokes can be changed together.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for each image, each followed by a
   **SET_IMAGE_CHANNELS** (``SetImageChannels``) at channel 0, stokes 0 requesting one tile

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.hdf5"      // file_id = 0
     file = "HH211_IQU.hdf5"     // file_id = 1
     hdu = "0"
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``), **REGION_HISTOGRAM_DATA** and a
   **RASTER_TILE_DATA** stream for each image

:red-text:`Check 1:` both images should satisfy:

   - OPEN_FILE_ACK.success = True

   - RASTER_TILE_DATA.file_id matches the image, with channel = 0 and stokes = 0

**Changing the inactive image without requesting tiles**

3. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) for the inactive image with an
   empty ``required_tiles`` field

   .. code-block:: protobuf

     file_id = 1
     channel = 2
     stokes = 1
     required_tiles = {}

4. Backend returns: **REGION_HISTOGRAM_DATA** (``RegionHistogramData``) only

:red-text:`Check 2:` the REGION_HISTOGRAM_DATA should satisfy:

   - file_id = 1

   - region_id = -1

   - channel = 2

   - stokes = 1

   - progress = 1

:red-text:`Check 3:` no tile data should follow:

   - no RASTER_TILE_SYNC arrives

   - no RASTER_TILE_DATA arrives

**The other image is unaffected**

5. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for the active image

   .. code-block:: protobuf

     file_id = 0
     compression_type = ZFP
     compression_quality = 11
     tiles = [0]

6. Backend returns: **RASTER_TILE_DATA** stream with RasterTileSync start/end

:red-text:`Check 4:` the response should satisfy:

   - the start RASTER_TILE_SYNC has end_sync = False and tile_count = 1, and the closing one has
     end_sync = True

   - RASTER_TILE_DATA.file_id = 0, channel = 0, stokes = 0, unchanged by the update to file 1

**The inactive image serves tiles at its new position**

7. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for the inactive image

   .. code-block:: protobuf

     file_id = 1
     compression_type = ZFP
     compression_quality = 11
     tiles = [0]

8. Backend returns: **RASTER_TILE_DATA** stream with RasterTileSync start/end

:red-text:`Check 5:` the RASTER_TILE_DATA should satisfy:

   - file_id = 1, channel = 2, stokes = 1

   No further SET_IMAGE_CHANNELS was sent after step 3, so this position can only have come from
   the empty tile request there.

**Both images updated together**

9. Frontend sends: two **SET_IMAGE_CHANNELS** (``SetImageChannels``) back to back, without waiting
   for the first to complete, each requesting one tile

   .. code-block:: protobuf

     file_id = 0, channel = 12, stokes = 0
     file_id = 1, channel = 1,  stokes = 2

10. Backend returns: two **RASTER_TILE_DATA** streams

:red-text:`Check 6:` the two tile groups should satisfy:

   - each file_id receives exactly one start and one end RASTER_TILE_SYNC

   - the tile for file 0 has channel = 12 and stokes = 0

   - the tile for file 1 has channel = 1 and stokes = 2

.. note::

   Check 6 is asserted per file_id rather than by order of arrival. The backend currently handles
   the two messages one after the other, but that is not part of the interface, so the test only
   requires that each image ends up with a complete and correctly tagged tile group.
