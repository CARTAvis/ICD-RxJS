Save Image
----------

.. uml::

    skinparam style strictuml
    hide footbox
    title Save Image workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Save/export image
    activate Frontend
    Frontend -> Backend : 3. SAVE_FILE
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. SAVE_FILE_ACK [Check 1]</font>
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Verify exported file
    activate Frontend
    Frontend -> Backend : 5. OPEN_FILE (exported)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. OPEN_FILE_ACK [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays exported image
    deactivate Frontend

SAVE_IMAGE_ORIGINAL
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_ORIGINAL.test.ts>`__.

This test verifies that a full image can be exported without modification, preserving the original dimensions and data, in both FITS and CASA formats.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 200
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "M17_SWex.fits"

**Case 1: Save as FITS**

4. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 200
     output_file_name = "M17_SWex_Original.fits"
     output_file_type = FITS
     keep_degenerate = true

5. Frontend sends: **OPEN_FILE** to reopen the exported file

   .. code-block:: protobuf

     file = "M17_SWex_Original.fits"
     file_id = 300
     render_mode = RASTER

6. Backend returns: **OPEN_FILE_ACK** and **REGION_HISTOGRAM_DATA**

:red-text:`Check 2:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[640, 800, 25, 1]"

7. Frontend sends: **SET_IMAGE_CHANNELS** with **ADD_REQUIRED_TILES**

8. Backend returns: **RASTER_TILE_DATA**

:red-text:`Check 3:` RASTER_TILE_DATA tiles count should match requested tiles

**Case 2: Save as CASA**

9. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 200
     output_file_name = "M17_SWex_Original.image"
     output_file_type = CASA
     keep_degenerate = true

10. Frontend reopens the exported file and verifies the same checks

:red-text:`Check 4:` the OPEN_FILE_ACK should satisfy:

    - fileInfoExtended.computedEntries['Shape'] = "[640, 800, 25, 1]"

SAVE_IMAGE_CHANNEL
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_CHANNEL.test.ts>`__.

This test verifies that a partial spectral range (channels 5-20) can be exported from an image cube.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Case 1: Save as CASA with partial channel range**

3. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_Partial.image"
     output_file_type = CASA
     channels = [5, 20, 1]
     keep_degenerate = true

4. Frontend reopens the exported file

:red-text:`Check 2:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[640, 800, 16, 1]"

**Case 2: Save as FITS with partial channel range**

5. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_Partial.fits"
     output_file_type = FITS
     channels = [5, 20, 1]
     keep_degenerate = true

6. Frontend reopens the exported file

:red-text:`Check 3:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[640, 800, 16, 1]"

SAVE_IMAGE_STOKES
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_STOKES.test.ts>`__.

This test verifies that specific Stokes parameters can be exported from an image containing multiple Stokes planes.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Case 1: Save as CASA with Stokes Q and U**

3. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "HH211_QU_test.image"
     output_file_type = CASA
     channels = [0, 2, 1]
     stokes = [1, 2, 1]
     keep_degenerate = true

4. Frontend reopens the exported file

:red-text:`Check 2:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[1049, 1049, 3, 2]"

**Case 2: Save as FITS with Stokes Q and U**

5. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "HH211_QU_test.fits"
     output_file_type = FITS
     channels = [0, 2, 1]
     stokes = [1, 2, 1]
     keep_degenerate = true

6. Frontend reopens the exported file

:red-text:`Check 3:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[1049, 1049, 3, 2]"

SAVE_IMAGE_CHOP
~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_CHOP.test.ts>`__.

This test verifies that an image can be exported with spatial cropping using a region. Both rectangle and polygon region types are tested.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Region 1: RECTANGLE**

3. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 200.0, y: 600.0}, {x: 350.0, y: 350.0}]
     rotation = 0.0

:red-text:`Check 2:` SET_REGION_ACK.success = True

4. Frontend sends: **SAVE_FILE** (``SaveFile``) with regionId = 1

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_Chop.fits"
     output_file_type = FITS
     keep_degenerate = true

5. Frontend reopens the exported file

:red-text:`Check 3:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[351, 351, 25, 1]"

6. Frontend sends: **SET_IMAGE_CHANNELS** with **ADD_REQUIRED_TILES**

7. Backend returns: **RASTER_TILE_DATA**

8. Same steps repeated for CASA format export

**Region 2: POLYGON**

9. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = POLYGON
     control_points = [{x: 25.0, y: 775.0}, {x: 375.0, y: 775.0}, {x: 375.0, y: 425.0}, {x: 25.0, y: 425.0}]
     rotation = 0.0

10. Same export and verification steps for both FITS and CASA formats

:red-text:`Check 4:` the exported shapes should match "[351, 351, 25, 1]"

SAVE_IMAGE_CHOP_SHARED
~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_CHOP_SHARED.test.ts>`__.

This test verifies that a chopped image can be exported using a shared region (a region defined on one image applied to another matched image).

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two images

   .. code-block:: protobuf

     file = "M17_SWex.fits", file_id = 0
     file = "M17_SWex.image", file_id = 1

2. Backend returns: **OPEN_FILE_ACK** for each file

:red-text:`Check 1:` both OPEN_FILE_ACK.success = True

**Region 1: RECTANGLE on file 0 (shared to file 1)**

3. Frontend sends: **SET_REGION** (``SetRegion``) on file 0

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 200.0, y: 600.0}, {x: 350.0, y: 350.0}]
     rotation = 0.0

:red-text:`Check 2:` SET_REGION_ACK.success = True

4. Frontend sends: **SAVE_FILE** (``SaveFile``) on file 1 using the shared region

   .. code-block:: protobuf

     file_id = 1
     output_file_name = "M17_SWex_Chop_Shared.fits"
     output_file_type = FITS
     region_id = <shared region id>
     keep_degenerate = true

5. Frontend reopens the exported file

:red-text:`Check 3:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[351, 351, 25, 1]"

6. Same steps for CASA format and POLYGON region type

SAVE_IMAGE_DROP_DEG
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_DROP_DEG.test.ts>`__.

This test verifies that degenerate axes (axes with size 1) can be dropped when exporting an image.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Case 1: Save as FITS with keepDegenerate = false**

3. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_Drop_Deg.fits"
     output_file_type = FITS
     keep_degenerate = false

4. Frontend reopens the exported file

:red-text:`Check 2:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[640, 800, 25]"

   (Note: Stokes axis with size 1 has been dropped, reducing from 4D to 3D)

5. Frontend sends: **SET_IMAGE_CHANNELS** with **ADD_REQUIRED_TILES**

6. Backend returns: **RASTER_TILE_DATA**

**Case 2: Save as CASA with keepDegenerate = false**

7. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_Drop_Deg.image"
     output_file_type = CASA
     keep_degenerate = false

8. Frontend reopens the exported file

:red-text:`Check 3:` the OPEN_FILE_ACK should satisfy:

   - fileInfoExtended.computedEntries['Shape'] = "[640, 800, 25]"

SAVE_IMAGE_ERROR_MESSAGE
~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_ERROR_MESSAGE.test.ts>`__.

This test verifies that appropriate error messages are returned when attempting to export an image with an invalid region (entirely outside the image bounds).

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **SET_REGION** (``SetRegion``) with a region entirely outside the image

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: -100.0, y: 35.0}, {x: 50.0, y: 50.0}]
     rotation = 0.0

:red-text:`Check 2:` SET_REGION_ACK.success = True

**Case 1: Save as FITS with out-of-bounds region**

4. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_error.fits"
     output_file_type = FITS
     region_id = 1
     channels = [0, 24, 1]
     stokes = [1, 2, 1]
     keep_degenerate = true

:red-text:`Check 3:` the SAVE_FILE response should satisfy:

   - Error message should contain "The selected region is entirely outside the image."

**Case 2: Save as CASA with out-of-bounds region**

5. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_name = "M17_SWex_error.image"
     output_file_type = CASA
     region_id = 1
     channels = [0, 24, 1]
     stokes = [1, 2, 1]
     keep_degenerate = true

:red-text:`Check 4:` the SAVE_FILE response should satisfy:

   - Error message should contain "The selected region is entirely outside the image."

SAVE_IMAGE_OVERWRITE
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SAVE_IMAGE_OVERWRITE.test.ts>`__.

This test verifies that the backend refuses to save an image to a path where doing so would destroy
something which is already there, and that it asks the frontend for confirmation in the cases where
the user may legitimately want to overwrite.

Seven requests are sent, one per refusal. The first three must be refused whatever ``overwrite``
says, so they are sent with ``overwrite = true`` to show that the refusal does not depend on it. The
remaining four are the ones the frontend may retry after asking the user, so they are sent with
``overwrite = false`` and the backend is expected to set ``overwrite_confirmation_required = true``
rather than simply failing.

.. note::

   Case 5 needs a symbolic link on disk, which the test creates before connecting and removes
   afterwards. It is the only ICD test which needs to know the absolute path of the backend's top
   level folder, because no CARTA message exposes it — ``FILE_LIST_RESPONSE.directory`` is relative.
   Set ``path.imageRoot`` in ``src/test/config.json`` to the folder the backend was started with,
   otherwise the test aborts before sending any request.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "M17_SWex.fits"

**Case 1: No file name**

3. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA/tmp"
     output_file_name = ""
     output_file_type = CASA
     overwrite = true

:red-text:`Check 2:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot save image with no filename."
   - SAVE_FILE_ACK.overwrite_confirmation_required = False

**Case 2: The output path is the image which is currently open**

4. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA"
     output_file_name = "M17_SWex.fits"
     output_file_type = FITS
     overwrite = true

:red-text:`Check 3:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot overwrite the source image."
   - SAVE_FILE_ACK.overwrite_confirmation_required = False

**Case 3: The output path is a directory which is not an image**

5. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA"
     output_file_name = "regionTest"
     output_file_type = CASA
     overwrite = true

:red-text:`Check 4:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot overwrite existing directory."
   - SAVE_FILE_ACK.overwrite_confirmation_required = False

**Case 4: The output path is a file which is not an image**

6. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA/regionTest"
     output_file_name = "M17_SWex_regionSet1_pix.crtf"
     output_file_type = CASA
     overwrite = false

:red-text:`Check 5:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot overwrite existing file or symlink."
   - SAVE_FILE_ACK.overwrite_confirmation_required = True

**Case 5: The output path is a symbolic link**

7. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA/tmp"
     output_file_name = "save_image_overwrite_symlink"
     output_file_type = CASA
     overwrite = false

:red-text:`Check 6:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot overwrite existing file or symlink."
   - SAVE_FILE_ACK.overwrite_confirmation_required = True

   (A symbolic link is refused separately because writing to it would replace the link itself
   rather than the file it points at.)

**Case 6: The output path is an existing image file**

8. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA"
     output_file_name = "M17_SWex.hdf5"
     output_file_type = HDF5
     overwrite = false

:red-text:`Check 7:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot overwrite existing image."
   - SAVE_FILE_ACK.overwrite_confirmation_required = True

**Case 7: The output path is an existing image directory**

9. Frontend sends: **SAVE_FILE** (``SaveFile``)

   .. code-block:: protobuf

     file_id = 0
     output_file_directory = "set_QA"
     output_file_name = "M17_SWex.image"
     output_file_type = CASA
     overwrite = false

:red-text:`Check 8:` the SAVE_FILE_ACK should satisfy:

   - SAVE_FILE_ACK.success = False
   - SAVE_FILE_ACK.message = "Cannot overwrite existing image."
   - SAVE_FILE_ACK.overwrite_confirmation_required = True
