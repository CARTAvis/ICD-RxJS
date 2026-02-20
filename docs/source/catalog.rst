Catalog
-------

.. uml::

    skinparam style strictuml
    hide footbox
    title Catalog workflow

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

    User -> Frontend: Browse catalogs
    activate Frontend
    Frontend -> Backend : 6. CATALOG_LIST_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">7. CATALOG_LIST_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays catalog list
    deactivate Frontend

    User -> Frontend: Get catalog info
    activate Frontend
    Frontend -> Backend : 8. CATALOG_FILE_INFO_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">9. CATALOG_FILE_INFO_RESPONSE [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Displays catalog info
    deactivate Frontend

    User -> Frontend: Open catalog
    activate Frontend
    Frontend -> Backend : 10. OPEN_CATALOG_FILE
    activate Backend
    Frontend <--[#red] Backend : <font color="red">11. OPEN_CATALOG_FILE_ACK [Check 3]</font>
    deactivate Backend
    User <-- Frontend: Displays catalog preview
    deactivate Frontend

    User -> Frontend: Filter/sort catalog
    activate Frontend
    Frontend -> Backend : 12. CATALOG_FILTER_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">13. CATALOG_FILTER_RESPONSE [Check 4]</font>
    deactivate Backend
    User <-- Frontend: Displays filtered catalog
    deactivate Frontend

CATALOG_GENERAL
~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CATALOG_GENERAL.test.ts>`__.

This test verifies the general catalog workflow: listing, file info, opening, and filtering/sorting a small catalog with an artificial data set.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA/carta_artificial_catalog"
     file = "Gaussian_J2000.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 1250, y: 100}
     spatial_profiles = [{coordinate: "x"}, {coordinate: "y"}]

4. Frontend sends: **CATALOG_LIST_REQUEST** (``CatalogListRequest``)

   .. code-block:: protobuf

     directory = "set_QA/carta_artificial_catalog"

5. Backend returns: **CATALOG_LIST_RESPONSE** (``CatalogListResponse``)

:red-text:`Check 2:` the CATALOG_LIST_RESPONSE should satisfy:

   - CATALOG_LIST_RESPONSE.success = True
   - CATALOG_LIST_RESPONSE.subdirectories should contain "Gaussian_J2000.image"

6. Frontend sends: **CATALOG_FILE_INFO_REQUEST** (``CatalogFileInfoRequest``)

   .. code-block:: protobuf

     directory = "set_QA/carta_artificial_catalog"
     name = "artificial_catalog_J2000.xml"

7. Backend returns: **CATALOG_FILE_INFO_RESPONSE** (``CatalogFileInfoResponse``)

:red-text:`Check 3:` the CATALOG_FILE_INFO_RESPONSE should satisfy:

   - CATALOG_FILE_INFO_RESPONSE.success = True
   - CATALOG_FILE_INFO_RESPONSE.file_info.name = "artificial_catalog_J2000.xml"
   - CATALOG_FILE_INFO_RESPONSE.file_info.type = VOTable
   - CATALOG_FILE_INFO_RESPONSE.file_info.file_size = 113559
   - Length of headers = 235

8. Frontend sends: **OPEN_CATALOG_FILE** (``OpenCatalogFile``)

   .. code-block:: protobuf

     directory = "set_QA/carta_artificial_catalog"
     name = "artificial_catalog_J2000.xml"
     file_id = 1
     preview_data_size = 50

9. Backend returns: **OPEN_CATALOG_FILE_ACK** (``OpenCatalogFileAck``)

:red-text:`Check 4:` the OPEN_CATALOG_FILE_ACK should satisfy:

   - OPEN_CATALOG_FILE_ACK.success = True
   - OPEN_CATALOG_FILE_ACK.data_size = 29
   - OPEN_CATALOG_FILE_ACK.file_id = 1
   - OPEN_CATALOG_FILE_ACK.file_info.name = "artificial_catalog_J2000.xml"
   - Length of headers = 235

**Case 1: Sort by column**

10. Frontend sends: **CATALOG_FILTER_REQUEST** (``CatalogFilterRequest``)

    .. code-block:: protobuf

      file_id = 1
      column_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      sort_column = "RA_d"
      sorting_type = 0
      subset_data_size = 29
      subset_start_index = 0

:red-text:`Check 5:` the CATALOG_FILTER_RESPONSE should satisfy:

    - Length of columns = 10, progress = 1
    - subsetDataSize = 29, filterDataSize = 29

**Case 2: Filter by number (RA_d > 160)**

11. Frontend sends: **CATALOG_FILTER_REQUEST** with numeric filter

    .. code-block:: protobuf

      file_id = 1
      filter_configs = [{column_name: "RA_d", comparison_operator: 5, value: 160}]
      subset_data_size = 29

:red-text:`Check 6:` the CATALOG_FILTER_RESPONSE should satisfy:

    - subsetDataSize = 26, filterDataSize = 26 (3 rows filtered out)

**Case 3: Filter by string (OTYPE_S contains "Star")**

12. Frontend sends: **CATALOG_FILTER_REQUEST** with string filter

    .. code-block:: protobuf

      file_id = 1
      filter_configs = [{column_name: "OTYPE_S", sub_string: "Star"}]
      subset_data_size = 29

:red-text:`Check 7:` the CATALOG_FILTER_RESPONSE should satisfy:

    - subsetDataSize = 24, filterDataSize = 24 (5 rows filtered out)

**Case 4: Combined filter + sort**

13. Frontend sends: **CATALOG_FILTER_REQUEST** with both string and numeric filters, plus sorting

    .. code-block:: protobuf

      file_id = 1
      filter_configs = [
          {column_name: "OTYPE_S", sub_string: "Star"},
          {column_name: "RA_d", comparison_operator: 5, value: 160}
      ]
      sort_column = "RA_d"
      sorting_type = 0
      subset_data_size = 29

:red-text:`Check 8:` the CATALOG_FILTER_RESPONSE should satisfy:

    - subsetDataSize = 23, filterDataSize = 23 (6 rows filtered out by combined filters)

CATALOG_FITS_VOT
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CATALOG_FITS_VOT.test.ts>`__.

This test verifies catalog operations for both FITS and VOTable catalog formats using a large catalog (COSMOSOPTCAT with 918,827 entries), comparing results between the two formats.

**For each catalog format (COSMOSOPTCAT.fits and COSMOSOPTCAT.vot):**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA/set_cosmos"
     file = "cosmos_herschel250micron.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

   .. code-block:: protobuf

     file_id = 0
     tiles = [0]
     point = {x: 3274, y: 3402}

4. Frontend sends: **CATALOG_LIST_REQUEST** (``CatalogListRequest``)

:red-text:`Check 2:` the CATALOG_LIST_RESPONSE should satisfy:

   - CATALOG_LIST_RESPONSE.success = True

5. Frontend sends: **CATALOG_FILE_INFO_REQUEST** (``CatalogFileInfoRequest``)

   For FITS catalog:

   .. code-block:: protobuf

     name = "COSMOSOPTCAT.fits"

   For VOTable catalog:

   .. code-block:: protobuf

     name = "COSMOSOPTCAT.vot"

6. Backend returns: **CATALOG_FILE_INFO_RESPONSE** (``CatalogFileInfoResponse``)

:red-text:`Check 3:` the CATALOG_FILE_INFO_RESPONSE should satisfy:

   - COSMOSOPTCAT.fits: success = True, file_size = 444729600, description = "Count: 918827", headers length = 62
   - COSMOSOPTCAT.vot: success = True, file_size = 1631311089, description = "Count: 918827", headers length = 62

7. Frontend sends: **OPEN_CATALOG_FILE** (``OpenCatalogFile``)

   .. code-block:: protobuf

     name = "COSMOSOPTCAT.fits" / "COSMOSOPTCAT.vot"
     file_id = 1 / 2
     preview_data_size = 50

8. Backend returns: **OPEN_CATALOG_FILE_ACK** (``OpenCatalogFileAck``)

:red-text:`Check 4:` the OPEN_CATALOG_FILE_ACK should satisfy:

   - Should arrive within 100000 ms
   - Both formats: success = True, data_size = 918827, headers length = 62

9. Frontend sends: **CATALOG_FILTER_REQUEST** (``CatalogFilterRequest``) to retrieve remaining rows

   .. code-block:: protobuf

     file_id = 1 / 2
     column_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     subset_data_size = 918777
     subset_start_index = 50

10. Backend returns: **CATALOG_FILTER_RESPONSE** (``CatalogFilterResponse``)

:red-text:`Check 5:` the CATALOG_FILTER_RESPONSE should satisfy:

    - Should arrive within 100000 ms
    - Length of columns = 10, progress = 1
    - subsetDataSize = 18777, subsetEndIndex = 918827, filterDataSize = 918827

CATALOG_LARGE
~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CATALOG_LARGE.test.ts>`__.

This test verifies catalog operations with a large VOTable catalog (COSMOSOPTCAT.vot, 918,827 entries), testing both full-table loading and progressive row loading.

**Part 1: Load whole table at one time**

1. Frontend sends: **CLOSE_FILE** (``CloseFile``) and **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA/set_cosmos"
     file = "cosmos_herschel250micron.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3. Frontend sends: **ADD_REQUIRED_TILES**, **SET_CURSOR**, and **SET_SPATIAL_REQUIREMENTS**

4. Frontend sends: **CATALOG_LIST_REQUEST**, **CATALOG_FILE_INFO_REQUEST**, and **OPEN_CATALOG_FILE** for "COSMOSOPTCAT.vot"

   .. code-block:: protobuf

     name = "COSMOSOPTCAT.vot"
     file_id = 1
     preview_data_size = 50

:red-text:`Check 2:` the OPEN_CATALOG_FILE_ACK should satisfy:

   - Should arrive within 100000 ms
   - success = True, data_size = 918827, headers length = 62

5. Frontend sends: **CATALOG_FILTER_REQUEST** to retrieve remaining 918,777 rows

   .. code-block:: protobuf

     file_id = 1
     column_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     subset_data_size = 918777
     subset_start_index = 50

:red-text:`Check 3:` the CATALOG_FILTER_RESPONSE should satisfy:

   - Should arrive within 100000 ms
   - subsetDataSize = 18777, subsetEndIndex = 918827, filterDataSize = 918827, progress = 1

**Part 2: Progressive load of rows**

6. Frontend opens the same catalog again in a new session

7. Frontend sends: **CATALOG_FILTER_REQUEST** 3 times with progressive start indices

   .. code-block:: protobuf

     Request 1: subset_start_index = 50,  subset_data_size = 50
     Request 2: subset_start_index = 100, subset_data_size = 50
     Request 3: subset_start_index = 150, subset_data_size = 50

:red-text:`Check 4:` each CATALOG_FILTER_RESPONSE should satisfy:

   - Request 1: subsetDataSize = 50, subsetEndIndex = 100, filterDataSize = 918827
   - Request 2: subsetDataSize = 50, subsetEndIndex = 150, filterDataSize = 918827
   - Request 3: subsetDataSize = 50, subsetEndIndex = 200, filterDataSize = 918827
   - All with progress = 1

IMPORT_MULTIPLE_CATALOG
~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMPORT_MULTIPLE_CATALOG.test.ts>`__.

This test verifies that multiple catalog files with different coordinate systems can be opened simultaneously, and that requesting file info for an invalid catalog format returns an appropriate error.

1. Frontend sends: **OPEN_CATALOG_FILE** (``OpenCatalogFile``) for 4 catalog files with different coordinate systems

   Catalog 1 (B1950/FK4):

   .. code-block:: protobuf

     directory = "set_QA/carta_artificial_catalog"
     name = "artificial_catalog_B1950.xml"
     file_id = 101
     preview_data_size = 0

   Catalog 2 (Ecliptic):

   .. code-block:: protobuf

     name = "artificial_catalog_Ecliptic.xml"
     file_id = 102

   Catalog 3 (Galactic):

   .. code-block:: protobuf

     name = "artificial_catalog_Galactic.xml"
     file_id = 103

   Catalog 4 (J2000/FK5):

   .. code-block:: protobuf

     name = "artificial_catalog_J2000.xml"
     file_id = 104

2. Backend returns: **OPEN_CATALOG_FILE_ACK** (``OpenCatalogFileAck``) for each catalog

:red-text:`Check 1:` each OPEN_CATALOG_FILE_ACK should satisfy:

   - All success = True
   - All dataSize = 29
   - All headers length = 235
   - Coordinate systems:

     - B1950: coosys.system = "FK4"
     - Ecliptic: coosys.system = "Ecliptic"
     - Galactic: coosys.system = "Galactic"
     - J2000: coosys.system = "FK5"

**Error case: Invalid catalog format**

3. Frontend sends: **CATALOG_FILE_INFO_REQUEST** for a non-catalog file

   .. code-block:: protobuf

     directory = "set_QA/carta_artificial_catalog"
     name = "Gaussian_J2000.fits"

:red-text:`Check 2:` the error response should satisfy:

   - Error message = "File does not contain a FITS table!"
