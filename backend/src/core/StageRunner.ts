import { Connection } from "./Connection";
import { Core } from "./Core";
import { ChildProcessWithoutNullStreams } from "child_process";
import { TerminalStream } from "./TerminalStream";

export class StageRunner {
    private core: Core;
    private stageNo: number;
    private connections: Connection[];
    private filePath: string;
    private spawnInstance: ChildProcessWithoutNullStreams | null;
    private terminalInstance: TerminalStream | null;
    // private userId: string;
    // private _running: boolean

    // get running() {
    //     return this._running;
    // }


    private attachTerminal = (): TerminalStream | null => {
        if (!this.spawnInstance)
            return null;
        return new TerminalStream(
            this.core,
            this.stageNo,
            this.spawnInstance,
        );
    }


    constructor(core: Core, stageNo: number, filePath: string) {
        this.core = core;
        this.stageNo = stageNo;
        this.filePath = filePath;
        this.connections = [];
        this.spawnInstance = null;
        this.terminalInstance = null;

        // this._running = false;
    }


    public attachNewSubscriber = (connection: Connection): void => {

    }

    public run = (): void => {
    }

    public kill = (): void => {
    }

}