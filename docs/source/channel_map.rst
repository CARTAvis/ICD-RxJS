Channel Map
-----------

.. uml::

    skinparam style strictuml
    hide footbox
    title Channel map workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open images
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE (x4)
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK (x4)
    Frontend -> Backend : 3. ADD_REQUIRED_TILES (x4)
    Frontend <-- Backend : 4. RASTER_TILE_DATA (x4)
    deactivate Backend
    User <-- Frontend: Displays images
    deactivate Frontend

    User -> Frontend: Request channel map
    activate Frontend
    Frontend -> Backend : 5. SET_IMAGE_CHANNELS (channel_map_enabled)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. RASTER_TILE_DATA [Check 1] (per channel)</font>
    deactivate Backend
    User <-- Frontend: Displays channel map
    deactivate Frontend

CHANNEL_MAP
~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CHANNEL_MAP.test.ts>`__.

This test verifies that channel map tile data is generated correctly for multiple image formats. It opens 4 copies of the same image in different formats and requests channel map tiles for each.

**For each file format (M17_SWex.fits, M17_SWex.image, M17_SWex.miriad, M17_SWex.hdf5):**

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits" / "M17_SWex.image" / "M17_SWex.miriad" / "M17_SWex.hdf5"
     hdu = ""
     file_id = 0 / 1 / 2 / 3
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_id = 0, 1, 2, 3 respectively

3. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``) with 12 tiles

   .. code-block:: protobuf

     file_id = 0 / 1 / 2 / 3
     tiles = [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722]
     compression_type = ZFP
     compression_quality = 11

4. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) stream

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 14 (RasterTileSync start + 12 tiles + RasterTileSync end)
   - RASTER_TILE_DATA.file_id matches the requested file
   - RASTER_TILE_DATA.channel = 0
   - RASTER_TILE_DATA.stokes = 0

**Channel map request 1: channels 1-3**

5. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) with channel map enabled

   .. code-block:: protobuf

     file_id = 0 / 1 / 2 / 3
     channel = 0
     stokes = 0
     required_tiles = {
         file_id: 0,
         tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434],
         compression_type: ZFP,
         compression_quality: 11
     }
     channel_range = {min: 1, max: 3}
     current_range = {min: 0, max: 3}
     channel_map_enabled = true

6. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) streams for 3 channels

:red-text:`Check 3:` the RASTER_TILE_DATA for each of the 3 channels should satisfy:

   - 3 sets of raster tile streams should arrive (one per channel: 1, 2, 3)
   - Each set contains: RasterTileSync start + 9 tile data messages + RasterTileSync end
   - All tile data should have the correct file_id and stokes = 0
   - Channel values should be 1, 2, 3 respectively
   - Each tile should have:

     - tiles.length = 1
     - tiles.layer = 2
     - tiles.x in [0, 1, 2]
     - tiles.y in [0, 1, 2]
     - tiles.width in [128, 256]
     - tiles.height = 256

**Channel map request 2: channel 4 (scroll forward)**

7. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) with updated channel range

   .. code-block:: protobuf

     file_id = 0 / 1 / 2 / 3
     channel = 4
     stokes = 0
     required_tiles = {tiles: [...], compression_type: ZFP, compression_quality: 11}
     channel_range = {min: 4, max: 4}
     current_range = {min: 1, max: 4}
     channel_map_enabled = true

8. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) stream for 1 channel

:red-text:`Check 4:` the RASTER_TILE_DATA for channel 4 should satisfy:

   - 1 set of raster tile stream should arrive
   - Contains: RasterTileSync start + 9 tile data messages + RasterTileSync end
   - RASTER_TILE_DATA.channel = 4
   - RASTER_TILE_DATA.stokes = 0
   - Each tile should have the same properties as Check 3 (layer, x, y, width, height)
