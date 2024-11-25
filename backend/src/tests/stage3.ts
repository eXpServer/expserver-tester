import { Socket } from "net";
import { generateRandomStrings, reverseString } from "../utils/string";
import { TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { ChildProcessWithoutNullStreams } from "child_process";

export const stage3MultipleClients: TestFunction = (port: number, spawnInstance: ChildProcessWithoutNullStreams) => {
    const testInput = "Connect multiple clients to server and sent string simultaneously";
    const expectedBehavior = "Each of the clients should receive their reversed versions of the string that they sent";
    const numClients = 10;


    return new Promise((resolve, _) => {
        const clients: Socket[] = [];
        for (let i = 0; i < numClients; i++)
            clients.push(new Socket());

        let responsesReceived: number = 0;

        spawnInstance.on('error', (error) => {
            resolve({
                passed: false,
                testInput,
                expectedBehavior: expectedBehavior,
                observedBehavior: `server crashed with error ${error}`
            })
        });


        const clientRecvChecker = (client: Socket, index: number) => {
            const input = `string-${index}\n`;

            const receivedCallback = (data: Buffer) => {
                const output = data.toString();
                const expected = reverseString(input);
                responsesReceived++;

                if (output !== expected) {
                    spawnInstance?.kill();
                    return resolve({
                        passed: false,
                        testInput,
                        expectedBehavior: `client ${index} receives ${expected}`,
                        observedBehavior: `client ${index} received ${output}`,
                        cleanup: () => {
                            clients.forEach((client) => client.destroy());
                        }
                    })
                }
                client.off('data', receivedCallback);


                if (responsesReceived == numClients) {
                    spawnInstance?.kill();
                    return resolve({
                        passed: true,
                        testInput,
                        expectedBehavior,
                        observedBehavior: expectedBehavior,
                        cleanup: () => {
                            clients.forEach(client => client.destroy());
                        }
                    })
                }
            }

            client.on('data', receivedCallback);
            client.write(input);
        }

        clients.forEach((client, index) => {

            client.once('connectionAttemptFailed', () => {
                spawnInstance?.kill();
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: "Server refused connection",
                    cleanup: () => {
                        clients.forEach(client => client.destroy());
                    }
                })
            })

            client.once('connectionAttemptTimeout', () => {
                spawnInstance?.kill();
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: "Server connection timed out",
                    cleanup: () => {
                        clients.forEach(client => client.destroy());
                    }
                })
            })

            client.connect(port, LOCALHOST, () => {
                clientRecvChecker(client, index);
            })
        })

    })
}

export const stage3ErrorHandling: TestFunction = (port: number, spawnInstance: ChildProcessWithoutNullStreams) => {
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
                    const expected = reverseString(input);

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
                const expected = reverseString(input);

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