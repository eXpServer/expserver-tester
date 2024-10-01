import { Socket, StageTestsInterface, StageTestState, TestStatus } from "../types";
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http'
import { StageWatcher } from "./StageWatcher";
import { StageRunner } from "./StageRunner";
import stageDescription from './stageDescription.json'
import stageTests from './stageTests.json';
import { Express } from "express";
import { TESTER_PORT, WEBSOCKET_PORT } from "../constants";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();



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

    public static stageDescription: any = stageDescription;
    public static stageTests: StageTestsInterface = stageTests;


    public static deleteRunner(stageRunner: StageRunner) {
        Core.runners = Core.runners.filter(runner => (runner !== stageRunner));
    }

    private static findStageRunner(watcher: StageWatcher): StageRunner {
        const { stageNo, userId } = watcher;
        const runner = this.runners.find(runner => {
            console.log("hello1", stageNo, userId)
            console.log("hello2", runner.stageNo, runner.userId);
            return ((runner.userId == userId) && (runner.stageNo == stageNo))
        });
        return runner;
    }

    private static async handleNoExistingRunner(watcher: StageWatcher): Promise<StageTestState> {
        const { stageNo, userId } = watcher;

        const file = await prisma.file.findFirst({
            where: {
                AND: {
                    stageNo,
                    userId,
                }
            }
        })

        const testDetails = Core.stageTests[stageNo.toString()];

        const initalState = testDetails.details.map((test) => ({
            title: test.title,
            desc: test.desc,
            data: test.data,
            status: TestStatus.Pending,
        }))

        if (file) {
            return ({
                binary_uploaded: true,
                running: false,
                current_state: initalState,
            })
        }
        else {
            return ({
                binary_uploaded: false,
                running: false,
                current_state: initalState,
            })
        }
    }

    private static async handleNewSubscriber(runner: StageRunner, watcher: StageWatcher): Promise<StageTestState> {
        runner.attachNewSubscriber(watcher);
        const currentState = runner.currentState;
        watcher.stageRunner = runner;

        return ({
            binary_uploaded: true,
            running: true,
            current_state: currentState,
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
            socket.emit('current-state', currentState);
        }
        else {
            const currentState = await this.handleNoExistingRunner(watcher);
            socket.emit('current-state', currentState);
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
            socket.emit('current-state', currentState);
        }
        else {
            const currentState = await this.handleNoExistingRunner(watcher);
            socket.emit('current-state', currentState);
        }
    }

    private static async handleNewSocketConnection(socket: Socket, stageNo: number, userId: string) {
        if (!socket.watcher)
            await this.handleNewWatcher(socket, stageNo, userId);
        else
            await this.handleExistingWatcher(socket, stageNo);
    }

    private static async handleStartRunner(socket: Socket) {
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
            return socket.emit('no-binary');

        const runner = new StageRunner(
            userId,
            stageNo,
            file.filePath,
        )

        this.runners.push(runner);

        this.watchers.forEach(watcher => {
            if (watcher.userId == userId && watcher.stageNo == stageNo)
                runner.attachNewSubscriber(watcher);
        })

        await runner.run();
    }

    private static handleStopRunner(socket: Socket) {
        const { stageRunner } = socket.watcher;
        if (stageRunner && stageRunner.running) {
            stageRunner.kill();

            Core.runners = Core.runners.filter(runner => (runner !== stageRunner));
        }
    }


    private static handleSocketDisconnected(socket: Socket) {
        const { stageRunner } = socket.watcher;
        stageRunner?.detachSubscriber(socket.watcher);

        Core.watchers = Core.watchers.filter(watcher => (watcher !== socket.watcher));
        socket.watcher = null;
    }


    public static initializeServer = (): void => {
        this.expressApp.listen(TESTER_PORT, () => console.log(`Server running on port ${TESTER_PORT}`));
        this.httpServer.listen(WEBSOCKET_PORT, () => console.log(`Websocket running on port ${WEBSOCKET_PORT}`));

        this.socketIo.on("connection", (socket: Socket) => {
            socket.emit("connection-ack");

            socket.on('request-state', async (data: { stageNo: number, userId: string }) => {
                const { stageNo, userId } = data;
                await this.handleNewSocketConnection(socket, stageNo, userId);
            })

            socket.on('run', () => {
                this.handleStartRunner(socket);
            })

            socket.on('stop', async () => {
                this.handleStopRunner(socket);
            })


            socket.on('disconnect', () => {
                this.handleSocketDisconnected(socket);
            })
        })
    }
}