import { action, makeObservable, observable, runInAction } from 'mobx';
import { CARTA } from 'carta-protobuf';
import { Subject } from 'rxjs';
import config from './config.json';
import WebSocket from 'ws';
const icdVersion = config.icdVersion;

export enum ConnectionStatus {
    CLOSED = 0,
    PENDING = 1,
    ACTIVE = 2,
}

export const INVALID_ANIMATION_ID = -1;

type HandlerFunction = (eventId: number, parsedMessage: any) => void;

interface IBackendResponse {
    success?: boolean | null;
    message?: string | null;
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

    readonly rasterTileStream: Subject<CARTA.RasterTileData>;
    readonly rasterSyncStream: Subject<CARTA.RasterTileSync>;
    readonly histogramStream: Subject<CARTA.RegionHistogramData>;
    readonly errorStream: Subject<CARTA.ErrorData>;
    readonly spatialProfileStream: Subject<CARTA.SpatialProfileData>;
    readonly spectralProfileStream: Subject<CARTA.SpectralProfileData>;
    readonly statsStream: Subject<CARTA.RegionStatsData>;
    readonly contourStream: Subject<CARTA.ContourImageData>;
    readonly catalogStream: Subject<CARTA.CatalogFilterResponse>;
    readonly momentProgressStream: Subject<CARTA.MomentProgress>;
    readonly scriptingStream: Subject<CARTA.ScriptingRequest>;
    readonly listProgressStream: Subject<CARTA.ListProgress>;
    readonly pvProgressStream: Subject<CARTA.PvProgress>;
    readonly vectorTileStream: Subject<CARTA.VectorOverlayTileData>;
    private readonly decoderMap: Map<CARTA.EventType, { messageClass: any; handler: HandlerFunction }>;

    public constructor() {
        makeObservable(this);
        this.loggingEnabled = true;
        this.deferredMap = new Map<number, Deferred<IBackendResponse>>();

        this.eventCounter = 1;
        this.sessionId = 0;
        this.endToEndPing = NaN;
        this.animationId = INVALID_ANIMATION_ID;
        this.connectionStatus = ConnectionStatus.CLOSED;
        this.rasterTileStream = new Subject<CARTA.RasterTileData>();
        this.rasterSyncStream = new Subject<CARTA.RasterTileSync>();
        this.histogramStream = new Subject<CARTA.RegionHistogramData>();
        this.errorStream = new Subject<CARTA.ErrorData>();
        this.spatialProfileStream = new Subject<CARTA.SpatialProfileData>();
        this.spectralProfileStream = new Subject<CARTA.SpectralProfileData>();
        this.statsStream = new Subject<CARTA.RegionStatsData>();
        this.contourStream = new Subject<CARTA.ContourImageData>();
        this.scriptingStream = new Subject<CARTA.ScriptingRequest>();
        this.catalogStream = new Subject<CARTA.CatalogFilterResponse>();
        this.momentProgressStream = new Subject<CARTA.MomentProgress>();
        this.listProgressStream = new Subject<CARTA.ListProgress>();
        this.pvProgressStream = new Subject<CARTA.PvProgress>();
        this.vectorTileStream = new Subject<CARTA.VectorOverlayTileData>();

        // Construct handler and decoder maps
        this.decoderMap = new Map<CARTA.EventType, { messageClass: any; handler: HandlerFunction }>([
            [
                CARTA.EventType.REGISTER_VIEWER_ACK,
                {
                    messageClass: CARTA.RegisterViewerAck,
                    handler: this.onRegisterViewerAck,
                },
            ],
            [
                CARTA.EventType.FILE_LIST_RESPONSE,
                {
                    messageClass: CARTA.FileListResponse,
                    handler: this.onDeferredResponse,
                },
            ],
        ]);

        // check ping every 5 seconds
        // setInterval(this.sendPing, 5000);
    }

    @action('connect')
    async connect(url: string): Promise<CARTA.IRegisterViewerAck> {
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
                sessionId: this.sessionId,
                clientFeatureFlags: BackendService.DefaultFeatureFlags,
            });
            // observer map is cleared, so that old subscriptions don't get incorrectly fired

            this.logEvent(CARTA.EventType.REGISTER_VIEWER, requestId, message, false);
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

    async getFileList(directory: string, filterMode: CARTA.FileListFilterMode): Promise<CARTA.IFileListResponse> {
        if (this.connectionStatus !== ConnectionStatus.ACTIVE) {
            throw new Error('Not connected');
        } else {
            const message = CARTA.FileListRequest.create({
                directory,
                filterMode,
            });
            const requestId = this.eventCounter;
            this.logEvent(CARTA.EventType.FILE_LIST_REQUEST, requestId, message, false);
            if (this.sendEvent(CARTA.EventType.FILE_LIST_REQUEST, CARTA.FileListRequest.encode(message).finish())) {
                const deferredResponse = new Deferred<CARTA.IFileListResponse>();
                this.deferredMap.set(requestId, deferredResponse);
                return await deferredResponse.promise;
            } else {
                throw new Error('Could not send event');
            }
        }
    }

    private messageHandler(event: MessageEvent) {
        if (event.data === 'PONG') {
            return;
        } else if (event.data.byteLength < 8) {
            console.log('Unknown event format');
            return;
        }

        const eventHeader16 = new Uint16Array(event.data, 0, 2);
        const eventHeader32 = new Uint32Array(event.data, 4, 1);
        const eventData = new Uint8Array(event.data, 8);

        const eventType: CARTA.EventType = eventHeader16[0];
        const eventIcdVersion = eventHeader16[1];
        const eventId = eventHeader32[0];

        if (eventIcdVersion !== BackendService.IcdVersion) {
            console.log(
                `Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${BackendService.IcdVersion}. Errors may occur`
            );
        }
        try {
            const decoderEntry = this.decoderMap.get(eventType);
            if (decoderEntry) {
                const parsedMessage = decoderEntry.messageClass.decode(eventData);
                if (parsedMessage) {
                    this.logEvent(eventType, eventId, parsedMessage);
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

        // TelemetryService.Instance.addTelemetryEntry(TelemetryAction.Connection, {serverFeatureFlags: ack.serverFeatureFlags, platformInfo: ack.platformStrings});
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

    private logEvent(eventType: CARTA.EventType, eventId: number, message: any, incoming: boolean = true) {
        const eventName = CARTA.EventType[eventType];
        if (this.loggingEnabled) {
            if (incoming) {
                if (eventId === 0) {
                    // console.log(`<== ${eventName} [Stream]`);
                } else {
                    // console.log(`<== ${eventName} [${eventId}]`);
                }
            } else {
                // console.log(`${eventName} [${eventId}] ==>`);
            }
            // console.log(message);
            // console.log("\n");
        }
    }
}
