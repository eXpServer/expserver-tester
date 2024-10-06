import { Socket } from "net";
import { generateRandomStrings, reverseString } from "../utils/string";
import { TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { ChildProcessWithoutNullStreams } from "child_process";

export const stage3MultipleClients: TestFunction = (port: number) => {
    const testInput = "Connect multiple clients to server and sent string simultaneously";
    const expectedBehavior = "Each of the clients should receive their respective input, but reversed";
    const numClients = 100;


    return new Promise((resolve, _) => {
        const clients: Socket[] = [];
        for (let i = 0; i < numClients; i++)
            clients.push(new Socket());

        let responsesReceived: number = 0;


        const clientRecvChecker = (client: Socket, index: number) => {
            const dataToSend = `string-${index}`;

            const receivedCallback = (data: Buffer) => {
                const output = data.toString();
                const expected = reverseString(dataToSend);
                responsesReceived++;

                if (output !== expected) {
                    return resolve({
                        observedBehavior: `received ${output} instead of ${expected}`,
                        passed: false,
                        cleanup: () => {
                            clients.forEach((client) => client.end());
                        }
                    })
                }
                client.off('data', receivedCallback);


                if (responsesReceived == numClients) {
                    return resolve({
                        passed: true,
                        observedBehavior: expectedBehavior,
                        cleanup: () => {
                            clients.forEach(client => client.end());
                        }
                    })
                }
            }

            client.on('data', receivedCallback);
        }

        clients.forEach((client, index) => {

            client.once('connectionAttemptFailed', () => {
                return resolve({
                    passed: false,
                    observedBehavior: "Server refused connection",
                    cleanup: () => {
                        clients.forEach(client => client.end());
                    }
                })
            })

            client.once('connectionAttemptTimeout', () => {
                return resolve({
                    passed: false,
                    observedBehavior: "Server connection timed out",
                    cleanup: () => {
                        clients.forEach(client => client.end());
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
    const testInput = "client disconnects";
    const expectedBehavior = "Previous and new clients are able to send and receive output as expected";

    return new Promise((resolve, _) => {
        const existingClient = new Socket();
        const clientToBeDisconnected = new Socket();
        const newClient = new Socket();


        const connectionAttemptFailedCallback = () => {
            return resolve({
                passed: false,
                observedBehavior: "server refused connection",
                cleanup: () => {
                    existingClient.end();
                    clientToBeDisconnected.end();
                    newClient.end();
                }
            })
        }

        const connectionTimeoutCallback = () => {
            return resolve({
                passed: false,
                observedBehavior: "server connection timed out",
                cleanup: () => {
                    existingClient.end();
                    clientToBeDisconnected.end();
                    newClient.end();
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
                observedBehavior: `Server terminated with Error code ${code || 0}`,
                cleanup: () => {
                    existingClient.end();
                    clientToBeDisconnected.end();
                    newClient.end();
                }
            })

        })

        const createNewClient = () => {
            newClient.connect(port, LOCALHOST, () => {
                const dataToSend = generateRandomStrings(10, 1)[0];
                newClient.once('data', (data) => {
                    const output = data.toString();
                    const expected = reverseString(dataToSend);

                    if (expected !== output) {
                        return resolve({
                            passed: false,
                            observedBehavior: "new client didn't receive string it expected",
                            cleanup: () => {
                                existingClient.end();
                                clientToBeDisconnected.end();
                                newClient.end();
                            }
                        })
                    }
                    else {
                        return resolve({
                            passed: true,
                            observedBehavior: expectedBehavior,
                            cleanup: () => {
                                existingClient.end();
                                clientToBeDisconnected.end();
                                newClient.end();
                            }
                        })
                    }
                })

                newClient.write(dataToSend);
            })
        }

        clientToBeDisconnected.once('close', () => {
            const dataToSend = generateRandomStrings(10, 1)[0];
            existingClient.on('data', (data) => {
                const output = data.toString();
                const expected = reverseString(dataToSend);

                if (expected !== output) {
                    return resolve({
                        passed: false,
                        observedBehavior: "existing client didn't receive string it expected",
                        cleanup: () => {
                            existingClient.end();
                            clientToBeDisconnected.end();
                            newClient.end();
                        }
                    })
                }
                else
                    createNewClient();
            })

            existingClient.write(dataToSend);
        })

        clientToBeDisconnected.connect(port, LOCALHOST, () => {
            existingClient.connect(port, LOCALHOST, () => {
                clientToBeDisconnected.end();
            })
        })

    })
}