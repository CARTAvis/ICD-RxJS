import { CARTA } from 'carta-protobuf';
import { MessageController } from './MessageController';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL, testRegisterViewerAck } from './AccessHelpers';

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

        testRegisterViewerAck(() => RegisterViewerAckResponse, { sessionType: CARTA.SessionType.NEW });

        afterAll(async () => {
            await msgController.closeConnection();
        });
    });
});
