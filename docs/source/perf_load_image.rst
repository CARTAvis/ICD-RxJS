Load Image
~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_LOAD_IMAGE_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_LOAD_IMAGE_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_LOAD_IMAGE_HDF5.test.ts>`__

Measures the end-to-end latency of opening an image and receiving the initial raster
tiles, spatial profiles, and histogram. The elapsed time is measured between the
``OPEN_FILE`` request and the ``REGION_HISTOGRAM_DATA`` response.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_LOAD_IMAGE

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    Client -[#red]> Backend : <font color="red">OPEN_FILE</font>
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    Client <-- Backend : OPEN_FILE_ACK
    Client <--[#red] Backend : <font color="red">REGION_HISTOGRAM_DATA</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client, Backend
        **Timeout starts (openFile: 20,000 ms)**
    end note

    Client -> Backend : ADD_REQUIRED_TILES (9 tiles, ZFP q=11)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (9 tiles + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    note over Client
        **Assert:** OPEN_FILE_ACK.success = True
        **Assert:** RASTER_TILE_DATA count = 9 + 2
    end note

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "cube_B_06400_z00100.<fits|image|hdf5>"
     file_id = 0

2. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA**

3. Frontend sends: **ADD_REQUIRED_TILES** (9 tiles), **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: text

     tiles = [33558529, 33558528, 33554433, 33554432, 33562625,
              33558530, 33562624, 33554434, 33562626]
     compression_type = ZFP
     compression_quality = 11
     point = {x: 1, y: 1}

4. Backend returns: **RASTER_TILE_DATA** stream and **SPATIAL_PROFILE_DATA**

:red-text:`Check 1:` within the ``openFile`` timeout (20,000 ms):

   - OPEN_FILE_ACK.success = True
   - RASTER_TILE_DATA stream length = 9 + 2 (9 tiles + RasterTileSync start and end)
