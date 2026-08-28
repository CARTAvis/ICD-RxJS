import { CARTA } from 'carta-protobuf';
import { MessageController } from './MessageController';
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

describe(`ACCESS_CARTA_DEFAULT tests: Testing connections to the backend`, () => {
    describe(`create a Websocket connection and receive REGISTER_VIEWER_ACK`, () => {
        let RegisterViewerAckResponse: CARTA.IRegisterViewerAck;
        const msgController = MessageController.Instance;

        test(
            `Receive REGISTER_VIEWER_ACK`,
            async () => {
                RegisterViewerAckResponse = await msgController.connect(TEST_SERVER_URL);
            },
            CONNECTION_TIMEOUT
        );

        test(`REGISTER_VIEWER_ACK.success = True`, () => {
            expect(RegisterViewerAckResponse.success).toBe(true);
        });

        test(`REGISTER_VIEWER_ACK.session_id is assigned by the backend`, () => {
            expectAssignedSessionId(RegisterViewerAckResponse);
            console.log(`Registered session ID is ${RegisterViewerAckResponse.sessionId} @${new Date()}`);
        });

        test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.NEW"`, () => {
            expect(RegisterViewerAckResponse.sessionType).toBe(CARTA.SessionType.NEW);
        });

        test(`REGISTER_VIEWER_ACK.message is a non-empty string reporting the assigned session id`, () => {
            expectMessageReportingSessionId(RegisterViewerAckResponse, RegisterViewerAckResponse.sessionId!);
            console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAckResponse.message}"`);
        });

        test(`REGISTER_VIEWER_ACK.server_feature_flags does not report READ_ONLY`, () => {
            expectWritableServer(RegisterViewerAckResponse);
            console.log(`Server feature flags are ${RegisterViewerAckResponse.serverFeatureFlags}`);
        });

        test(`REGISTER_VIEWER_ACK.platform_strings has ${PLATFORM_STRING_KEYS.join(', ')}`, () => {
            expectPlatformStrings(RegisterViewerAckResponse);
            console.log(`Platform strings are ${JSON.stringify(RegisterViewerAckResponse.platformStrings)}`);
        });

        test(`REGISTER_VIEWER_ACK.user_preferences = None`, () => {
            expectNoUserPreferences(RegisterViewerAckResponse);
        });

        test(`REGISTER_VIEWER_ACK.user_layouts = None`, () => {
            expectNoUserLayouts(RegisterViewerAckResponse);
        });

        afterAll(async () => {
            await msgController.closeConnection();
        });
    });
});
