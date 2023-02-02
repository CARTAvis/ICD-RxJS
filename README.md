# ICD-rxjs
A couple of integration tests run by the protobuf interface and websocket via RxJS (modification from carta-frontend/src/services/BackendService.ts) method offer a white-box testing on **CARTA backend**.

## Documentation
All the tests' designed documentations are in the [google drive](https://drive.google.com/drive/folders/1SxE1qw_6UlleKBkoXZRmpv4-LYWwU97Y?usp=sharing), access permission may required.

## Build process
The build process relies heavily on `npm` and `nodejs`, so make sure they are installed and accesible.
Initialise submodules and install package dependencies:
```
git submodule update --init --recursive
npm install
```
* **Building static protocol buffer code** is done using the `$ build_proto.sh` script in the `protobuf` folder, which builds the static JavaScript code, as well as the TypeScript definitions, and symlinks to the `node_modules/carta-protobuf` directory.
```
cd carta-backend-ICD-rxjs/protobuf
./build_proto.sh
```

## Run it
* For the local computer test, set
`"serverURL": "ws://127.0.0.1:3002"` 
in the `src/test/config.json`, where `3002` is the port number from the backend setting in this example.
* For the server test, set
`"serverURL": "wss://carta.asiaa.sinica.edu.tw/socketdev"` 
in the `src/test/config.json`.

### Test one at a time
To avoid side effect, likely concurrent issue or IO traffic, it is better to run one test at one time. There is always a simple test from the beginning of the connection to backend, the address of which can be modified at `src/test/config.json`.
* A first test could run by 
`$ npm test src/test/ACCESS_WEBSOCKET.test.ts` or 
`$ npm test src/test/ACCESS_CARTA_DEFAULT.test.ts`. 
As if it was failed, we might check up the parameters at `config.json` to fit the environment.
* The test `$ npm test src/test/FILEINFO.test.ts` can help us verify the supported file formats. In case this test is failed, we may increase the timeout limitation, likely `timeout.readfile` or `timeout.openfile` at `config.json`.

## Image download
To download the images for the test, please visit:
[https://carta.asiaa.sinica.edu.tw/images/](https://carta.asiaa.sinica.edu.tw/images/)
The webpage list all the needed images for each stage of the ICD test. All the images for each stage are packed into **.tgz** file and can be downloaded by simply clicking on the **Download all files** hyper link. You can also download these files through wget command by clicking on the **wget** button to copy the command and then paste it to your terminal for download.
