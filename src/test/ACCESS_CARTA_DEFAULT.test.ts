import { CARTA } from "carta-protobuf";
import config from "./config.json";
const WebSocket = require("ws");
import { MessageController } from "./MessageController";

let testServerUrl = config.serverURL0;
let connectTimeout = config.timeout.connection;

describe(`ACCESS_CARTA_DEFAULT tests: Testing connections to the backend`, () => {
    describe(`create a Websocket connection and receive REGISTER_VIEWER_ACK`, () => {
        let RegisterViewerAckResponse: CARTA.RegisterViewerAck;
        const msgController = MessageController.Instance;

        test(`Receive REGISTER_VIEWER_ACK`, async () => {
            RegisterViewerAckResponse = await msgController.connect(testServerUrl);
        }); 

        test(`REGISTER_VIEWER_ACK.message is not empty`, () => {
            expect(RegisterViewerAckResponse.message).toBeDefined();
        })

        test(`REGISTER_VIEWER_ACK.platformStrings is not empty`, () => {
            expect(RegisterViewerAckResponse.platformStrings).toBeDefined();
        })

        test("REGISTER_VIEWER_ACK.success = True", () => {
            expect(RegisterViewerAckResponse.success).toBe(true);
        });

        test("REGISTER_VIEWER_ACK.session_id is not None", () => {
            expect(RegisterViewerAckResponse.sessionId).toBeDefined();
            console.log(`Registered session ID is ${RegisterViewerAckResponse.sessionId} @${new Date()}`);
        });

        test("REGISTER_VIEWER_ACK.user_preferences = None", () => {
            expect(RegisterViewerAckResponse.userPreferences).toMatchObject({});
        });

        test("REGISTER_VIEWER_ACK.user_layouts = None", () => {
            expect(RegisterViewerAckResponse.userLayouts).toMatchObject({});
        });

        afterAll(async () => {
            await msgController.closeConnection();
        })
    })
});