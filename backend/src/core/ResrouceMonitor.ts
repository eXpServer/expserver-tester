import Cpu from "node-os-utils/lib/cpu";
import { ProcessDataInterface } from "../types";
import { ChildProcessWithoutNullStreams } from "child_process";
import osu from 'node-os-utils';
import Mem from "node-os-utils/lib/mem";
import EventEmitter from "eventemitter3";
import { getCpuUsage, getMemUsage } from "../utils/process";

enum ResourceMonitorEvents {
    TEST_UPDATE = 'stage-stats-update',
    TEST_COMPLETE = 'stage-stats-complete',
    EMIT_TO_STAGE_RUNNER = 'process-stats-event',
}

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
        this._emitter.on(ResourceMonitorEvents.EMIT_TO_STAGE_RUNNER, emitterCallback);
    }

    public reAttachSpawn(spawnInstance: ChildProcessWithoutNullStreams) {
        if (this._running)
            return;

        this.spawnInstance = spawnInstance;
    }

    private async getUsage() {
        const cpuUsage = await getCpuUsage(this.spawnInstance.pid);
        const memUsage = await getMemUsage(this.spawnInstance.pid);
        // const { totalMemMb, usedMemMb } = await this.mem.used();
        // const memUsage = (usedMemMb / totalMemMb) * 100;

        this._currentUsage = { cpu: cpuUsage, mem: memUsage };
    }

    private emitToAllSockets(event: string, data: any) {
        this._emitter.emit(ResourceMonitorEvents.EMIT_TO_STAGE_RUNNER, event, data);
    }

    public run() {
        this._running = true;
        this.timeout = setTimeout(() => {
            this.getUsage();

            this.emitToAllSockets(ResourceMonitorEvents.TEST_UPDATE, this._currentUsage);
        }, 1000);

        this.spawnInstance.once('close', () => {
            this.kill();
            this.emitToAllSockets(ResourceMonitorEvents.TEST_COMPLETE, this._currentUsage);
        })
    }

    public kill() {
        this._running = false;
        clearTimeout(this.timeout);
    }
}