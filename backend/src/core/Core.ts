import { Socket, StageTest, TestDetails, Test, TestState, TestStatus } from "../types";
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http'
import { StageWatcher } from "./StageWatcher";
import { StageRunner } from "./StageRunner";
import { Express } from "express";
import { TESTER_PORT, WEBSOCKET_PORT } from "../constants";
import { PrismaClient } from "@prisma/client";
import { tests } from "../tests";
const prisma = new PrismaClient();

enum EmitEvents {
    CurrentState = 'current-state',
    NoBinary = 'no-binary',
    ConnectionAck = 'connection-ack',
}

enum ReceiveEvents {
    Connection = 'connection',
    RequestState = 'request-state',
    Run = 'run',
    Stop = 'stop',
    Disconnect = 'disconnect',
}

export class Core {
    public static runners: StageRunner[];
    public static watchers: StageWatcher[];
    public static httpServer: HttpServer;
    public static socketIo: Server;
    public static expressApp: Express;


    public static iniitialize(httpServer: HttpServer, socketIo: Server, expressApp: Express) {
        Core.runners = [];
        Core.watchers = [];
        Core.httpServer = httpServer;
        Core.socketIo = socketIo;
        Core.expressApp = expressApp;

        Core.initializeServer()
    }

    private static stageTests: StageTest = tests;


    public static deleteRunner(stageRunner: StageRunner) {
        Core.runners = Core.runners.filter(runner => (runner !== stageRunner));
    }

    private static findStageRunner(watcher: StageWatcher): StageRunner {
        const { stageNo, userId } = watcher;
        const runner = this.runners.find(runner => {
            return ((runner.userId == userId) && (runner.stageNo == stageNo))
        });
        return runner;
    }

    private static async handleNoExistingRunner(watcher: StageWatcher): Promise<TestState> {
        const { stageNo, userId } = watcher;

        const file = await prisma.file.findFirst({
            where: {
                AND: {
                    stageNo,
                    userId,
                }
            }
        })


        const runner = new StageRunner(
            userId,
            stageNo,
            file,
        )

        this.runners.push(runner);

        const testDetails = this.getTests(stageNo);
        if (!testDetails) {
            return ({
                binaryId: null,
                fileName: null,
                running: false,
                testDetails: [],
            })
        }

        const previousResult = await runner.fetchPreviousData();
        if (previousResult) {
            return ({
                binaryId: file?.binaryId || null,
                fileName: file?.fileName || null,
                running: false,
                timeTaken: previousResult.timeTaken,
                testDetails: testDetails.map<TestDetails>((test, index) => ({
                    title: test.title,
                    description: test.description,
                    testInput: test.testInput,
                    expectedBehavior: test.expectedBehavior,
                    observedBehavior: previousResult.testDetails[index].observedBehavior,
                    status: previousResult.testDetails[index].status,
                }))
            })
        }


        return ({
            binaryId: file?.binaryId || null,
            fileName: file?.fileName || null,
            running: false,
            testDetails: testDetails.map<TestDetails>(test => ({
                title: test.title,
                description: test.description,
                testInput: test.testInput,
                expectedBehavior: test.expectedBehavior,
                observedBehavior: null,
                status: TestStatus.Pending,
            }))

        })
    }

    private static async handleNewSubscriber(runner: StageRunner, watcher: StageWatcher): Promise<TestState> {
        runner.attachNewSubscriber(watcher);
        const currentState = runner.currentState;
        watcher.stageRunner = runner;

        const previousResult = await runner.fetchPreviousData();
        if (previousResult) {
            return ({
                binaryId: runner.binaryId,
                fileName: runner.fileName,
                running: false,
                timeTaken: previousResult.timeTaken,
                testDetails: currentState.map<TestDetails>((test, index) => ({
                    title: test.title,
                    description: test.description,
                    testInput: test.testInput,
                    expectedBehavior: test.expectedBehavior,
                    observedBehavior: previousResult.testDetails[index].observedBehavior,
                    status: previousResult.testDetails[index].status,
                }))
            })
        }


        return ({
            binaryId: runner.binaryId,
            fileName: runner.fileName,
            running: runner.running,
            testDetails: currentState,
        })
    }

    private static async handleNewWatcher(socket: Socket, stageNo: number, userId: string) {
        const watcher = new StageWatcher(socket, userId);
        socket.watcher = watcher;

        watcher.changeListeningStage(stageNo);
        this.watchers.push(watcher);

        const runner = this.findStageRunner(watcher);
        if (runner) {
            const currentState = await this.handleNewSubscriber(runner, watcher);
            socket.emit(EmitEvents.CurrentState, currentState);
        }
        else {
            const currentState = await this.handleNoExistingRunner(watcher);
            socket.emit(EmitEvents.CurrentState, currentState);
        }
    }

    private static async handleExistingWatcher(socket: Socket, stageNo: number) {
        const watcher = socket.watcher;

        const prevRunner = watcher.stageRunner;
        if (prevRunner) {
            prevRunner.detachSubscriber(watcher);
        }

        watcher.changeListeningStage(stageNo);
        const newRunner = this.findStageRunner(watcher);
        if (newRunner) {
            const currentState = await this.handleNewSubscriber(newRunner, watcher);
            socket.emit(EmitEvents.CurrentState, currentState);
        }
        else {
            const currentState = await this.handleNoExistingRunner(watcher);
            socket.emit(EmitEvents.CurrentState, currentState);
        }
    }

    private static async handleRequestState(socket: Socket, stageNo: number, userId: string) {
        if (!socket.watcher)
            await this.handleNewWatcher(socket, stageNo, userId);
        else
            await this.handleExistingWatcher(socket, stageNo);
    }

    private static async handleStartRunner(socket: Socket) {
        if (!socket.watcher)
            return;
        const { userId, stageNo } = socket.watcher;
        const file = await prisma.file.findFirst({
            where: {
                AND: {
                    userId,
                    stageNo,
                }
            }
        })

        if (!file)
            return socket.emit(EmitEvents.NoBinary);

        const runner = this.findStageRunner(socket.watcher);

        this.watchers.forEach(watcher => {
            if (watcher.userId == userId && watcher.stageNo == stageNo) {
                watcher.stageRunner = runner;
                runner.attachNewSubscriber(watcher);
            }
        })

        await runner.run();
    }

    private static handleStopRunner(socket: Socket) {
        if (!socket.watcher)
            return;
        const { stageRunner } = socket.watcher;
        if (stageRunner && stageRunner.running) {
            stageRunner.kill(true);

            Core.runners = Core.runners.filter(runner => (runner !== stageRunner));
        }
    }


    private static handleSocketDisconnected(socket: Socket) {
        if (!socket.watcher)
            return;
        const { stageRunner } = socket.watcher;
        stageRunner?.detachSubscriber(socket.watcher);

        Core.watchers = Core.watchers.filter(watcher => (watcher !== socket.watcher));
        socket.watcher = null;
    }


    public static initializeServer = (): void => {
        this.expressApp.listen(TESTER_PORT, () => console.log(`Server running on port ${TESTER_PORT}`));
        this.httpServer.listen(WEBSOCKET_PORT, () => console.log(`Websocket running on port ${WEBSOCKET_PORT}`));

        this.socketIo.on(ReceiveEvents.Connection, (socket: Socket) => {
            socket.emit(EmitEvents.ConnectionAck);
            socket.on(ReceiveEvents.RequestState, (data: { stageNo: number, userId: string }) => {
                const { stageNo, userId } = data;
                void this.handleRequestState(socket, stageNo, userId);
            })

            socket.on(ReceiveEvents.Run, () => {
                void this.handleStartRunner(socket);
            })

            socket.on(ReceiveEvents.Stop, () => {
                void this.handleStopRunner(socket);
            })


            socket.on(ReceiveEvents.Disconnect, () => {
                this.handleSocketDisconnected(socket);
            })
        })
    }


    public static getDescription(stageNo: number | string): string | null {
        if (!this.stageTests[`stage${stageNo}`])
            return null;

        return this.stageTests[`stage${stageNo}`].descriptionFilePath;
    }

    public static getTests(stageNo: number | string): Test[] | null {
        if (!this.stageTests[`stage${stageNo}`])
            return null;

        return this.stageTests[`stage${stageNo}`].tests.map(test => ({ ...test, status: TestStatus.Pending }));
    }


    public static requiresDummyServer(stageNo: number | string): boolean {
        if (!this.stageTests[`stage${stageNo}`])
            return false;

        return this.stageTests[`stage${stageNo}`].requiresDummyServer;
    }

    public static requiresXpsConfig(stageNo: number | string): boolean {
        if (!this.stageTests[`stage${stageNo}`])
            return false;

        return !!this.stageTests[`stage${stageNo}`].requiresXpsConfig;
    }

    public static getPublicPath(stageNo: number | string): string {
        if (!this.stageTests[`stage${stageNo}`])
            return 'common';
        const customFilePath = this.stageTests[`stage${stageNo}`].customPublicPath
        return customFilePath
            ? customFilePath
            : 'common'
    }
}