import { CARTA } from 'carta-protobuf';
import config from './config.json';
import { MessageController } from './MessageController';

let testServerUrl = config.serverURL0;
let connectTimeout = config.timeout.connection;

const platformStringKeys = ['release_info', 'deployment', 'architecture', 'platform'];

describe(`ACCESS_CARTA_DEFAULT tests: Testing connections to the backend`, () => {
    describe(`create a Websocket connection and receive REGISTER_VIEWER_ACK`, () => {
        let RegisterViewerAckResponse: CARTA.IRegisterViewerAck;
        const msgController = MessageController.Instance;

        test(
            `Receive REGISTER_VIEWER_ACK`,
            async () => {
                RegisterViewerAckResponse = await msgController.connect(testServerUrl);
            },
            connectTimeout
        );

        test('REGISTER_VIEWER_ACK.success = True', () => {
            expect(RegisterViewerAckResponse.success).toBe(true);
        });

        test('REGISTER_VIEWER_ACK.session_id is assigned by the backend', () => {
            expect(RegisterViewerAckResponse.sessionId).toBeDefined();
            expect(RegisterViewerAckResponse.sessionId).not.toEqual(0);
            console.log(`Registered session ID is ${RegisterViewerAckResponse.sessionId} @${new Date()}`);
        });

        test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.NEW"`, () => {
            expect(RegisterViewerAckResponse.sessionType).toBe(CARTA.SessionType.NEW);
        });

        test(`REGISTER_VIEWER_ACK.message is a non-empty string reporting the assigned session id`, () => {
            expect(RegisterViewerAckResponse.message).toBeDefined();
            expect(RegisterViewerAckResponse.message).not.toEqual('');
            expect(RegisterViewerAckResponse.message).toContain(`${RegisterViewerAckResponse.sessionId}`);
        });

        test(`REGISTER_VIEWER_ACK.server_feature_flags does not report READ_ONLY`, () => {
            expect(RegisterViewerAckResponse.serverFeatureFlags).toBeDefined();
            expect(RegisterViewerAckResponse.serverFeatureFlags! & CARTA.ServerFeatureFlags.READ_ONLY).toEqual(0);
            console.log(`Server feature flags are ${RegisterViewerAckResponse.serverFeatureFlags}`);
        });

        test(`REGISTER_VIEWER_ACK.platform_strings has ${platformStringKeys.join(', ')}`, () => {
            const platformStrings = RegisterViewerAckResponse.platformStrings!;
            expect(platformStrings).toBeDefined();
            platformStringKeys.forEach((key) => {
                expect(platformStrings[key]).toBeDefined();
                expect(platformStrings[key]).not.toEqual('');
            });
            expect(['macOS', 'Linux']).toContain(platformStrings['platform']);
            console.log(`Platform strings are ${JSON.stringify(platformStrings)}`);
        });

        test('REGISTER_VIEWER_ACK.user_preferences = None', () => {
            expect(RegisterViewerAckResponse.serverFeatureFlags! & CARTA.ServerFeatureFlags.USER_PREFERENCES).toEqual(
                0
            );
            expect(RegisterViewerAckResponse.userPreferences).toEqual({});
        });

        test('REGISTER_VIEWER_ACK.user_layouts = None', () => {
            expect(RegisterViewerAckResponse.serverFeatureFlags! & CARTA.ServerFeatureFlags.USER_LAYOUTS).toEqual(0);
            expect(RegisterViewerAckResponse.userLayouts).toEqual({});
        });

        afterAll(async () => {
            await msgController.closeConnection();
        });
    });
});
