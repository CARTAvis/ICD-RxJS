FITS Region Matching
--------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title FITS region export/import matching workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open FITS image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Create regions
    activate Frontend
    Frontend -> Backend : 3. SET_REGION (x4)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. SET_REGION_ACK [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays regions
    deactivate Frontend

    User -> Frontend: Export regions
    activate Frontend
    Frontend -> Backend : 5. EXPORT_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. EXPORT_REGION_ACK [Check 2]</font>
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Re-import regions
    activate Frontend
    Frontend -> Backend : 7. IMPORT_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">8. IMPORT_REGION_ACK [Check 3]</font>
    deactivate Backend
    User <-- Frontend: Displays re-imported regions
    deactivate Frontend

FITS_REGION_EXPORT_IMPORT_MATCHING
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FITS_REGION_EXPORT_IMPORT_MATCHING.test.ts>`__.

This test verifies that regions created on a FITS image can be exported to CASA region format (CRTF) in world coordinates, re-imported, and that the control points match the originals within a precision of 3 decimal digits. This checks the coordinate conversion precision for a round-trip through CRTF format.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

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

**Create 4 regions:**

3. Frontend sends: **SET_REGION** (``SetRegion``) 4 times:

   - Region 1: POINT at (262.071716, 377.173907)
   - Region 2: RECTANGLE at (224.531619, 503.871734), size (154.8529, 319.090825), rotation = 0
   - Region 3: ELLIPSE at (405.191764, 628.238373), semi-axes (105.581523, 79.772706), rotation = 0
   - Region 4: POLYGON with vertices (419.270873, 367.788882), (330.113142, 285.66992), (431.002154, 177.74214)

:red-text:`Check 2:` all SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True

**Export to CRTF world coordinates:**

4. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_test_world.crtf"
     type = CRTF
     coord_type = WORLD
     file_id = 0

5. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 3:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True
   - EXPORT_REGION_ACK.contents = []

**Re-import exported file:**

6. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_test_world.crtf"
     type = CRTF
     group_id = 0

7. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 4:` the re-imported regions should match the originals (precision = 3 digits):

   - Point: control point (262.072, 377.174)
   - Rectangle: center (224.532, 503.872), size (154.853, 319.091)
   - Ellipse: center (405.192, 628.238), semi-axes (105.582, 79.773)
   - Polygon: vertices (419.271, 367.789), (330.113, 285.670), (431.002, 177.742)

FITS_DS9_REGION_EXPORT_IMPORT_MATCHING
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FITS_DS9_REGION_EXPORT_IMPORT_MATCHING.test.ts>`__.

This test is identical in structure to FITS_REGION_EXPORT_IMPORT_MATCHING, but exports and re-imports using DS9 region format (.reg) instead of CRTF. It verifies coordinate conversion precision through a round-trip in DS9 format.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

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

**Create 4 regions (same as FITS_REGION_EXPORT_IMPORT_MATCHING):**

3. Frontend sends: **SET_REGION** (``SetRegion``) 4 times:

   - Region 1: POINT at (262.071716, 377.173907)
   - Region 2: RECTANGLE at (224.531619, 503.871734), size (154.8529, 319.090825), rotation = 0
   - Region 3: ELLIPSE at (405.191764, 628.238373), semi-axes (105.581523, 79.772706), rotation = 0
   - Region 4: POLYGON with vertices (419.270873, 367.788882), (330.113142, 285.66992), (431.002154, 177.74214)

:red-text:`Check 2:` all SET_REGION_ACK should satisfy:

   - All SET_REGION_ACK.success = True

**Export to DS9 world coordinates:**

4. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_test_world.reg"
     type = DS9_REG
     coord_type = WORLD
     file_id = 0

5. Backend returns: **EXPORT_REGION_ACK** (``ExportRegionAck``)

:red-text:`Check 3:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True
   - EXPORT_REGION_ACK.contents = []

**Re-import exported file:**

6. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     directory = "<save_subdirectory>"
     file = "M17_SWex_test_world.reg"
     type = DS9_REG
     group_id = 0

7. Backend returns: **IMPORT_REGION_ACK** (``ImportRegionAck``)

:red-text:`Check 4:` the re-imported regions should match the originals (precision = 3 digits):

   - Point: control point (262.072, 377.174)
   - Rectangle: center (224.532, 503.872), size (154.853, 319.091)
   - Ellipse: center (405.192, 628.238), semi-axes (105.582, 79.773)
   - Polygon: vertices (419.271, 367.789), (330.113, 285.670), (431.002, 177.742)
