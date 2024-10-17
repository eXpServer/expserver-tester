import { FinalSummary, TestDetails, TestState } from "@/types";
import { io, Socket } from "socket.io-client";

export enum SocketIncomingEvents {
    CurrentState = 'current-state',
    ConnectionAcknowledged = "connection-ack",
    Error = 'error',

    TestsStart = 'stage-tests-start',
    TestsUpdate = 'stage-tests-update',
    TestsComplete = 'stage-tests-complete',
    TestsForceQuit = 'stage-tests-force-quit',

    TerminalUpdate = 'stage-terminal-update',
    TerminalComplete = 'stage-terminal-complete',

    ResourceStatsUpdate = 'stage-stats-update',
    ResourceStatsComplete = 'stage-stats-complete',

}

export enum SocketOutgoingEvents {
    RequestState = 'request-state',
    Run = 'run',
    Stop = 'stop',
}

const SOCKET_URL = 'http://localhost:6970';


export class WebSocket {
    private _socket: Socket;
    private _stageNo: number;
    private _userId: string;
    private callbacks: Map<SocketIncomingEvents, (() => void)[]> = new Map();

    get socket() {
        return this._socket;
    }

    get stageNo() {
        return this._stageNo;
    }

    get userId() {
        return this._userId;
    }


    constructor(userId: string) {
        const socket = io(SOCKET_URL);
        this._userId = userId;

        socket.once(SocketIncomingEvents.ConnectionAcknowledged, () => {
            this._socket = socket;
        })

        socket.once(SocketIncomingEvents.Error, () => {
            this._socket = null;
            throw new Error("socket connection not esablished");
        })
    }


    private requestState(stageNo: number): Promise<TestState> {
        this._stageNo = stageNo;
        return new Promise((resolve) => {
            if (this._socket == null)
                return resolve(null);
            this._socket.emit(SocketOutgoingEvents.RequestState, ({ stageNo, userId: this._userId }));
            this._socket.once(SocketIncomingEvents.CurrentState, (data: TestState) => {
                return resolve(data);
            })
        })
    }

    public async changeStage(stageNo: number) {
        this._stageNo = stageNo;
        const data = await this.requestState(stageNo);
        return data;
    }


    private setCallback(event: SocketIncomingEvents, callback: () => void) {
        const prevCallbacks = this.callbacks.get(event);
        if (prevCallbacks)
            prevCallbacks.push(callback);
        else
            this.callbacks.set(event, [callback]);
    }

    public setTestCallbacks(updateCallback: () => void, completeCallback: () => void) {
        this._socket.on(SocketIncomingEvents.TestsUpdate, updateCallback);
        this._socket.on(SocketIncomingEvents.TestsComplete, completeCallback);

        this.setCallback(SocketIncomingEvents.TestsUpdate, updateCallback);
        this.setCallback(SocketIncomingEvents.TestsComplete, completeCallback);
    }

    public setTerminalCallbacks(updateCallback: () => void, completeCallback: () => void) {
        this._socket.on(SocketIncomingEvents.TerminalUpdate, updateCallback);
        this._socket.on(SocketIncomingEvents.TerminalComplete, completeCallback);

        this.setCallback(SocketIncomingEvents.TerminalUpdate, updateCallback);
        this.setCallback(SocketIncomingEvents.TerminalComplete, completeCallback);
    }

    public setResourceMonitorCallbacks(updateCallback: () => void, completeCallback: () => void) {
        this._socket.on(SocketIncomingEvents.ResourceStatsUpdate, updateCallback);
        this._socket.on(SocketIncomingEvents.ResourceStatsComplete, completeCallback);

        this.setCallback(SocketIncomingEvents.ResourceStatsUpdate, updateCallback);
        this.setCallback(SocketIncomingEvents.ResourceStatsComplete, completeCallback);
    }

    public run(): Promise<TestDetails[]> {
        return new Promise((resolve, _) => {
            this._socket.emit(SocketOutgoingEvents.Run);
            this._socket.once(SocketIncomingEvents.TestsStart, (data: TestDetails[]) => {
                resolve(data);
            })
        })
    }

    public stop(): Promise<FinalSummary> {
        const events: SocketIncomingEvents[] = [
            SocketIncomingEvents.TestsUpdate,
            SocketIncomingEvents.TestsComplete,
            SocketIncomingEvents.TerminalUpdate,
            SocketIncomingEvents.TerminalComplete,
            SocketIncomingEvents.ResourceStatsUpdate,
            SocketIncomingEvents.ResourceStatsComplete,
        ];

        return new Promise((resolve) => {
            this._socket.emit(SocketOutgoingEvents.Stop, () => {
                events.forEach(event => this.removeCallbacks(event));

                this._socket.once(SocketIncomingEvents.TestsForceQuit, (data: FinalSummary) => resolve(data))
            });
        });
    }

    public removeCallbacks(event: SocketIncomingEvents) {
        const eventCallbacks = this.callbacks.get(event);
        eventCallbacks?.forEach(callback => {
            this._socket.off(event, callback);
        });
    }
}