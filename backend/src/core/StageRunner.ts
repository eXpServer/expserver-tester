import { Connection } from "./Connection";
import { Core } from "./Core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { TerminalStream } from "./TerminalStream";
import { ResultInterface, TestStatus } from "../types";
import { createSpawn } from "../utils/process";
import { ProcessStatsStream } from "./ProcessStatsStream";
import testFunctions from '../tests';

export class StageRunner {
    private connections: Connection[];
    private filePath: string;
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

    private _currentState: ResultInterface[];

    get currentState() {
        return this._currentState;
    }


    constructor(userId: string, stageNo: number, filePath: string) {
        this._stageNo = stageNo;
        this.filePath = filePath;
        this.connections = [];
        this.spawnInstance = null;
        this.terminalInstance = null;
        this.processStatsInstance = null;
        this.cleanupCallbacks = [];
        this._userId = userId;

        this._currentState = Core.stageTests[this.stageNo.toString()].details.map(test => ({
            title: test.title,
            desc: test.desc,
            data: test.data,
            status: TestStatus.Pending,
        }))

    }


    public attachNewSubscriber(connection: Connection): void {
        this.connections.push(connection);
        if (this.terminalInstance)
            this.terminalInstance.attachNewSubscriber(connection);
        if (this.processStatsInstance)
            this.processStatsInstance.attachNewSubscriber(connection);

    }

    public detachSubscriber(connection: Connection): void {
        this.connections = this.connections.filter(value => (value !== connection));
        if (this.terminalInstance)
            this.terminalInstance.detachSubscriber(connection);
        if (this.processStatsInstance)
            this.processStatsInstance.detachSubscriber(connection);

    }

    private emitToAllSockets(event: string, data: any) {

        this.connections.forEach(connection => {
            connection.socket.emit(event, data);
        })
    }

    public async run(): Promise<void> {
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


        this.spawnInstance = await createSpawn(this.filePath);

        const functions = Core.stageTests[this.stageNo.toString()].details.map(test => ({
            fnName: test.fn,
            args: test.args,
        }));


        this.terminalInstance = new TerminalStream(this.spawnInstance);
        this.connections.forEach(connection => this.terminalInstance.attachNewSubscriber(connection))
        this.terminalInstance.run();

        this.processStatsInstance = new ProcessStatsStream(this.spawnInstance)
        this.connections.forEach(connection => this.processStatsInstance.attachNewSubscriber(connection));
        this.processStatsInstance.run();

        for (let i = 0; i < functions.length; i++) {
            const { fnName, args } = functions[i];

            const fn: Function = testFunctions[fnName];
            const { status, data, cleanup } = await fn(...args, this.spawnInstance);

            if (cleanup)
                this.cleanupCallbacks.push(cleanup);

            this._currentState[i].data = data;
            this._currentState[i].status = status;

            this.emitToAllSockets('stage-tests-update', this._currentState);
        }

        this.kill();
    }

    public kill() {
        this._running = false;

        this.spawnInstance.once('close', () => {
            this.terminalInstance.kill();
            this.terminalInstance = null;

            this.processStatsInstance.kill();
            this.processStatsInstance = null;
        })

        this.spawnInstance.kill('SIGINT');

        this.cleanupCallbacks.forEach(callback => callback());

        this.connections.forEach(connection => connection.stageRunner = null);


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