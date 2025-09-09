Introduction
============

The Interface Control Document (ICD) Test for the CARTA backend with WebSocket connection is designed 
to validate the correctness, stability, and compliance of the backend implementation against the 
agreed communication protocols defined in the ICD. 
The ICD specifies the structure, format, and sequence of messages exchanged between the backend server 
and the client applications, ensuring interoperability and consistency across the system.

In this test framework, the WebSocket protocol is used as the primary communication channel between 
the backend and the client. WebSocket provides a full-duplex, low-latency communication mechanism that 
is essential for real-time data exchange, event-driven interactions, and responsive user experiences. 
The test environment replicates production-like scenarios by opening persistent connections, 
exchanging request and response messages, and monitoring the message flows in accordance with the 
ICD specifications.

To implement and manage the ICD tests, we use RxJS (Reactive Extensions for JavaScript) as the core 
testing tool. RxJS provides a powerful and expressive abstraction for handling asynchronous event 
streams, making it particularly well-suited for testing WebSocket-based interactions. 
By leveraging observables, operators, and stream composition, RxJS allows us to define reproducible 
test cases, capture message sequences, and verify protocol compliance with high precision. 
This approach simplifies the validation of complex asynchronous workflows and ensures that the 
backend behaves as expected under a wide range of conditions.

The primary objectives of these tests are:

1. Protocol Compliance – To confirm that the backend strictly adheres to the message definitions, 
   sequencing rules, and error-handling requirements described in the ICD.
2. Functional Validation – To verify that backend services provide the expected responses to client 
   requests under normal and edge-case conditions.
3. Robustness and Stability – To assess the backend’s ability to maintain reliable connections, handle 
   concurrent sessions, and recover gracefully from failures.
4. Performance Evaluation – To measure latency, throughput, and resource usage during message exchanges, 
   ensuring scalability for operational workloads.

By systematically exercising the WebSocket-based backend through these ICD tests, we ensure alignment 
with the defined interface contract, minimize integration risks, and provide confidence in the backend’s 
readiness for deployment in production environments.

Build Tests
===========

The ICD test project relies heavily on **Node.js** and **npm**, so ensure that both are properly 
installed and accessible in your environment before proceeding.

0. **Clone the source code from the ICD-RxJS GitHub repository**

   ::

     git clone https://github.com/CARTAvis/ICD-RxJS.git

1. **Initialize submodules and install dependencies**

   ::

     cd ICD-RxJS
     git submodule update --init --recursive
     npm install

2. **Build static Protocol Buffer code**

   The script ``build_proto.sh`` located in the ``protobuf`` folder generates the static JavaScript code 
   and the corresponding TypeScript definitions. It also creates symbolic links to the 
   ``node_modules/carta-protobuf`` directory for seamless integration.

   ::

     cd ICD-rxjs/protobuf
     ./build_proto.sh

This process ensures that all dependencies are properly set up and that the protocol buffer definitions 
are correctly compiled before running the ICD tests.

Run Tests
=========

For local testing, configure the ``src/test/config.json`` file by setting:

.. code-block:: json

   "serverURL": "ws://127.0.0.1:3002"

Here, ``3002`` corresponds to the backend port number in this example.

For server-side testing, update the same configuration file with:

.. code-block:: json

   "serverURL": "wss://carta.asiaa.sinica.edu.tw/socketdev"

Run One Test at a Time
----------------------

To minimize side effects such as concurrency issues or heavy I/O traffic, 
it is recommended to run tests individually. A basic connectivity test is always 
available at the beginning of the test suite, 
and the target server address can be adjusted in ``src/test/config.json``.

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

- **Validate supported file formats**:

  .. code-block:: bash

     npm test src/test/FILEINFO.test.ts

  If this test fails, you may need to increase the timeout values in 
  ``config.json``, such as ``timeout.readFile`` or ``timeout.openFile``.

