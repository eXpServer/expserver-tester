import { StageWatcher } from "./StageWatcher";
import { Core } from "./Core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { TerminalStream } from "./TerminalStream";
import { TestDetails, TestStatus } from "../types";
import { createSpawn } from "../utils/process";
import { ResourceMonitor } from "./ResrouceMonitor";

enum StageRunnerEvents {
    TEST_STARTED = 'stage-tests-start',
    TEST_UPDATE = 'stage-tests-update',
    TEST_COMPLETE = 'stage-tests-complete',
    FORCE_QUIT = 'stage-tests-force-quit',
}

export class StageRunner {
    private watchers: StageWatcher[];
    private _filePath: string;
    private spawnInstance: ChildProcessWithoutNullStreams | null;
    private terminalInstance: TerminalStream | null;
    private processStatsInstance: ResourceMonitor | null;
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

    }

    public detachSubscriber(watcher: StageWatcher): void {
        this.watchers = this.watchers.filter(value => (value !== watcher));
    }

    private emitToAllSockets(event: string, data: any) {

        this.watchers.forEach(watcher => {
            watcher.socket.emit(event, data); // do watcher.emit()
        })
    }

    private emitterCallback = (event: string, data: any) => {
        this.emitToAllSockets(event, data);
    }

    private async createAndLinkSpawnInstance() {
        if (this.spawnInstance == null) {
            this.spawnInstance = await createSpawn(this.filePath);
            console.log('spawn undied');

            this.spawnInstance.on('close', () => {
                console.log('spanw died');
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
                this.terminalInstance = new TerminalStream(this.spawnInstance, this.emitterCallback);
                this.terminalInstance.run();

                this.processStatsInstance = new ResourceMonitor(this.spawnInstance, this.emitterCallback);
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

        this.emitToAllSockets(StageRunnerEvents.TEST_STARTED, this.currentState);

        await this.createAndLinkSpawnInstance();

        const functions = Core.stageTests[`stage${this.stageNo}`].tests.map(test => test.testFunction);
        for (let i = 0; i < functions.length; i++) {
            const fn = functions[i];


            if (this.spawnInstance) {
                this.spawnInstance.kill();
                this.spawnInstance = null;
            }
            await this.createAndLinkSpawnInstance();

            const { passed, testInput, expectedBehavior, observedBehavior, cleanup } = await fn(this.spawnInstance);

            this._currentState[i].testInput = testInput;
            this._currentState[i].expectedBehavior = expectedBehavior;
            this._currentState[i].status = (passed
                ? TestStatus.Passed
                : TestStatus.Failed
            );
            this._currentState[i].observedBehavior = observedBehavior;

            if (cleanup)
                this.cleanupCallbacks.push(cleanup);

            this.emitToAllSockets(StageRunnerEvents.TEST_UPDATE, this._currentState);
        }
        if (this.running)
            this.kill();
    }

    public async kill(forced?: boolean) { // add flag to indicate if forced quit
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

        if (forced) {
            this.emitToAllSockets(StageRunnerEvents.FORCE_QUIT, {
                numTestCases,
                numPassed,
                numFailed,
            });
        }
        else {
            this.emitToAllSockets(StageRunnerEvents.TEST_COMPLETE, {
                numTestCases,
                numPassed,
                numFailed,
            })
        }
    }
}