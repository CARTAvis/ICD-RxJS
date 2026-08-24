import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL, testRegisterViewerAck } from './AccessHelpers';

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

    testRegisterViewerAck(() => RegisterViewerAckTemp, { sessionType: CARTA.SessionType.NEW });

    afterAll(async () => {
        await client.closeConnection();
    });
});
