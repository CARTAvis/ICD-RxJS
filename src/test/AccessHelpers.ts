import { CARTA } from 'carta-protobuf';
import config from './config.json';

/**
 * Shared fixtures and assertions for the ACCESS_* tests, all of which open a connection and
 * check one REGISTER_VIEWER_ACK.
 */

export const TEST_SERVER_URL = config.serverURL0;
export const CONNECTION_TIMEOUT = config.timeout.connection;

/** Keys the backend has to report in REGISTER_VIEWER_ACK.platform_strings. */
export const PLATFORM_STRING_KEYS = ['release_info', 'deployment', 'architecture', 'platform'];

/** Values REGISTER_VIEWER_ACK.platform_strings["platform"] may take. */
export const SUPPORTED_PLATFORMS = ['macOS', 'Linux'];

export function expectAssignedSessionId(ack: CARTA.IRegisterViewerAck) {
    expect(ack.sessionId).toBeDefined();
    expect(ack.sessionId).not.toEqual(0);
}

/** The acknowledgement carries a non-empty message naming the session id it is about. */
export function expectMessageReportingSessionId(ack: CARTA.IRegisterViewerAck, sessionId: number) {
    expect(ack.message).toBeDefined();
    expect(ack.message).not.toEqual('');
    expect(ack.message).toContain(`${sessionId}`);
}

export function expectWritableServer(ack: CARTA.IRegisterViewerAck) {
    expect(ack.serverFeatureFlags).toBeDefined();
    expect(ack.serverFeatureFlags! & CARTA.ServerFeatureFlags.READ_ONLY).toEqual(0);
}

export function expectPlatformStrings(ack: CARTA.IRegisterViewerAck) {
    const platformStrings = ack.platformStrings!;
    expect(platformStrings).toBeDefined();
    PLATFORM_STRING_KEYS.forEach((key) => {
        expect(platformStrings[key]).toBeDefined();
        expect(platformStrings[key]).not.toEqual('');
    });
    expect(SUPPORTED_PLATFORMS).toContain(platformStrings['platform']);
}

export function expectNoUserPreferences(ack: CARTA.IRegisterViewerAck) {
    expect(ack.serverFeatureFlags! & CARTA.ServerFeatureFlags.USER_PREFERENCES).toEqual(0);
    expect(ack.userPreferences).toEqual({});
}

export function expectNoUserLayouts(ack: CARTA.IRegisterViewerAck) {
    expect(ack.serverFeatureFlags! & CARTA.ServerFeatureFlags.USER_LAYOUTS).toEqual(0);
    expect(ack.userLayouts).toEqual({});
}

interface RegisterViewerAckExpectation {
    sessionType: CARTA.SessionType;
    /** The session id that was asked for. Omit when the backend is the one assigning it. */
    sessionId?: number;
}

/**
 * Register the checks every REGISTER_VIEWER_ACK has to pass. Call it inside a `describe` block,
 * after the `test` that assigns the acknowledgement — `getAck` is read when each check runs, not
 * when it is registered.
 */
export function testRegisterViewerAck(
    getAck: () => CARTA.IRegisterViewerAck,
    expected: RegisterViewerAckExpectation
) {
    const requestedSessionId = expected.sessionId;
    const sessionIdOrigin = requestedSessionId === undefined ? 'assigned' : 'requested';

    test('REGISTER_VIEWER_ACK.success = True', () => {
        expect(getAck().success).toBe(true);
    });

    test(
        requestedSessionId === undefined
            ? 'REGISTER_VIEWER_ACK.session_id is assigned by the backend'
            : `REGISTER_VIEWER_ACK.session_id is ${requestedSessionId}`,
        () => {
            const ack = getAck();
            if (requestedSessionId === undefined) {
                expectAssignedSessionId(ack);
            } else {
                expect(ack.sessionId).toEqual(requestedSessionId);
            }
            console.log(`Registered session ID is ${ack.sessionId} @${new Date()}`);
        }
    );

    test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.${CARTA.SessionType[expected.sessionType]}"`, () => {
        expect(getAck().sessionType).toBe(expected.sessionType);
    });

    test(`REGISTER_VIEWER_ACK.message is a non-empty string reporting the ${sessionIdOrigin} session id`, () => {
        const ack = getAck();
        expectMessageReportingSessionId(ack, requestedSessionId ?? ack.sessionId!);
        console.log(`"REGISTER_VIEWER_ACK.message" returns: "${ack.message}"`);
    });

    test('REGISTER_VIEWER_ACK.server_feature_flags does not report READ_ONLY', () => {
        const ack = getAck();
        expectWritableServer(ack);
        console.log(`Server feature flags are ${ack.serverFeatureFlags}`);
    });

    test(`REGISTER_VIEWER_ACK.platform_strings has ${PLATFORM_STRING_KEYS.join(', ')}`, () => {
        const ack = getAck();
        expectPlatformStrings(ack);
        console.log(`Platform strings are ${JSON.stringify(ack.platformStrings)}`);
    });

    test('REGISTER_VIEWER_ACK.user_preferences = None', () => {
        expectNoUserPreferences(getAck());
    });

    test('REGISTER_VIEWER_ACK.user_layouts = None', () => {
        expectNoUserLayouts(getAck());
    });
}
