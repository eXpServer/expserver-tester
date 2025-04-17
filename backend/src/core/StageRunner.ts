import { StageWatcher } from "./StageWatcher";
import { Core } from "./Core";
import { TerminalStream } from "./TerminalStream";
import { type TestDetails, TestFunction, TestStatus } from "../types";
import { ResourceMonitor } from "./ResrouceMonitor";
import { ContainerManager } from "./ContainerManager";
import { File, PrismaClient } from "@prisma/client";
import { Timer } from "./Timer";

const prisma = new PrismaClient()

enum StageRunnerEvents {
    TEST_STARTED = 'stage-tests-start',
    TEST_UPDATE = 'stage-tests-update',
    TEST_COMPLETE = 'stage-tests-complete',
    FORCE_QUIT = 'stage-tests-force-quit',
}

export class StageRunner {
    private watchers: StageWatcher[];
    private file: File;
    private containerInstance: ContainerManager | null;
    private terminalInstance: TerminalStream | null;
    private processStatsInstance: ResourceMonitor | null;
    private timerInstance: Timer | null;
    private _stageNo: number;
    private _userId: string;
    private _running: boolean;

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
        return this.file.filePath || null;
    }

    get fileName() {
        return this.file.fileName || null;
    }

    get binaryId() {
        return this.file.binaryId || null;
    }

    private _currentState: TestDetails[];

    get currentState() {
        return this._currentState;
    }


    constructor(userId: string, stageNo: number, file: File) {
        this._stageNo = stageNo;
        this.file = file;
        this.watchers = [];
        this.containerInstance = new ContainerManager(
            `container-${file.binaryId}`,
            file.binaryId,
            Core.requiresXpsConfig(stageNo),
            Core.getPublicPath(stageNo),
        );
        this.terminalInstance = new TerminalStream(
            this.containerInstance,
            this.emitterCallback
        );
        this.processStatsInstance = new ResourceMonitor(
            this.containerInstance,
            this.emitterCallback
        );
        this.timerInstance = new Timer(
            this.containerInstance,
            this.emitterCallback,
        )
        this._userId = userId;

        this._currentState = Core.getTests(stageNo).map(test => ({
            title: test.title,
            description: test.description,
            testInput: test.testInput,
            expectedBehavior: test.expectedBehavior,
            observedBehavior: test.expectedBehavior,
            status: TestStatus.Pending,
        }))
    }



    public async fetchPreviousData(): Promise<{ timeTaken: number, testDetails: Omit<TestDetails, 'description' | 'title'>[] }> {
        const result = await prisma.testResults.findUnique({
            where: {
                userId_stageNo: {
                    stageNo: this.stageNo,
                    userId: this.userId,
                }
            },

            include: {
                testDetails: true
            }
        });

        if (!result)
            return null;
        return {
            timeTaken: result.timeTaken,
            testDetails: result.testDetails.map((test, index) => ({
                testInput: test.testInput,
                expectedBehavior: test.expectedBehaviour,
                observedBehavior: test.observedBehaviour,
                status: test.status as TestStatus,
            }))
        }
    }

    public async storePreviousData(): Promise<void> {
        await prisma.$transaction([
            prisma.testResults.deleteMany({
                where: {
                    userId: this.userId,
                    stageNo: this.stageNo
                }
            }),
            prisma.testResults.create({
                data: {
                    userId: this.userId,
                    stageNo: this.stageNo,
                    timeTaken: this.timerInstance.currentTime,
                    testDetails: {
                        create: this._currentState.map(test => ({
                            testInput: test.testInput,
                            expectedBehaviour: test.expectedBehavior,
                            observedBehaviour: test.observedBehavior,
                            status: test.status,
                        }))
                    }
                }
            })
        ]);
    }


    public async attachNewSubscriber(watcher: StageWatcher) {
        this.watchers.push(watcher);
    }

    public detachSubscriber(watcher: StageWatcher): void {
        this.watchers = this.watchers.filter(value => (value !== watcher));
    }

    private emitToAllSockets(event: string, data: any) {

        this.watchers.forEach(watcher => {
            watcher.emit(event, data); // do watcher.emit()
        })
    }

    private emitterCallback = (event: string, data: any) => {
        this.emitToAllSockets(event, data);
    }

    private containerWarmUp() {
        return new Promise(async (resolve, reject) => {
            this.terminalInstance.kill();
            this.processStatsInstance.kill();
            await this.containerInstance.kill();
            await this.containerInstance.start();
            if (this.containerInstance.running == false)
                return reject(false);
            this.terminalInstance.run();
            this.processStatsInstance.run();
            return resolve(true);
        })
    }


    private runTest = async (func: TestFunction, index: number) => {
        try {
            await this.containerWarmUp();
        }
        catch (error) {
            console.log(error)
            this._currentState[index].observedBehavior = "Server didn't start up as expected, ensure it has been compiled with the provided Dockerfile and is of an appropriate stage"
            this._currentState[index].status = TestStatus.Failed;
            this.emitToAllSockets(StageRunnerEvents.TEST_UPDATE, this.currentState);
            return;
        }

        const { passed, testInput, expectedBehavior, observedBehavior, cleanup } = await func(this.containerInstance);

        if (testInput)
            this._currentState[index].testInput = testInput;
        if (expectedBehavior)
            this._currentState[index].expectedBehavior = expectedBehavior;
        if (observedBehavior)
            this._currentState[index].observedBehavior = observedBehavior;
        this._currentState[index].status = (passed
            ? TestStatus.Passed
            : TestStatus.Failed
        );


        if (cleanup)
            cleanup();

        this.emitToAllSockets(StageRunnerEvents.TEST_UPDATE, this.currentState);
    }

    public async run() {
        this._running = true;
        this._currentState = this._currentState.map(value => ({
            ...value,
            status: TestStatus.Running,
        }))
        this.timerInstance?.run();
        this.emitToAllSockets(StageRunnerEvents.TEST_STARTED, this.currentState);

        const functions = Core.getTests(this._stageNo).map(test => test.testFunction);
        for (let i = 0; i < functions.length; i++) {
            await this.runTest(functions[i], i);
        }



        if (this.running)
            this.kill();
    }

    public async kill(forced?: boolean) {
        this._running = false;
        this.terminalInstance?.kill();
        this.processStatsInstance?.kill();
        this.timerInstance?.kill();
        await this.containerInstance.kill();

        this.containerInstance = null;
        this.watchers.forEach(watcher => watcher.stageRunner = null);

        await this.storePreviousData();

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