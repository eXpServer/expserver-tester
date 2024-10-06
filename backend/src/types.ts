import { Request as Req, Response as Res, NextFunction as NextFn } from "express";
import { Socket as Soc } from "socket.io";
import { StageWatcher } from "./core/StageWatcher";


export interface ProcessDataInterface {
    cpu: number,
    mem: number,
}

export interface TestDetails {
    title: string,
    description: string,
    testInput: string | null,
    expectedBehavior: string | null,
    observedBehavior: string | null,
    status: TestStatus;
}

export interface Test {
    title: string,
    description: string,
    testInput?: string,
    expectedBehavior: string | null,
    status: TestStatus;
    testFunction: TestFunction;
}

export type TestFunction = (...args: any[]) => Promise<{
    passed: boolean,
    observedBehavior: string,
    cleanup?: () => void,
}>

export interface TestState {
    binaryId: string | null,
    running: boolean,
    testDetails: TestDetails[]
}

export enum TestStatus {
    Pending = "pending",
    Running = "running",
    Passed = "passed",
    Failed = "failed",
}

export interface StageTest {
    [stageNo: string]: {
        stageName: string,
        descriptionFilePath: string,
        tests: Test[];
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
    watcher?: StageWatcher
};