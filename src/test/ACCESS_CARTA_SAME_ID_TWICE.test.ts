import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import {
    CONNECTION_TIMEOUT,
    PLATFORM_STRING_KEYS,
    TEST_SERVER_URL,
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
        sessionId: 9999,
    },
};

describe(`ACCESS_CARTA_SAME_ID_TWICE tests: Testing REGISTER_VIEWER sent twice on one connection with the same session id`, () => {
    let client = new BackendService();
    let FirstRegisterViewerAck: CARTA.IRegisterViewerAck;
    let RegisterViewerAckTemp: CARTA.IRegisterViewerAck;

    test(
        `send "REGISTER_VIEWER" to "${TEST_SERVER_URL}" with session_id=${assertItem.register.sessionId} and receive "REGISTER_VIEWER_ACK"x2 within ${CONNECTION_TIMEOUT} ms`,
        async () => {
            FirstRegisterViewerAck = await client.connect(TEST_SERVER_URL, assertItem.register.sessionId!);
            RegisterViewerAckTemp = await client.getRegisterViewerAck(assertItem.register.sessionId!);
        },
        CONNECTION_TIMEOUT
    );

    test(`the first REGISTER_VIEWER_ACK is a resumed session with session_id ${assertItem.register.sessionId}`, () => {
        expect(FirstRegisterViewerAck.success).toBe(true);
        expect(FirstRegisterViewerAck.sessionId).toEqual(assertItem.register.sessionId);
        expect(FirstRegisterViewerAck.sessionType).toBe(CARTA.SessionType.RESUMED);
    });

    // The second acknowledgement has to stand on its own, so it gets the full set of checks.
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

    describe(`the second REGISTER_VIEWER_ACK against the first`, () => {
        test(`REGISTER_VIEWER_ACK.message reports the session id and differs from the first acknowledgement`, () => {
            expectMessageReportingSessionId(FirstRegisterViewerAck, assertItem.register.sessionId!);
            expect(RegisterViewerAckTemp.message).not.toEqual(FirstRegisterViewerAck.message);
            console.log(`The first "REGISTER_VIEWER_ACK.message" returns: "${FirstRegisterViewerAck.message}"`);
            console.log(`The second "REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAckTemp.message}"`);
        });

        test(`REGISTER_VIEWER_ACK reports the same server information`, () => {
            expect(RegisterViewerAckTemp.serverFeatureFlags).toEqual(FirstRegisterViewerAck.serverFeatureFlags);
            expect(RegisterViewerAckTemp.platformStrings).toEqual(FirstRegisterViewerAck.platformStrings);
        });
    });

    afterAll(async () => {
        await client.closeConnection();
    });
});
