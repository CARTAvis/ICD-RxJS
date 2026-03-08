Region Spectral Profile
~~~~~~~~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_REGION_SPECTRAL_PROFILE_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_REGION_SPECTRAL_PROFILE_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_REGION_SPECTRAL_PROFILE_HDF5.test.ts>`__

Measures the time to compute a mean spectral profile over a large rectangular region on a
1000-channel cube. The elapsed time is measured between the ``SET_SPECTRAL_REQUIREMENTS``
request and the ``SPECTRAL_PROFILE_DATA`` response with progress = 1.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_REGION_SPECTRAL_PROFILE

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file and load initial tile ==

    Client -> Backend : OPEN_FILE\n(cube_B_03200_z01000)
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

    == Step 2: Create rectangle region ==

    Client -> Backend : SET_REGION\n(RECTANGLE, center=(800,800),\nsize=400x400, rotation=0)
    activate Backend
    Client <-- Backend : SET_REGION_ACK (regionId=1)
    deactivate Backend

    == Step 3: Request spectral profile ==

    note over Client, Backend
        **Timeout starts (120,000 ms)**
    end note

    Client -[#red]> Backend : <font color="red">SET_SPECTRAL_REQUIREMENTS</font>\n(regionId=1, stats=[Mean])
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop streaming progress
        Client <-- Backend : SPECTRAL_PROFILE_DATA (progress < 1)
    end
    Client <--[#red] Backend : <font color="red">SPECTRAL_PROFILE_DATA (progress = 1)</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** SET_REGION_ACK.success = True
        **Assert:** SPECTRAL_PROFILE_DATA progress = 1
    end note

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "cube_B_03200_z01000.<fits|image|hdf5>"
     file_id = 0

2. Frontend loads tiles and sets cursor at (1, 1)

3. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: text

     region_type = RECTANGLE
     control_points = [{x: 800, y: 800}, {x: 400, y: 400}]
     rotation = 0

4. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``)

   .. code-block:: text

     file_id = 0
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

5. Backend streams: **SPECTRAL_PROFILE_DATA** with increasing progress

:red-text:`Check 1:` within 120,000 ms:

   - SET_REGION_ACK.success = True
   - SPECTRAL_PROFILE_DATA reaches progress = 1
