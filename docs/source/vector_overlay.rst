Vector Overlay
--------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Vector Overlay workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open polarization image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    Frontend <-- Backend : 4. REGION_HISTOGRAM_DATA
    Frontend <-- Backend : 4. RASTER_TILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Set vector overlay parameters
    activate Frontend
    Frontend -> Backend : 5. SET_VECTOR_OVERLAY_PARAMETERS
    activate Backend

    loop Tile streaming
        Frontend <-- Backend : 6. VECTOR_OVERLAY_TILE_DATA
    end

    Frontend <--[#red] Backend : <font color="red">7. VECTOR_OVERLAY_TILE_DATA (progress=1) [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays vector overlay
    deactivate Frontend

    User -> Frontend: Clear overlay
    activate Frontend
    Frontend -> Backend : 8. SET_VECTOR_OVERLAY_PARAMETERS (clear)
    activate Backend
    deactivate Backend
    deactivate Frontend

VECTOR_OVERLAY_FITS
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/VECTOR_OVERLAY_FITS.test.ts>`__.

This test verifies vector overlay ICD messages with a FITS format polarization image across 7 different parameter configurations.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

3. Frontend sends: **SET_VECTOR_OVERLAY_PARAMETERS** (``SetVectorOverlayParameters``) for each case

   Image bounds for all cases:

   .. code-block:: protobuf

     x_min = 0
     x_max = 1049
     y_min = 0
     y_max = 1049
     compression_type = NONE
     compression_quality = 8

**Case 1: Absolute polarization intensity only**

   .. code-block:: protobuf

     stokes_angle = 1
     stokes_intensity = 1

:red-text:`Check 1:` the VECTOR_OVERLAY_TILE_DATA should satisfy:

   - progress = 1
   - compressionQuality = 8
   - Angle and intensity tile dimensions: height = 50, width = 50
   - Image data length = 2500 bytes

**Case 2: Smoothing factor 4**

   .. code-block:: protobuf

     stokes_angle = 1
     stokes_intensity = 1
     smoothing_factor = 4

:red-text:`Check 2:` tile dimensions reduced to height = 14, width = 14, image data length = 196 bytes

**Case 3: Smoothing factor 4 + fractional intensity**

   .. code-block:: protobuf

     fractional = true
     smoothing_factor = 4

:red-text:`Check 3:` same tile dimensions as Case 2

**Case 4: Smoothing factor 4 + threshold**

   .. code-block:: protobuf

     smoothing_factor = 4
     threshold = 0.01

:red-text:`Check 4:` same tile dimensions as Case 2

**Case 5: Smoothing factor 2 + Q/U error debiasing**

   .. code-block:: protobuf

     smoothing_factor = 2
     debiasing = true
     q_error = 0.01
     u_error = 0.01

:red-text:`Check 5:` tile dimensions: height = 26, width = 26, image data length = 676 bytes

**Case 6: Computed PA (Position Angle) only**

   .. code-block:: protobuf

     stokes_angle = 1
     stokes_intensity = -1

:red-text:`Check 6:` only angle tiles returned (no intensity tiles)

**Case 7: Computed PI (Polarized Intensity) only**

   .. code-block:: protobuf

     stokes_angle = -1
     stokes_intensity = 1

:red-text:`Check 7:` only intensity tiles returned (no angle tiles)

VECTOR_OVERLAY_CASA
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/VECTOR_OVERLAY_CASA.test.ts>`__.

This test verifies vector overlay with a CASA format polarization image. Same 7 test cases as VECTOR_OVERLAY_FITS.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.image"
     file_id = 0
     render_mode = RASTER

2-7. Same SET_VECTOR_OVERLAY_PARAMETERS configurations and checks as FITS test

:red-text:`Check 1-7:` all tile dimensions, image data lengths, and spot-check values should match the FITS test results

VECTOR_OVERLAY_HDF5
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/VECTOR_OVERLAY_HDF5.test.ts>`__.

This test verifies vector overlay with an HDF5 format polarization image. Same 7 test cases as VECTOR_OVERLAY_FITS.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.hdf5"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2-7. Same SET_VECTOR_OVERLAY_PARAMETERS configurations and checks as FITS test

:red-text:`Check 1-7:` all tile dimensions, image data lengths, and spot-check values should match the FITS test results

VECTOR_OVERLAY_CHANNEL_STREAM
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/VECTOR_OVERLAY_CHANNEL_STREAM.test.ts>`__.

This test verifies vector overlay data updates correctly when the image channel is changed.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_VECTOR_OVERLAY_PARAMETERS** (``SetVectorOverlayParameters``)

   .. code-block:: protobuf

     fractional = true
     smoothing_factor = 4
     threshold = 0.01

3. Backend returns: **VECTOR_OVERLAY_TILE_DATA** for channel 0

:red-text:`Check 1:` the initial overlay data should have progress = 1

4. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``)

   .. code-block:: protobuf

     file_id = 0
     channel = 1
     stokes = 0

5. Backend returns: **VECTOR_OVERLAY_TILE_DATA**, **REGION_HISTOGRAM_DATA**, **RASTER_TILE_DATA**, **RASTER_TILE_SYNC**

:red-text:`Check 2:` the channel change responses should satisfy:

   - VECTOR_OVERLAY_TILE_DATA updates for the new channel
   - REGION_HISTOGRAM_DATA contains updated histogram properties
   - RASTER_TILE_DATA count matches expected tile count (25 tiles)
   - RASTER_TILE_SYNC.endSync = True

VECTOR_OVERLAY_CONTOUR_CHANNEL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/VECTOR_OVERLAY_CONTOUR_CHANNEL.test.ts>`__.

This test verifies vector overlay combined with contours and channel changes across multiple file formats.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for two images

   File 1 (CASA):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.image"
     file_id = 0
     render_mode = RASTER

   File 2 (HDF5):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HH211_IQU.hdf5"
     file_id = 1
     render_mode = RASTER

2. Frontend sends: **SET_VECTOR_OVERLAY_PARAMETERS** and **SET_CONTOUR_PARAMETERS** for both files

   Contour parameters:

   .. code-block:: protobuf

     levels = [0.01421, 0.04263, 0.07104]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8

3. Backend returns: **VECTOR_OVERLAY_TILE_DATA** and **CONTOUR_IMAGE_DATA** for both files

:red-text:`Check 1:` the contour data should satisfy:

   - Level 0.07104: 301 uncompressed coordinates, 48 start indices
   - Level 0.04263: 4085 uncompressed coordinates, 780 start indices
   - Level 0.01421: 47845 uncompressed coordinates, 6396 start indices

4. Frontend sends: **SET_IMAGE_CHANNELS** (fileId: 1, channel: 1)

:red-text:`Check 2:` after channel change, updated VECTOR_OVERLAY_TILE_DATA and CONTOUR_IMAGE_DATA should arrive for the HDF5 file

VECTOR_OVERLAY_NO_POLARIZATION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/VECTOR_OVERLAY_NO_POLARIZATION.test.ts>`__.

This test verifies vector overlay behavior with a non-polarized FITS image (no Stokes parameters).

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_VECTOR_OVERLAY_PARAMETERS** (``SetVectorOverlayParameters``)

   .. code-block:: protobuf

     stokes_angle = 0
     stokes_intensity = 0
     image_bounds = {x_min: 0, x_max: 650, y_min: 0, y_max: 800}
     smoothing_factor = 2
     compression_type = NONE
     compression_quality = 8

:red-text:`Check 1:` the VECTOR_OVERLAY_TILE_DATA should satisfy:

   - progress = 1
   - compressionQuality = 8
   - Angle tile dimensions: height = 144, width = 64, mip = 2
   - Intensity tile dimensions: height = 144, width = 64, mip = 2
   - Total image data length = 36864 bytes
