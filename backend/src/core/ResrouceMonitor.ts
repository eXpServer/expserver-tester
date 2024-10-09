import Cpu from "node-os-utils/lib/cpu";
import { ProcessDataInterface } from "../types";
import { ChildProcessWithoutNullStreams } from "child_process";
import osu from 'node-os-utils';
import Mem from "node-os-utils/lib/mem";
import EventEmitter from "eventemitter3";

export class ResourceMonitor {
    private spawnInstance: ChildProcessWithoutNullStreams;
    private cpu: Cpu;
    private mem: Mem;
    private _currentUsage: ProcessDataInterface;
    private timeout: ReturnType<typeof setTimeout>;
    private _running: boolean;
    private _emitter: EventEmitter;

    get emitter() {
        return this._emitter;
    }

    get running() {
        return this._running;
    }

    get currentUsage() {
        return this._currentUsage;
    }

    constructor(spawnInstance: ChildProcessWithoutNullStreams, emitterCallback: (event: string, data: any) => void) {
        this._emitter = new EventEmitter();
        this.spawnInstance = spawnInstance;
        this.cpu = osu.cpu;
        this.mem = osu.mem;

        this._currentUsage = {
            cpu: 0,
            mem: 0,
        }

        this._running = false;
        this._emitter.on('process-stats-event', emitterCallback);
    }

    public reAttachSpawn(spawnInstance: ChildProcessWithoutNullStreams) {
        if (this._running)
            return;

        this.spawnInstance = spawnInstance;
    }

    private async getUsage() {
        const cpuInfo = await this.cpu.free();
        const cpuUsage = 100 - cpuInfo;

        const { totalMemMb, usedMemMb } = await this.mem.used();
        const memUsage = (usedMemMb / totalMemMb) * 100;

        this._currentUsage = { cpu: cpuUsage, mem: memUsage };
    }

    private emitToAllSockets(event: string, data: any) {
        this._emitter.emit('process-stats-event', event, data);
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