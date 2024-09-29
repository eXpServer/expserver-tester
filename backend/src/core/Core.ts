import { Socket } from "../types";
import { Connection } from "./Connection";
import { StageRunner } from "./StageRunner";
import stageDescription from './stageDescription.json'
export class Core {
    public runners: StageRunner[];
    public connections: Connection[];
    public serverSocket: Socket; // rename to socketio
    // http instance

    constructor(serverSocket: Socket) {
        this.runners = [];
        this.connections = [];
        this.serverSocket = serverSocket;
    }

    public static stageDescription: any = stageDescription;

    public start = (): void => {

    }
}