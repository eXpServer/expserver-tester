import { Socket } from "../types";
import { Core } from "./Core";
import { StageRunner } from "./StageRunner";

export class Connection { // rename
    private _socket: Socket;
    private _stageRunner: StageRunner;
    private _stageNo: number;
    private _userId: string;

    get stageNo() {
        return this._stageNo;
    }

    get userId() {
        return this._userId;
    }

    get socket() {
        return this._socket;
    }

    constructor(socket: Socket, userId: string) {
        this._socket = socket;
        this._userId = userId;
    }

    public changeListeningStage(stageNo: number) {
        this._stageNo = stageNo;
    }

    get stageRunner() {
        return this._stageRunner;
    }

    public updateStageRunner(runner: StageRunner) {
        if (runner.stageNo != this._stageNo)
            throw new Error("INCORRECT stage runner mapping");

        this._stageRunner = this.stageRunner;
    }
}