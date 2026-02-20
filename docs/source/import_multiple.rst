Import Multiple
---------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Import Multiple Files workflow

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

    User -> Frontend: Import catalog/region files
    activate Frontend

    loop For each file
        Frontend -> Backend : 3. LOAD_CATALOG_FILE / IMPORT_REGION
        activate Backend
        Frontend <--[#red] Backend : <font color="red">4. OPEN_CATALOG_FILE_ACK / IMPORT_REGION_ACK [Check 1]</font>
        deactivate Backend
    end

    User <-- Frontend: Files imported
    deactivate Frontend

    User -> Frontend: Import invalid file
    activate Frontend
    Frontend -> Backend : 5. LOAD_CATALOG_FILE / IMPORT_REGION (invalid)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. Error response [Check 2]</font>
    deactivate Backend
    deactivate Frontend

IMPORT_MULTIPLE_CATALOG
~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMPORT_MULTIPLE_CATALOG.test.ts>`__.

This test verifies importing multiple catalog files in different coordinate systems (B1950, Ecliptic, Galactic, J2000).

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for context image

   .. code-block:: protobuf

     directory = "set_QA"
     file = "Gaussian_J2000.fits"
     file_id = 100
     render_mode = RASTER

2. Frontend sends: **LOAD_CATALOG_FILE** (``LoadCatalogFile``) for 4 catalog files

   Catalog 1 (B1950):

   .. code-block:: protobuf

     file = "artificial_catalog_B1950.xml"
     file_id = 101

   Catalog 2 (Ecliptic):

   .. code-block:: protobuf

     file = "artificial_catalog_Ecliptic.xml"
     file_id = 102

   Catalog 3 (Galactic):

   .. code-block:: protobuf

     file = "artificial_catalog_Galactic.xml"
     file_id = 103

   Catalog 4 (J2000):

   .. code-block:: protobuf

     file = "artificial_catalog_J2000.xml"
     file_id = 104

3. Backend returns: **OPEN_CATALOG_FILE_ACK** for each catalog

:red-text:`Check 1:` each OPEN_CATALOG_FILE_ACK should satisfy:

   - success = True
   - dataSize = 29 entries
   - headers.length = 235
   - Coordinate systems: FK4 (B1950), Ecliptic, Galactic, FK5 (J2000)

**Error case:**

4. Frontend sends: **LOAD_CATALOG_FILE** for a FITS image file (not a catalog)

:red-text:`Check 2:` the error response should satisfy:

   - Error message contains "File does not contain a FITS table!"

IMPORT_MULTIPLE_REGION
~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMPORT_MULTIPLE_REGION.test.ts>`__.

This test verifies importing multiple region files in different formats (CRTF and DS9) for both pixel and world coordinates.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex.image"
     file_id = 100
     render_mode = RASTER

2. Frontend sends: **IMPORT_REGION** (``ImportRegion``) for 4 region files

   Region 1 (CRTF pixel):

   .. code-block:: protobuf

     file = "M17_SWex_regionSet1_pix.crtf"
     group_id = 100

   Region 2 (CRTF world):

   .. code-block:: protobuf

     file = "M17_SWex_regionSet1_world.crtf"
     group_id = 100

   Region 3 (DS9 pixel):

   .. code-block:: protobuf

     file = "M17_SWex_regionSet1_pix.reg"
     group_id = 100

   Region 4 (DS9 world):

   .. code-block:: protobuf

     file = "M17_SWex_regionSet1_world.reg"
     group_id = 100

3. Backend returns: **IMPORT_REGION_ACK** for each file

:red-text:`Check 1:` each IMPORT_REGION_ACK should satisfy:

   - success = True
   - message = "" (empty for success)
   - 16 regions imported per file
   - regionStyles.color = "green"
   - regionStyles.lineWidth = 1

**Error case:**

4. Frontend sends: **IMPORT_REGION** for a CASA image file (not a region file)

:red-text:`Check 2:` the error response should satisfy:

   - Error message contains "Import region failed:"
