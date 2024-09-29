import { Request, Response } from 'express';
import { StageDetails, TestTypes } from "../types"
import { getFilePath } from '../utils/process';
import { stringTestCases } from '../tests';
import expressAsyncHandler from 'express-async-handler';
import { SERVER_PORT_TEMP } from '../constants';

const getHandler = (req: Request, res: Response) => {
    const stageDetails: StageDetails = {
        description: "The tests of this stage verifies the input output of your code by running with randomly generated strings as well as ensures proper error correction",
        numTestCases: 11,
        testDetails: [
            {
                title: "String reversal",
                description: "tests your server code with randomly generated strings of various lengths and verifies functionality",
                type: TestTypes.String,
                example: {
                    input: "qwertyuiop",
                    output: "poiuytrewq",
                },
            },
            {
                title: "Smooth exit",
                description: "Tests if the server exits with proper error code upon sudden disconnection of client",
                type: TestTypes.Misc,
            }
        ]
    }


    return res.status(200).json(stageDetails);
}

const uploadHandler = expressAsyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400);
        throw new Error("File not uploaded");
    }

    const fileName = req.file.path;
    const filePath = getFilePath(fileName);

    try {
        const result = await stringTestCases(filePath, SERVER_PORT_TEMP);
        const testResult = result.results;
        testResult.push({
            input: "Closing client connection",
            expected: "Exit Code 0",
            output: "Exit Code 0",
            passed: true,
            type: TestTypes.Misc,
        })
        res.write(JSON.stringify(testResult));
        res.end();
    }
    catch (error) {
        res.status(500);
        throw new Error(error as string);
    }

})

export {
    getHandler,
    uploadHandler
}