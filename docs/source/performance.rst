Performance Tests
-----------------

The performance test suite measures backend latency and throughput for computationally
intensive operations. Each test uses a Jest timeout as the pass/fail threshold -- if the
backend does not complete the operation within the configured timeout, the test fails.

All performance tests read data files from the ``set_QA_performance`` directory. Three
file formats (FITS, CASA, HDF5) are tested for each operation, enabling cross-format
performance comparison.

Timeout values are configured in ``src/test/config.json`` under the ``performance`` key:

.. code-block:: json

   {
     "performance": {
       "openFile": 20000,
       "readFile": 10000,
       "playContour": 12000,
       "playAnimator": 300000,
       "setSpectralReqTimeout": 10000,
       "momentTimeout": 400000,
       "pvTimeout": 200000
     }
   }

.. uml::

    skinparam style strictuml
    hide footbox
    title Performance test measurement pattern

    actor Tester

    box "Client-side" #EDEDED
            participant "Test Runner"
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    Tester -> "Test Runner": Start test
    activate "Test Runner"
    "Test Runner" -> Backend : OPEN_FILE
    activate Backend
    "Test Runner" <-- Backend : OPEN_FILE_ACK
    "Test Runner" -> Backend : <operation request>
    note right
        Timeout starts here.
        If the operation does not
        complete within the configured
        threshold, the test fails.
    end note
    "Test Runner" <-- Backend : <streaming responses>
    "Test Runner" <--[#red] Backend : <font color="red">Final response (progress = 1) [Pass]</font>
    deactivate Backend
    Tester <-- "Test Runner": Test result
    deactivate "Test Runner"

.. toctree::
   :maxdepth: 1

   perf_sample_images
   perf_load_image
   perf_raster_tile_data
   perf_contour_data
   perf_animator_contour
   perf_cube_histogram
   perf_moments
   perf_pv
   perf_region_spectral_profile
