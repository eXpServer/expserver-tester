import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { chmod } from "fs";
import { FILE_EXECUTABLE_PERMS } from "../constants";
export const createSpawn = async (filePath: string): Promise<ChildProcessWithoutNullStreams> => {
    return new Promise((resolve, reject) => {
        chmod(filePath, FILE_EXECUTABLE_PERMS, (err) => {
            if (err)
                return reject(err);
            const child = spawn(filePath);
            child.on('spawn', () => {
                return resolve(child);
            })
        })

    })
}

export const deleteSpawn = (spawnInstance: ChildProcessWithoutNullStreams): void => {
    if (spawnInstance.killed)
        return;

    spawnInstance.kill("SIGINT");
}