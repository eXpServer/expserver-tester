import { Core } from '../../core/Core';
import { Request, Response } from '../../types';
import expressAsyncHandler from 'express-async-handler';
import { deleteFile, getFilePath, verifyStageNo } from '../../utils/file';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getStageDescription = expressAsyncHandler(async (req: Request, res: Response) => {
    const stageNo = req.params['num'];
    if (!verifyStageNo(stageNo)) {
        res.status(404);
        throw new Error("Stage not found");
    }

    const stageDescription = Core.stageDescription;
    res.status(200).json(stageDescription[stageNo]);
})


/**
 * 
 */
const uploadBinaryHandler = expressAsyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400);
        throw new Error("File not found");
    }

    const stageNo = req.params['num'];
    if (!verifyStageNo(stageNo)) {
        res.status(400);
        throw new Error("Stage not found");
    }

    const fileName = req.file.path;
    const filePath = getFilePath(fileName);

    try {
        const existingFile = await prisma.file.findFirst({
            where: {
                AND: {
                    stageNo: parseInt(stageNo),
                    userId: req.user,
                }
            }
        })

        if (existingFile) {
            await deleteFile(existingFile.filePath);

            await prisma.file.delete({
                where: {
                    id: existingFile.id,
                }
            });
        }

        await prisma.file.create({
            data: {
                filePath,
                stageNo: parseInt(stageNo),
                userId: req.user,
            }
        })
    }
    catch (error) {
        res.status(500);
        throw new Error("error creating db entry");
    }


    res.status(200).json({
        fileName,
        stageNo,
    })
})

const deleteBinaryHandler = expressAsyncHandler(async (req: Request, res: Response) => {
    const stageNo = req.params['num'];
    if (!verifyStageNo(stageNo)) {
        res.status(400);
        throw new Error("Stage not found");
    }

    try {
        const file = await prisma.file.findFirst({
            where: {
                AND: {
                    stageNo: parseInt(stageNo),
                    userId: req.user,
                }
            }
        })

        if (!file) {
            res.status(200).json({
                message: "already deleted",
            })
        }
        else {
            const filePath = file.filePath;
            await deleteFile(filePath);

            await prisma.file.delete({
                where: {
                    id: file.id,
                }
            })
        }
    }
    catch (error) {
        res.status(500);
        throw new Error("Something went wrong");
    }

    res.status(200).json({
        message: "deleted successfully",
    })
})

const runHandler = expressAsyncHandler(async (req: Request, res: Response) => {
    // const stageNo = req.params['num'];
    // if (!verifyStageNo(stageNo)) {
    //     res.status(400);
    //     throw new Error("Stage error");
    // }


    // const file = await prisma.file.findFirst({
    //     where: {
    //         AND: {
    //             userId: req.user,
    //             stageNo: parseInt(stageNo),
    //         }
    //     }
    // })

    // if (file) {
    // }
})

const stopHandler = expressAsyncHandler(async (req: Request, res: Response) => {

})


export {
    getStageDescription,
    uploadBinaryHandler,
    deleteBinaryHandler,
    runHandler,
    stopHandler,
}