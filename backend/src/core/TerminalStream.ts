import { ChildProcessWithoutNullStreams } from "child_process";
import { TERMINAL_MAX_LIMIT } from "../constants";
import EventEmitter from "eventemitter3";

enum TerminalStreamEvents {
    TEST_UPDATE = 'stage-terminal-update',
    TEST_COMPLETE = 'stage-terminal-complete',
    EMIT_TO_STAGE_RUNNER = 'terminal-event',
}

export class TerminalStream {
    private spawnInstance: ChildProcessWithoutNullStreams;
    private _currentStream: string[]; //send only onel ine at a time or send max 10k-ish lines
    private _streamBuffer: string;
    private _running: boolean;
    private _emitter: EventEmitter;

    get emitter() {
        return this._emitter;
    }

    get running() {
        return this._running;
    }

    get currentStream() {
        return this._currentStream;
    }

    constructor(spawnInstance: ChildProcessWithoutNullStreams, emitterCallback: (event: string, data: any) => void) {
        this._emitter = new EventEmitter();
        this.spawnInstance = spawnInstance;

        this._currentStream = [];
        this._streamBuffer = "";

        this._running = false;
        this._emitter.on(TerminalStreamEvents.EMIT_TO_STAGE_RUNNER, emitterCallback);
    }

    public reAttachSpawn(spawnInstance: ChildProcessWithoutNullStreams) {
        if (this._running)
            return;
        this.spawnInstance = spawnInstance;
    }

    private emitToAllSockets(event: string, data: any) {
        this._emitter.emit(TerminalStreamEvents.EMIT_TO_STAGE_RUNNER, event, data);
    }

    private terminalStreamCallback = (data: Buffer) => {
        this._streamBuffer += data.toString();
        const lines = this._streamBuffer.split("\n");
        this._streamBuffer = lines.pop();

        lines.forEach(line => this._currentStream.push(line))

        const toSend = this._currentStream.slice(-TERMINAL_MAX_LIMIT).join('\n');
        this.emitToAllSockets(TerminalStreamEvents.TEST_UPDATE, toSend);

    }

    private closeCallback = (code: number) => {
        const line = `Process exited with code : ${code || 0}`
        this._currentStream.push(line);

        const toSend = this._currentStream.slice(-TERMINAL_MAX_LIMIT).join('\n');
        this.emitToAllSockets(TerminalStreamEvents.TEST_COMPLETE, toSend);
        this.kill();
    }


    public run(): void {
        this._running = true;
        this.spawnInstance.stdout.setEncoding('ascii');
        this.spawnInstance.stdout.on('data', this.terminalStreamCallback);

        this.spawnInstance.on('close', this.closeCallback)
    }

    public kill() {
        this._running = false;
        this.spawnInstance.off('data', this.terminalStreamCallback);
        this.spawnInstance.off('close', this.closeCallback);
    }
}