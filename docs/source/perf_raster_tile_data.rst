Raster Tile Data
~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_RASTER_TILE_DATA_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_RASTER_TILE_DATA_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_RASTER_TILE_DATA_HDF5.test.ts>`__

Measures bulk raster tile delivery throughput by requesting 54 tiles at a higher zoom
level after the initial image load. The elapsed time is measured between the
``ADD_REQUIRED_TILES`` request and the last ``RASTER_TILE_DATA`` response.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_RASTER_TILE_DATA

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load 1 initial tile ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 2: Request 54 tiles at higher MIP level ==

    note over Client, Backend
        **Timeout starts (readFile: 10,000 ms)**
    end note

    Client -[#red]> Backend : <font color="red">ADD_REQUIRED_TILES</font> (54 tiles, ZFP q=11)
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    Client <--[#red] Backend : <font color="red">RASTER_TILE_DATA (54 tiles + sync start/end)</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** RASTER_TILE_DATA count = 54 + 2
    end note

1. Frontend opens ``cube_B_06400_z00100.<fits|image|hdf5>`` and loads 1 initial tile

2. Frontend sends: **ADD_REQUIRED_TILES** (54 tiles at higher MIP level)

   .. code-block:: text

     tiles = [67125252, 67129348, 67125253, ... (54 tiles)]
     compression_type = ZFP
     compression_quality = 11

3. Backend returns: **RASTER_TILE_DATA** stream

:red-text:`Check 1:` within the ``readFile`` timeout (10,000 ms):

   - RASTER_TILE_DATA stream length = 54 + 2 (54 tiles + RasterTileSync start and end)
