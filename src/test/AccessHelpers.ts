import { CARTA } from 'carta-protobuf';
import config from './config.json';

/**
 * Shared fixtures and assertions for the ACCESS_* tests, all of which open a connection and
 * check one REGISTER_VIEWER_ACK.
 *
 * These are plain assertions rather than jest tests: the test titles belong to the test files,
 * so that every test( ) a file registers can be read there.
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
