import { LOCALHOST } from "../constants";
import { TestFunction } from "../types";
import { Socket } from 'net'
import fs from 'fs';
import path from 'path';
import { cwd } from "process";
import { reverseString } from "../utils/string";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ContainerManager } from "../core/ContainerManager";


/**
 * creates a tcp connection to the tcp server running on the given port
 * sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking
 * waits for 5 seconds, then creates a second connection
 * @param port number
 * @returns 
 */
export const stage8NonBlockingTest: TestFunction = async (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "a client is connected to the server and sends a large file, but does not receive any data from the server.After 30 seconds, a second client is connected to the server, and verifies if the server responds";
    const expectedBehavior = "server should be able to handle multiple connections simultaneously, and should not block on a single connection";
    return new Promise((resolve, _) => {
        const firstClient = new Socket();
        const secondClient = new Socket();

        spawnInstance.on('error', error => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server crashed with error ${error}`
            })
        })


        const connectionFailedHandler = () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Server refused connection",
                cleanup: () => {
                    firstClient.destroy();
                    secondClient.destroy();
                }
            })
        };

        const connectionTimeoutHandler = () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Server connection timeout",
                cleanup: () => {
                    firstClient.destroy();
                    secondClient.destroy();
                }
            })
        }

        firstClient.on('connectionAttemptFailed', connectionFailedHandler);
        secondClient.on('connectionAttemptFailed', connectionFailedHandler);

        firstClient.on('connectionAttemptTimeout', connectionTimeoutHandler);
        secondClient.on('connectionAttemptTimeout', connectionTimeoutHandler);

        firstClient.connect(port, LOCALHOST, () => {
            const file = fs.createReadStream(path.join(cwd(), 'public', '4gb.txt'));
            file.pipe(firstClient);


            const firstClientWaitTimeout = setTimeout(() => {
                secondClient.connect(port, LOCALHOST, () => {
                    const input = "hello world";
                    secondClient.write(input);

                    secondClient.on('data', () => {
                        clearTimeout(secondClientWaitTimeout);
                        firstClient.end();
                        secondClient.end();
                        clearTimeout(firstClientWaitTimeout)

                        return resolve({
                            passed: true,
                            testInput,
                            expectedBehavior,
                            observedBehavior: expectedBehavior
                        })
                    })

                    const secondClientWaitTimeout = setTimeout(() => {
                        clearTimeout(secondClientWaitTimeout);
                        firstClient.end();
                        secondClient.end();
                        file.close();
                        clearTimeout(firstClientWaitTimeout);

                        spawnInstance.kill().then(() => {
                            return resolve({
                                passed: false,
                                testInput,
                                expectedBehavior,
                                observedBehavior: "Server did not respond to the second client within 30s"
                            });
                        })

                    }, 30000);
                })
            }, 5000);

        })
    })
}