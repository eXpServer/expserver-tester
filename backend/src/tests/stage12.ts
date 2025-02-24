import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { readFileSync } from "fs";

export const stage12FileServerResponse: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "";
    const expectedBehavior = "";
    return new Promise((resolve) => {
        spawnInstance.once('error', (error) => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `server crashed with error ${error}`
            })
        })

        const client = new Socket();
        client.once('connectionAttemptFailed', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server refused connection",
            })
        })

        client.once('connectionAttemptTimeout', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server connection timed out",
            })
        })


        let timeout = null;
        client.on('connect', () => {
            timeout = setTimeout(() => {
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: "Server didn't respond with any data",
                })
            }, 30000);
        })



        const verifyResultCallback = (data: Buffer) => {
            if (timeout !== null)
                clearTimeout(timeout);
            const expectedString = readFileSync(`${process.cwd()}/public/common/sample.txt`, { encoding: 'utf-8' });
            if (data.toString() == expectedString) {
                return resolve({
                    passed: true,
                    testInput,
                    expectedBehavior,
                    observedBehavior: expectedBehavior
                });
            }
            else {
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: `Expected string: ${data.toString()}, received ${expectedString}`
                })
            }
        }

        client.on('data', verifyResultCallback);

        client.connect(port, LOCALHOST);
    });
}