import { Request as Req, Response as Res, NextFunction as NextFn, Request, Response, NextFunction } from "express";

/**
 * Different types of tests that are being done
 */
export enum TestTypes {
    String = "string",
    Cpu = "cpu",
    Mem = "memory",
    Proxy = "proxy",
    Misc = "misc",
};


/**
 * Brief desc and details about each test
 */
export interface TestDetails {
    title: string,
    description: string,
    type: TestTypes,
    example?: Omit<Result, 'type'>,
}

/**
 * Overview on all tests done for each stage
 */
export interface StageDetails {
    description: string,
    numTestCases: number,
    testDetails: TestDetails[],
}


/**
 * type of the result to be sent to the user
 */
export interface Result {
    input: string,
    output?: string,
    expected?: string,
    passed?: boolean,
    type: TestTypes,
}

export interface StageResults {
    numTestCases: number,
    numPassed: number,
    results: Result[];
}

export type AsyncRouteCallback = (req: Request, res: Response, next: NextFunction) => Promise<any>
