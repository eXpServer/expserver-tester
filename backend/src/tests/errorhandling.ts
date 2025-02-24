import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { generateRandomStrings, reverseString } from "../utils/string";

export const prematureErrorHandling: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
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

export const finalErrorHandling: TestFunction = (hostPort: number, reverse: boolean, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "client forcefully disconnects";
    const expectedBehavior = "Previous and new clients are able to send and receive output as expected";

    return new Promise((resolve, _) => {
        const existingClient = new Socket();
        const clientToBeDisconnected = new Socket();
        const newClient = new Socket();


        const connectionAttemptFailedCallback = () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server refused connection",
                cleanup: () => {
                    existingClient.destroy();
                    clientToBeDisconnected.destroy();
                    newClient.destroy();
                }
            })
        }

        const connectionTimeoutCallback = () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server connection timed out",
                cleanup: () => {
                    existingClient.destroy();
                    clientToBeDisconnected.destroy();
                    newClient.destroy();
                }
            })
        }

        existingClient.on('connectionAttemptTimeout', connectionTimeoutCallback);
        clientToBeDisconnected.on('connectionAttemptTimeout', connectionTimeoutCallback);
        newClient.on('connectionAttemptTimeout', connectionTimeoutCallback);

        existingClient.on('connectionAttemptFailed', connectionAttemptFailedCallback);
        clientToBeDisconnected.on('connectionAttemptFailed', connectionAttemptFailedCallback);
        newClient.on('connectionAttemptFailed', connectionAttemptFailedCallback);

        spawnInstance.on('close', (code) => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server terminated with Error code ${code || 0}`,
                cleanup: () => {
                    existingClient.destroy();
                    clientToBeDisconnected.destroy();
                    newClient.destroy();
                }
            })

        })

        const createNewClient = () => {
            newClient.connect(port, LOCALHOST, () => {
                const input = generateRandomStrings(10, 1)[0];
                newClient.once('data', (data) => {
                    const output = data.toString();
                    const expected = (reverse
                        ? reverseString(input)
                        : input);

                    if (expected !== output) {
                        return resolve({
                            passed: false,
                            testInput,
                            expectedBehavior,
                            observedBehavior: "new client didn't receive string it expected",
                            cleanup: () => {
                                existingClient.destroy();
                                clientToBeDisconnected.destroy();
                                newClient.destroy();
                            }
                        })
                    }
                    else {
                        return resolve({
                            passed: true,
                            testInput,
                            expectedBehavior,
                            observedBehavior: expectedBehavior,
                            cleanup: () => {
                                existingClient.destroy();
                                clientToBeDisconnected.destroy();
                                newClient.destroy();
                            }
                        })
                    }
                })

                newClient.write(input);
            })
        }

        clientToBeDisconnected.once('close', () => {
            const input = generateRandomStrings(10, 1)[0];
            existingClient.on('data', (data) => {
                const output = data.toString();
                const expected = (reverse
                    ? reverseString(input)
                    : input);

                if (expected !== output) {
                    return resolve({
                        passed: false,
                        testInput,
                        expectedBehavior,
                        observedBehavior: "existing client didn't receive string it expected",
                        cleanup: () => {
                            existingClient.destroy();
                            clientToBeDisconnected.destroy();
                            newClient.destroy();
                        }
                    })
                }
                else
                    createNewClient();
            })

            existingClient.write(input);
        })

        clientToBeDisconnected.connect(port, LOCALHOST, () => {
            existingClient.connect(port, LOCALHOST, () => {
                clientToBeDisconnected.destroy();
            })
        })

    })
}

export const proxyServerCrashHandling: TestFunction = async (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "Client connects to the proxy and sends a request to be relayed to the upstream server"
    const expectedBehavior = "Proxy server shouldn't crash, instead handle the error gracefully"
    await spawnInstance.stopPythonServer();
    return new Promise((resolve, _) => {

        spawnInstance.on('close', (code) => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server terminated with Error code ${code}`,
            })
        })

        fetch(`http://localhost:${port}`).catch(err => {
            if (err.cause?.code == 'UND_ERR_SOCKET') {
                return resolve({
                    passed: true,
                    testInput,
                    expectedBehavior,
                    observedBehavior: "Server terminated client connection without any crashes",
                })
            }
            else {
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: `Server terminated client with error: ${err.code}`
                })
            }
        })
    });
}