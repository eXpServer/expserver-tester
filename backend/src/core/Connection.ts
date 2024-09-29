import { Socket } from "../types";
import { Core } from "./Core";
import { StageRunner } from "./StageRunner";

export class Connection {
    private core: Core;
    private socket: Socket;
    private publishers: StageRunner[];

    constructor(core: Core, socket: Socket) {
        this.core = core;
        this.socket = socket;
        this.publishers = [];
    }

    public subscribeTo = (stageNo: number): boolean => {
        return true;
    }

    public unsubscribeFrom = (stageNo: number): boolean => {
        return true;
    }
}