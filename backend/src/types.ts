import { Request as Req, Response as Res, NextFunction as NextFn } from "express";
import { Socket as Soc } from "socket.io";
import { Connection } from "./core/Connection";


export interface ProcessDataInterface {
    cpu: number,
    mem: number,
}

export interface ResultInterface {
    title: string,
    desc: string,
    data?: {
        input?: string,
        output?: string,
        expected?: string,
    },
    status: TestStatus,

}

export interface TestDetails {
    title: string,
    desc: string,
    fn: string,
    args?: any[],
    data?: { input?: string, expected?: string, output?: string }
}

export interface StageTestState {
    binary_uploaded: boolean,
    running: boolean,
    current_state: ResultInterface[]
}

export enum TestStatus {
    Pending = "pending",
    Running = "running",
    Passed = "passed",
    Failed = "failed",
}

export interface StageTestsInterface {
    [stageNo: string]: {
        numTestCases: number,
        details: TestDetails[],
    }
}


export type Request = Req & {
    user: string,
    file: {
        path: string,
    }
};
export type Response = Res;
export type NextFunction = NextFn;

export type Socket = Soc & {
    connection?: Connection
};