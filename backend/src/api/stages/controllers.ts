import { Core } from '../../core/Core';
import { Request, Response } from '../../types';
import expressAsyncHandler from 'express-async-handler';
import { deleteFile, getFilePath, verifyStageNo } from '../../utils/file';
import { PrismaClient } from '@prisma/client';
import { chmod } from 'fs';
import { FILE_EXECUTABLE_PERMS } from '../../constants';
const prisma = new PrismaClient();

const getStageDescription = expressAsyncHandler(async (req: Request, res: Response) => {
    const stageNo = req.params['num'];

    const stageDescPath = Core.getDescription(stageNo);
    if (!stageDescPath) {
        res.status(404);
        throw new Error("Stage not found");
    }

    res.sendFile(getFilePath(`public/${stageDescPath}`));
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

    const relativePath = req.file.path;
    const absolutePath = getFilePath(relativePath);
    const binaryId = relativePath.split('/').pop();
    const fileName = req.file.originalname;

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
                    binaryId: existingFile.binaryId,
                }
            });
        }

        await prisma.file.create({
            data: {
                filePath: absolutePath,
                binaryId,
                fileName,
                stageNo: parseInt(stageNo),
                userId: req.user,
            }
        })
    }
    catch (error) {
        res.status(500);
        throw new Error("error creating db entry");
    }

    chmod(absolutePath, FILE_EXECUTABLE_PERMS, (err) => {
        if (err)
            return;
    })


    res.status(200).json({
        binaryId: fileName.split('/').pop(),
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
                    binaryId: file.binaryId,
                }
            })
        }
    }
    catch (error) {
        res.status(500);
        throw new Error("Something went wrong");
    }

    res.status(200).json({
        message: `Binary for Stage ${stageNo} deleted successfully.`,
    })
})


export {
    getStageDescription,
    uploadBinaryHandler,
    deleteBinaryHandler,
}