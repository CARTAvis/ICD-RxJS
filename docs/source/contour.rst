Contour
-------

.. uml::

    skinparam style strictuml
    hide footbox
    title Contour workflow

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
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    Frontend -> Backend : 4. SET_CURSOR
    Frontend <-- Backend : 5. RASTER_TILE_DATA
    Frontend <-- Backend : 5. SPATIAL_PROFILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Set contour parameters
    activate Frontend
    Frontend -> Backend : 6. SET_CONTOUR_PARAMETERS
    activate Backend
    Frontend <--[#red] Backend : <font color="red">7. CONTOUR_IMAGE_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays contours
    deactivate Frontend

CONTOUR_IMAGE_DATA
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONTOUR_IMAGE_DATA.test.ts>`__.

This test verifies that contour image data (vertices) are delivered correctly for different smoothing modes.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "contour_test.miriad"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "contour_test.miriad"

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

**Case 1: GaussianBlur smoothing mode**

7. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 21, y_min: 0, y_max: 21}
     levels = [0.6]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

8. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 3:` the CONTOUR_IMAGE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 0.6
     contour_sets[0].decimation_factor = 4
     contour_sets[0].uncompressed_coordinates_size = 104

   - rawCoordinates values should match expected byte array

**Case 2: BlockAverage smoothing mode**

9. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 21, y_min: 0, y_max: 21}
     levels = [0.6]
     smoothing_mode = BlockAverage
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

10. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 4:` the CONTOUR_IMAGE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 0.6
     contour_sets[0].decimation_factor = 4
     contour_sets[0].uncompressed_coordinates_size = 40

   - rawCoordinates values should match expected byte array

**Case 3: NoSmoothing mode**

11. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      image_bounds = {x_min: 0, x_max: 21, y_min: 0, y_max: 21}
      levels = [0.85]
      smoothing_mode = NoSmoothing
      smoothing_factor = 4
      decimation_factor = 4
      compression_level = 8
      contour_chunk_size = 100000

12. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 5:` the CONTOUR_IMAGE_DATA should satisfy:

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 0.85
      contour_sets[0].decimation_factor = 4
      contour_sets[0].uncompressed_coordinates_size = 104

    - rawCoordinates values should match expected byte array

CONTOUR_IMAGE_DATA_NAN
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONTOUR_IMAGE_DATA_NAN.test.ts>`__.

This test verifies that contour image data (vertices) are delivered correctly when NaN pixels are present in the image.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "contour_test_nan.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "contour_test_nan.image"

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

**Case 1: GaussianBlur smoothing mode**

7. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 21, y_min: 0, y_max: 21}
     levels = [5.6]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

8. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 3:` the CONTOUR_IMAGE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 5.6
     contour_sets[0].decimation_factor = 4
     contour_sets[0].uncompressed_coordinates_size = 208

   - rawCoordinates values should match expected byte array

**Case 2: BlockAverage smoothing mode**

9. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 21, y_min: 0, y_max: 21}
     levels = [5.6]
     smoothing_mode = BlockAverage
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

10. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 4:` the CONTOUR_IMAGE_DATA should satisfy:

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 5.6
      contour_sets[0].decimation_factor = 4
      contour_sets[0].uncompressed_coordinates_size = 72

    - rawCoordinates values should match expected byte array

**Case 3: NoSmoothing mode**

11. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      image_bounds = {x_min: 0, x_max: 21, y_min: 0, y_max: 21}
      levels = [5.6]
      smoothing_mode = NoSmoothing
      smoothing_factor = 4
      decimation_factor = 4
      compression_level = 8
      contour_chunk_size = 100000

12. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 5:` the CONTOUR_IMAGE_DATA should satisfy:

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 5.6
      contour_sets[0].decimation_factor = 4
      contour_sets[0].uncompressed_coordinates_size = 304

    - rawCoordinates values should match expected byte array

CONTOUR_DATA_STREAM
~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONTOUR_DATA_STREAM.test.ts>`__.

This test verifies contour data streaming when there are a large number of vertices (large image with multiple contour levels).

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "h_m51_b_s05_drz_sci.fits"
     hdu = ""
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "h_m51_b_s05_drz_sci.fits"

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 4000, y: 2000}

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

7. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``) with multiple levels

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.36, 0.72, 1.09]
     smoothing_mode = NoSmoothing
     smoothing_factor = 4
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

8. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``) stream

:red-text:`Check 2:` the CONTOUR_IMAGE_DATA stream should satisfy:

   - 3 CONTOUR_IMAGE_DATA messages should arrive (one per level), each with progress = 1

   - Each message's contourSets[0].level should be one of [0.36, 0.72, 1.09]

   - All messages should arrive within 90000 ms (30000 ms per level)

:red-text:`Check 3:` after all contour data is received:

   - No additional messages should be received from the backend within 500 ms

CONTOUR_CHANGE_SMOOTH_AND_DECIMATION_FACTOR
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CONTOUR_CHANGE_SMOOTH_AND_DEMICATION_FACTOR.test.ts>`__.

This test verifies that contour data is generated correctly with different smoothing factors and decimation factors.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "h_m51_b_s05_drz_sci.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.file_info.name = "h_m51_b_s05_drz_sci.fits"

4. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1, y: 1}
     spatial_profiles = [{coordinate: "x", mip: 1}, {coordinate: "y", mip: 1}]

5. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

**Case 1: smoothing_factor = 4, decimation_factor = 2**

6. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.6]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 2
     compression_level = 8
     contour_chunk_size = 100000

7. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 2:` the CONTOUR_IMAGE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 0.6
     contour_sets[0].decimation_factor = 2
     contour_sets[0].uncompressed_coordinates_size = 417688

   - rawCoordinates length should be greater than 1

**Case 2: smoothing_factor = 6, decimation_factor = 4**

8. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.85]
     smoothing_mode = GaussianBlur
     smoothing_factor = 6
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

9. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 3:` the CONTOUR_IMAGE_DATA should satisfy:

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 0.85
     contour_sets[0].decimation_factor = 4
     contour_sets[0].uncompressed_coordinates_size = 486624

   - rawCoordinates length should be greater than 1

**Case 3: smoothing_factor = 2, decimation_factor = 6**

10. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``)

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
      levels = [0.1]
      smoothing_mode = GaussianBlur
      smoothing_factor = 2
      decimation_factor = 6
      compression_level = 8
      contour_chunk_size = 100000

11. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``)

:red-text:`Check 4:` the CONTOUR_IMAGE_DATA should satisfy:

    .. code-block:: protobuf

      file_id = 0
      reference_file_id = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 0.1
      contour_sets[0].decimation_factor = 6
      contour_sets[0].uncompressed_coordinates_size = 724136

    - rawCoordinates length should be greater than 1
