import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import {
    PLATFORM_STRING_KEYS,
    expectAssignedSessionId,
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
        sessionId: 0,
        clientFeatureFlags: 0,
    },
};

/**
 * The backend never reads client_feature_flags, so two registrations which differ only in that
 * flag have to agree on everything the connection itself does not decide. session_id and message
 * are left out: each connection is assigned its own id, and the message reports it.
 */
function expectSameApartFromSession(ack: CARTA.IRegisterViewerAck, control: CARTA.IRegisterViewerAck) {
    expect(ack.success).toEqual(control.success);
    expect(ack.sessionType).toEqual(control.sessionType);
    expect(ack.serverFeatureFlags).toEqual(control.serverFeatureFlags);
    expect(ack.platformStrings).toEqual(control.platformStrings);
    expect(ack.userPreferences).toEqual(control.userPreferences);
    expect(ack.userLayouts).toEqual(control.userLayouts);
}

describe(`ACCESS_CARTA_NO_CLIENT_FEATURE tests: Testing backend connection without any client feature`, () => {
    let client = new BackendService();
    let RegisterViewerAckTemp: CARTA.IRegisterViewerAck;
    // The control: the same registration sent with the client's default feature flags, which is
    // what every other test in the suite sends. Its acknowledgement is what the zero-flag one is
    // compared against, since a check on the zero-flag response alone cannot tell whether the
    // backend read the flag.
    let controlClient = new BackendService();
    let RegisterViewerAckControl: CARTA.IRegisterViewerAck;

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

    test(
        `send "REGISTER_VIEWER" to "${TEST_SERVER_URL}" with session_id=${assertItem.register.sessionId} and the default client_feature_flags, then receive "REGISTER_VIEWER_ACK" `,
        async () => {
            RegisterViewerAckControl = await controlClient.connect(TEST_SERVER_URL, assertItem.register.sessionId!);
        },
        CONNECTION_TIMEOUT
    );

    test(`REGISTER_VIEWER_ACK is the same as for a default connection apart from the session`, () => {
        expectSameApartFromSession(RegisterViewerAckTemp, RegisterViewerAckControl);
    });

    afterAll(async () => {
        await client.closeConnection();
        await controlClient.closeConnection();
    });
});
