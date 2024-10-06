import { Socket } from "net";
import { generateRandomStrings, reverseString } from "../utils/string"
import { TestFunction, TestStatus } from "../types";
import { LOCALHOST } from "../constants";
import { ChildProcessWithoutNullStreams } from "child_process";

export const stage1StringReversal: TestFunction = (port: number) => {
    return new Promise((resolve, _) => {
        const testStrings = generateRandomStrings(100, 1000);

        const client = new Socket();

        const writeToServer = (index: number) => {
            const input = testStrings[index];

            const verifyResultCallback = (data: Buffer) => {

                client.off('data', verifyResultCallback);
                const expected = reverseString(input);
                const output = data.toString();

                if (output !== expected) {
                    return resolve({
                        passed: false,
                        observedBehavior: output,
                        cleanup: () => {
                            client.end();
                        },
                    })
                }
                else {
                    if (index == testStrings.length - 1) {
                        return resolve({
                            passed: true,
                            observedBehavior: output,
                            cleanup: () => {
                                client.end();
                            },
                        })
                    }
                    else {
                        return writeToServer(index + 1);
                    }
                }

            }


            client.on('data', verifyResultCallback);
            client.write(input);
        }

        client.connect(port, LOCALHOST, () => writeToServer(0));

    })
}

export const stage1ErrorChecking: TestFunction = (port: number, spawnInstance: ChildProcessWithoutNullStreams) => {
    return new Promise((resolve, _) => {
        const client = new Socket();

        spawnInstance.once('close', (code) => {
            console.log('exited with code ' + code);

            resolve({
                passed: (code == 1),
                observedBehavior: `Process exited with code ${code || 0}`,
            })
        })


        client.connect(port, LOCALHOST, () => client.end());
    })
}