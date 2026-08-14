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

   - CATALOG_FILE_INFO_RESPONSE.file_info.description reports the file name, "Column Count: 235", and the coordinate system of this catalog: "Coordinate System: FK5", "Epoch: J2000" and "Equinox: 2000"

   - The headers place the sorted and filtered columns ("RA_d" and "OTYPE_S") inside the requested column_indices, since the requests name a column while the response keys its columns by index

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
   - OPEN_CATALOG_FILE_ACK.file_info.type = VOTable
   - Length of headers = 235

   - OPEN_CATALOG_FILE_ACK.preview_data has one entry per column (235), and every entry holds 29 rows: the request asks for 50 preview rows, which is more than the table holds, so the backend returns the whole table instead

Every request below returns the whole subset in a single CATALOG_FILTER_RESPONSE, since the table holds only 29 rows. Each response reports file_id = 1, columns keyed by the requested column_indices, and one value per row of subset_data_size in every column.

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
    - subsetDataSize = 29, filterDataSize = 29 (no filter is applied, so the whole table is returned)

    - The returned "RA_d" values are in ascending order

**Case 2: Filter by number (RA_d >= 160)**

11. Frontend sends: **CATALOG_FILTER_REQUEST** with numeric filter

    .. code-block:: protobuf

      file_id = 1
      filter_configs = [{column_name: "RA_d", comparison_operator: GreaterOrEqual, value: 160}]
      subset_data_size = 29

:red-text:`Check 6:` the CATALOG_FILTER_RESPONSE should satisfy:

    - subsetDataSize = 26, filterDataSize = 26 (3 rows filtered out)

    - Every returned "RA_d" value is greater than or equal to 160, and the number of returned rows equals the number of rows of the unfiltered table which meet that condition

**Case 3: Filter by string (OTYPE_S contains "Star")**

12. Frontend sends: **CATALOG_FILTER_REQUEST** with string filter

    .. code-block:: protobuf

      file_id = 1
      filter_configs = [{column_name: "OTYPE_S", sub_string: "Star"}]
      subset_data_size = 29

:red-text:`Check 7:` the CATALOG_FILTER_RESPONSE should satisfy:

    - subsetDataSize = 24, filterDataSize = 24 (5 rows filtered out)

    - Every returned "OTYPE_S" value contains "Star", and the number of returned rows equals the number of rows of the unfiltered table which meet that condition. The backend matches a case-sensitive substring rather than the whole value

**Case 4: Combined filter + sort**

13. Frontend sends: **CATALOG_FILTER_REQUEST** with both string and numeric filters, plus sorting

    .. code-block:: protobuf

      file_id = 1
      filter_configs = [
          {column_name: "OTYPE_S", sub_string: "Star"},
          {column_name: "RA_d", comparison_operator: GreaterOrEqual, value: 160}
      ]
      sort_column = "RA_d"
      sorting_type = Ascending
      subset_data_size = 29

:red-text:`Check 8:` the CATALOG_FILTER_RESPONSE should satisfy:

    - subsetDataSize = 23, filterDataSize = 23 (6 rows filtered out by combined filters)

    - Every returned row satisfies both filters at once, the returned "RA_d" values are in ascending order, and the two filters together keep fewer rows than either one alone

CATALOG_FITS_VOT
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/CATALOG_FITS_VOT.test.ts>`__.

This test verifies catalog operations for both FITS and VOTable catalog formats using a large catalog (COSMOSOPTCAT with 918,827 entries), comparing results between the two formats. The same table is stored in both formats, so the two runs differ only in the file type and the file size, and every other part of the response has to agree.

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

   - COSMOSOPTCAT.fits: success = True, file_info.type = FITSTable, file_size = 444729600, headers length = 62
   - COSMOSOPTCAT.vot: success = True, file_info.type = VOTable, file_size = 1631311089, headers length = 62

   - file_info.description reports the file name, "Column Count: 62" and "Row Count: 918827"

   - the headers describe every column exactly once: their column_index values cover 0 to 61, each header has a non-empty name, and none has an UnsupportedType data type

7. Frontend sends: **OPEN_CATALOG_FILE** (``OpenCatalogFile``)

   .. code-block:: protobuf

     name = "COSMOSOPTCAT.fits" / "COSMOSOPTCAT.vot"
     file_id = 1 / 2
     preview_data_size = 50

8. Backend returns: **OPEN_CATALOG_FILE_ACK** (``OpenCatalogFileAck``)

:red-text:`Check 4:` the OPEN_CATALOG_FILE_ACK should satisfy:

   - Should arrive within 100000 ms
   - Both formats: success = True, data_size = 918827, headers length = 62
   - COSMOSOPTCAT.fits: file_id = 1, file_info.type = FITSTable; COSMOSOPTCAT.vot: file_id = 2, file_info.type = VOTable

   - preview_data has one entry per column (62), and every entry holds preview_data_size (50) rows

9. Frontend sends: **CATALOG_FILTER_REQUEST** (``CatalogFilterRequest``) to retrieve remaining rows

   .. code-block:: protobuf

     file_id = 1 / 2
     column_indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     subset_data_size = 918777
     subset_start_index = 50

10. Backend streams: **CATALOG_FILTER_RESPONSE** (``CatalogFilterResponse``)

    The requested subset is not returned in one message. The backend splits it into chunks of at
    most 100000 rows, so the 918777 requested rows arrive as 10 messages: nine of 100000 rows and a
    final one of 18777 rows.

:red-text:`Check 5:` the streamed CATALOG_FILTER_RESPONSE should satisfy:

    - Should arrive within 100000 ms

    - Exactly 10 messages are streamed

    - Every message: file_id = 1 / 2, filter_data_size = 918827, request_end_index = 918827, and the columns are keyed by the requested column_indices [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    - The chunks cover the requested subset without a gap or an overlap: each message begins where the previous one ended, subset_end_index - subset_data_size gives its first row, and every column in it carries subset_data_size rows

    - The progress increases from message to message, stays below 1 until the last message, and equals 1 only in the last one

    - Last message: subset_data_size = 18777, subset_end_index = 918827

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

   The 918,777 requested rows exceed the 100000 rows the backend puts in one message, so they
   are streamed as 10 CATALOG_FILTER_RESPONSE messages.

:red-text:`Check 3:` the streamed CATALOG_FILTER_RESPONSE should satisfy:

   - Should arrive within 100000 ms
   - Exactly 10 messages are streamed, and the progress increases from message to message and equals 1 only in the last one
   - Last message: subsetDataSize = 18777, subsetEndIndex = 918827, filterDataSize = 918827, progress = 1
   - Every column of a message holds one value per row of its subsetDataSize

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
   - All with progress = 1, in a single message, since a window of 50 rows fits in one message

   - A window ends at subset_start_index + subset_data_size, and filterDataSize stays at the 918827 rows of the table, so paging through the table does not change the number of rows it reports

   - The three windows return three different sets of rows, and each window returns exactly the rows which the whole table load of part 1 returned at the same position in the table. This is what makes progressive loading equivalent to loading the table at one time

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
