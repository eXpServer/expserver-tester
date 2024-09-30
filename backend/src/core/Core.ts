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

    public static findStageRunner(connection: Connection): StageRunner {
        const { stageNo, userId } = connection;
        const runner = this.runners.find(runner => {
            return ((runner.userId == userId) && (runner.stageNo == stageNo))
        });
        return runner;
    }

    public static async handleNoExistingRunner(connection: Connection): Promise<StageTestState> {
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

    public static async handleNewSubscriber(runner: StageRunner, connection: Connection): Promise<StageTestState> {
        runner.attachNewSubscriber(connection);

        const currentState = runner.currentState;

        return ({
            binary_uploaded: true,
            running: true,
            current_state: currentState,
        })
    }


    public static initializeServer = (): void => {
        this.expressApp.listen(TESTER_PORT, () => console.log(`Server running on port ${TESTER_PORT}`));
        this.httpServer.listen(WEBSOCKET_PORT, () => console.log(`Websocket running on port ${WEBSOCKET_PORT}`));

        this.socketIo.on("connection", (socket: Socket) => {
            socket.emit("connection-ack");

            socket.on('connection-re-ack', async (data: { stageNo: number, userId: string }) => {

                // create a new connection instance and store necessory data
                const { stageNo, userId } = data;
                const connection = new Connection(socket, userId);
                socket.connection = connection;
                connection.changeListeningStage(stageNo);

                this.connections.push(connection);

                // find a stagerunner if existing
                const runner = this.findStageRunner(connection);

                if (!runner) {
                    const currentState = await this.handleNoExistingRunner(connection);
                    socket.emit('current-state', currentState);

                }
                else {
                    const currentState = await this.handleNewSubscriber(runner, connection);
                    socket.emit('current-state', currentState);
                }
            })

            socket.on('run', async () => {
                const { stageNo, userId } = socket.connection;
                const file = await prisma.file.findFirst({
                    where: {
                        AND: {
                            stageNo,
                            userId,
                        }
                    }
                })

                if (!file) {
                    return;
                }
                const runner = new StageRunner(
                    userId,
                    stageNo,
                    file.filePath,
                )
                this.runners.push(runner);
                const currentState = await this.handleNewSubscriber(runner, socket.connection);
                socket.emit('current-state', currentState);
            })

            socket.on('disconnect', () => {
                if (!socket.connection)
                    return;

                const connection = socket.connection;
                const runner = connection.stageRunner;
                if (runner) {
                    runner.detachSubscriber(connection);
                }
            })
        })
    }
}