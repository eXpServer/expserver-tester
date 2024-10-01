import { ChildProcessWithoutNullStreams } from "child_process";
import { Core } from "./Core";
import { StageWatcher } from "./StageWatcher";

export class TerminalStream {
    private spawnInstance: ChildProcessWithoutNullStreams;
    private watchers: StageWatcher[];
    private _currentStream: string[]; //send only onel ine at a time or send max 10k-ish lines
    private _streamBuffer: string;

    get currentStream() {
        return this._currentStream;
    }

    constructor(spawnInstance: ChildProcessWithoutNullStreams) {
        this.watchers = [];
        this.spawnInstance = spawnInstance;

        this._currentStream = [];
        this._streamBuffer = "";
    }

    public attachNewSubscriber(watcher: StageWatcher) {
        this.watchers.push(watcher);

        const toSend = this._currentStream.slice(-1000).join('\n');
        this.emitToAllSockets('stage-terminal-update', toSend);
    }

    public detachSubscriber(watcher: StageWatcher) {
        this.watchers = this.watchers.filter(value => (value !== watcher));
    }

    private emitToAllSockets(event: string, data: any) {
        this.watchers.forEach(watcher => {
            watcher.socket.emit(event, data);
        })
    }

    private terminalStreamCallback = (data: Buffer) => {
        this._streamBuffer += data.toString();
        const lines = this._streamBuffer.split("\n");
        this._streamBuffer = lines.pop();

        lines.forEach(line => void this._currentStream.push(line))

        const toSend = this._currentStream.slice(-1000).join('\n');
        this.emitToAllSockets('stage-terminal-update', toSend);

    }

    private closeCallback = (code: number) => {
        const line = `Process exited with code : ${code || 0}`
        this._currentStream.push(line);

    }


    public run(): void {
        this.spawnInstance.stdout.setEncoding('ascii');
        this.spawnInstance.stdout.on('data', this.terminalStreamCallback);

        this.spawnInstance.on('close', this.closeCallback)
    }

    public kill() {
        this.spawnInstance.off('data', this.terminalStreamCallback);
        this.spawnInstance.off('close', this.closeCallback);
    }
}