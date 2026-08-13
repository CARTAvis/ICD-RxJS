Access CARTA
------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Access CARTA workflow

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

ACCESS_CARTA_DEFAULT
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_DEFAULT.test.ts>`__.

This test verifies that a default connection to the backend succeeds and returns correct session information.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 0
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id is assigned by the backend (not 0)

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.NEW

   - REGISTER_VIEWER_ACK.message is a non-empty string reporting the assigned session_id

   - REGISTER_VIEWER_ACK.server_feature_flags does not have the READ_ONLY bit set

   - REGISTER_VIEWER_ACK.platform_strings has non-empty release_info, deployment, architecture and platform entries, where platform is "macOS" or "Linux"

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object), and server_feature_flags does not have the USER_PREFERENCES bit set

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object), and server_feature_flags does not have the USER_LAYOUTS bit set

ACCESS_CARTA_DEFAULT_CONCURRENT
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_DEFAULT_CONCURRENT.test.ts>`__.

This test verifies that multiple concurrent connections (10 clients) to the backend all succeed, each receiving a unique session ID. The 10 clients connect simultaneously, so the backend registers them in parallel rather than one after another.

1. 10 clients each send: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 0
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``) for each client

:red-text:`Check 1:` every REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id is assigned by the backend (not 0)

   - REGISTER_VIEWER_ACK.session_id is unique across all connections

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.NEW

   - REGISTER_VIEWER_ACK.message is a non-empty string reporting its own session_id

   - REGISTER_VIEWER_ACK.platform_strings has non-empty release_info, deployment, architecture and platform entries

   - REGISTER_VIEWER_ACK.server_feature_flags and REGISTER_VIEWER_ACK.platform_strings are identical across all connections

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_KNOWN_SESSION
~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_KNOWN_SESSION.test.ts>`__.

This test verifies that connecting with a client-supplied session ID results in a resumed session. Any non-zero session ID is treated as a resume request, and the backend adopts the requested ID and echoes it back.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 9999
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id = 9999

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.RESUMED

   - REGISTER_VIEWER_ACK.message is a non-empty string reporting the requested session id

   - REGISTER_VIEWER_ACK.server_feature_flags does not have the READ_ONLY bit set

   - REGISTER_VIEWER_ACK.platform_strings has non-empty release_info, deployment, architecture and platform entries, where platform is "macOS" or "Linux"

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_NO_CLIENT_FEATURE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_NO_CLIENT_FEATURE.test.ts>`__.

This test verifies that a connection without any client feature flags still succeeds, and that the acknowledgement is the same as for a default connection. The backend does not read ``client_feature_flags``, so no part of the response may depend on it.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: text

     session_id = 0
     client_feature_flags = 0

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id is assigned by the backend (not 0)

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.NEW

   - REGISTER_VIEWER_ACK.message is a non-empty string reporting the assigned session_id

   - REGISTER_VIEWER_ACK.server_feature_flags does not have the READ_ONLY bit set

   - REGISTER_VIEWER_ACK.platform_strings has non-empty release_info, deployment, architecture and platform entries, where platform is "macOS" or "Linux"

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)

ACCESS_CARTA_SAME_ID_TWICE
~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/ACCESS_CARTA_SAME_ID_TWICE.test.ts>`__.

This test verifies that sending REGISTER_VIEWER twice on the same connection with the same session ID results in a resumed session on the second attempt.

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``) — first registration

   .. code-block:: text

     session_id = 9999
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

3. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``) — second registration on same connection

   .. code-block:: text

     session_id = 9999
     client_feature_flags = WEB_ASSEMBLY | WEB_GL

4. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

:red-text:`Check 1:` the second REGISTER_VIEWER_ACK should satisfy:

   - REGISTER_VIEWER_ACK.success = True

   - REGISTER_VIEWER_ACK.session_id = 9999

   - REGISTER_VIEWER_ACK.session_type = CARTA.SessionType.RESUMED

   - REGISTER_VIEWER_ACK.user_preferences = None (empty object)

   - REGISTER_VIEWER_ACK.user_layouts = None (empty object)
