import path from "path"
import { spawn } from "child_process";


/**
 * get file path of uploaded file given file name
 * @param fileName : string
 * @returns string
 */
export const getFilePath = (fileName: string): string => {
    return path.join(__dirname, '../..', fileName);
}



export const spawnProcess = (filePath: string) => {
    const child = spawn(filePath);
    return child;
}