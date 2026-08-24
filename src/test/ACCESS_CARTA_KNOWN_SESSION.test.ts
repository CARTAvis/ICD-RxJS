import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL, testRegisterViewerAck } from './AccessHelpers';

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

    testRegisterViewerAck(() => RegisterViewerAckTemp, {
        sessionType: CARTA.SessionType.RESUMED,
        sessionId: assertItem.register.sessionId!,
    });

    afterAll(async () => {
        await client.closeConnection();
    });
});
