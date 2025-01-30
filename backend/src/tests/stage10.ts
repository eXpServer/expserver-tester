import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction } from "../types";
import { generateRandomStrings } from "../utils/string";
import { LOCALHOST } from "../constants";

export const stage10StringWriteBack: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "client sends a randomly generated string to the server";
    const expectedBehavior = "client receives the same string that was sent as input"
    return new Promise((resolve, _) => {

        spawnInstance.on('error', (error) => {
            resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `server crashed with error ${error}`
            })
        });

        const testStrings = generateRandomStrings(100, 1000);

        const client = new Socket();

        client.on('connectionAttemptFailed', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server refused connection",
            })
        })

        client.on('connectionAttemptTimeout', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server connection timed out",
            })
        })

        const writeToServer = (index: number) => {
            const input = testStrings[index];

            const verifyResultCallback = (data: Buffer) => {

                client.off('data', verifyResultCallback);
                const expected = input;
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
