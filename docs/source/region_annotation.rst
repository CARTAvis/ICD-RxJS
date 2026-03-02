Region Annotation
-----------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Region Annotation Export/Import workflow

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

    User -> Frontend: Create annotation regions
    activate Frontend
    loop 10 annotation types
        Frontend -> Backend : 3. SET_REGION
        Frontend <--[#red] Backend : <font color="red">4. SET_REGION_ACK [Check 1]</font>
    end
    deactivate Frontend

    User -> Frontend: Export regions
    activate Frontend
    Frontend -> Backend : 5. EXPORT_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. EXPORT_REGION_ACK [Check 2]</font>
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Import regions
    activate Frontend
    Frontend -> Backend : 7. IMPORT_REGION
    activate Backend
    Frontend <--[#red] Backend : <font color="red">8. IMPORT_REGION_ACK [Check 3]</font>
    deactivate Backend
    User <-- Frontend: Regions restored
    deactivate Frontend

SET_REGION_ANNOTATION_EXPORT_IMPORT_CASA_PIXEL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/SET_REGION_ANNOTATION_EXPORT_IMPORT_CASA_PIXEL.test.ts>`__.

This test verifies that all annotation region types can be created, exported as CRTF (CASA Region Text Format) in pixel coordinates, and then re-imported with preserved properties.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.fits"
     file_id = 0
     render_mode = RASTER

2. Frontend sends: **SET_REGION** (``SetRegion``) for 10 annotation region types

   .. code-block:: protobuf

     Region 1:  ANNPOINT      - control_points = [{x: 163, y: 565}]
     Region 2:  ANNLINE       - control_points = [{x: 270, y: 618}, {x: 219, y: 560}], rotation = 318.958
     Region 3:  ANNRECTANGLE  - control_points = [{x: 309, y: 587}, {x: 36, y: 44}]
     Region 4:  ANNELLIPSE    - control_points = [{x: 388, y: 587}, {x: 33.7, y: 11.9}]
     Region 5:  ANNPOLYGON    - control_points = [{x: 175.58, y: 511.66}, {x: 125.95, y: 464.02}, {x: 169.62, y: 446.15}, {x: 225.21, y: 464.02}, {x: 175.58, y: 471.96}]
     Region 6:  ANNPOLYLINE   - control_points = [{x: 265, y: 458}, {x: 299, y: 520}, {x: 324, y: 446}]
     Region 7:  ANNVECTOR     - control_points = [{x: 340, y: 533}, {x: 416, y: 474}], rotation = 52.177
     Region 8:  ANNTEXT       - control_points = [{x: 260.94, y: 346.89}, {x: 400.28, y: 107.20}], rotation = 45
     Region 9:  ANNCOMPASS    - control_points = [{x: 157.71, y: 132.50}, {x: 100, y: 100}]
     Region 10: ANNRULER      - control_points = [{x: 362, y: 219}, {x: 485, y: 285}]

:red-text:`Check 1:` each SET_REGION_ACK should satisfy:

   - SET_REGION_ACK.success = True

   - SET_REGION_ACK.region_id = 1 through 10

3. Frontend sends: **EXPORT_REGION** (``ExportRegion``)

   .. code-block:: protobuf

     file_id = 0
     file = "set_region_annotation_test_pixel.crtf"
     type = CRTF
     coord_type = WORLD

:red-text:`Check 2:` the EXPORT_REGION_ACK should satisfy:

   - EXPORT_REGION_ACK.success = True

4. Frontend sends: **IMPORT_REGION** (``ImportRegion``)

   .. code-block:: protobuf

     file = "set_region_annotation_test_pixel.crtf"
     type = CRTF
     group_id = 0

:red-text:`Check 3:` the IMPORT_REGION_ACK should satisfy:

   - IMPORT_REGION_ACK.success = True

   - 10 regions imported (region IDs 11-20)

   - Each region's control_points match the original values (within precision of 3 digits)

   - Each region's rotation matches the original (where applicable)

   - Each region's type matches the original annotation type

   - Region styles preserved: color = "#FFBA01", lineWidth = 2 (1 for text), dashList = [0]

   - Annotation styles preserved: font = "Helvetica", fontStyle, fontSize, and type-specific properties (textLabel, compass arrows, etc.)
