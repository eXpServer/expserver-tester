import { Socket } from "net";
import { LOCALHOST } from "../constants";
import { TestFunction } from "../types";
import { generateRandomStrings, reverseString } from "../utils/string";
import { ContainerManager } from "../core/ContainerManager";

export const stringReversal: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    return new Promise((resolve, _) => {

        spawnInstance.on('error', (error) => {
            spawnInstance?.kill();
            resolve({
                passed: false,
                observedBehavior: `server crashed with error ${error}`
            })
        });

        const testStrings = generateRandomStrings(100, 1000);

        const client = new Socket();

        client.on('connectionAttemptFailed', () => {
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "server refused connection",
            })
        })

        client.on('connectionAttemptTimeout', () => {
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "server connection timed out",
            })
        })

        client.on('close', () => {
            client.removeAllListeners();
            spawnInstance?.kill();
            return resolve({
                passed: false,
                observedBehavior: "server connection timed out",
            })
        })

        client.on('error', () => {
            client.destroy();
            spawnInstance?.kill();
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Cannot establish a connection with server",
            })
        })

        const writeToServer = (index: number) => {
            const input = testStrings[index];

            const verifyResultCallback = (data: Buffer) => {

                client.off('data', verifyResultCallback);
                const expected = reverseString(input);
                const output = data.toString();

                if (output !== expected) {
                    client.removeAllListeners();
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
                        client.removeAllListeners();
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

        client.connect(port, spawnInstance.containerName, () => writeToServer(0));

    })
}

export const stringWriteBack: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    return new Promise((resolve, _) => {

        spawnInstance.on('error', (error) => {
            spawnInstance?.kill();
            resolve({
                passed: false,
                observedBehavior: `server crashed with error ${error}`
            })
        });

        const testStrings = generateRandomStrings(100, 1000);

        const client = new Socket();

        client.on('connectionAttemptFailed', () => {
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "server refused connection",
            })
        })

        client.on('connectionAttemptTimeout', () => {
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "server connection timed out",
            })
        })

        client.on('error', () => {
            client.destroy();
            spawnInstance?.kill();
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Cannot establish a connection with server",
            })
        })

        client.on('close', () => {
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Connection terminated / server not running on desired port",
            })
        })


        const writeToServer = (index: number) => {
            const input = testStrings[index];

            const verifyResultCallback = (data: Buffer) => {

                client.off('data', verifyResultCallback);
                const expected = input;
                const output = data.toString();

                if (output !== expected) {
                    client.removeAllListeners();
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
                        client.removeAllListeners();
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

        client.connect(port, spawnInstance.containerName, () => writeToServer(0));

    })
}