import { StageWatcher } from "./StageWatcher";
import { Core } from "./Core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { TerminalStream } from "./TerminalStream";
import { TestDetails, TestStatus } from "../types";
import { createSpawn } from "../utils/process";
import { ProcessStatsStream } from "./ProcessStatsStream";

export class StageRunner {
    private watchers: StageWatcher[];
    private _filePath: string;
    private spawnInstance: ChildProcessWithoutNullStreams | null;
    private terminalInstance: TerminalStream | null;
    private processStatsInstance: ProcessStatsStream | null;
    private _stageNo: number;
    private _userId: string;
    private _running: boolean;
    private cleanupCallbacks: Function[];

    get running() {
        return this._running;
    }

    get stageNo() {
        return this._stageNo;
    }

    get userId() {
        return this._userId;
    }

    get filePath() {
        return this._filePath;
    }

    private _currentState: TestDetails[];

    get currentState() {
        return this._currentState;
    }


    constructor(userId: string, stageNo: number, filePath: string) {
        this._stageNo = stageNo;
        this._filePath = filePath;
        this.watchers = [];
        this.spawnInstance = null;
        this.terminalInstance = null;
        this.processStatsInstance = null;
        this.cleanupCallbacks = [];
        this._userId = userId;

        this._currentState = Core.stageTests[`stage${stageNo}`].tests.map(test => ({
            title: test.title,
            description: test.description,
            testInput: test.testInput,
            expectedBehavior: test.expectedBehavior,
            observedBehavior: null,
            status: TestStatus.Pending,
        }))

    }


    public attachNewSubscriber(watcher: StageWatcher): void {
        this.watchers.push(watcher);
        if (this.terminalInstance)
            this.terminalInstance.attachNewSubscriber(watcher);
        if (this.processStatsInstance)
            this.processStatsInstance.attachNewSubscriber(watcher);

    }

    public detachSubscriber(watcher: StageWatcher): void {
        this.watchers = this.watchers.filter(value => (value !== watcher));
        if (this.terminalInstance)
            this.terminalInstance.detachSubscriber(watcher);
        if (this.processStatsInstance)
            this.processStatsInstance.detachSubscriber(watcher);

    }

    private emitToAllSockets(event: string, data: any) {

        this.watchers.forEach(watcher => {
            watcher.socket.emit(event, data);
        })
    }

    private async createAndLinkSpawnInstance() {
        if (this.spawnInstance == null) {
            this.spawnInstance = await createSpawn(this.filePath);


            this.spawnInstance.on('close', () => {
                this.spawnInstance = null;
            })

            if (this.terminalInstance || this.processStatsInstance) {
                if (this.terminalInstance.running)
                    this.terminalInstance.kill();

                if (this.processStatsInstance.running)
                    this.processStatsInstance.kill();

                this.terminalInstance.reAttachSpawn(this.spawnInstance);
                this.terminalInstance.run();

                this.processStatsInstance.reAttachSpawn(this.spawnInstance);
                this.processStatsInstance.run();
            }
            else {
                this.terminalInstance = new TerminalStream(this.spawnInstance);
                this.watchers.forEach(watcher => this.terminalInstance.attachNewSubscriber(watcher))
                this.terminalInstance.run();

                this.processStatsInstance = new ProcessStatsStream(this.spawnInstance)
                this.watchers.forEach(watcher => this.processStatsInstance.attachNewSubscriber(watcher));
                this.processStatsInstance.run();
            }

        }
    }

    public async run() {
        this._running = true;
        this._currentState = this._currentState.map(value => ({
            ...value,
            status: TestStatus.Running,
        }))

        this.emitToAllSockets('run-started', {
            binary_uploaded: true,
            running: true,
            current_state: this.currentState
        });

        await this.createAndLinkSpawnInstance();

        const functions = Core.stageTests[`stage${this.stageNo}`].tests.map(test => test.testFunction);
        for (let i = 0; i < functions.length; i++) {
            console.log(`Running Stage: ${this.stageNo}\t\tTest ${i}`)
            const fn = functions[i];


            if (this.spawnInstance) {
                this.spawnInstance.kill();
                this.spawnInstance = null;
            }
            await this.createAndLinkSpawnInstance();



            const { passed, observedBehavior, cleanup } = await fn(this.spawnInstance);


            console.log(`Completed Stage: ${this.stageNo}\t\tTest ${i}`)

            this._currentState[i].status = (passed
                ? TestStatus.Passed
                : TestStatus.Failed
            );
            this._currentState[i].observedBehavior = observedBehavior;

            if (cleanup)
                this.cleanupCallbacks.push(cleanup);

            this.emitToAllSockets('stage-tests-update', this._currentState);
        }

        this.kill();
    }

    public kill() {
        this._running = false;

        if (this.spawnInstance) {
            this.spawnInstance.once('close', () => {
                this.terminalInstance.kill();
                this.terminalInstance = null;

                this.processStatsInstance.kill();
                this.processStatsInstance = null;
            })

            this.spawnInstance.kill('SIGINT');
        }
        else {
            this.terminalInstance?.kill();
            this.processStatsInstance?.kill();
        }

        this.cleanupCallbacks.forEach(callback => callback());

        this.watchers.forEach(watcher => watcher.stageRunner = null);


        const numTestCases = this._currentState.length;
        const numPassed = this._currentState.filter(test => test.status == TestStatus.Passed).length;
        const numFailed = this._currentState.filter(test => test.status == TestStatus.Failed).length;

        Core.deleteRunner(this);

        this.emitToAllSockets('stage-tests-complete', {
            numTestCases,
            numPassed,
            numFailed,
        })
    }
}