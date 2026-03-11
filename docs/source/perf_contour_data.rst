Contour Data
~~~~~~~~~~~~

See the source code:
`Mode 0 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CONTOUR_DATA_Mode0.test.ts>`__ |
`Mode 1 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CONTOUR_DATA_Mode1.test.ts>`__ |
`Mode 2 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_CONTOUR_DATA_Mode2.test.ts>`__

Measures contour computation time on a large 2D Hubble image (8600 x 12200 pixels) across
three smoothing modes: NoSmoothing (0), BlockAverage (1), and GaussianBlur (2). The elapsed
time is measured between the ``SET_CONTOUR_PARAMETERS`` request and the last
``CONTOUR_IMAGE_DATA`` response with progress = 1 for all 5 contour levels.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_CONTOUR_DATA

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load initial tiles ==

    Client -> Backend : OPEN_FILE\n(h_m51_b_s05_drz_sci.fits, hdu="0")
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

    == Step 2: Set contour parameters ==

    note over Client, Backend
        **Timeout starts (playContour: 12,000 ms)**
    end note

    Client -> Backend : SET_CONTOUR_PARAMETERS (reset)
    Client -[#red]> Backend : <font color="red">SET_CONTOUR_PARAMETERS</font>\n(5 levels, smoothing_mode=<0|1|2>)
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop for each of 5 contour levels
        Client <-- Backend : CONTOUR_IMAGE_DATA (progress < 1)
        Client <--[#red] Backend : <font color="red">CONTOUR_IMAGE_DATA (progress = 1)</font>
    end
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** all 5 levels reach progress = 1
    end note

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "h_m51_b_s05_drz_sci.fits"
     hdu = "0"
     file_id = 0

2. Frontend loads 9 initial tiles and sets cursor

3. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: text

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.1, 0.36, 0.72, 1.09, 1.46]
     smoothing_mode = <0 | 1 | 2>
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

4. Backend streams: **CONTOUR_IMAGE_DATA** with increasing progress

:red-text:`Check 1:` within the ``playContour`` timeout (12,000 ms):

   - All 5 contour levels reach progress = 1
