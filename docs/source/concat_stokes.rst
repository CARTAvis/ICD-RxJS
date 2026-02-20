Concat/Stokes
-------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Concat Stokes workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Select Stokes images
    activate Frontend
    Frontend -> Backend : 1. FILE_INFO_REQUEST (per Stokes file)
    activate Backend
    Frontend <-- Backend : 2. FILE_INFO_RESPONSE
    Frontend -> Backend : 3. CONCAT_STOKES_FILES
    Frontend <--[#red] Backend : <font color="red">4. CONCAT_STOKES_FILES_ACK [Check 1]</font>
    Frontend <--[#red] Backend : <font color="red">5. REGION_HISTOGRAM_DATA [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays hypercube
    deactivate Frontend

CONCAT_STOKES_IMAGES
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONCAT_STOKES_IMAGES.test.ts>`__.

This test verifies that separate Stokes parameter images (I, Q, U, V) stored as individual 4D FITS cubes (256x256x480) can be concatenated into a single hypercube image. It tests 5 different Stokes combinations and checks both the ``CONCAT_STOKES_FILES_ACK`` and ``REGION_HISTOGRAM_DATA`` responses.

**Input files** (from ``set_QA`` directory):

- ``IRCp10216_sci.spw0.cube.I.manual.pbcor.fits`` (polarizationType = 1)
- ``IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits`` (polarizationType = 2)
- ``IRCp10216_sci.spw0.cube.U.manual.pbcor.fits`` (polarizationType = 3)
- ``IRCp10216_sci.spw0.cube.V.manual.pbcor.fits`` (polarizationType = 4)

**For each case, the test performs 3 steps:**

1. Frontend sends: **FILE_LIST_REQUEST** and verifies the file list is returned successfully.

2. Frontend sends: **FILE_INFO_REQUEST** (``FileInfoRequest``) for each Stokes file to be combined

   .. code-block:: protobuf

     file = "IRCp10216_sci.spw0.cube.{I,Q,U,V}.manual.pbcor.fits"
     hdu = ""

:red-text:`Check 1:` each FILE_INFO_RESPONSE should satisfy:

   - FILE_INFO_RESPONSE.success = True

3. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [{directory, hdu, file, polarizationType}, ...]

4. Backend returns: **CONCAT_STOKES_FILES_ACK** (``ConcatStokesFilesAck``) and **REGION_HISTOGRAM_DATA** (``RegionHistogramData``)

**Case 1: Combine I, Q, U, V**

:red-text:`Check 2:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_IQUV.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 4
   - openFileAck.beamTable.length = 1920

:red-text:`Check 3:` the REGION_HISTOGRAM_DATA should satisfy:

   - regionId = -1, progress = 1, config.numBins = -1
   - histograms.binWidth = 0.004779201466590166
   - histograms.firstBinCenter = -0.11032065749168396
   - histograms.numBins = 256
   - histograms.mean = 0.0014072911570091893
   - histograms.stdDev = 0.05368401551544911

**Case 2: Combine I, V**

:red-text:`Check 4:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_IV.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 2
   - openFileAck.beamTable.length = 960

:red-text:`Check 5:` the REGION_HISTOGRAM_DATA should have the same values as Check 3 (Stokes I is the first component).

**Case 3: Combine Q, U**

:red-text:`Check 6:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 2
   - openFileAck.beamTable.length = 960

:red-text:`Check 7:` the REGION_HISTOGRAM_DATA should satisfy:

   - histograms.binWidth = 0.00016267175669781864
   - histograms.firstBinCenter = -0.018377140164375305
   - histograms.numBins = 256
   - histograms.mean = -0.00003742659352908538
   - histograms.stdDev = 0.0038693415380174558

**Case 4: Combine I, Q, U**

:red-text:`Check 8:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_IQU.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 3
   - openFileAck.beamTable.length = 1440

:red-text:`Check 9:` the REGION_HISTOGRAM_DATA should have the same values as Check 3 (Stokes I is the first component).

**Case 5: Combine Q, U, V**

:red-text:`Check 10:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_QUV.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 3
   - openFileAck.beamTable.length = 1440

:red-text:`Check 11:` the REGION_HISTOGRAM_DATA should have the same values as Check 7 (Stokes Q is the first component).

CONCAT_STOKES_IMAGES_AXIS_DEGENERACY
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONCAT_STOKES_IMAGES_AXIS_DEGENERACY.test.ts>`__.

This test is identical in structure and expected results to CONCAT_STOKES_IMAGES, but uses axis-degeneracy-dropped ("dropdeg") versions of the Stokes images. This verifies that the backend correctly handles images where degenerate axes have been removed.

**Input files** (from ``set_QA`` directory):

- ``IRCp10216_sci.spw0.cube.I.dropdeg.manual.pbcor.fits`` (polarizationType = 1)
- ``IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits`` (polarizationType = 2)
- ``IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits`` (polarizationType = 3)
- ``IRCp10216_sci.spw0.cube.V.dropdeg.manual.pbcor.fits`` (polarizationType = 4)

The same 5 cases are tested with the same expected results:

.. list-table:: Expected results per combination
   :header-rows: 1
   :widths: 20 40 10 10

   * - Case
     - Output file name
     - Stokes
     - Beam table length
   * - I,Q,U,V
     - hypercube_IQUV.dropdeg.manual.pbcor.fits
     - 4
     - 1920
   * - I,V
     - hypercube_IV.dropdeg.manual.pbcor.fits
     - 2
     - 960
   * - Q,U
     - hypercube_QU.dropdeg.manual.pbcor.fits
     - 2
     - 960
   * - I,Q,U
     - hypercube_IQU.dropdeg.manual.pbcor.fits
     - 3
     - 1440
   * - Q,U,V
     - hypercube_QUV.dropdeg.manual.pbcor.fits
     - 3
     - 1440

All output files have dimensions = 4, width = 256, height = 256, depth = 480.

The REGION_HISTOGRAM_DATA values are identical to CONCAT_STOKES_IMAGES:

- Stokes I first component (Cases 1, 2, 4): binWidth = 0.004779, mean = 0.001407, stdDev = 0.053684
- Stokes Q first component (Cases 3, 5): binWidth = 0.000163, mean = -0.000037, stdDev = 0.003869

CONCAT_ERROR_MESSAGE
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONCAT_ERROR_MESSAGE.test.ts>`__.

This test verifies that attempting to concatenate incompatible Stokes images returns appropriate error messages.

**Case 1: Inconsistent image shapes (Q + axis-degeneracy U)**

1. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits", polarizationType: 3}
     ]

:red-text:`Check 1:` the error response should contain:

   - Error message containing "are not consistent!"

**Case 2: Duplicate Stokes type (Q + axis-degeneracy Q)**

2. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits", polarizationType: 2}
     ]

:red-text:`Check 2:` the error response should contain:

   - Error message containing "Duplicate Stokes type found"
