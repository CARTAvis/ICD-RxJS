PV
~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_PV_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_PV_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_PV_HDF5.test.ts>`__

Measures the time to generate a position-velocity (PV) diagram from a spectral cube. The
elapsed time is measured between the ``PV_REQUEST`` request and the ``PV_RESPONSE`` response.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_PV

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1-3: Open file and set up region ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    activate Backend
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 4: Create LINE region ==

    Client -> Backend : SET_REGION\n(LINE, rotation=135)
    activate Backend
    Client <-- Backend : SET_REGION_ACK (regionId=1)
    deactivate Backend

    == Step 5: Request PV diagram ==

    note over Client, Backend
        **Timeout starts (pvTimeout: 200,000 ms)**
    end note

    Client -[#red]> Backend : <font color="red">PV_REQUEST</font>\n(fileId=0, regionId=1, width=3)
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop streaming progress
        Client <-- Backend : PV_PROGRESS (progress < 1)
    end
    Client <-- Backend : PV_PROGRESS (progress = 1)
    Client <-- Backend : REGION_HISTOGRAM_DATA
    Client <--[#red] Backend : <font color="red">PV_RESPONSE (success = True)</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    == Step 6: Load PV output tiles ==

    Client -> Backend : ADD_REQUIRED_TILES\n(fileId=1, 13 tiles)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA (13 tiles + sync start/end)
    deactivate Backend

    note over Client
        **Assert:** PV_RESPONSE.success = True
        **Assert:** PV progress reaches 1
        **Assert:** 1 REGION_HISTOGRAM_DATA
        **Assert:** RASTER_TILE_DATA count = 13 + 2
    end note

1. Frontend opens ``cube_B_06400_z00100.<fits|image|hdf5>`` and loads initial tiles

2. Frontend sends: **SET_REGION** (``SetRegion``) with a LINE region

   .. code-block:: text

     region_type = LINE
     control_points = [(3719.18, 3663.72), (5897.90, 5842.44)]
     rotation = 135

3. Frontend sends: **PV_REQUEST** (``PvRequest``)

   .. code-block:: text

     file_id = 0
     region_id = 1
     width = 3

4. Backend streams: **PV_PROGRESS** with increasing progress, then **PV_RESPONSE**

5. Frontend requests 13 tiles on the PV output image (file_id = 1)

:red-text:`Check 1:` within the ``pvTimeout`` (200,000 ms):

   - PV_RESPONSE.success = True
   - PV progress reaches 1
   - PV output image produces 1 REGION_HISTOGRAM_DATA
   - Raster tiles for PV image: stream length = 13 + 2
