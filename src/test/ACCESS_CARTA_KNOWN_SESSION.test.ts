import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import {
    PLATFORM_STRING_KEYS,
    expectMessageReportingSessionId,
    expectNoUserLayouts,
    expectNoUserPreferences,
    expectPlatformStrings,
    expectWritableServer,
} from './AccessHelpers';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL } from './CommonHelpers';

interface AssertItem {
    register: CARTA.IRegisterViewer;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 9999,
    },
};

describe(`ACCESS_CARTA_KNOWN_SESSION tests: Testing connections to the backend with an known session id`, () => {
    let client = new BackendService();
    let RegisterViewerAckTemp: CARTA.IRegisterViewerAck;

    test(
        `send "REGISTER_VIEWER" to "${TEST_SERVER_URL}" with session_id=${assertItem.register.sessionId} and receive "REGISTER_VIEWER_ACK" `,
        async () => {
            RegisterViewerAckTemp = await client.connect(TEST_SERVER_URL, assertItem.register.sessionId!);
        },
        CONNECTION_TIMEOUT
    );

    test(`REGISTER_VIEWER_ACK.success = True`, () => {
        expect(RegisterViewerAckTemp.success).toBe(true);
    });

    test(`REGISTER_VIEWER_ACK.session_id is ${assertItem.register.sessionId}`, () => {
        expect(RegisterViewerAckTemp.sessionId).toEqual(assertItem.register.sessionId);
        console.log(`Registered session ID is ${RegisterViewerAckTemp.sessionId} @${new Date()}`);
    });

    test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.RESUMED"`, () => {
        expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.RESUMED);
    });

    test(`REGISTER_VIEWER_ACK.message is a non-empty string reporting the requested session id`, () => {
        expectMessageReportingSessionId(RegisterViewerAckTemp, assertItem.register.sessionId!);
        console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAckTemp.message}"`);
    });

    test(`REGISTER_VIEWER_ACK.server_feature_flags does not report READ_ONLY`, () => {
        expectWritableServer(RegisterViewerAckTemp);
        console.log(`Server feature flags are ${RegisterViewerAckTemp.serverFeatureFlags}`);
    });

    test(`REGISTER_VIEWER_ACK.platform_strings has ${PLATFORM_STRING_KEYS.join(', ')}`, () => {
        expectPlatformStrings(RegisterViewerAckTemp);
        console.log(`Platform strings are ${JSON.stringify(RegisterViewerAckTemp.platformStrings)}`);
    });

    test(`REGISTER_VIEWER_ACK.user_preferences = None`, () => {
        expectNoUserPreferences(RegisterViewerAckTemp);
    });

    test(`REGISTER_VIEWER_ACK.user_layouts = None`, () => {
        expectNoUserLayouts(RegisterViewerAckTemp);
    });

    afterAll(async () => {
        await client.closeConnection();
    });
});
