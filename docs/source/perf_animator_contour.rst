Animator Contour
~~~~~~~~~~~~~~~~

See the source code:
`FITS <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_ANIMATOR_CONTOUR_FITS.test.ts>`__ |
`CASA <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_ANIMATOR_CONTOUR_CASA.test.ts>`__ |
`HDF5 <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/performance/PERF_ANIMATOR_CONTOUR_HDF5.test.ts>`__

Measures animation playback performance with contour overlays, testing both forward and
backward channel animation. The elapsed time is measured between the ``START_ANIMATION``
request and the ``STOP_ANIMATION`` request while playing the animation forwardly.

.. uml::

    skinparam style strictuml
    hide footbox
    title PERF_ANIMATOR_CONTOUR

    box "Client (Test Runner)" #EDEDED
        participant Client
    end box

    box "Server (Backend)" #lightblue
        participant Backend
    end box

    == Preparation: Open file, load tile, set contours ==

    Client -> Backend : OPEN_FILE
    activate Backend
    Client <-- Backend : OPEN_FILE_ACK
    Client <-- Backend : REGION_HISTOGRAM_DATA
    deactivate Backend

    Client -> Backend : ADD_REQUIRED_TILES (1 tile)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA (1 tile + sync)
    deactivate Backend

    Client -> Backend : SET_CONTOUR_PARAMETERS\n(levels=[-0.01, 0.01], GaussianBlur)
    activate Backend
    Client <-- Backend : CONTOUR_IMAGE_DATA (2 levels)
    deactivate Backend

    == Case 1: Forward animation (channels 1 -> 30) ==

    Client -> Backend : SET_IMAGE_CHANNELS (channel=0)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA
    deactivate Backend

    note over Client, Backend
        **Timeout starts (playAnimator: 300,000 ms)**
    end note

    Client -[#red]> Backend : <font color="red">START_ANIMATION</font>\n(start=ch1, delta=+1, rate=5fps)
    activate Backend
    Client <-- Backend : START_ANIMATION_ACK

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement starts
    end note

    loop channel 1 to 30
        Client -> Backend : ADD_REQUIRED_TILES
        Client <-- Backend : RASTER_TILE_DATA (tile + sync)
        Client <-- Backend : CONTOUR_IMAGE_DATA (2 levels)
        Client <-- Backend : REGION_HISTOGRAM_DATA
        Client -> Backend : ANIMATION_FLOW_CONTROL
    end
    deactivate Backend

    Client -[#red]> Backend : <font color="red">STOP_ANIMATION (endFrame=ch30)</font>

    note right of Backend #FFEEEE
        <font color="red">Elapsed time
        measurement ends
    end note

    == Case 2: Backward animation (channels 40 -> 31) ==

    Client -> Backend : SET_IMAGE_CHANNELS (channel=40)
    activate Backend
    Client <-- Backend : RASTER_TILE_DATA
    deactivate Backend

    Client -> Backend : START_ANIMATION\n(start=ch40, delta=-1, rate=5fps)
    activate Backend
    Client <-- Backend : START_ANIMATION_ACK

    loop channel 39 down to 31
        Client -> Backend : ADD_REQUIRED_TILES
        Client <-- Backend : RASTER_TILE_DATA (tile + sync)
        Client <-- Backend : CONTOUR_IMAGE_DATA (2 levels)
        Client <-- Backend : REGION_HISTOGRAM_DATA
        Client -> Backend : ANIMATION_FLOW_CONTROL
    end
    deactivate Backend

    Client -> Backend : STOP_ANIMATION (endFrame=ch30)

    note over Client
        **Assert:** channels in ascending order (Case 1)
        **Assert:** channels in descending order (Case 2)
    end note

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: text

     directory = "set_QA_performance"
     file = "cube_B_06400_z00100.<fits|image|hdf5>"
     file_id = 0

2. Frontend loads initial tiles and sets contour parameters

   .. code-block:: text

     levels = [-0.01, 0.01]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4

**Case 1: Forward animation (channels 1 to 30)**

3. Frontend sends: **START_ANIMATION** (``StartAnimation``)

   .. code-block:: text

     start_frame = {channel: 1, stokes: 0}
     first_frame = {channel: 0, stokes: 0}
     last_frame = {channel: 44, stokes: 0}
     delta_frame = {channel: 1, stokes: 0}
     frame_rate = 5

4. Animation plays with **ANIMATION_FLOW_CONTROL** per frame, stops at channel 30

:red-text:`Check 1:` within the ``playAnimator`` timeout (300,000 ms):

   - START_ANIMATION_ACK.success = True
   - RASTER_TILE_DATA channels are in ascending order
   - CONTOUR_IMAGE_DATA channels are in ascending order (2 levels per channel)
   - REGION_HISTOGRAM_DATA channels are in ascending order

**Case 2: Backward animation (channels 40 to 31)**

5. Frontend sends: **START_ANIMATION** with delta_frame = {channel: -1}

:red-text:`Check 2:` within the ``playAnimator`` timeout (300,000 ms):

   - RASTER_TILE_DATA channels are in descending order
   - CONTOUR_IMAGE_DATA channels are in descending order
   - REGION_HISTOGRAM_DATA channels are in descending order
