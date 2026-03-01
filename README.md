# ICD-RxJS

Protocol-level integration tests for the [CARTA](https://cartavis.org/) backend, driven through the protobuf/WebSocket interface via RxJS (adapted from `carta-frontend/src/services/BackendService.ts`).

## Prerequisites

- [Node.js](https://nodejs.org/) (with npm)
- A running **carta-backend** instance (local or remote)
- [Test images](#test-images) for the test stage you want to run

## Build

Initialize submodules and install dependencies:

```shell
git submodule update --init --recursive
npm install
```

Then build the protobuf bindings (JavaScript + TypeScript definitions):

```shell
cd protobuf
./build_proto.sh
```

The script compiles the `.proto` files and symlinks the output to `node_modules/carta-protobuf`.

## Configuration

Edit `src/test/config.json` before running tests.

- **Local testing** — point to your local backend instance:
  ```json
  { "serverURL": "ws://127.0.0.1:3002" }
  ```
- **Remote testing** — point to a deployed server (for example):
  ```json
  { "serverURL": "wss://carta.asiaa.sinica.edu.tw/socketdev" }
  ```

## Running tests

Run one test file at a time to avoid concurrency and I/O issues:

```shell
npm test src/test/ACCESS_WEBSOCKET.test.ts
npm test src/test/ACCESS_CARTA_DEFAULT.test.ts
```

To verify supported file formats:

```shell
npm test src/test/FILEINFO.test.ts
```

If a test fails, check the parameters in `config.json` — in particular, the server URL and timeout values (`timeout.readfile`, `timeout.openfile`) — to ensure they match your environment.

## Test images

Download the test images from:
<https://carta.asiaa.sinica.edu.tw/images/>

Each test stage lists the required images, packed into `.tgz` archives. Use the **Download all files** link or copy the **wget** command from the page.

## Documentation

The test documentation is built with [Sphinx](https://www.sphinx-doc.org/) using the Read the Docs theme. A hosted copy is available at <https://carta.asiaa.sinica.edu.tw/icd-test-docs/index.html>.

### Setup (one-time)

Install Sphinx and extensions via conda:

```shell
conda create -n py312 python=3.12
conda activate py312
conda install sphinx sphinx-rtd-theme plantuml sphinxcontrib-plantuml
```

[PlantUML](https://plantuml.com/) must also be installed and available on your `PATH` for diagram rendering.

### Build

```shell
cd docs
make clean && make html
```

Open the generated HTML:

```shell
open docs/build/html/index.html      # macOS
xdg-open docs/build/html/index.html  # Linux
```

## Design documents

The original design documents for all tests are available on [Google Drive](https://drive.google.com/drive/folders/1SxE1qw_6UlleKBkoXZRmpv4-LYWwU97Y?usp=sharing) (access permission may be required).
