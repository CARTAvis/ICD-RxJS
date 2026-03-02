File List Progress
------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title File list progress workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Browse large folder
    activate Frontend
    Frontend -> Backend : 1. FILE_LIST_REQUEST
    activate Backend
    Frontend <-- Backend : 2. LIST_PROGRESS (repeated)
    Frontend <--[#red] Backend : <font color="red">3. FILE_LIST_RESPONSE [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays file list
    deactivate Frontend

    == Cancellation ==

    User -> Frontend: Browse large folder
    activate Frontend
    Frontend -> Backend : 4. FILE_LIST_REQUEST
    activate Backend
    Frontend <-- Backend : 5. LIST_PROGRESS
    Frontend -> Backend : 6. STOP_FILE_LIST
    deactivate Backend
    User <-- Frontend: Loading cancelled
    deactivate Frontend

    Frontend -> Backend : 7. FILE_LIST_REQUEST (different folder)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">8. FILE_LIST_RESPONSE [Check 2]</font>
    deactivate Backend

FILE_LIST_PROGRESS_COMPLETE
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FILE_LIST_PROGRESS_COMPLETE.test.ts>`__.

This test verifies that requesting a file list for a folder containing many files sends a series of ``ListProgress`` messages until the full ``FileListResponse`` arrives, and that the backend remains responsive afterward.

1. Frontend sends: **FILE_LIST_REQUEST** (``FileListRequest``) for a large folder

   .. code-block:: protobuf

     directory = "set_QA/set_lotsFiles2"

2. Backend returns: a series of **LIST_PROGRESS** (``ListProgress``) messages followed by **FILE_LIST_RESPONSE** (``FileListResponse``)

:red-text:`Check 1:` the FILE_LIST_RESPONSE should satisfy:

   - Should arrive within 60000 ms
   - FILE_LIST_RESPONSE.success = True

3. Frontend sends: **FILE_LIST_REQUEST** (``FileListRequest``) for a different folder to verify backend health

   .. code-block:: protobuf

     directory = "set_QA"

:red-text:`Check 2:` the backend health check should satisfy:

   - FILE_LIST_RESPONSE is defined
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory contains "set_QA"

FILE_LIST_PROGRESS_CANCELLATION
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/FILE_LIST_PROGRESS_CANCELLATION.test.ts>`__.

This test verifies that a file list request for a large folder can be cancelled mid-progress using ``StopFileList``, and that the backend remains responsive after cancellation.

1. Frontend sends: **FILE_LIST_REQUEST** (``FileListRequest``) for a large folder

   .. code-block:: protobuf

     directory = "set_QA/set_lotsFiles2"
     filter_mode = 0

2. Backend begins returning: **LIST_PROGRESS** (``ListProgress``) messages

3. After receiving the first ``ListProgress`` message, Frontend sends: **STOP_FILE_LIST** (``StopFileList``)

   .. code-block:: protobuf

     file_list_filter_mode = 0

:red-text:`Check 1:` the cancellation should succeed:

   - At least one LIST_PROGRESS message should have been received before cancellation
   - The LIST_PROGRESS.percentage field should be defined

4. Frontend sends: **FILE_LIST_REQUEST** (``FileListRequest``) for a different folder to verify backend health

   .. code-block:: protobuf

     directory = "set_QA"

:red-text:`Check 2:` the backend health check should satisfy:

   - FILE_LIST_RESPONSE is defined
   - FILE_LIST_RESPONSE.success = True
   - FILE_LIST_RESPONSE.directory contains "set_QA"
