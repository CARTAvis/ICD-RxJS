import config from './config.json';
import WebSocket from 'ws';
import { CONNECTION_TIMEOUT, TEST_SERVER_URL } from './CommonHelpers';

describe('ACCESS_WEBSOCKET: Testing connections to the websocket server', () => {
    let testRemoteWebsocketSite = 'wss://echo.websocket.org';
    test.skip(
        `should connect to "${testRemoteWebsocketSite}".`,
        (done) => {
            // Construct a Websocket
            let Connection = new WebSocket(testRemoteWebsocketSite);

            // While open a Websocket
            Connection.onopen = () => {
                if (config.log.event) {
                    console.log(testRemoteWebsocketSite + '  opened');
                }
                Connection.close();
                done(); // Return to this test
            };
        },
        CONNECTION_TIMEOUT + 2000
    );

    test(
        `should connect to "${TEST_SERVER_URL}".`,
        (done) => {
            let Connection = new WebSocket(TEST_SERVER_URL);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);

            Connection.onopen = OnOpen;

            function OnOpen(this, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                if (config.log.event) {
                    console.log(TEST_SERVER_URL + '  opened');
                }

                this.close();
                expect(this.readyState).toBe(WebSocket.CLOSING);

                Connection.onclose = OnClose;
                function OnClose(this, ev: CloseEvent) {
                    expect(this.readyState).toBe(WebSocket.CLOSED);
                    if (config.log.event) {
                        console.log(TEST_SERVER_URL + '  closed');
                    }
                    done();
                }
            }
        },
        CONNECTION_TIMEOUT
    );
});
