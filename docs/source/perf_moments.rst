Moments
~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_MOMENTS_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_MOMENTS_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_MOMENTS_HDF5.test.ts>`__

Measures the time to generate all 13 moment images from a spectral cube. The elapsed time
is measured between the ``MOMENT_REQUEST`` request and the ``MOMENT_RESPONSE`` response.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_MOMENTS

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Step 1: Open file ==

    Client -> Backend : OPEN_FILE\n(S255_IR_sci.spw25.cube.I.pbcor)
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    == Step 2: Load tiles and set spectral profile ==

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client -> Backend : SET_CURSOR (x=960, y=960)
    Client -> Backend : SET_SPATIAL_REQUIREMENTS
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync start/end)
    Client <-- Backend : SPATIAL_PROFILE_DATA
    deactivate Backend

    Client -> Backend : SET_SPECTRAL_REQUIREMENTS (Sum)
    activate Backend
    loop streaming progress
        Client <-- Backend : SPECTRAL_PROFILE_DATA (progress < 1)
    end
    Client <-- Backend : SPECTRAL_PROFILE_DATA (progress = 1)
    deactivate Backend

    == Step 3: Request 13 moments ==

    note over Client, Backend
        **Timeout starts (momentTimeout: 400,000 ms)**
    end note

    Client -[#red]> Backend : <font color="red">MOMENT_REQUEST</font>\n(moments=[0..12], axis=SPECTRAL,\nmask=Include, pixelRange=[0.1,1.0])
    activate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    Client <-- Backend : REGION_HISTOGRAM_DATA x 13\n(one per moment image)
    Client <--[#red] Backend : <font color="red">MOMENT_RESPONSE\n(13 openFileAcks)</font>
    deactivate Backend

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    note over Client
        **Assert:** MOMENT_RESPONSE.success = True
        **Assert:** openFileAcks.length = 13
        **Assert:** all openFileAcks[].success = True
    end note

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "S255_IR_sci.spw25.cube.I.pbcor.<fits|image|hdf5>"
     file_id = 0

2. Frontend loads tiles, sets cursor at (960, 960), and requests spectral profile

3. Frontend sends: **MOMENT_REQUEST** (``MomentRequest``) for all 13 moments

   .. code-block:: text

     file_id = 0
     moments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
     axis = SPECTRAL
     mask = Include
     pixel_range = {min: 0.1, max: 1.0}
     spectral_range = {min: 0, max: 400}
     rest_freq = 335500000000

   The 13 moment types: Average, Integrated, Weighted Coordinate, Weighted Dispersion
   Coordinate, Median, Median Coordinate, Standard Deviation, RMS, Abs Mean Deviation,
   Maximum, Maximum Coordinate, Minimum, Minimum Coordinate.

4. Backend returns: **MOMENT_RESPONSE** with 13 ``openFileAcks``

:red-text:`Check 1:` within the ``momentTimeout`` (400,000 ms):

   - MOMENT_RESPONSE.success = True
   - MOMENT_RESPONSE.openFileAcks.length = 13
   - All openFileAcks[].success = True
