import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction } from "../types";
import { reverseString } from "../utils/string";
import { LOCALHOST } from "../constants";
import path from "path";
import { createReadStream, readFileSync } from 'fs'
import { getCpuUsage } from "../utils/process";


export const multipleClients: TestFunction = (hostPort: number, reverse: boolean, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "Connect multiple clients to server and sent string simultaneously";
    const expectedBehavior = "Each of the clients should receive the reversed versions of the string that they sent";
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
                const expected = (reverse
                    ? reverseString(input)
                    : input);
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

export const proxyMultipleConnections: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2";
    const expectedBehavior = "client 1 receives response from /test/1 && client 2 gets response from /test/2";
    const serverPort = 3000;
    const serverMappedPort = spawnInstance.getMapppedPort(serverPort);
    const numClients = 3;
    return new Promise((resolve, _) => {
        spawnInstance.on('error', (error) => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server crashed with error ${error}`
            })
        })

        let numPassed = 0;
        const verifyResponse = async (proxyServerResponse: string, route: number) => {
            const uri = `http://localhost:${serverMappedPort}/${route}`;
            const serverResponse = await fetch(uri);
            const statusLine = `HTTP/1.1 ${serverResponse.status} ${serverResponse.statusText}`;

            const headers = [...serverResponse.headers.entries()]
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')

            const body = await serverResponse.text();
            const fullResponse = `${statusLine}\n${headers}\n\n${body}`;

            if (fullResponse !== proxyServerResponse) {
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: "Response received from the proxy server didn't match the response received directly from the main server",
                })
            }
            else {
                numPassed++;
                if (numPassed == numClients) {
                    return resolve({
                        passed: true,
                        testInput,
                        expectedBehavior,
                        observedBehavior: expectedBehavior,
                    })
                }
            }
        }

        for (let i = 0; i < numClients; i++) {
            fetch(`http://localhost:${port}/${i}`)
                .then(res => {

                    const statusLine = `HTTP/1.1 ${res.status} ${res.statusText}`;

                    const headers = [...res.headers.entries()]
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n')

                    res.text().then(body => {
                        const fullResponse = `${statusLine}\n${headers}\n\n${body}`;
                        verifyResponse(fullResponse, i);
                    })
                })
                .catch(error => {
                    return resolve({
                        passed: false,
                        testInput,
                        expectedBehavior,
                        observedBehavior: `Connection failed with error ${error}`
                    })
                })
        }
    })
}


/**
 * creates a tcp connection to the tcp server running on the given port
 * sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking
 * waits for 5 seconds, then creates a second connection
 * @param port number
 */
export const nonBlockingSocket: TestFunction = async (hostPort: number, spawnInstance: ContainerManager) => {
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
        firstClient.on('connectionAttemptTimeout', connectionTimeoutHandler);

        secondClient.on('connectionAttemptFailed', connectionFailedHandler);
        secondClient.on('connectionAttemptTimeout', connectionTimeoutHandler);

        firstClient.connect(port, LOCALHOST, () => {
            const file = createReadStream(path.join(process.cwd(), 'public', '4gb.txt'));
            file.pipe(firstClient);

            const firstClientWaitTimeout = setTimeout(() => {
                secondClient.connect(port, LOCALHOST, () => {
                    const errorCallback = () => {
                        firstClient.end();
                        secondClient.end();
                        clearTimeout(firstClientWaitTimeout);
                        clearTimeout(secondClientWaitTimeout);

                        return resolve({
                            passed: false,
                            expectedBehavior,
                            testInput,
                            observedBehavior: "Client connection was disconnected",
                            cleanup: () => {
                                firstClient.destroy();
                                secondClient.destroy();
                            }
                        })
                    };

                    firstClient.on('error', errorCallback);
                    secondClient.on('error', errorCallback)


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


                        firstClient.off('connectionAttemptFailed', connectionFailedHandler);
                        firstClient.off('connectionAttemptTimeout', connectionTimeoutHandler);
                        firstClient.off('error', errorCallback);

                        secondClient.off('connectionAttemptFailed', connectionFailedHandler);
                        secondClient.off('connectionAttemptTimeout', connectionTimeoutHandler);
                        secondClient.off('error', errorCallback);


                        clearTimeout(secondClientWaitTimeout);
                        firstClient.destroy();
                        secondClient.destroy();
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


                    }, 5000);
                })
            }, 5000);

        })
    })
}

export const checkCpuUsage: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "Creates an idle client connection and tracks CPU usage over the course of 20 seconds";
    const expectedBehavior = "CPU usage should be less than 10%";
    return new Promise((resolve, _) => {
        const NUM_ITERATIONS = 30;
        const client = new Socket();

        spawnInstance.on('error', error => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server crashed with error ${error}`
            })
        })

        const calcAvergeUsage = (results: number[]) => {
            let total = 0;
            for (let i = 0; i < results.length; i++) {
                total += results[i];
            }
            const average = total / results.length;
            return average;
        }

        client.on('connectionAttemptFailed', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Server refused connection",
            })
        });

        client.on('connectionAttemptTimeout', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Server connection timed out",
            })
        })

        client.connect(port, LOCALHOST, () => {
            const results = Array<number>(NUM_ITERATIONS);
            let index = NUM_ITERATIONS - 1;


            const interval = setInterval(async () => {
                if (index < 0) {
                    const average = calcAvergeUsage(results);
                    const observedBehavior = `CPU usage was ${average}%`;
                    client.destroy();
                    clearInterval(interval);
                    return resolve({
                        testInput,
                        expectedBehavior,
                        observedBehavior,
                        passed: average <= 0.10,
                    });
                }

                const cpuUsage = await getCpuUsage(spawnInstance.pid);
                results[NUM_ITERATIONS - index - 1] = cpuUsage;
                index--;
            }, 1000);
        })
    });
}

export const prematureFileServerTest: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "Connects to the file server";
    const expectedBehavior = "Server responds with the contents of 'sample.txt' without needing any input from the client";
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