import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import config from './config.json';
import WebSocket from 'ws';

let testServerUrl = config.serverURL0;
let connectTimeout = config.timeout.connection;
let testNumber = config.repeat.concurrent;

const platformStringKeys = ['release_info', 'deployment', 'architecture', 'platform'];

let client: BackendService[] = [];
let RegisterViewerAckResponse: CARTA.IRegisterViewerAck[] = [];

describe(`ACCESS_CARTA_DEFAULT_CONCURRENT: Testing multiple concurrent connections to the backend.`, () => {
    test(
        `establish ${testNumber} concurrent connections to "${testServerUrl}".`,
        async () => {
            client = Array.from({ length: testNumber }, () => new BackendService());
            RegisterViewerAckResponse = await Promise.all(client.map((item) => item.connect(testServerUrl)));
            client.forEach((item) => {
                expect(item.connection.readyState).toBe(WebSocket.OPEN);
            });
        },
        connectTimeout
    );

    test(`assert every REGISTER_VIEWER_ACK.success is True.`, () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is assigned by the backend.`, () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.sessionId).toBeDefined();
            expect(item.sessionId).not.toEqual(0);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, () => {
        const sessionIds = RegisterViewerAckResponse.map((item) => item.sessionId);
        console.log(`Registered session IDs are ${sessionIds}`);
        expect(new Set(sessionIds).size).toEqual(testNumber);
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is "CARTA.SessionType.NEW".`, () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.sessionType).toEqual(CARTA.SessionType.NEW);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.message reports its own session_id`, () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.message).toBeDefined();
            expect(item.message).not.toEqual('');
            expect(item.message).toContain(`${item.sessionId}`);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.platform_strings has ${platformStringKeys.join(', ')}`, () => {
        RegisterViewerAckResponse.forEach((item) => {
            const platformStrings = item.platformStrings!;
            expect(platformStrings).toBeDefined();
            platformStringKeys.forEach((key) => {
                expect(platformStrings[key]).toBeDefined();
                expect(platformStrings[key]).not.toEqual('');
            });
        });
    });

    test(`assert every REGISTER_VIEWER_ACK reports the same server information`, () => {
        const firstResponse = RegisterViewerAckResponse[0];
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.serverFeatureFlags).toEqual(firstResponse.serverFeatureFlags);
            expect(item.platformStrings).toEqual(firstResponse.platformStrings);
        });
    });

    test('assert every REGISTER_VIEWER_ACK.user_preferences = None', () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.userPreferences).toEqual({});
        });
    });

    test('assert every REGISTER_VIEWER_ACK.user_layouts = None', () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.userLayouts).toEqual({});
        });
    });

    afterAll(() => {
        client.forEach((item) => {
            item.closeConnection();
        });
    });
});
