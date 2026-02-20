Access & WebSocket
------------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Session Registration workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Connect to server
    activate Frontend
    Frontend -> Backend : 1. REGISTER_VIEWER
    activate Backend
    Frontend <--[#red] Backend : <font color="red">2. REGISTER_VIEWER_ACK [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Session established
    deactivate Frontend

    User -> Frontend: Reconnect with known session
    activate Frontend
    Frontend -> Backend : 3. REGISTER_VIEWER (session_id = 9999)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">4. REGISTER_VIEWER_ACK [Check 2]</font>
    deactivate Backend
    User <-- Frontend: Session resumed
    deactivate Frontend

ACCESS_CARTA_DEFAULT
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_DEFAULT.test.ts>`__.

This test verifies basic WebSocket connection to the CARTA backend and validates the REGISTER_VIEWER_ACK response.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``) via WebSocket connection

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id is not None

   - REGISTER_VIEWER_ACK.message is not empty

   - REGISTER_VIEWER_ACK.platformStrings is not empty

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_DEFAULT_CONCURRENT
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_DEFAULT_CONCURRENT.test.ts>`__.

This test verifies that the backend can handle multiple concurrent WebSocket connections and that each connection receives a unique session ID.

1. Frontend opens 10 concurrent WebSocket connections

2. Each connection sends: **REGISTER_VIEWER** (``RegisterViewer``)

3. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``) for each connection

:red-text:`Check 1:` every REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id is not None

   - REGISTER_VIEWER_ACK.message is not empty

   - REGISTER_VIEWER_ACK.platformStrings is not empty

   - All session IDs are unique across the 10 connections

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.NEW

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_KNOWN_SESSION
~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_KNOWN_SESSION.test.ts>`__.

This test verifies reconnecting to the backend with a known (previously established) session ID to test session resumption.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 9999
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id = 9999

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.RESUMED

   - REGISTER_VIEWER_ACK.message is a non-empty string

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_NO_CLIENT_FEATURE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_NO_CLIENT_FEATURE.test.ts>`__.

This test verifies connecting to the backend with zero client feature flags (no features advertised) to validate backend handles feature-less clients.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: protobuf

     session_id = 0
     client_feature_flags = 0

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id is a non-empty string (newly generated)

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.NEW

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_SAME_ID_TWICE
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_SAME_ID_TWICE.test.ts>`__.

This test verifies sending REGISTER_VIEWER twice with the same session ID on the same connection to validate backend behavior for duplicate session registration.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 9999
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

3. Frontend sends again: **REGISTER_VIEWER** (``RegisterViewer``) with the same session_id = 9999

4. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the second REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id = 9999

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.RESUMED

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_WEBSOCKET
~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_WEBSOCKET.test.ts>`__.

This test verifies basic WebSocket connectivity by testing the full WebSocket connection lifecycle and state transitions.

1. Frontend creates a WebSocket connection to the server

:red-text:`Check 1:` the WebSocket state transitions should satisfy:

   - Initial state after construction: WebSocket.CONNECTING

   - After onopen callback: WebSocket.OPEN

   - After calling close(): WebSocket.CLOSING

   - After onclose callback: WebSocket.CLOSED
