Access WebSocket
----------------

.. uml::

    skinparam style strictuml
    hide footbox
    title WebSocket connection lifecycle

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Connect to server
    activate Frontend
    Frontend -> Frontend: <font color="red">new WebSocket() [Check 1: CONNECTING]</font>
    Frontend -> Backend : 1. Opening handshake
    activate Backend
    Frontend <-- Backend : 2. onopen
    Frontend -> Frontend: <font color="red">[Check 1: OPEN]</font>
    Frontend -> Frontend: <font color="red">close() [Check 1: CLOSING]</font>
    Frontend -> Backend : 3. Closing handshake
    Frontend <-- Backend : 4. onclose
    deactivate Backend
    Frontend -> Frontend: <font color="red">[Check 1: CLOSED]</font>
    User <-- Frontend: Connection closed
    deactivate Frontend

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
