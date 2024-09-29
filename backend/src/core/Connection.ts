import { Socket } from "../types";
import { Core } from "./Core";
import { StageRunner } from "./StageRunner";

export class Connection { // rename
    private core: Core;
    private socket: Socket;
    private stageRunner: StageRunner[]; //can only be subscribed to one at a time

    constructor(core: Core, socket: Socket) {
        this.core = core;
        this.socket = socket;
        this.stageRunner = [];
    }

    public subscribeTo = (stageNo: number): boolean => {
        return true;
    }

    public unsubscribeFrom = (stageNo: number): boolean => {
        return true;
    }
}