import path from "path"
import { Core } from '../core/Core';
import fs from 'fs';

export const getFilePath = (fileName: string): string => {
    return path.join(process.cwd(), fileName);
}

export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    })
}

export const verifyStageNo = (stageNo: string): boolean => {
    const stageNoAsInt = parseInt(stageNo);
    const stageDescription = Core.stageTests[`stage${stageNoAsInt}`];
    return !(isNaN(stageNoAsInt) || !stageDescription[stageNo]);
}