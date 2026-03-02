Check Raster Tile Data
----------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Check Raster Tile Data workflow

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

    User -> Frontend: Request tiles
    activate Frontend
    Frontend -> Backend : 3. SET_IMAGE_CHANNELS / ADD_REQUIRED_TILES
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. RASTER_TILE_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Tile data received
    deactivate Frontend

CHECK_RASTER_TILE_DATA
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CHECK_RASTER_TILE_DATA.test.ts>`__.

This test verifies that raster tile data values at different layers and compression types are correctly delivered by the backend.

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

3. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) with NONE compression

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = NONE
     tiles = [0]

4. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``)

:red-text:`Check 2:` the RASTER_TILE_DATA should satisfy:

   - RASTER_TILE_DATA.file_id = 0

   - RASTER_TILE_DATA.channel = 0

   - RASTER_TILE_DATA.stokes = 0

   - RASTER_TILE_DATA.compression_type = NONE

   - RASTER_TILE_DATA.tiles.length = 1

   - RASTER_TILE_DATA.tiles[0].x = 0, y = 0, layer = 0

   - RASTER_TILE_DATA.tiles[0].height = 256, width = 256

   - RASTER_TILE_DATA.tiles[0].image_data at pixel (256,256) = 2.72519

**ZFP compression at multiple layers (layers 1-4)**

5. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) for each of 4 layers with ZFP compression

   .. code-block:: protobuf

     file_id = 0
     compression_type = ZFP
     compression_quality = 11

:red-text:`Check 3:` for each layer, the RASTER_TILE_DATA should satisfy:

   - RASTER_TILE_DATA.file_id = 0

   - RASTER_TILE_DATA.channel = 0

   - RASTER_TILE_DATA.stokes = 0

   - RASTER_TILE_DATA.compression_type = ZFP

   - Each tile has correct x, y, layer, height (256), and width (256)

   - Image data length and spot-check byte values at indices [0, 50000, 100000, 150000, 200000] match expected values
