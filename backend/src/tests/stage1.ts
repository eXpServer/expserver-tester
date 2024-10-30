import { Socket } from "net";
import { generateRandomStrings, reverseString } from "../utils/string"
import { TestFunction, TestStatus } from "../types";
import { LOCALHOST } from "../constants";
import { ChildProcessWithoutNullStreams } from "child_process";

export const stage1StringReversal: TestFunction = (port: number) => {
    const testInput = "client sends a randomly generated string to the server";
    const expectedBehavior = "client receives reversed version of the input"
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
                        testInput: input,
                        expectedBehavior: expected,
                        observedBehavior: output,
                        cleanup: () => {
                            client.destroy();
                        },
                    })
                }
                else {
                    if (index == testStrings.length - 1) {
                        return resolve({
                            passed: true,
                            testInput: input,
                            expectedBehavior: expected,
                            observedBehavior: output,
                            cleanup: () => {
                                client.destroy();
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
    const testInput = "Force disconnection of the client";
    const expectedBehavior = "Process exited with code 1";
    return new Promise((resolve, _) => {
        const client = new Socket();

        const closeCallback = (code: number | null) => {

            resolve({
                passed: (code == 1),
                testInput,
                expectedBehavior: expectedBehavior,
                observedBehavior: `Process exited with code ${code || 0}`,
            })
        }

        spawnInstance.on('close', closeCallback);

        client.on('error', () => {
            resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Client disconnected with an error",
                cleanup: () => spawnInstance.off('close', closeCallback),
            })
        });


        client.connect(port, LOCALHOST, () => {
            client.destroy();

            client.on('close', () => {
                const timeout = setTimeout(() => {
                    spawnInstance.off('close', closeCallback);
                    resolve({
                        passed: false,
                        testInput,
                        expectedBehavior: expectedBehavior,
                        observedBehavior: "Process did not exit within 3s",
                        cleanup: () => clearTimeout(timeout),
                    })
                }, 3000);
            })
        });
    })
}