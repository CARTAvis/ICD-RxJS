Session
-------

.. uml::
    
    skinparam style strictuml
    hide footbox
    title Initial connection
    
    actor User
    box "Client-side"
    participant Frontend
    end box
    
    box "Server-side" #lightblue
    participant Backend
    end box

    User -> Frontend : Loads app/page
    activate Frontend
    Frontend -> Backend : Connects to backend (WS)
    activate Backend
    Frontend <-- Backend : Connection response (WS)
    Frontend -> Backend : REGISTER_VIEWER
    Frontend <-- Backend : REGISTER_VIEWER_ACK
    deactivate Backend
    User <-- Frontend : Connection info updated
    deactivate Frontend

ACCESS_CARTA_DEFAULT
~~~~~~~~~~~~~~~~~~~~

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)
   
   .. code-block:: protobuf

     session_id = "0"
     api_key = ""
     client_feature_flags = 5

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

3. Check the backend message:

   - REGISTER_VIEWER_ACK should arrives within 100 ms
  
   - REGISTER_VIEWER_ACK should contains:

   .. code-block:: protobuf

     success = True
     session_id = <some number>
     session_type = 0
     server_feature_flags = 8
     user_preferences = {}
     user_layouts = {}

ACCESS_CARTA_KNOWN_SESSION
~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: protobuf

     session_id = "9999"
     api_key = ""
     client_feature_flags = 5

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

3. Check the backend message:

   - REGISTER_VIEWER_ACK should arrives within 100 ms

   - REGISTER_VIEWER_ACK should contains:

   .. code-block:: protobuf

     success = True
     session_id = "9999"
     session_type = 1
     server_feature_flags = 8
     user_preferences = {}
     user_layouts = {}
     message = <not empty>

ACCESS_CARTA_NO_CLIENT_FEATURE
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: protobuf

     session_id = "0"
     api_key = ""
     client_feature_flags = 0

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

3. Check the backend message:

   - REGISTER_VIEWER_ACK should arrives within 100 ms

   - REGISTER_VIEWER_ACK should contains:

   .. code-block:: protobuf

     success = True
     session_id = <some number>
     session_type = 0
     server_feature_flags = 8
     user_preferences = {}
     user_layouts = {}
     message = <not empty>

ACCESS_CARTA_SAME_ID_TWICE
~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)

   .. code-block:: protobuf

     session_id = "12345"
     api_key = ""
     client_feature_flags = 5

2. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

3. Frontend sends: **REGISTER_VIEWER** (``RegisterViewer``)
   
   .. code-block:: protobuf

     session_id = "12345"
     api_key = ""
     client_feature_flags = 5

4. Backend returns: **REGISTER_VIEWER_ACK** (``RegisterViewerAck``)

5. Check the backend message:

   - REGISTER_VIEWER_ACK should arrives within 100 ms

   - REGISTER_VIEWER_ACK should contains:

   .. code-block:: protobuf

     success = True
     session_id = "12345"
     session_type = 1
     server_feature_flags = 8
     user_preferences = {}
     user_layouts = {}

