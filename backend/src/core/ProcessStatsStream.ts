import Cpu from "node-os-utils/lib/cpu";
import { ProcessDataInterface } from "../types";
import { Connection } from "./Connection";
import { ChildProcessWithoutNullStreams } from "child_process";
import osu from 'node-os-utils';
import Mem from "node-os-utils/lib/mem";

export class ProcessStatsStream {
    private spawnInstance: ChildProcessWithoutNullStreams;
    private connections: Connection[];
    private cpu: Cpu;
    private mem: Mem;
    private _currentUsage: ProcessDataInterface;
    private timeout: NodeJS.Timeout;

    get currentUsage() {
        return this._currentUsage;
    }

    constructor(spawnInstance: ChildProcessWithoutNullStreams) {
        this.connections = [];
        this.spawnInstance = spawnInstance;
        this.cpu = osu.cpu;
        this.mem = osu.mem;

        this._currentUsage = {
            cpu: 0,
            mem: 0,
        }
    }

    public attachNewSubscriber(connection: Connection) {
        this.connections.push(connection);
    }

    public detachSubscriber(connection: Connection) {
        this.connections = this.connections.filter(value => (value !== connection));
    }

    private async getUsage() {
        const cpuInfo = await this.cpu.free();
        const cpuUsage = 100 - cpuInfo;

        const { totalMemMb, usedMemMb } = await this.mem.used();
        const memUsage = (usedMemMb / totalMemMb) * 100;

        this._currentUsage = { cpu: cpuUsage, mem: memUsage };
    }

    private emitToAllSockets(event: string, data: any) {
        this.connections.forEach(connection => connection.socket.emit(event, data));
    }

    public run() {
        this.timeout = setTimeout(() => {
            this.getUsage();

            this.emitToAllSockets('stage-stats-update', this._currentUsage);
        }, 1000);

        this.spawnInstance.once('close', () => {
            this.emitToAllSockets('stage-stats-complete', this._currentUsage);
            clearTimeout(this.timeout);
        })
    }

    public kill() {
        clearTimeout(this.timeout);
    }
}