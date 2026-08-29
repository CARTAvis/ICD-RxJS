import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import config from './config.json';
import WebSocket from 'ws';
import {
    PLATFORM_STRING_KEYS,
    expectAssignedSessionId,
    expectMessageReportingSessionId,
    expectNoUserLayouts,
    expectNoUserPreferences,
    expectPlatformStrings,
} from './AccessHelpers';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL } from './CommonHelpers';

let testNumber = config.repeat.concurrent;

let client: BackendService[] = [];
let RegisterViewerAckResponse: CARTA.IRegisterViewerAck[] = [];

describe(`ACCESS_CARTA_DEFAULT_CONCURRENT: Testing multiple concurrent connections to the backend.`, () => {
    test(
        `establish ${testNumber} concurrent connections to "${TEST_SERVER_URL}".`,
        async () => {
            client = Array.from({ length: testNumber }, () => new BackendService());
            RegisterViewerAckResponse = await Promise.all(client.map((item) => item.connect(TEST_SERVER_URL)));
            client.forEach((item) => {
                expect(item.connection.readyState).toBe(WebSocket.OPEN);
            });
        },
        CONNECTION_TIMEOUT
    );

    test(`assert every REGISTER_VIEWER_ACK.success is True.`, () => {
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is assigned by the backend.`, () => {
        RegisterViewerAckResponse.forEach(expectAssignedSessionId);
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
            expectMessageReportingSessionId(item, item.sessionId!);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.platform_strings has ${PLATFORM_STRING_KEYS.join(', ')}`, () => {
        RegisterViewerAckResponse.forEach(expectPlatformStrings);
    });

    test(`assert every REGISTER_VIEWER_ACK reports the same server information`, () => {
        const firstResponse = RegisterViewerAckResponse[0];
        RegisterViewerAckResponse.forEach((item) => {
            expect(item.serverFeatureFlags).toEqual(firstResponse.serverFeatureFlags);
            expect(item.platformStrings).toEqual(firstResponse.platformStrings);
        });
    });

    test('assert every REGISTER_VIEWER_ACK.user_preferences = None', () => {
        RegisterViewerAckResponse.forEach(expectNoUserPreferences);
    });

    test('assert every REGISTER_VIEWER_ACK.user_layouts = None', () => {
        RegisterViewerAckResponse.forEach(expectNoUserLayouts);
    });

    afterAll(() => {
        client.forEach((item) => {
            item.closeConnection();
        });
    });
});
