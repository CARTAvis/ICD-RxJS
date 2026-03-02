Get File List
-------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Get File List workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Browse files
    activate Frontend
    Frontend -> Backend : 1. FILE_LIST_REQUEST
    activate Backend
    Frontend <--[#red] Backend : <font color="red">2. FILE_LIST_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays file list
    deactivate Frontend

GET_FILELIST
~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/GET_FILELIST.test.ts>`__.

This test verifies that file lists are correctly generated for valid directory paths, including subdirectory traversal, and that appropriate errors are returned for invalid paths.

**Case 1: Default path ($BASE)**

1. Frontend sends: **FILE_LIST_REQUEST**

   .. code-block:: text

     directory = "$BASE"
     filter_mode = 0

2. Backend returns: **FILE_LIST_RESPONSE** (``FileListResponse``)

:red-text:`Check 1:` the FILE_LIST_RESPONSE should satisfy:

   - FILE_LIST_RESPONSE.success = True

   - FILE_LIST_RESPONSE.subdirectories[] should contain "set_QA"

**Case 2: QA subdirectory**

3. Frontend sends: **FILE_LIST_REQUEST**

   .. code-block:: text

     directory = "<basepath>/set_QA"
     filter_mode = 0

4. Backend returns: **FILE_LIST_RESPONSE**

:red-text:`Check 2:` the FILE_LIST_RESPONSE should satisfy:

   - FILE_LIST_RESPONSE.success = True

   - FILE_LIST_RESPONSE.directory contains "set_QA"

   - FILE_LIST_RESPONSE.files[] should contain "M17_SWex.fits"

   - FILE_LIST_RESPONSE.subdirectories[] should contain "tmp"

**Case 3: Nested subdirectory**

5. Frontend sends: **FILE_LIST_REQUEST**

   .. code-block:: text

     directory = "<basepath>/set_QA/tmp"
     filter_mode = 0

6. Backend returns: **FILE_LIST_RESPONSE**

:red-text:`Check 3:` the FILE_LIST_RESPONSE should satisfy:

   - FILE_LIST_RESPONSE.success = True

   - FILE_LIST_RESPONSE.directory contains "set_QA/tmp"

   - FILE_LIST_RESPONSE.parent = "set_QA"

**Case 4: Invalid path**

7. Frontend sends: **FILE_LIST_REQUEST**

   .. code-block:: text

     directory = "/unknown/path"
     filter_mode = 0

:red-text:`Check 4:` the FILE_LIST_RESPONSE should return error:

   - Error message should contain "File list failed"

GET_FILELIST_ROOTPATH_CONCURRENT
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/GET_FILELIST_ROOTPATH_CONCURRENT.test.ts>`__.

This test verifies that multiple concurrent clients (10 connections) all receive identical file lists when querying the root path.

1. 10 clients each send: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 0
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Each client sends: **FILE_LIST_REQUEST**

   .. code-block:: text

     directory = "$BASE"

3. Backend returns: **FILE_LIST_RESPONSE** for each client

:red-text:`Check 1:` every FILE_LIST_RESPONSE should satisfy:

   - FILE_LIST_RESPONSE.success = True

   - All 10 FILE_LIST_RESPONSE.files[] are identical across clients

   - All 10 FILE_LIST_RESPONSE.subdirectories[] are identical across clients
