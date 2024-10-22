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

            const errorCallback = () => {
                this._socket = null;
                reject("socket connection not established");
            }


            socket.once(SocketIncomingEvents.Error, errorCallback);

            socket.once(SocketIncomingEvents.ConnectionAcknowledged, () => {
                socket.off(SocketIncomingEvents.Error, errorCallback);
                this._socket = socket;
                resolve(true);
            })

        })
    }


    private requestState(stageNo: number): Promise<TestState> {
        return new Promise((resolve, reject) => {
            if (this._socket == null)
                return reject('socket is null');
            this._socket.emit(SocketOutgoingEvents.RequestState, ({ stageNo, userId: this._userId }));


            const errorCallback = () => {
                this._socket = null;
                reject("socket connection not failed");
            }

            this._socket.once(SocketIncomingEvents.Error, errorCallback);

            this._socket.once(SocketIncomingEvents.CurrentState, (data: TestState) => {
                this._socket.off(SocketIncomingEvents.Error, errorCallback);
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

    public setTestCallbacks(updateCallback: (data: TestDetails[]) => void, completeCallback: (data: FinalSummary) => void) {
        this._socket.on(SocketIncomingEvents.TestsUpdate, updateCallback);
        this._socket.on(SocketIncomingEvents.TestsComplete, completeCallback);

        this.setCallback(SocketIncomingEvents.TestsUpdate, updateCallback);
        this.setCallback(SocketIncomingEvents.TestsComplete, completeCallback);
    }

    public setTerminalCallbacks(callback: (data: string) => void) {
        this._socket.on(SocketIncomingEvents.TerminalUpdate, callback);
        this._socket.on(SocketIncomingEvents.TerminalComplete, callback);

        this.setCallback(SocketIncomingEvents.TerminalUpdate, callback);
        this.setCallback(SocketIncomingEvents.TerminalComplete, callback);
    }

    public setResourceMonitorCallbacks(callback: (data: { cpu: number, mem: number }) => void) {
        this._socket.on(SocketIncomingEvents.ResourceStatsUpdate, callback);
        this._socket.on(SocketIncomingEvents.ResourceStatsComplete, callback);

        this.setCallback(SocketIncomingEvents.ResourceStatsUpdate, callback);
        this.setCallback(SocketIncomingEvents.ResourceStatsComplete, callback);
    }

    public run(): Promise<TestDetails[]> {
        return new Promise((resolve, reject) => {

            const errorCallback = () => {
                this._socket = null;
                reject('something went wrong');
            }

            this._socket.emit(SocketOutgoingEvents.Run);
            this._socket.once(SocketIncomingEvents.Error, errorCallback);
            this._socket.once(SocketIncomingEvents.TestsStart, (data: TestDetails[]) => {
                this._socket.off(SocketIncomingEvents.Error, errorCallback);
                resolve(data);
            })
        })
    }

    public stop(): Promise<FinalSummary> {
        return new Promise((resolve, reject) => {

            const errorCallback = () => {
                this._socket = null;
                reject('something went wrong');
            }

            this._socket.emit(SocketOutgoingEvents.Stop);
            this._socket.on(SocketIncomingEvents.Error, errorCallback);
            this._socket.once(SocketIncomingEvents.TestsForceQuit, (data: FinalSummary) => {
                this._socket.off(SocketIncomingEvents.Error, errorCallback);
                resolve(data)
            })
        });
    }

    public removeCallbacks(event: SocketIncomingEvents) {
        const eventCallbacks = this.callbacks.get(event);
        eventCallbacks?.forEach(callback => {
            this._socket.off(event, callback);
        });
    }

    public kill() {
        if (!this._socket)
            return;
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