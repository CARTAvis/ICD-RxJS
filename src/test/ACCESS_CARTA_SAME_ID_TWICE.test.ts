import { CARTA } from 'carta-protobuf';
import { BackendService } from './MessageControllerConcurrent';
import {
    CONNECTION_TIMEOUT,
    TEST_SERVER_URL,
    expectMessageReportingSessionId,
    testRegisterViewerAck,
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
    testRegisterViewerAck(() => RegisterViewerAckTemp, {
        sessionType: CARTA.SessionType.RESUMED,
        sessionId: assertItem.register.sessionId!,
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
