import { ChildProcessWithoutNullStreams } from "child_process";
import { Core } from "./Core";
import { Connection } from "./Connection";

export class TerminalStream {
    private core: Core;
    private spawnInstance: ChildProcessWithoutNullStreams;
    private connections: Connection[];
    private stageNo: number;
    // private testId: string
    private _currentStream: string;

    get currentStream() {
        return this._currentStream;
    }

    constructor(core: Core, stageNo: number, spawnInstance: ChildProcessWithoutNullStreams) {
        this.core = core;
        this.stageNo = stageNo;
        this.connections = [];
        this.spawnInstance = spawnInstance;
    }


    public startStream = (): void => {

    }
}