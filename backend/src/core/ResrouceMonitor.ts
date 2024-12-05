import Cpu from "node-os-utils/lib/cpu";
import { ResourceStats } from "../types";
import { ChildProcessWithoutNullStreams } from "child_process";
import osu from 'node-os-utils';
import Mem from "node-os-utils/lib/mem";
import { getCpuUsage, getMemUsage } from "../utils/process";
import { ContainerManager } from "./ContainerManager";

enum ResourceMonitorEvents {
    TEST_UPDATE = 'stage-stats-update',
    TEST_COMPLETE = 'stage-stats-complete',
    EMIT_TO_STAGE_RUNNER = 'process-stats-event',
}

export class ResourceMonitor {
    // private spawnInstance: ChildProcessWithoutNullStreams;
    private containerInstance: ContainerManager;
    private cpu: Cpu;
    private mem: Mem;
    private _currentUsage: ResourceStats;
    private timeout: ReturnType<typeof setTimeout>;
    private _running: boolean;
    private _callback: (event: string, data: any) => void;

    get running() {
        return this._running;
    }

    get currentUsage() {
        return this._currentUsage;
    }

    constructor(containerInstance: ContainerManager, emitterCallback: (event: string, data: any) => void) {
        this.containerInstance = containerInstance;
        this.cpu = osu.cpu;
        this.mem = osu.mem;

        this._currentUsage = {
            cpu: 0,
            mem: 0,
        }

        this._running = false;
        this._callback = emitterCallback;
        // this._emitter.on(ResourceMonitorEvents.EMIT_TO_STAGE_RUNNER, emitterCallback);
    }

    // public reAttachSpawn(spawnInstance: ChildProcessWithoutNullStreams) {
    //     if (this._running)
    //         return;

    //     this.spawnInstance = spawnInstance;
    // }

    private async getUsage() {
        // const cpuUsage = await getCpuUsage(this.spawnInstance.pid);
        // const memUsage = await getMemUsage(this.spawnInstance.pid);
        // const { totalMemMb, usedMemMb } = await this.mem.used();
        // const memUsage = (usedMemMb / totalMemMb) * 100;

        this._currentUsage = { cpu: 0, mem: 0 };
    }

    private emitToAllSockets(event: string, data: any) {
        this._callback(event, data);
        // this._emitter.emit(ResourceMonitorEvents.EMIT_TO_STAGE_RUNNER, event, data);
    }

    private closeCallback = () => {
        this.emitToAllSockets(ResourceMonitorEvents.TEST_COMPLETE, this._currentUsage);
        this.kill();
    }

    private resourceStreamCallback = () => {
        this.getUsage();
        this.emitToAllSockets(ResourceMonitorEvents.TEST_UPDATE, this._currentUsage);
    }

    public run() {
        this._running = true;
        this.timeout = setTimeout(this.resourceStreamCallback, 1000);

        this.containerInstance.once('close', this.closeCallback)
    }

    public kill() {
        this._running = false;
        clearTimeout(this.timeout);
    }
}