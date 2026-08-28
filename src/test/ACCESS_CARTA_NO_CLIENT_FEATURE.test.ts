import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import {
    CONNECTION_TIMEOUT,
    PLATFORM_STRING_KEYS,
    TEST_SERVER_URL,
    expectAssignedSessionId,
    expectMessageReportingSessionId,
    expectNoUserLayouts,
    expectNoUserPreferences,
    expectPlatformStrings,
    expectWritableServer,
} from './AccessHelpers';

interface AssertItem {
    register: CARTA.IRegisterViewer;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 0,
    },
};

describe(`ACCESS_CARTA_NO_CLIENT_FEATURE tests: Testing backend connection without any client feature`, () => {
    let client = new BackendService();
    let RegisterViewerAckTemp: CARTA.IRegisterViewerAck;

    test(
        `send "REGISTER_VIEWER" to "${TEST_SERVER_URL}" with session_id=${assertItem.register.sessionId} and client_feature_flags=${assertItem.register.clientFeatureFlags}, then receive "REGISTER_VIEWER_ACK" `,
        async () => {
            RegisterViewerAckTemp = await client.connect(
                TEST_SERVER_URL,
                assertItem.register.sessionId!,
                assertItem.register.clientFeatureFlags!
            );
        },
        CONNECTION_TIMEOUT
    );

    test(`REGISTER_VIEWER_ACK.success = True`, () => {
        expect(RegisterViewerAckTemp.success).toBe(true);
    });

    test(`REGISTER_VIEWER_ACK.session_id is assigned by the backend`, () => {
        expectAssignedSessionId(RegisterViewerAckTemp);
        console.log(`Registered session ID is ${RegisterViewerAckTemp.sessionId} @${new Date()}`);
    });

    test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.NEW"`, () => {
        expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.NEW);
    });

    test(`REGISTER_VIEWER_ACK.message is a non-empty string reporting the assigned session id`, () => {
        expectMessageReportingSessionId(RegisterViewerAckTemp, RegisterViewerAckTemp.sessionId!);
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
