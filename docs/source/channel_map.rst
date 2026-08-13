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

    loop One request per channel
        Frontend -> Backend : 5. SET_IMAGE_CHANNELS (channel_map_enabled)
        activate Backend
        Frontend <--[#red] Backend : <font color="red">6. RASTER_TILE_DATA [Check 3]</font>
        Frontend <--[#red] Backend : <font color="red">7. CHANNEL_MAP_FLOW_CONTROL [Check 4]</font>
        deactivate Backend
    end

    User <-- Frontend: Displays channel map
    deactivate Frontend

CHANNEL_MAP
~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CHANNEL_MAP.test.ts>`__.

This test verifies that channel map tile data is generated correctly for multiple image formats. It opens 4 copies of the same image in different formats and requests channel map tiles for each.

.. note::

   Since ICD version 31.0.0 the backend processes **one channel per request**. Each
   **SET_IMAGE_CHANNELS** request is answered by that channel's raster tiles followed by a
   **CHANNEL_MAP_FLOW_CONTROL** message reporting the outcome, and the frontend only sends the next
   channel after the previous one completes. The former ``channel_range`` and ``current_range``
   fields of ``SetImageChannels`` and the ``current_tiles`` field of ``AddRequiredTiles`` were
   removed, and ``ChannelMapFlowControl.received_channel`` was replaced by ``completed_channel``
   plus a ``status`` and an optional ``message``.

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

**Channel map view: channels 1, 2 and 3, one request per channel**

5. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) with channel map enabled, once per
   channel. The request for channel 2 is only sent after channel 1 has been acknowledged, and so on.

   .. code-block:: protobuf

     file_id = 0 / 1 / 2 / 3
     channel = 1 / 2 / 3
     stokes = 0
     required_tiles = {
         file_id: 0 / 1 / 2 / 3,
         tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434],
         compression_type: ZFP,
         compression_quality: 11
     }
     channel_map_enabled = true

6. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) stream for the requested channel

:red-text:`Check 3:` the RASTER_TILE_DATA stream for each channel should satisfy:

   - Total length = 11 (RasterTileSync start + 9 tile data messages + RasterTileSync end)
   - RASTER_TILE_DATA.file_id matches the requested file
   - RASTER_TILE_DATA.channel = the requested channel (1, 2 or 3)
   - RASTER_TILE_DATA.stokes = 0
   - Each tile should have:

     - tiles.length = 1
     - tiles.layer = 2
     - tiles.x in [0, 1, 2]
     - tiles.y in [0, 1, 2]
     - tiles.width in [128, 256]
     - tiles.height = 256

7. Backend returns: **CHANNEL_MAP_FLOW_CONTROL** (``ChannelMapFlowControl``)

:red-text:`Check 4:` the CHANNEL_MAP_FLOW_CONTROL for each channel should satisfy:

   - CHANNEL_MAP_FLOW_CONTROL.file_id matches the requested file
   - CHANNEL_MAP_FLOW_CONTROL.completed_channel = the requested channel (1, 2 or 3)
   - CHANNEL_MAP_FLOW_CONTROL.status = COMPLETED

**Channel map jump: channel 4 (scroll forward)**

8. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) for a single channel outside the
   channels rendered so far

   .. code-block:: protobuf

     file_id = 0 / 1 / 2 / 3
     channel = 4
     stokes = 0
     required_tiles = {tiles: [...], compression_type: ZFP, compression_quality: 11}
     channel_map_enabled = true

9. Backend returns: **RASTER_TILE_DATA** (``RasterTileData``) stream followed by
   **CHANNEL_MAP_FLOW_CONTROL** (``ChannelMapFlowControl``)

:red-text:`Check 5:` the response for channel 4 should satisfy:

   - Total length = 11 (RasterTileSync start + 9 tile data messages + RasterTileSync end)
   - RASTER_TILE_DATA.channel = 4
   - RASTER_TILE_DATA.stokes = 0
   - Each tile should have the same properties as Check 3 (layer, x, y, width, height)
   - CHANNEL_MAP_FLOW_CONTROL.completed_channel = 4
   - CHANNEL_MAP_FLOW_CONTROL.status = COMPLETED
