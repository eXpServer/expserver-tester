import { Core } from '../core/Core';
import { Request, Response } from '../types';
import expressAsyncHandler from 'express-async-handler';

const getStageDescription = expressAsyncHandler(async (req: Request, res: Response) => {

    const stageNo = req.params['num'];

    const stageDescription = Core.stageDescription;

    const stageNoAsInt = parseInt(stageNo);
    if (isNaN(stageNoAsInt) || !stageDescription[stageNo]) {
        res.status(400);
        throw new Error("Stage not found");
    }

    res.status(200).json(stageDescription[stageNo]);
})

const uploadBinaryHandler = async (req: Request, res: Response) => {
    if (req.file)
}

const deleteBinaryHandler = async (req: Request, res: Response) => {

}

const runHandler = async (req: Request, res: Response) => {

}

const stopHandler = async (req: Request, res: Response) => {

}


export {
    getStageDescription,
    uploadBinaryHandler,
    deleteBinaryHandler,
    runHandler,
    stopHandler,
}