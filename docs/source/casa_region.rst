CASA Region
-----------

.. uml::

    skinparam style strictuml
    hide footbox
    title CASA region import/export workflow

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

    User -> Frontend: Browse region files
    activate Frontend
    Frontend -> Backend : 3. REGION_LIST_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. REGION_LIST_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays region list
    deactivate Frontend

    User -> Frontend: Get region file info
    activate Frontend
    Frontend -> Backend : 5. REGION_FILE_INFO_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. REGION_FILE_INFO_RESPONSE [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays region file info
    deactivate Frontend

    User -> Frontend: Import region file
    activate Frontend
    Frontend -> Backend : 7. IMPORT_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">8. IMPORT_REGION_ACK [Check 3]</font>
    deactivate Backend
    User <-- Frontend: Displays imported regions
    deactivate Frontend

    User -> Frontend: Export regions
    activate Frontend
    Frontend -> Backend : 9. EXPORT_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">10. EXPORT_REGION_ACK [Check 4]</font>
    deactivate Backend
    User <-- Frontend: Region file saved
    deactivate Frontend

CASA_REGION_INFO
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CASA_REGION_INFO.test.ts>`__.

This test verifies that CASA region file listing and file info retrieval work correctly.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **REGION_LIST_REQUEST** (``RegionListRequest``)

   .. code-block:: protobuf

     directory = "<region_subdirectory>"

4. Backend returns: **REGION_LIST_RESPONSE** (``RegionListResponse``)

:red-text:`Check 2:` the REGION_LIST_RESPONSE should satisfy:

   - REGION_LIST_RESPONSE.success = True
   - REGION_LIST_RESPONSE.directory contains the region subdirectory path
   - REGION_LIST_RESPONSE.subdirectories = [] (empty)
   - REGION_LIST_RESPONSE.files should contain:

     - "M17_SWex_regionSet1_pix.crtf" (type = CRTF)
     - "M17_SWex_regionSet1_world.crtf" (type = CRTF)

5. Frontend sends: **REGION_FILE_INFO_REQUEST** (``RegionFileInfoRequest``) for each region file

   File 1:

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_regionSet1_world.crtf"

   File 2:

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_regionSet1_pix.crtf"

6. Backend returns: **REGION_FILE_INFO_RESPONSE** (``RegionFileInfoResponse``) for each file

:red-text:`Check 3:` the REGION_FILE_INFO_RESPONSE for the world coordinate file should satisfy:

   - Should arrive within 6000 ms
   - REGION_FILE_INFO_RESPONSE.success = True
   - REGION_FILE_INFO_RESPONSE.file_info.name = "M17_SWex_regionSet1_world.crtf"
   - REGION_FILE_INFO_RESPONSE.file_info.type = CRTF
   - REGION_FILE_INFO_RESPONSE.contents should contain 17 lines of CRTF region definitions (header + 16 regions)

:red-text:`Check 4:` the REGION_FILE_INFO_RESPONSE for the pixel coordinate file should satisfy:

   - REGION_FILE_INFO_RESPONSE.success = True
   - REGION_FILE_INFO_RESPONSE.file_info.name = "M17_SWex_regionSet1_pix.crtf"
   - REGION_FILE_INFO_RESPONSE.file_info.type = CRTF
   - REGION_FILE_INFO_RESPONSE.contents should contain 17 lines of CRTF region definitions (header + 16 regions)
   - Contents should match expected CRTF format entries for symbol, centerbox, rotbox, ellipse, and poly region types

CASA_REGION_IMPORT_INTERNAL
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CASA_REGION_IMPORT_INTERNAL.test.ts>`__.

This test verifies that CASA region files (CRTF format) created with CARTA can be imported correctly, comparing both world and pixel coordinate formats.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Import world coordinate region file:**

3. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_regionSet1_world.crtf"
     type = CRTF
     group_id = 0

4. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 2:` the IMPORT_REGION_ACK for the world coordinate file should satisfy:

   - Should arrive within 500 ms
   - IMPORT_REGION_ACK.success = True
   - Length of regions = 16
   - Regions should include the following types with correct control points (precision = 1 digit):

     - Region 1: POINT at (-103.8, 613.1)
     - Region 2: RECTANGLE at (-106.4, 528.9), size (75.1, 75.1), rotation = 0
     - Region 3: RECTANGLE at (-118.0, 412.4), size (137.2, 54.4), rotation = 0
     - Region 4: RECTANGLE at (-120.6, 251.9), size (173.5, 44.0), rotation = 45
     - Region 5: ELLIPSE at (758.3, 635.1), semi-axes (50.5, 50.5), rotation = 0
     - Region 6: ELLIPSE at (749.3, 486.2), semi-axes (29.8, 69.9), rotation = 0
     - Region 7: ELLIPSE at (745.4, 369.7), semi-axes (18.1, 79.0), rotation = 45
     - Region 8: POLYGON with vertices (757.0, 270.1), (715.6, 118.6), (829.5, 191.1)
     - Regions 9-16: duplicate set (POINT, RECTANGLE x3, ELLIPSE x3, POLYGON)

**Import pixel coordinate region file:**

5. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_regionSet1_pix.crtf"
     type = CRTF
     group_id = 0

6. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 3:` the IMPORT_REGION_ACK for the pixel coordinate file should satisfy:

   - IMPORT_REGION_ACK.success = True
   - Length of regions = 16
   - Region IDs continue from 17 to 32 (appended to existing regions)
   - Regions should match the same types and control points as the world coordinate import

CASA_REGION_IMPORT_EXCEPTION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CASA_REGION_IMPORT_EXCEPTION.test.ts>`__.

This test verifies that importing invalid CASA region files produces appropriate error messages.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Case 1: Import region file with mixed coordinates (pixel)**

3. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_regionSet2_pix.crtf"
     type = CRTF
     group_id = 0

:red-text:`Check 2:` the IMPORT_REGION_ACK should satisfy:

   - The import should fail with error message: "Mixed world and pixel coordinates not supported"

**Case 2: Import region file with mixed coordinates (world)**

4. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_regionSet2_world.crtf"
     type = CRTF
     group_id = 0

:red-text:`Check 3:` the IMPORT_REGION_ACK should satisfy:

   - The import should fail with error message: "Mixed world and pixel coordinates not supported"

CASA_REGION_IMPORT_EXPORT
~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CASA_REGION_IMPORT_EXPORT.test.ts>`__.

This test verifies the full round-trip of importing a CASA region file, exporting it to both world and pixel coordinates, and re-importing the exported files. It uses a region file containing 10 region types including rectangles, ellipses, polygons, lines, vectors, text annotations, and points.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1.0, y: 1.0}

**Import initial region file:**

4. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<region_subdirectory>"
     file = "M17_SWex_testRegions_pix.crtf"
     type = CRTF
     group_id = 0

5. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 2:` the IMPORT_REGION_ACK should satisfy:

   - IMPORT_REGION_ACK.success = True
   - Length of regions = 10
   - Regions should include:

     - Region 1: RECTANGLE at (320, 400), size (40, 100)
     - Region 2: RECTANGLE at (320, 400), size (100, 40)
     - Region 3: RECTANGLE at (320, 400), size (200, 40), rotation = 45
     - Region 4: POLYGON with vertices (320, 400), (320, 600), (400, 400)
     - Region 5: ELLIPSE at (320, 400), semi-axes (200, 200)
     - Region 6: ELLIPSE at (320, 400), semi-axes (100, 20), rotation = 45
     - Region 7: LINE from (320, 400) to (320, 300)
     - Region 8: ANNVECTOR from (320, 400) to (370, 450)
     - Region 9: ANNTEXT at (320, 400) with label "CARTA REGION TEST"
     - Region 10: POINT at (320, 300)

**Export to world coordinates:**

6. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_testRegions_pix_export_to_world.crtf"
     type = CRTF
     coord_type = WORLD
     file_id = 0

7. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 3:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True
   - EXPORT_REGION_ACK.contents = [] (empty, written to file)

**Export to pixel coordinates:**

8. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_testRegions_pix_export_to_pix.crtf"
     type = CRTF
     coord_type = PIXEL
     file_id = 0

9. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 4:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True
   - EXPORT_REGION_ACK.contents = [] (empty, written to file)

**Re-import exported world coordinate file:**

10. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

    .. code-block:: protobuf

      directory = "<save_subdirectory>"
      file = "M17_SWex_testRegions_pix_export_to_world.crtf"
      type = CRTF
      group_id = 0

11. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 5:` the re-imported world coordinate IMPORT_REGION_ACK should satisfy:

    - IMPORT_REGION_ACK.success = True
    - Length of regions = 10
    - Last region ID = 20

**Re-import exported pixel coordinate file:**

12. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

    .. code-block:: protobuf

      directory = "<save_subdirectory>"
      file = "M17_SWex_testRegions_pix_export_to_pix.crtf"
      type = CRTF
      group_id = 0

13. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 6:` the re-imported pixel coordinate IMPORT_REGION_ACK should satisfy:

    - IMPORT_REGION_ACK.success = True
    - Length of regions = 10
    - Last region ID = 30

CASA_REGION_EXPORT
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CASA_REGION_EXPORT.test.ts>`__.

This test verifies that hand-created regions can be exported to CASA region format (CRTF) and re-imported correctly. It creates 16 regions programmatically (points, rectangles, ellipses, and polygons with various rotations), exports them to both world and pixel coordinate files, and re-imports them.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

**Create 16 regions programmatically:**

3. Frontend sends: **SET_REGION** (``SetRegion``) 16 times for the following region types:

   - Region 1: POINT at (-109.579, 618.563)
   - Region 2: RECTANGLE at (-114.748, 508.708), size (90.468, 90.468), rotation = 0
   - Region 3: RECTANGLE at (-114.748, 332.941), size (170.597, 64.62), rotation = 0
   - Region 4: RECTANGLE at (-126.38, 167.512), size (149.919, 38.772), rotation = 45
   - Region 5: ELLIPSE at (758.918, 634.071), semi-axes (62.035, 62.035), rotation = 0
   - Region 6: ELLIPSE at (751.163, 444.088), semi-axes (29.725, 93.053), rotation = 0
   - Region 7: ELLIPSE at (749.871, 290.291), semi-axes (25.848, 84.006), rotation = 45
   - Region 8: POLYGON with vertices (757.626, 184.314), (698.175, 66.7051), (831.293, 106.769)
   - Regions 9-16: second set (POINT, RECTANGLE x3, ELLIPSE x3, POLYGON)

:red-text:`Check 2:` all SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True

**Export to world coordinates:**

4. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_handMadeRegions_world.crtf"
     type = CRTF
     coord_type = WORLD
     file_id = 0

5. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 3:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True
   - EXPORT_REGION_ACK.contents = []

**Export to pixel coordinates:**

6. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_handMadeRegions_pix.crtf"
     type = CRTF
     coord_type = PIXEL
     file_id = 0

7. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 4:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True
   - EXPORT_REGION_ACK.contents = []

**Re-import exported world coordinate file:**

8. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_handMadeRegions_world.crtf"
     type = CRTF
     group_id = 0

9. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 5:` the IMPORT_REGION_ACK should satisfy:

   - IMPORT_REGION_ACK.success = True
   - Length of regions = 16
   - Last region ID = 32

**Re-import exported pixel coordinate file:**

10. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

    .. code-block:: protobuf

      directory = "<save_subdirectory>"
      file = "M17_SWex_handMadeRegions_pix.crtf"
      type = CRTF
      group_id = 0

11. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 6:` the IMPORT_REGION_ACK should satisfy:

    - IMPORT_REGION_ACK.success = True
    - Length of regions = 16
    - Last region ID = 48

EXPORT_REGION_OVERWRITE
~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/EXPORT_REGION_OVERWRITE.test.ts>`__.

This test verifies that the backend refuses to export regions to a path where doing so would destroy
something which is already there. The check is made before the region file is written and does not
depend on the region format, so CRTF is used here to cover it.

A directory can never be overwritten, so that case is sent with ``overwrite = true`` to show that
the refusal does not depend on it. An existing file is a case the frontend may retry after asking
the user, so it is sent with ``overwrite = false`` and the backend is expected to set
``overwrite_confirmation_required = true`` rather than simply failing.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     hdu = ""
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True
   - OPEN_FILE_ACK.fileInfo.name = "M17_SWex.image"

3. Frontend sends: **SET_REGION** (``SetRegion``) to create a region to export

   .. code-block:: protobuf

     file_id = 0
     region_id = -1
     region_type = RECTANGLE
     control_points = [{x: 200.0, y: 400.0}, {x: 100.0, y: 100.0}]
     rotation = 0.0

:red-text:`Check 2:` SET_REGION_ACK.success = True

**Case 1: The export path is an existing directory**

4. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "regionTest"
     type = CRTF
     coord_type = PIXEL
     file_id = 0
     overwrite = true

5. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 3:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = False
   - EXPORT_REGION_ACK.message = "Export region failed: cannot overwrite existing directory."
   - EXPORT_REGION_ACK.overwrite_confirmation_required = False

**Case 2: The export path is an existing file**

6. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "set_QA/regionTest"
     file = "M17_SWex_regionSet1_pix.crtf"
     type = CRTF
     coord_type = PIXEL
     file_id = 0
     overwrite = false

7. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 4:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = False
   - EXPORT_REGION_ACK.message = "Export region failed: cannot overwrite existing file."
   - EXPORT_REGION_ACK.overwrite_confirmation_required = True
