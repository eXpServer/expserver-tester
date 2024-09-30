import { ChildProcessWithoutNullStreams } from "child_process";
import { Core } from "./Core";
import { Connection } from "./Connection";

export class TerminalStream {
    private spawnInstance: ChildProcessWithoutNullStreams;
    private connections: Connection[];
    private _currentStream: string; //send only onel ine at a time or send max 10k-ish lines

    get currentStream() {
        return this._currentStream;
    }

    constructor(spawnInstance: ChildProcessWithoutNullStreams) {
        this.connections = [];
        this.spawnInstance = spawnInstance;

        this._currentStream = "";

        this.run();
    }

    public attachNewSubscriber(connection: Connection) {
        this.connections.push(connection);

        connection.socket.emit('stage-terminal-update', this._currentStream);
    }

    public detachSubscriber(connection: Connection) {
        this.connections = this.connections.filter(value => (value !== connection));
    }

    private emitToAllSockets(event: string, data: any) {
        this.connections.forEach(connection => {
            connection.socket.emit(event, data);
        })
    }


    private run(): void {
        this.spawnInstance.stdout.setEncoding('ascii');
        this.spawnInstance.stdout.on('data', (data: Buffer) => {
            const line = data.toString();
            this._currentStream += line;

            this.emitToAllSockets('stage-terminal-update', line);
        })

        this.spawnInstance.on('close', (code) => {
            const line = `Process exited with code : ${code || 0}`
            this._currentStream += line;

            this.emitToAllSockets('stage-terminal-update', line);
        })
    }
}