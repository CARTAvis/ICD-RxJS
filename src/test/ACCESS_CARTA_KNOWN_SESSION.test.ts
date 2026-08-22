import { action, makeObservable, observable, runInAction } from 'mobx';
import { CARTA } from 'carta-protobuf';
import config from './config.json';

import WebSocket from 'ws';
let testServerUrl = config.serverURL0;
let connectTimeout = config.timeout.connection;
const icdVersion = config.icdVersion;

interface AssertItem {
    register: CARTA.IRegisterViewer;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 9999,
    },
};

export enum ConnectionStatus {
    CLOSED = 0,
    PENDING = 1,
    ACTIVE = 2,
}

export const INVALID_ANIMATION_ID = -1;

type HandlerFunction = (eventId: number, parsedMessage: any) => void;

interface IBackendResponse {
    success?: boolean;
    message?: string;
}

// Deferred class adapted from https://stackoverflow.com/a/58610922/1727322
export class Deferred<T> {
    private _resolve: (value: T) => void = () => {};
    private _reject: (reason: any) => void = () => {};

    private _promise: Promise<T> = new Promise<T>((resolve, reject) => {
        this._reject = reject;
        this._resolve = resolve;
    });

    public get promise(): Promise<T> {
        return this._promise;
    }

    public resolve(value: T) {
        this._resolve(value);
    }

    public reject(reason: any) {
        this._reject(reason);
    }
}

export class BackendService {
    public static staticInstance: BackendService;

    static get Instance() {
        if (!BackendService.staticInstance) {
            BackendService.staticInstance = new BackendService();
        }
        return BackendService.staticInstance;
    }

    private static readonly IcdVersion = icdVersion;
    private static readonly DefaultFeatureFlags =
        CARTA.ClientFeatureFlags.WEB_ASSEMBLY | CARTA.ClientFeatureFlags.WEB_GL;
    private static readonly ConnectionAttemptDelay = 1000;
    // Bounded by wall clock rather than by an attempt count, and with the handshake bounded too, so
    // that a backend which never arrives is reported by the rejection raised in onclose instead of
    // by jest killing the beforeAll hook first. See MessageController.ts for the full reasoning.
    private static readonly ConnectionBudget = config.timeout.connection * 0.9;
    private static readonly HandshakeTimeout = 2000;

    @observable connectionStatus: ConnectionStatus;
    readonly loggingEnabled: boolean;
    @observable connectionDropped: boolean;
    @observable endToEndPing: number;

    public animationId: number;
    public sessionId: number;
    public serverFeatureFlags: number;
    public serverUrl: string;

    private connection: WebSocket;
    private deferredMap: Map<number, Deferred<IBackendResponse>>;
    private eventCounter: number;

    private readonly decoderMap: Map<CARTA.EventType, { messageClass: any; handler: HandlerFunction }>;

    public constructor() {
        makeObservable(this);
        this.loggingEnabled = true;
        this.deferredMap = new Map<number, Deferred<IBackendResponse>>();

        this.eventCounter = 1;
        this.endToEndPing = NaN;
        this.animationId = INVALID_ANIMATION_ID;
        this.connectionStatus = ConnectionStatus.CLOSED;

        // Construct handler and decoder maps
        this.decoderMap = new Map<CARTA.EventType, { messageClass: any; handler: HandlerFunction }>([
            [
                CARTA.EventType.REGISTER_VIEWER_ACK,
                {
                    messageClass: CARTA.RegisterViewerAck,
                    handler: this.onRegisterViewerAck,
                },
            ],
        ]);
    }

    @action('connect')
    async connect(url: string, sessionid: number): Promise<CARTA.IRegisterViewerAck> {
        if (this.connection) {
            this.connection.onclose = null;
            this.connection.close();
        }

        const isReconnection: boolean = url === this.serverUrl;
        let connectionAttempts = 0;
        const retryDeadline = Date.now() + BackendService.ConnectionBudget;
        // A socket which is refused or unreachable reports why through onerror, but it is onclose
        // which decides whether to retry. The reason is kept here so that the rejection raised once
        // the budget runs out can still say what went wrong, rather than only "code=1006".
        let lastConnectionError: string = '';
        // const apiService = ApiService.Instance;
        this.connectionDropped = false;
        this.connectionStatus = ConnectionStatus.PENDING;
        this.serverUrl = url;
        this.connection = new WebSocket(url, { handshakeTimeout: BackendService.HandshakeTimeout });
        this.connection.binaryType = 'arraybuffer';
        this.connection.onmessage = this.messageHandler.bind(this);
        this.connection.onclose = (ev: CloseEvent) =>
            runInAction(() => {
                // A further retry costs the delay plus, in the worst case, a whole handshake timeout.
                // Both are charged against the budget before the retry is scheduled, so that the
                // rejection always lands inside config.timeout.connection instead of just after it.
                const nextAttemptCost = BackendService.ConnectionAttemptDelay + BackendService.HandshakeTimeout;
                const budgetExhausted = Date.now() + nextAttemptCost > retryDeadline;
                // Only change to closed connection if the connection was originally active or this is a reconnection
                if (this.connectionStatus === ConnectionStatus.ACTIVE || isReconnection || budgetExhausted) {
                    const wasNeverActive = this.connectionStatus !== ConnectionStatus.ACTIVE;
                    this.connectionStatus = ConnectionStatus.CLOSED;
                    if (wasNeverActive) {
                        const def = this.deferredMap.get(requestId);
                        if (def) {
                            const attempts = connectionAttempts + 1;
                            const reason = lastConnectionError || `code=${ev.code} reason=${ev.reason}`;
                            def.reject(
                                new Error(`Could not connect to ${url} after ${attempts} attempt(s): ${reason}`)
                            );
                            this.deferredMap.delete(requestId);
                        }
                    }
                } else {
                    connectionAttempts++;
                    const budgetLeft = Math.round(retryDeadline - Date.now());
                    console.log(
                        `Connection to ${url} failed (${lastConnectionError || `code=${ev.code}`}), retry ${connectionAttempts} in ${BackendService.ConnectionAttemptDelay} ms (${budgetLeft} ms of budget left)`
                    );
                    setTimeout(() => {
                        const newConnection = new WebSocket(url, {
                            handshakeTimeout: BackendService.HandshakeTimeout,
                        });
                        newConnection.binaryType = 'arraybuffer';
                        newConnection.onopen = this.connection.onopen;
                        newConnection.onerror = this.connection.onerror;
                        newConnection.onclose = this.connection.onclose;
                        newConnection.onmessage = this.connection.onmessage;
                        this.connection = newConnection;
                    }, BackendService.ConnectionAttemptDelay);
                }
            });

        this.deferredMap.clear();
        this.eventCounter = 1;
        const requestId = this.eventCounter;

        const deferredResponse = new Deferred<CARTA.IRegisterViewerAck>();
        this.deferredMap.set(requestId, deferredResponse);

        this.connection.onopen = action(() => {
            if (this.connectionStatus === ConnectionStatus.CLOSED) {
                this.connectionDropped = true;
            }
            this.connectionStatus = ConnectionStatus.ACTIVE;
            const message = CARTA.RegisterViewer.create({
                sessionId: sessionid,
                clientFeatureFlags: BackendService.DefaultFeatureFlags,
            });
            // observer map is cleared, so that old subscriptions don't get incorrectly fired

            if (this.sendEvent(CARTA.EventType.REGISTER_VIEWER, CARTA.RegisterViewer.encode(message).finish())) {
                this.deferredMap.set(requestId, deferredResponse);
            } else {
                throw new Error('Could not send event');
            }
        });

        // `ws` reports a refused or unreachable socket by emitting error and then close, so this
        // handler runs before every retry in onclose. Recording the reason rather than rejecting
        // here leaves the decision to give up with onclose, which is what owns the budget.
        this.connection.onerror = (ev) => {
            const error = (ev as any)?.error;
            lastConnectionError = error?.code ? `${error.code} ${url}` : ((ev as any)?.message ?? 'WebSocket error');
        };

        return await deferredResponse.promise;
    }

    @action closeConnection = () => {
        if (this.connection && this.connectionStatus !== ConnectionStatus.CLOSED) {
            this.connection.close();
        }
    };

    private messageHandler(event: MessageEvent) {
        const eventHeader16 = new Uint16Array(event.data, 0, 2);
        const eventHeader32 = new Uint32Array(event.data, 4, 1);
        const eventData = new Uint8Array(event.data, 8);

        const eventType: CARTA.EventType = eventHeader16[0];
        const eventIcdVersion = eventHeader16[1];
        const eventId = eventHeader32[0];

        if (eventIcdVersion !== BackendService.IcdVersion) {
            console.warn(
                `Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${BackendService.IcdVersion}. Errors may occur`
            );
        }
        try {
            const decoderEntry = this.decoderMap.get(eventType);
            if (decoderEntry) {
                const parsedMessage = decoderEntry.messageClass.decode(eventData);
                if (parsedMessage) {
                    decoderEntry.handler.call(this, eventId, parsedMessage);
                } else {
                    console.log(`Unsupported event response ${eventType}`);
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    private onDeferredResponse(eventId: number, response: IBackendResponse) {
        const def = this.deferredMap.get(eventId);
        if (def) {
            if (response.success) {
                def.resolve(response);
            } else {
                def.reject(response.message);
            }
        } else {
            console.log(`Can't find deferred for request ${eventId}`);
        }
    }

    private onRegisterViewerAck(eventId: number, ack: CARTA.RegisterViewerAck) {
        this.sessionId = ack.sessionId;
        this.serverFeatureFlags = ack.serverFeatureFlags;

        this.onDeferredResponse(eventId, ack);
    }

    private sendEvent(eventType: CARTA.EventType, payload: Uint8Array): boolean {
        if (this.connection.readyState === WebSocket.OPEN) {
            const eventData = new Uint8Array(8 + payload.byteLength);
            const eventHeader16 = new Uint16Array(eventData.buffer, 0, 2);
            const eventHeader32 = new Uint32Array(eventData.buffer, 4, 1);
            eventHeader16[0] = eventType;
            eventHeader16[1] = BackendService.IcdVersion;
            eventHeader32[0] = this.eventCounter;

            eventData.set(payload, 8);
            this.connection.send(eventData);
            this.eventCounter++;
            return true;
        } else {
            console.log('Error sending event');
            this.eventCounter++;
            return false;
        }
    }
}

describe(`ACCESS_CARTA_KNOWN_SESSION tests: Testing connections to the backend with an known session id`, () => {
    let client = new BackendService();
    let RegisterViewerAckTemp: CARTA.IRegisterViewerAck;
    test(
        `send "REGISTER_VIEWER" to "${testServerUrl}" with session_id=${assertItem.register.sessionId} and receive "REGISTER_VIEWER_ACK" `,
        async () => {
            RegisterViewerAckTemp = await client.connect(testServerUrl, assertItem.register.sessionId);
        },
        connectTimeout
    );

    test('REGISTER_VIEWER_ACK.success = True', () => {
        expect(RegisterViewerAckTemp.success).toBe(true);
    });

    test(`REGISTER_VIEWER_ACK.session_id is ${assertItem.register.sessionId}`, () => {
        expect(RegisterViewerAckTemp.sessionId).toEqual(assertItem.register.sessionId);
    });

    test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.RESUMED"`, () => {
        expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.RESUMED);
    });

    test('REGISTER_VIEWER_ACK.user_preferences = None', () => {
        expect(RegisterViewerAckTemp.userPreferences).toMatchObject({});
    });

    test('REGISTER_VIEWER_ACK.user_layouts = None', () => {
        expect(RegisterViewerAckTemp.userLayouts).toMatchObject({});
    });

    test('REGISTER_VIEWER_ACK.message is a non-empty string', () => {
        expect(RegisterViewerAckTemp.message).toBeDefined();
        expect(RegisterViewerAckTemp.message).not.toEqual('');
        if (RegisterViewerAckTemp.message !== '') {
            console.warn(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAckTemp.message}" @${new Date()}`);
        }
    });

    afterAll(async () => {
        await client.closeConnection();
    });
});
