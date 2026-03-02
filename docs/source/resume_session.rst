Resume Session
--------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Resume Session workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Reconnect after disconnect
    activate Frontend
    Frontend -> Backend : 1. REGISTER_VIEWER
    activate Backend
    Frontend <-- Backend : 2. REGISTER_VIEWER_ACK
    deactivate Backend
    Frontend -> Backend : 3. RESUME_SESSION
    activate Backend
    Frontend <-- Backend : 4. REGION_HISTOGRAM_DATA (per image)
    Frontend <--[#red] Backend : <font color="red">5. RESUME_SESSION_ACK [Check]</font>
    deactivate Backend
    User <-- Frontend: Session restored
    deactivate Frontend

RESUME_IMAGE
~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/RESUME_IMAGE.test.ts>`__.

This test verifies that a session can be resumed with previously open images restored. It resumes the session twice to ensure repeatability, then verifies the images can be rendered.

1. Frontend sends: **REGISTER_VIEWER** and connects to the server

2. Frontend sends: **RESUME_SESSION** (``ResumeSession``)

   .. code-block:: protobuf

     images = [
       {directory: "set_QA", file: "M17_SWex.fits", file_id: 0, hdu: "", render_mode: RASTER, channel: 0, stokes: 0},
       {directory: "set_QA", file: "M17_SWex.image", file_id: 1, hdu: "", render_mode: RASTER, channel: 0, stokes: 0}
     ]

3. Backend returns: 2 **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK** (``ResumeSessionAck``)

:red-text:`Check 1:` the RESUME_SESSION_ACK should satisfy:

   - RESUME_SESSION_ACK.success = True

**Resume again (verify repeatability):**

4. Frontend reconnects and sends: **RESUME_SESSION** (same as step 2)

5. Backend returns: 2 **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 2:` the RESUME_SESSION_ACK should satisfy:

   - RESUME_SESSION_ACK.success = True

**Render resumed images:**

6. Frontend sends: **ADD_REQUIRED_TILES** for file_id = 0

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     compression_type = ZFP
     compression_quality = 11

7. Backend returns: **RASTER_TILE_DATA**

8. Frontend sends: **ADD_REQUIRED_TILES** for file_id = 1

   .. code-block:: protobuf

     file_id = 1
     tiles = [0]
     compression_type = ZFP
     compression_quality = 11

9. Backend returns: **RASTER_TILE_DATA**

RESUME_CATALOG
~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/RESUME_CATALOG.test.ts>`__.

This test verifies that a session can be resumed with both an image and a catalog file restored. After resuming, it verifies the catalog data can be queried.

1. Frontend sends: **REGISTER_VIEWER** and connects to the server

2. Frontend sends: **RESUME_SESSION** (``ResumeSession``)

   .. code-block:: protobuf

     images = [
       {directory: "set_QA", file: "model.fits", file_id: 0, hdu: "", render_mode: RASTER, channel: 0, stokes: 0}
     ]
     catalog_files = [
       {directory: "set_QA", name: "test_fk4.xml", file_id: 1, preview_data_size: 10}
     ]

3. Backend returns: 2 **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 1:` the RESUME_SESSION_ACK should satisfy:

   - RESUME_SESSION_ACK.success = True

**Resume again:**

4. Frontend reconnects and sends: **RESUME_SESSION** (same as step 2)

5. Backend returns: 2 **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 2:` the RESUME_SESSION_ACK should satisfy:

   - RESUME_SESSION_ACK.success = True

**Query catalog data:**

6. Frontend sends: **CATALOG_FILTER_REQUEST** (``CatalogFilterRequest``)

   .. code-block:: protobuf

     file_id = 1
     column_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     subset_start_index = 0
     subset_data_size = 6

7. Backend returns: **CATALOG_FILTER_RESPONSE** (``CatalogFilterResponse``)

:red-text:`Check 3:` the CATALOG_FILTER_RESPONSE should satisfy:

   - columns.length = 10 (matching the number of requested column indices)

RESUME_CONTOUR
~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/RESUME_CONTOUR.test.ts>`__.

This test verifies that a session can be resumed with contour settings restored. After resuming, it changes the channel and verifies that contour data is recalculated for all configured levels.

1. Frontend sends: **REGISTER_VIEWER** and connects to the server

2. Frontend sends: **RESUME_SESSION** (``ResumeSession``)

   .. code-block:: protobuf

     images = [
       {
         directory: "set_QA",
         file: "M17_SWex.fits",
         file_id: 0,
         hdu: "",
         render_mode: RASTER,
         channel: 0,
         stokes: 0,
         contour_settings: {
           file_id: 0,
           reference_file_id: 0,
           image_bounds: {x_min: 0, x_max: 800, y_min: 0, y_max: 800},
           levels: [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0],
           smoothing_mode: GaussianBlur,
           smoothing_factor: 4,
           decimation_factor: 4,
           compression_level: 8,
           contour_chunk_size: 100000
         }
       }
     ]

3. Backend returns: **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 1:` the RESUME_SESSION_ACK should satisfy:

   - RESUME_SESSION_ACK.success = True

**Resume again:**

4. Frontend reconnects and sends: **RESUME_SESSION** (same as step 2)

5. Backend returns: **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 2:` RESUME_SESSION_ACK.success = True

**Change channel and verify contour recalculation:**

6. Frontend sends: **SET_IMAGE_CHANNELS** (``SetImageChannels``)

   .. code-block:: protobuf

     file_id = 0
     channel = 1
     stokes = 0

7. Backend returns: 12 **CONTOUR_IMAGE_DATA** (one per level) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 3:` the CONTOUR_IMAGE_DATA should satisfy:

   - ContourImageData count = 12 (one for each contour level)
   - REGION_HISTOGRAM_DATA.channel = 1

RESUME_REGION
~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/RESUME_REGION.test.ts>`__.

This test verifies that a session can be resumed with regions restored on multiple images. After resuming, it requests region statistics to confirm the regions are functional.

1. Frontend sends: **REGISTER_VIEWER** and connects to the server

2. Frontend sends: **RESUME_SESSION** (``ResumeSession``)

   .. code-block:: protobuf

     images = [
       {
         directory: "set_QA", file: "M17_SWex.fits", file_id: 0, render_mode: RASTER, channel: 0, stokes: 0,
         regions: {"1": {region_type: RECTANGLE, control_points: [{x: 250, y: 350}, {x: 80, y: 60}], rotation: 0}}
       },
       {
         directory: "set_QA", file: "M17_SWex.image", file_id: 1, render_mode: RASTER, channel: 0, stokes: 0,
         regions: {"2": {region_type: RECTANGLE, control_points: [{x: 350, y: 250}, {x: 60, y: 80}], rotation: 0}}
       }
     ]

3. Backend returns: 2 **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 1:` the RESUME_SESSION_ACK should satisfy:

   - RESUME_SESSION_ACK.success = True

**Resume again:**

4. Frontend reconnects and sends: **RESUME_SESSION** (same as step 2)

5. Backend returns: 2 **REGION_HISTOGRAM_DATA** and **RESUME_SESSION_ACK**

:red-text:`Check 2:` RESUME_SESSION_ACK.success = True

**Request region statistics:**

6. Frontend sends: **SET_STATS_REQUIREMENTS** (``SetStatsRequirements``) for region 1 on file 0

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     stats_configs = [{coordinate: "z", stats_types: [NumPixels, NanCount, Sum]}]

7. Backend returns: **REGION_STATS_DATA** (``RegionStatsData``)

8. Frontend sends: **SET_STATS_REQUIREMENTS** for region 2 on file 1

   .. code-block:: protobuf

     file_id = 1
     region_id = 2
     stats_configs = [{coordinate: "z", stats_types: [NumPixels, NanCount, Sum]}]

9. Backend returns: **REGION_STATS_DATA**
