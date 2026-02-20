Introduction
============

CARTA (Cube Analysis and Rendering Tool for Astronomy) is an image visualization and analysis tool
designed for the `ALMA <https://www.almaobservatory.org/>`_, `VLA <https://public.nrao.edu/vla/>`_,
and `SKA <https://www.skao.int/>`_ radio telescopes. It adopts a client-server architecture in which
a backend process handles data access, computation, and image processing, while a browser-based
frontend provides interactive visualization.

The **Interface Control Document (ICD)** defines the structure, format, and sequencing of all messages
exchanged between the CARTA backend and frontend over a WebSocket connection. This test suite validates
that the backend implementation conforms to the ICD specification, ensuring correctness, stability,
and interoperability.

Architecture
------------

Communication between the CARTA frontend and backend follows a message-based protocol over
`WebSocket <https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API>`_. WebSocket provides
full-duplex, low-latency communication that is essential for streaming raster tile data, real-time
cursor profiles, animation frames, and other interactive workflows.

All messages are serialized using `Protocol Buffers <https://protobuf.dev/>`_ (protobuf), which
provides compact binary encoding and language-neutral type definitions. Each test case in this suite
sends protobuf-encoded requests to the backend and validates the structure and content of the
responses.

.. uml::

    skinparam style strictuml
    hide footbox
    title CARTA ICD Communication

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Interact with UI
    activate Frontend
    Frontend -> Backend : Protobuf request via WebSocket
    activate Backend
    Frontend <-- Backend : Protobuf response / data stream
    deactivate Backend
    User <-- Frontend: Updated visualization
    deactivate Frontend

Technology Stack
----------------

The test suite is built with:

- **TypeScript** -- Provides type safety and IDE support for test development.
- **Jest** -- The test runner and assertion framework.
- **RxJS** (Reactive Extensions for JavaScript) -- Handles asynchronous message streams from the
  WebSocket connection. Observables and operators allow precise control over message sequencing,
  timeouts, and stream composition, making it well suited for validating complex asynchronous
  workflows.
- **Protocol Buffers** -- Message serialization format shared between the frontend and backend.
  The ``carta-protobuf`` package provides the TypeScript bindings.

Test Objectives
---------------

1. **Protocol Compliance** -- Confirm that the backend adheres to the message definitions,
   sequencing rules, and error-handling requirements described in the ICD.
2. **Functional Validation** -- Verify that backend services return correct responses under
   normal and edge-case conditions, including file operations, region statistics, animation,
   and image export.
3. **Robustness and Stability** -- Assess the backend's ability to maintain reliable connections,
   handle concurrent sessions, and remain responsive after file closures or cancelled operations.
4. **Performance Evaluation** -- Measure latency and throughput during message exchanges such as
   animation playback, histogram computation, and tile streaming.

Build Tests
===========

The test suite requires **Node.js** and **npm**. Ensure both are installed before proceeding.

0. **Clone the repository**

   ::

     git clone https://github.com/CARTAvis/ICD-RxJS.git

1. **Initialize submodules and install dependencies**

   ::

     cd ICD-RxJS
     git submodule update --init --recursive
     npm install

2. **Build Protocol Buffer bindings**

   The ``build_proto.sh`` script in the ``protobuf`` directory generates static JavaScript code
   and TypeScript definitions, then creates symbolic links under ``node_modules/carta-protobuf``.

   ::

     cd protobuf
     ./build_proto.sh

Run Tests
=========

Configuration
-------------

Edit ``src/test/config.json`` to point to the target backend.

For **local** testing:

.. code-block:: json

   "serverURL": "ws://127.0.0.1:3002"

where ``3002`` is the backend port number.

For **remote** testing:

.. code-block:: json

   "serverURL": "wss://carta.asiaa.sinica.edu.tw/socketdev"

Run One Test at a Time
----------------------

To avoid concurrency issues and heavy I/O contention, it is recommended to run tests individually.

Example Test Runs
-----------------

- **Verify backend connectivity**:

  .. code-block:: bash

     npm test src/test/ACCESS_WEBSOCKET.test.ts

  or

  .. code-block:: bash

     npm test src/test/ACCESS_CARTA_DEFAULT.test.ts

  If these tests fail, review and adjust the parameters in ``config.json`` to
  match your environment.

- **Validate file info retrieval**:

  .. code-block:: bash

     npm test src/test/FILEINFO_FITS_MULTIHDU.test.ts

  If this test fails, you may need to increase the timeout values in
  ``config.json``, such as ``timeout.readFile`` or ``timeout.openFile``.

- **Run a specific test category** (e.g., all animator tests):

  .. code-block:: bash

     npm test src/test/ANIMATOR_DATA_STREAM.test.ts
