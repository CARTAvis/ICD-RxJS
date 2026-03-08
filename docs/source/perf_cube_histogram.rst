Cube Histogram
~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CUBE_HISTOGRAM_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CUBE_HISTOGRAM_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CUBE_HISTOGRAM_HDF5.test.ts>`__

Measures the time to compute a full cube histogram across all channels. The HDF5 format
pre-computes histograms at write time, so the HDF5 variant uses a much tighter timeout
(500 ms vs 300,000 ms) to verify the cached result is returned quickly. The elapsed time
is measured between the ``SET_HISTOGRAM_REQUIREMENTS`` request and the
``REGION_HISTOGRAM_DATA`` response with progress = 1.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_CUBE_HISTOGRAM

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load initial tiles ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (9 tiles)
    activate Backend
    Client -> Backend : SET_CURSOR (x=1, y=1)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (9 tiles + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    == Step 2: Request cube histogram ==

    note over Client, Backend
        **Timeout starts**
        FITS/CASA: 300,000 ms | HDF5: 500 ms
    end note

    Client -[#red]> Backend : <font color="red">SET_HISTOGRAM_REQUIREMENTS</font>\n(region=-2, channel=-2, num_bins=-1)
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop streaming progress
        Client <-- Backend : REGION_HISTOGRAM_DATA (progress < 1)
    end
    Client <--[#red] Backend : <font color="red">REGION_HISTOGRAM_DATA (progress = 1)</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** progress reaches 1
    end note

1. Frontend opens ``cube_B_06400_z00100.<fits|image|hdf5>`` and loads initial tiles

2. Frontend sends: **SET_HISTOGRAM_REQUIREMENTS** (``SetHistogramRequirements``)

   .. code-block:: text

     file_id = 0
     region_id = -2
     histograms = [{channel: -2, num_bins: -1}]

3. Backend streams: **REGION_HISTOGRAM_DATA** with increasing progress

:red-text:`Check 1:` within the cube histogram timeout:

   - FITS/CASA: 300,000 ms
   - HDF5: 500 ms (pre-computed)
   - REGION_HISTOGRAM_DATA reaches progress = 1
