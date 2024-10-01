import { Socket, StageTestsInterface, StageTestState, TestStatus } from "../types";
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http'
import { Connection } from "./Connection";
import { StageRunner } from "./StageRunner";
import stageDescription from './stageDescription.json'
import stageTests from './stageTests.json';
import { Express } from "express";
import { TESTER_PORT, WEBSOCKET_PORT } from "../constants";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();



export class Core {
    public static runners: StageRunner[];
    public static connections: Connection[];
    public static httpServer: HttpServer;
    public static socketIo: Server;
    public static expressApp: Express;


    public static iniitialize(httpServer: HttpServer, socketIo: Server, expressApp: Express) {
        Core.runners = [];
        Core.connections = [];
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

    private static findStageRunner(connection: Connection): StageRunner {
        const { stageNo, userId } = connection;
        const runner = this.runners.find(runner => {
            console.log("hello1", stageNo, userId)
            console.log("hello2", runner.stageNo, runner.userId);
            return ((runner.userId == userId) && (runner.stageNo == stageNo))
        });
        return runner;
    }

    private static async handleNoExistingRunner(connection: Connection): Promise<StageTestState> {
        const { stageNo, userId } = connection;

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

    private static async handleNewSubscriber(runner: StageRunner, connection: Connection): Promise<StageTestState> {
        runner.attachNewSubscriber(connection);
        const currentState = runner.currentState;
        connection.stageRunner = runner;

        return ({
            binary_uploaded: true,
            running: true,
            current_state: currentState,
        })
    }

    private static async handleNewConnection(socket: Socket, stageNo: number, userId: string) {
        const connection = new Connection(socket, userId);
        socket.connection = connection;

        connection.changeListeningStage(stageNo);
        this.connections.push(connection);

        const runner = this.findStageRunner(connection);
        if (runner) {
            const currentState = await this.handleNewSubscriber(runner, connection);
            socket.emit('current-state', currentState);
        }
        else {
            const currentState = await this.handleNoExistingRunner(connection);
            socket.emit('current-state', currentState);
        }
    }

    private static async handleExistingConnection(socket: Socket, stageNo: number) {
        const connection = socket.connection;

        const prevRunner = connection.stageRunner;
        if (prevRunner) {
            prevRunner.detachSubscriber(connection);
        }

        connection.changeListeningStage(stageNo);
        const newRunner = this.findStageRunner(connection);
        if (newRunner) {
            const currentState = await this.handleNewSubscriber(newRunner, connection);
            socket.emit('current-state', currentState);
        }
        else {
            const currentState = await this.handleNoExistingRunner(connection);
            socket.emit('current-state', currentState);
        }
    }

    private static async handleConnection(socket: Socket, stageNo: number, userId: string) {
        if (!socket.connection)
            await this.handleNewConnection(socket, stageNo, userId);
        else
            await this.handleExistingConnection(socket, stageNo);
    }

    private static async handleRun(socket: Socket) {
        const { userId, stageNo } = socket.connection;
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

        this.connections.forEach(connection => {
            if (connection.userId == userId && connection.stageNo == stageNo)
                runner.attachNewSubscriber(connection);
        })

        await runner.run();
    }

    private static handleStop(socket: Socket) {
        const { stageRunner } = socket.connection;
        if (stageRunner && stageRunner.running) {
            stageRunner.kill();

            Core.runners = Core.runners.filter(runner => (runner !== stageRunner));
        }
    }


    private static handleDisconnect(socket: Socket) {
        const { stageRunner } = socket.connection;
        stageRunner?.detachSubscriber(socket.connection);

        Core.connections = Core.connections.filter(connection => (connection !== socket.connection));
        socket.connection = null;
    }


    public static initializeServer = (): void => {
        this.expressApp.listen(TESTER_PORT, () => console.log(`Server running on port ${TESTER_PORT}`));
        this.httpServer.listen(WEBSOCKET_PORT, () => console.log(`Websocket running on port ${WEBSOCKET_PORT}`));

        this.socketIo.on("connection", (socket: Socket) => {
            socket.emit("connection-ack");

            socket.on('request-state', async (data: { stageNo: number, userId: string }) => {
                const { stageNo, userId } = data;
                await this.handleConnection(socket, stageNo, userId);
            })

            socket.on('run', () => {
                this.handleRun(socket);
            })

            socket.on('stop', async () => {
                this.handleStop(socket);
            })


            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            })
        })
    }
}