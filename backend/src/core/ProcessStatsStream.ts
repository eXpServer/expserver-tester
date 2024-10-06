import Cpu from "node-os-utils/lib/cpu";
import { ProcessDataInterface } from "../types";
import { StageWatcher } from "./StageWatcher";
import { ChildProcessWithoutNullStreams } from "child_process";
import osu from 'node-os-utils';
import Mem from "node-os-utils/lib/mem";

export class ProcessStatsStream {
    private spawnInstance: ChildProcessWithoutNullStreams;
    private watchers: StageWatcher[];
    private cpu: Cpu;
    private mem: Mem;
    private _currentUsage: ProcessDataInterface;
    private timeout: ReturnType<typeof setTimeout>;
    private _running: boolean;

    get running() {
        return this._running;
    }

    get currentUsage() {
        return this._currentUsage;
    }

    constructor(spawnInstance: ChildProcessWithoutNullStreams) {
        this.watchers = [];
        this.spawnInstance = spawnInstance;
        this.cpu = osu.cpu;
        this.mem = osu.mem;

        this._currentUsage = {
            cpu: 0,
            mem: 0,
        }

        this._running = false;
    }

    public reAttachSpawn(spawnInstance: ChildProcessWithoutNullStreams) {
        if (this._running)
            return;

        this.spawnInstance = spawnInstance;
    }

    public attachNewSubscriber(watcher: StageWatcher) {
        this.watchers.push(watcher);
    }

    public detachSubscriber(watcher: StageWatcher) {
        this.watchers = this.watchers.filter(value => (value !== watcher));
    }

    private async getUsage() {
        const cpuInfo = await this.cpu.free();
        const cpuUsage = 100 - cpuInfo;

        const { totalMemMb, usedMemMb } = await this.mem.used();
        const memUsage = (usedMemMb / totalMemMb) * 100;

        this._currentUsage = { cpu: cpuUsage, mem: memUsage };
    }

    private emitToAllSockets(event: string, data: any) {
        this.watchers.forEach(watcher => watcher.socket.emit(event, data));
    }

    public run() {
        this._running = true;
        this.timeout = setTimeout(() => {
            this.getUsage();

            this.emitToAllSockets('stage-stats-update', this._currentUsage);
        }, 1000);

        this.spawnInstance.once('close', () => {
            this.kill();
            this.emitToAllSockets('stage-stats-complete', this._currentUsage);
        })
    }

    public kill() {
        this._running = false;
        clearTimeout(this.timeout);
    }
}