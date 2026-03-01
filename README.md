# ICD-RxJS

Integration tests for the [CARTA](https://cartavis.org/) backend, driven through the protobuf/WebSocket interface via RxJS (adapted from `carta-frontend/src/services/BackendService.ts`). The suite provides white-box protocol-level testing of **carta-backend**.

## Prerequisites

- **Node.js** and **npm**
- **Python 3** with a Conda environment (for building documentation)

## Build

Initialise submodules and install dependencies:

```shell
git submodule update --init --recursive
npm install
```

Build the static protocol buffer code (JavaScript + TypeScript definitions):

```shell
cd protobuf
./build_proto.sh
```

The script compiles the `.proto` files and symlinks the output to `node_modules/carta-protobuf`.

## Configuration

Edit `src/test/config.json` before running tests.

- **Local testing** — set the server URL to your local backend instance:
  ```json
  { "serverURL": "ws://127.0.0.1:3002" }
  ```
- **Remote testing** — point to a deployed server:
  ```json
  { "serverURL": "wss://carta.asiaa.sinica.edu.tw/socketdev" }
  ```

## Running tests

To avoid concurrency and I/O issues, run one test file at a time:

```shell
npm test src/test/ACCESS_WEBSOCKET.test.ts
npm test src/test/ACCESS_CARTA_DEFAULT.test.ts
```

If a test fails, check the parameters in `config.json` (server URL, timeout values such as `timeout.readfile` and `timeout.openfile`) to match your environment.

To verify supported file formats:

```shell
npm test src/test/FILEINFO.test.ts
```

## Test images

Download the test images from:
<https://carta.asiaa.sinica.edu.tw/images/>

Each test stage lists the required images, packed into `.tgz` archives. Use the **Download all files** link or copy the **wget** command from the page.

## Building the documentation

The test documentation is built with [Sphinx](https://www.sphinx-doc.org/) using the Read the Docs theme.

### Setup (one-time)

Create and activate a Python environment, then install the required packages:

```shell
conda create -n py312 python=3.12
conda activate py312
pip install sphinx sphinx-rtd-theme sphinxcontrib-plantuml
```

[PlantUML](https://plantuml.com/) must also be installed and available on your `PATH` for diagram rendering.

The generated documentation is also available on this [website](https://carta.asiaa.sinica.edu.tw/icd-test-docs/index.html).

### Build

```shell
cd docs
make clean
make html
```

The generated HTML is written to `docs/build/html/`. Open it with:

```shell
open docs/build/html/index.html    # macOS
xdg-open docs/build/html/index.html  # Linux
```

## Design documents

The original design documents for all tests are available on [Google Drive](https://drive.google.com/drive/folders/1SxE1qw_6UlleKBkoXZRmpv4-LYWwU97Y?usp=sharing) (access permission may be required).
