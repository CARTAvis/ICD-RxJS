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
