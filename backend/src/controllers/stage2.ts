import { Request, Response } from 'express';
import { StageDetails, TestTypes } from "../types"
import { getFilePath } from '../utils/process';
import { clientTestCases, stringTestCases } from '../tests';
import expressAsyncHandler from 'express-async-handler';
import { SERVER_PORT_TEMP } from '../constants';

const getHandler = (req: Request, res: Response) => {
    const stageDetails: StageDetails = {
        description: "The tests of this stage verifies whether your client code creates a connection with our mock server, takes input properly, etc",
        numTestCases: 11,
        testDetails: [
            {
                title: "I/O",
                description: "tests if the client properly sends the string given to it via terminal input and if it receives the reply from the server",
                type: TestTypes.String,
                example: {
                    input: "qwertyuiop",
                    output: "n/a",
                },
            },
            {
                title: "Smooth exit",
                description: "Tests if the client code exits smoothly without any seg faults, errors, etc",
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
        const result = await clientTestCases(filePath);
        const testResult = result.results;
        // testResult.push({
        //     input: "Closing client connection",
        //     expected: "Exit Code 0",
        //     output: "Exit Code 0",
        //     passed: true,
        //     type: TestTypes.Misc,
        // })
        res.status(200).json(testResult);
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