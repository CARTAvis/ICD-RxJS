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

This test verifies that separate Stokes parameter images (I, Q, U, V) stored as individual 4D FITS cubes (256x256x480) can be concatenated into a single hypercube image, and that each plane of that hypercube holds the image which went into it. It tests 5 different Stokes combinations.

**Input files** (from ``set_QA`` directory):

- ``IRCp10216_sci.spw0.cube.I.manual.pbcor.fits`` (polarizationType = 1)
- ``IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits`` (polarizationType = 2)
- ``IRCp10216_sci.spw0.cube.U.manual.pbcor.fits`` (polarizationType = 3)
- ``IRCp10216_sci.spw0.cube.V.manual.pbcor.fits`` (polarizationType = 4)

Opened on its own, each of these four cubes answers with a distinct **REGION_HISTOGRAM_DATA**, and those four histograms are the reference the test identifies the hypercube's planes by:

.. list-table::
   :header-rows: 1

   * - Stokes
     - binWidth
     - firstBinCenter
     - mean
     - stdDev
   * - I
     - 0.004779201466590166
     - -0.11032065749168396
     - 0.0014072911570091893
     - 0.05368401551544901
   * - Q
     - 0.00016267175669781864
     - -0.018377140164375305
     - -0.00003742659352908538
     - 0.003869341538017443
   * - U
     - 0.00016493673319928348
     - -0.02082323282957077
     - 0.00012091044507226787
     - 0.004009951489450122
   * - V
     - 0.00016941891226451844
     - -0.020163865759968758
     - 0.000017799031213005305
     - 0.003931388177191896

``StokesFilesConnector`` iterates its loaders in polarization order, so the Stokes axis it builds is sorted I, Q, U, V however the request was ordered. Every case below therefore names its files in **reverse** order, and expects the sorted axis back.

**For each case, the test performs 5 steps:**

1. Frontend sends: **FILE_LIST_REQUEST** and verifies the input images are listed.

2. Frontend sends: **FILE_INFO_REQUEST** (``FileInfoRequest``) for each Stokes file to be combined

   .. code-block:: protobuf

     file = "IRCp10216_sci.spw0.cube.{I,Q,U,V}.manual.pbcor.fits"
     hdu = ""

:red-text:`Check 1:` each FILE_INFO_RESPONSE should satisfy:

   - success = True
   - fileInfo.name = the file which was asked for

3. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [{directory, hdu, file, polarizationType}, ...]

4. Backend returns: **CONCAT_STOKES_FILES_ACK** (``ConcatStokesFilesAck``) and **REGION_HISTOGRAM_DATA** (``RegionHistogramData``) for the plane the hypercube opens on, which is Stokes plane 0.

5. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``) once per remaining plane, which is what the Stokes selector sends, and the backend answers each with a **REGION_HISTOGRAM_DATA** for that plane

   .. code-block:: protobuf

     file_id = 0
     channel = 0
     stokes = 1 .. (number of planes - 1)
     required_tiles = {file_id: 0, tiles: [0], compression_type: ZFP, compression_quality: 11}

Every REGION_HISTOGRAM_DATA, whether it came with the ack or from a **SET_IMAGE_CHANNELS**, is checked to carry fileId = 0, regionId = -1, progress = 1, config.numBins = -1, histograms.numBins = 256, and the four histogram values of the Stokes image which belongs on that plane. The beam table is checked against the shape rather than a constant: ``DoConcat`` rebuilds it as one beam per channel per plane, so its length must be 480 × the number of planes.

**Case 1: Combine I, Q, U, V** (requested V, U, Q, I)

:red-text:`Check 2:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.success = True
   - openFileAck.fileId = 0
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_IQUV.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 4
   - openFileAck.beamTable.length = 1920

:red-text:`Check 3:` the Stokes axis should read I, Q, U, V:

   - plane 0 (the histogram which came with the ack) matches Stokes I
   - plane 1 matches Stokes Q
   - plane 2 matches Stokes U
   - plane 3 matches Stokes V

**Case 2: Combine I, V** (requested V, I)

:red-text:`Check 4:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_IV.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 2
   - openFileAck.beamTable.length = 960

:red-text:`Check 5:` the Stokes axis should read I, V — plane 0 matches Stokes I, plane 1 matches Stokes V.

**Case 3: Combine Q, U** (requested U, Q)

:red-text:`Check 6:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 2
   - openFileAck.beamTable.length = 960

:red-text:`Check 7:` the Stokes axis should read Q, U — plane 0 matches Stokes Q, plane 1 matches Stokes U.

**Case 4: Combine I, Q, U** (requested U, Q, I)

:red-text:`Check 8:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_IQU.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 3
   - openFileAck.beamTable.length = 1440

:red-text:`Check 9:` the Stokes axis should read I, Q, U.

**Case 5: Combine Q, U, V** (requested V, U, Q)

:red-text:`Check 10:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = True
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_QUV.manual.pbcor.fits"
   - openFileAck.fileInfoExtended: dimensions = 4, width = 256, height = 256, depth = 480, stokes = 3
   - openFileAck.beamTable.length = 1440

:red-text:`Check 11:` the Stokes axis should read Q, U, V.

CONCAT_STOKES_IMAGES_AXIS_DEGENERACY
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONCAT_STOKES_IMAGES_AXIS_DEGENERACY.test.ts>`__.

This test covers the same 5 combinations as CONCAT_STOKES_IMAGES, in the same 5 steps and with the same per-plane checks, but uses axis-degeneracy-dropped ("dropdeg") versions of the Stokes images. This verifies that the backend correctly handles images where degenerate axes have been removed.

**Input files** (from ``set_QA`` directory):

- ``IRCp10216_sci.spw0.cube.I.dropdeg.manual.pbcor.fits`` (polarizationType = 1)
- ``IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits`` (polarizationType = 2)
- ``IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits`` (polarizationType = 3)
- ``IRCp10216_sci.spw0.cube.V.dropdeg.manual.pbcor.fits`` (polarizationType = 4)

These four inputs carry **no Stokes axis of their own**, which is the premise of this test: ``DoConcat`` takes its ``stokes_axis < 0`` branch, builds a Stokes coordinate, and extends every image before it can concatenate them. The FILE_INFO_RESPONSE step therefore checks the inputs really are degenerate-axis-dropped, so the test cannot quietly turn into a copy of CONCAT_STOKES_IMAGES:

   - dimensions = 3, width = 256, height = 256, depth = 480, stokes = 1

Dropping a degenerate axis changes the shape of the file, not its pixels, so the four reference histograms are exactly those tabulated for CONCAT_STOKES_IMAGES above, and the planes of each hypercube are identified against them the same way.

The same 5 cases are tested, each requested in reverse order and expected back sorted:

.. list-table:: Expected results per combination
   :header-rows: 1
   :widths: 16 34 16 10 10

   * - Case
     - Output file name
     - Stokes axis
     - Stokes
     - Beam table length
   * - I,Q,U,V
     - hypercube_IQUV.dropdeg.manual.pbcor.fits
     - I, Q, U, V
     - 4
     - 1920
   * - I,V
     - hypercube_IV.dropdeg.manual.pbcor.fits
     - I, V
     - 2
     - 960
   * - Q,U
     - hypercube_QU.dropdeg.manual.pbcor.fits
     - Q, U
     - 2
     - 960
   * - I,Q,U
     - hypercube_IQU.dropdeg.manual.pbcor.fits
     - I, Q, U
     - 3
     - 1440
   * - Q,U,V
     - hypercube_QUV.dropdeg.manual.pbcor.fits
     - Q, U, V
     - 3
     - 1440

All output files have dimensions = 4, width = 256, height = 256, depth = 480 — the Stokes axis being the one the concatenation added.

CONCAT_ERROR_MESSAGE
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONCAT_ERROR_MESSAGE.test.ts>`__.

This test verifies that a **CONCAT_STOKES_FILES** request which cannot be satisfied is refused with an
explanatory message, that the refusal costs nothing else, and that the session is unharmed by it.

Every refusal travels back the same way: the backend answers with a **CONCAT_STOKES_FILES_ACK**
carrying ``success = False`` and the reason in ``message``, and it opens no image. Because that ack is
the whole of the answer, each case is followed by two further checks. The first watches the connection
for 500 ms to confirm that no **REGION_HISTOGRAM_DATA** or raster data was streamed for an image which
was never opened. The second sends a **SET_SPATIAL_REQUIREMENTS** naming the requested ``file_id``: a
file id which is genuinely free draws ``ERROR_DATA`` reading "File id 0 not found", so this is what
shows that the refused request left no half-opened image behind. The frontend leaves its own file
counter unchanged when the request is rejected, so a file id which was quietly consumed would put the
two sides out of step.

The six refusals below cover every rejection ``StokesFilesConnector`` can raise for the images in
``set_QA``. A seventh case then concatenates a valid pair to show the session still works.

The test opens with **FILE_LIST_REQUEST**, first against ``$BASE`` to resolve the base path the
Stokes file directories are then prefixed with, and again against ``set_QA`` to verify that every
image the cases name is on disk — apart from the one Case 6 deliberately invents. Without that, any
of the refusals below could be a missing file wearing a different case title.

**Case 1: Inconsistent image shapes (Q + axis-degeneracy U)**

1. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "IRCp10216_sci.spw0.cube.U.dropdeg.manual.pbcor.fits", polarizationType: 3}
     ]

:red-text:`Check 1:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = False
   - message contains "Image shapes or axes are not consistent!"

:red-text:`Check 2:` no further message should arrive within 500 ms.

:red-text:`Check 3:` a SET_SPATIAL_REQUIREMENTS for file_id = 0 should draw ERROR_DATA:

   - severity = DEBUG, tags = ["spatial"]
   - message = "File id 0 not found"

**Case 2: Duplicate Stokes type (Q + axis-degeneracy Q)**

2. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "IRCp10216_sci.spw0.cube.Q.dropdeg.manual.pbcor.fits", polarizationType: 2}
     ]

:red-text:`Check 4:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = False
   - message contains "Duplicate Stokes type found!"

:red-text:`Checks 5 and 6:` as Checks 2 and 3.

**Case 3: A single file, too few to concatenate**

3. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2}
     ]

:red-text:`Check 7:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = False
   - message contains "Need at least two files to concatenate!"

:red-text:`Checks 8 and 9:` as Checks 2 and 3.

**Case 4: Mixed file types (FITS + CASA image)**

4. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "M17_SWex.image", polarizationType: 3}
     ]

:red-text:`Check 10:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = False
   - message contains "Different file types can not be concatenated!"

:red-text:`Checks 11 and 12:` as Checks 2 and 3.

**Case 5: A hypercube with a gap in the Stokes axis (I, Q, V)**

5. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.I.manual.pbcor.fits", polarizationType: 1},
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "IRCp10216_sci.spw0.cube.V.manual.pbcor.fits", polarizationType: 4}
     ]

The Stokes types are checked for contiguity only when more than two files are given. I, Q and V map to
FITS Stokes values 1, 2 and 4, which are not evenly spaced, so the hypercube is refused by name.

:red-text:`Check 13:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = False
   - message contains "Hypercube IQV is not allowed!"

:red-text:`Checks 14 and 15:` as Checks 2 and 3.

**Case 6: A file which is not on disk**

6. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "no_such_stokes_image.fits", polarizationType: 3}
     ]

:red-text:`Check 16:` the CONCAT_STOKES_FILES_ACK should satisfy:

   - success = False
   - message contains "no_such_stokes_image.fits does not exist."

:red-text:`Checks 17 and 18:` as Checks 2 and 3.

**Case 7: A valid concatenation after the refusals (Q + U)**

7. Frontend sends: **CONCAT_STOKES_FILES** (``ConcatStokesFiles``) within 3000 ms

   .. code-block:: protobuf

     file_id = 0
     render_mode = RASTER
     stokes_files = [
         {file: "IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits", polarizationType: 2},
         {file: "IRCp10216_sci.spw0.cube.U.manual.pbcor.fits", polarizationType: 3}
     ]

Each refusal above opens image loaders before it gives up, and they are held until
``StokesFilesConnector::ClearCache`` runs. This case would be refused as a duplicate Stokes type if
that clean-up were skipped, so it also covers the recovery path.

:red-text:`Check 19:` the CONCAT_STOKES_FILES_ACK and REGION_HISTOGRAM_DATA should satisfy:

   - success = True, openFileAck.success = True
   - openFileAck.fileId = 0
   - openFileAck.fileInfo.name = "IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits"
   - REGION_HISTOGRAM_DATA.fileId = 0

:red-text:`Check 20:` a SET_SPATIAL_REQUIREMENTS for file_id = 0 followed by a **SET_CURSOR** at
(128, 128) should now draw SPATIAL_PROFILE_DATA instead of the error of Check 3:

   - fileId = 0, regionId = 0
   - x = 128, y = 128
   - the profile coordinates are ["x", "y"] as requested
