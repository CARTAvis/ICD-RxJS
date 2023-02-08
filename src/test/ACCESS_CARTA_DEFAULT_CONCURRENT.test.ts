import { CARTA } from "carta-protobuf";
import { BackendService } from "./MessageController-concurrent";
import config from "./config.json";
const WebSocket = require("ws");

let testServerUrl = config.serverURL0;
let connectTimeout = config.timeout.connection;
let testNumber = config.repeat.concurrent

let client: BackendService[] = Array(testNumber);
let RegisterViewerAckResponse: CARTA.RegisterViewerAck[] = new Array(testNumber);

describe(`ACCESS_CARTA_DEFAULT_CONCURRENT: Testing multiple concurrent connections to the backend.`, () => {
    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {
        for (let i = 0; i < client.length; i++) {
            client[i] = new BackendService;
            RegisterViewerAckResponse[i] = await client[i].connect(testServerUrl);
            expect(client[i].connection.readyState).toBe(WebSocket.OPEN)
        }  
    }, connectTimeout);

    test(`assert every REGISTER_VIEWER_ACK.success is True.`, () => {
        RegisterViewerAckResponse.forEach((item, index, array) => {
            expect(item.success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is not None.`, () => {
        RegisterViewerAckResponse.forEach((item, index, array) => {
            expect(item.sessionId).toBeDefined();
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, () => {
        RegisterViewerAckResponse.forEach((item, index, array) => {
            expect(array.filter(f => f.sessionId === item.sessionId).length).toEqual(1);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is "CARTA.SessionType.NEW".`, () => {
        RegisterViewerAckResponse.forEach((item, index, array) => {
            expect(item.sessionType).toEqual(CARTA.SessionType.NEW);
        });
    });

    afterAll(async () => {
        for (let i = 0; i < client.length; i++) {
            await client[i].closeConnection();
        }
    });
    
});