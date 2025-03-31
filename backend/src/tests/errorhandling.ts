import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { generateRandomStrings, reverseString } from "../utils/string";

export const prematureErrorHandling: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    return new Promise((resolve, _) => {
        const client = new Socket();


        const closeCallback = (code: number | null) => {
            resolve({
                passed: (code == 1),
                observedBehavior: `Process exited with code ${code || 0}`,
            })
        }

        spawnInstance.on('close', closeCallback);

        client.on('error', () => {
            client.destroy();
            resolve({
                passed: false,
                observedBehavior: "Client disconnected with an error",
                cleanup: () => spawnInstance.off('close', closeCallback),
            })
        });

        client.on('close', () => {
            resolve({
                passed: false,
                observedBehavior: "Connection was terminated / server is not running on desired port",
                cleanup: () => spawnInstance?.off('close', closeCallback),
            })
        })


        client.connect(port, LOCALHOST, () => {
            client.destroy();

            client.on('close', () => {
                const timeout = setTimeout(() => {
                    spawnInstance.off('close', closeCallback);
                    resolve({
                        passed: false,
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

    return new Promise((resolve, _) => {
        const existingClient = new Socket();
        const clientToBeDisconnected = new Socket();
        const newClient = new Socket();


        const connectionAttemptFailedCallback = () => {
            existingClient.destroy();
            clientToBeDisconnected.destroy();
            newClient.destroy();
            return resolve({
                passed: false,
                observedBehavior: "server refused connection",
            })
        }

        const connectionTimeoutCallback = () => {
            existingClient.destroy();
            clientToBeDisconnected.destroy();
            newClient.destroy();
            return resolve({
                passed: false,
                observedBehavior: "server connection timed out",
            })
        }

        const connectionErrorCallback = () => {
            existingClient.destroy();
            clientToBeDisconnected.destroy();
            newClient.destroy();
            spawnInstance?.kill();
            return resolve({
                passed: false,
                observedBehavior: "cannot establish a connection with server",
            })
        }

        const clientCloseCallback = () => {
            existingClient.destroy();
            clientToBeDisconnected.destroy();
            newClient.destroy();
            return resolve({
                passed: false,
                observedBehavior: "Connection was terminated / server is not running on desired port",
            })
        }


        existingClient.on('connectionAttemptTimeout', connectionTimeoutCallback);
        clientToBeDisconnected.on('connectionAttemptTimeout', connectionTimeoutCallback);
        newClient.on('connectionAttemptTimeout', connectionTimeoutCallback);

        existingClient.on('connectionAttemptFailed', connectionAttemptFailedCallback);
        clientToBeDisconnected.on('connectionAttemptFailed', connectionAttemptFailedCallback);
        newClient.on('connectionAttemptFailed', connectionAttemptFailedCallback);

        existingClient.on('error', connectionErrorCallback);
        clientToBeDisconnected.on('error', connectionErrorCallback);
        newClient.on('error', connectionErrorCallback);

        existingClient.on('close', clientCloseCallback);
        clientToBeDisconnected.on('close', clientCloseCallback);
        newClient.on('close', clientCloseCallback);

        spawnInstance.on('close', (code) => {
            return resolve({
                passed: false,
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
    await spawnInstance.stopPythonServer();
    return new Promise((resolve, _) => {

        spawnInstance.on('close', (code) => {
            return resolve({
                passed: false,
                observedBehavior: `Server terminated with Error code ${code}`,
            })
        })

        fetch(`http://localhost:${port}`).catch(err => {
            if (err.cause?.code == 'UND_ERR_SOCKET') {
                return resolve({
                    passed: true,
                    observedBehavior: "Server terminated client connection without any crashes",
                })
            }
            else {
                return resolve({
                    passed: false,
                    observedBehavior: `Server terminated client with error: ${err.code}`
                })
            }
        })
    });
}