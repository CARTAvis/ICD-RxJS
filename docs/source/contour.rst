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

How the vertices are carried
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``ContourSet.raw_coordinates`` is not a coordinate list but an encoded one, and
``decimation_factor`` is how the backend says which of the two encodings it used:

- **1 or more** — the vertices were rounded to that many parts of a pixel, delta-encoded per axis,
  byte-shuffled in blocks of four int32s and compressed with Zstd. This is what a default build
  sends.
- **0** — plain little-endian float32 pairs, unrounded. This is what a backend built with
  ``DisableContourCompression`` sends.

The frontend branches on the same field in ``ProcessContourSet``, and the tests decode both the same
way, so every check below is on the decoded vertices rather than on the bytes. Rounding a decoded
float32 set to the requested grid gives the values a compressing backend would have sent, which is
what lets one expected geometry cover both encodings.

``raw_start_indices`` holds the index, into the coordinate list, of the first coordinate of each
polyline.

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
     channel = 0
     stokes = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 0.6

   - the whole contour arrives in one CONTOUR_IMAGE_DATA, since it is far shorter than one chunk

   - contour_sets[0].uncompressed_coordinates_size = 13 * 8, two four-byte coordinates per vertex

   - the decoded vertices equal the 13 pinned in the test, on the 1/4 pixel grid

   - a Zstd-encoded set is already on that grid, so rounding it moves nothing

   - every vertex lies inside the requested image bounds

   - the last vertex repeats the first: the level encloses the peak, so the contour is a closed ring

   - raw_start_indices holds one polyline, starting at coordinate 0

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
      channel = 0
      stokes = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 0.6

    - the whole contour arrives in one CONTOUR_IMAGE_DATA, since it is far shorter than one chunk

    - contour_sets[0].uncompressed_coordinates_size = 5 * 8, two four-byte coordinates per vertex

    - the decoded vertices equal the 5 pinned in the test, on the 1/4 pixel grid

    - a Zstd-encoded set is already on that grid, so rounding it moves nothing

    - every vertex lies inside the requested image bounds

    - the last vertex repeats the first: the level encloses the peak, so the contour is a closed ring

    - raw_start_indices holds one polyline, starting at coordinate 0

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
      channel = 0
      stokes = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 0.85

    - the whole contour arrives in one CONTOUR_IMAGE_DATA, since it is far shorter than one chunk

    - contour_sets[0].uncompressed_coordinates_size = 13 * 8, two four-byte coordinates per vertex

    - the decoded vertices equal the 13 pinned in the test, on the 1/4 pixel grid

    - a Zstd-encoded set is already on that grid, so rounding it moves nothing

    - every vertex lies inside the requested image bounds

    - the last vertex repeats the first: the level encloses the peak, so the contour is a closed ring

    - raw_start_indices holds one polyline, starting at coordinate 0

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
     channel = 0
     stokes = 0
     progress = 1
     contour_sets.length = 1
     contour_sets[0].level = 5.6

   - the whole contour arrives in one CONTOUR_IMAGE_DATA, since it is far shorter than one chunk

   - contour_sets[0].uncompressed_coordinates_size = 26 * 8, two four-byte coordinates per vertex

   - the decoded vertices equal the 26 pinned in the test, on the 1/4 pixel grid

   - a Zstd-encoded set is already on that grid, so rounding it moves nothing

   - no vertex is NaN, and every one of them lies inside the requested image bounds

   - the last vertex does not repeat the first: the NaN region cuts the level off at the edge of the
     image, so the contour is one open polyline rather than the closed ring of CONTOUR_IMAGE_DATA

   - raw_start_indices holds that one polyline, starting at coordinate 0

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
      channel = 0
      stokes = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 5.6

    - the whole contour arrives in one CONTOUR_IMAGE_DATA, since it is far shorter than one chunk

    - contour_sets[0].uncompressed_coordinates_size = 9 * 8, two four-byte coordinates per vertex

    - the decoded vertices equal the 9 pinned in the test, on the 1/4 pixel grid

    - a Zstd-encoded set is already on that grid, so rounding it moves nothing

    - no vertex is NaN, and every one of them lies inside the requested image bounds

    - the last vertex does not repeat the first: the NaN region cuts the level off at the edge of the
      image, so the contour is one open polyline rather than the closed ring of CONTOUR_IMAGE_DATA

    - raw_start_indices holds that one polyline, starting at coordinate 0

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
      channel = 0
      stokes = 0
      progress = 1
      contour_sets.length = 1
      contour_sets[0].level = 5.6

    - the whole contour arrives in one CONTOUR_IMAGE_DATA, since it is far shorter than one chunk

    - contour_sets[0].uncompressed_coordinates_size = 38 * 8, two four-byte coordinates per vertex

    - the decoded vertices equal the 38 pinned in the test, on the 1/4 pixel grid

    - a Zstd-encoded set is already on that grid, so rounding it moves nothing

    - no vertex is NaN, and every one of them lies inside the requested image bounds

    - the last vertex does not repeat the first: the NaN region cuts the level off at the edge of the
      image, so the contour is one open polyline rather than the closed ring of CONTOUR_IMAGE_DATA

    - raw_start_indices holds that one polyline, starting at coordinate 0

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

   - exactly 3 messages report progress = 1, one per level, within 90000 ms (30000 ms per level)

   - every message carries file_id = 0, reference_file_id = 0, channel = 0, stokes = 0 and exactly
     one contour set, whose level is one of [0.36, 0.72, 1.09]

   - each level holds more vertices than one chunk of 100000, and so arrives as more than one
     message: this image is here because ``TraceLevel`` has to flush partial results rather than
     answer in a single message

   - within one level the progress increases, and only its last message reports 1. ``TraceLevel``
     clamps a partial to 0.99, so no partial may report the level complete. The levels are traced in
     parallel, so messages of different levels interleave and only the run belonging to one level is
     ordered

   - every chunk decodes to vertices which lie inside the requested image bounds, on the 1/4 pixel
     grid, with raw_start_indices addressing pairs inside its own coordinate list

   - the three levels return different numbers of vertices, decreasing as the level rises: every
     pixel above 1.09 is also above 0.36, so the lower level traces the longer boundary. This is
     what shows the levels were not all traced at the same value

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

Each group below holds every parameter fixed but one, so that what changes in the response can only
be the work of the factor being varied. Both groups contour level 0.6 of the same image with
``GaussianBlur``.

**Group 1: the decimation factor, with smoothing_factor = 4**

6. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``) once per decimation factor
   in [1, 4, 8]

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.6]
     smoothing_mode = GaussianBlur
     smoothing_factor = 4
     decimation_factor = 1, then 4, then 8
     compression_level = 8
     contour_chunk_size = 100000

7. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``) for each of them

:red-text:`Check 2:` each of the three responses should satisfy:

   - the chunks of the level end in one reporting progress = 1, and the partials before it increase
     without reaching 1

   - every chunk carries file_id = 0, reference_file_id = 0, channel = 0, stokes = 0, one contour
     set, and level = 0.6

   - every chunk decodes to vertices inside the requested image bounds, with raw_start_indices
     addressing pairs inside its own coordinate list

   - contour_sets[0].decimation_factor is the factor which was asked for, or 0 from a backend built
     with ``DisableContourCompression``; where it is the factor, the coordinates are already on the
     1/N pixel grid

   - the level holds more vertices than one chunk of 100000, so each response is streamed in chunks

:red-text:`Check 3:` across the three responses:

   - the three return the same number of vertices. The decimation factor is the grid the vertices
     are rounded to, not an input to the tracing: ``Session::SendContourData`` passes it to
     ``RoundAndEncodeVertices`` after ``ContourImage`` has already produced the vertices, so the
     same level traced at a different decimation returns the same vertices on a finer or coarser
     grid

**Group 2: the smoothing factor, with decimation_factor = 4**

8. Frontend sends: **SET_CONTOUR_PARAMETERS** (``SetContourParameters``) once per smoothing factor
   in [1, 4, 8]

   .. code-block:: protobuf

     file_id = 0
     reference_file_id = 0
     image_bounds = {x_min: 0, x_max: 8600, y_min: 0, y_max: 12200}
     levels = [0.6]
     smoothing_mode = GaussianBlur
     smoothing_factor = 1, then 4, then 8
     decimation_factor = 4
     compression_level = 8
     contour_chunk_size = 100000

9. Backend returns: **CONTOUR_IMAGE_DATA** (``ContourImageData``) for each of them

:red-text:`Check 4:` each of the three responses should satisfy:

   - the chunks of the level end in one reporting progress = 1, and the partials before it increase
     without reaching 1

   - every chunk decodes to a non-empty set of vertices, inside the requested image bounds, at
     level 0.6, with raw_start_indices addressing pairs inside its own coordinate list

:red-text:`Check 5:` across the three responses:

   - the three return different numbers of vertices, fewer as the smoothing factor rises. The
     smoothing factor, unlike the decimation factor, is an input to the tracing: it is the width of
     the Gaussian kernel ``ContourImage`` convolves the image with before looking for the level, and
     a wider kernel flattens the small structure the contour would otherwise have followed
