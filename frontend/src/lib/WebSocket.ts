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
    private callbacks: Map<SocketIncomingEvents, ((...args: unknown[]) => void)[]> = new Map();

    get socket() {
        return this._socket;
    }

    get stageNo() {
        return this._stageNo;
    }

    get userId() {
        return this._userId;
    }


    public initialize(userId: string) {
        return new Promise((resolve, reject) => {
            const socket = io(SOCKET_URL);
            this._userId = userId;
    
            socket.once(SocketIncomingEvents.ConnectionAcknowledged, () => {
                this._socket = socket;
                resolve(true);
            })
    
            socket.once(SocketIncomingEvents.Error, () => {
                this._socket = null;
                throw new Error("socket connection not esablished");
                reject()
            })
        })
    }


    private requestState(stageNo: number): Promise<TestState> {
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


    private setCallback(event: SocketIncomingEvents, callback: (...args: unknown[]) => void) {
        const prevCallbacks = this.callbacks.get(event);
        if (prevCallbacks)
            prevCallbacks.push(callback);
        else
            this.callbacks.set(event, [callback]);
    }

    public setTestCallbacks(updateCallback: (...args: unknown[]) => void, completeCallback: (...args: unknown[]) => void) {
        this._socket.on(SocketIncomingEvents.TestsUpdate, updateCallback);
        this._socket.on(SocketIncomingEvents.TestsComplete, completeCallback);

        this.setCallback(SocketIncomingEvents.TestsUpdate, updateCallback);
        this.setCallback(SocketIncomingEvents.TestsComplete, completeCallback);
    }

    public setTerminalCallbacks(callback: (...args: unknown[]) => void) {
        this._socket.on(SocketIncomingEvents.TerminalUpdate, callback);
        this._socket.on(SocketIncomingEvents.TerminalComplete, callback);

        this.setCallback(SocketIncomingEvents.TerminalUpdate, callback);
        this.setCallback(SocketIncomingEvents.TerminalComplete, callback);
    }

    public setResourceMonitorCallbacks(callback: (...args: unknown[]) => void) {
        this._socket.on(SocketIncomingEvents.ResourceStatsUpdate, callback);
        this._socket.on(SocketIncomingEvents.ResourceStatsComplete, callback);

        this.setCallback(SocketIncomingEvents.ResourceStatsUpdate, callback);
        this.setCallback(SocketIncomingEvents.ResourceStatsComplete, callback);
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

        return new Promise((resolve) => {
            this._socket.once(SocketIncomingEvents.TestsForceQuit, (data: FinalSummary) => resolve(data))
        });
    }

    public removeCallbacks(event: SocketIncomingEvents) {
        const eventCallbacks = this.callbacks.get(event);
        eventCallbacks?.forEach(callback => {
            this._socket.off(event, callback);
        });
    }

    public kill() {
        return new Promise((resolve) => {
            this.stop();


            const events: SocketIncomingEvents[] = [
                SocketIncomingEvents.TestsUpdate,
                SocketIncomingEvents.TestsComplete,
                SocketIncomingEvents.TerminalUpdate,
                SocketIncomingEvents.TerminalComplete,
                SocketIncomingEvents.ResourceStatsUpdate,
                SocketIncomingEvents.ResourceStatsComplete,
            ];

            events.forEach(event => {
                this.removeCallbacks(event);
            });

            this._socket.disconnect();
            this._socket.once('disconnect', () => resolve(true));
        })
    }
}