import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { Test, TestFunction } from "../types";
import { reverseString } from "../utils/string";
import { LOCALHOST } from "../constants";
import path from "path";
import { createReadStream, readFileSync } from 'fs'
import { getCpuUsage } from "../utils/process";
import { cwd } from "process";


export const multipleClients: TestFunction = (port: number, reverse: boolean, spawnInstance: ContainerManager) => {
    const numClients = 10;


    return new Promise((resolve, _) => {
        const clients: Socket[] = [];
        for (let i = 0; i < numClients; i++) {
            const newClient = new Socket();
            newClient.on('connectionAttemptFailed', () => {
                spawnInstance?.kill();
                return resolve({
                    passed: false,
                    observedBehavior: "Server refused connection",
                    cleanup: () => {
                        clients.forEach(client => client.destroy());
                    }
                })
            })

            newClient.on('connectionAttemptTimeout', () => {
                spawnInstance?.kill();
                return resolve({
                    passed: false,
                    observedBehavior: "Server connection timed out",
                    cleanup: () => {
                        clients.forEach(client => client.destroy());
                    }
                })
            })

            newClient.on('error', () => {
                spawnInstance?.kill();
                return resolve({
                    passed: false,
                    observedBehavior: "cannot establish a connection with server",
                    cleanup: () => {
                        clients.forEach(client => client.destroy());
                    }
                })
            })


            clients.push(newClient);
        }

        let responsesReceived: number = 0;

        spawnInstance.on('error', (error) => {
            spawnInstance?.kill();
            resolve({
                passed: false,
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
            client.connect(port, spawnInstance.containerName, () => {
                clientRecvChecker(client, index);
            })
        })

    })
}

export const proxyMultipleConnections: TestFunction = (port: number, spawnInstance: ContainerManager) => {
    const serverPort = 3000;
    const numClients = 3;
    return new Promise((resolve, _) => {
        spawnInstance.on('error', (error) => {
            spawnInstance?.kill();
            return resolve({
                passed: false,
                observedBehavior: `Server crashed with error ${error}`
            })
        })

        let numPassed = 0;
        const verifyResponse = async (proxyServerResponse: string, route: number) => {
            const uri = `http://${spawnInstance.containerName}:${serverPort}/${route}`;
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
                    observedBehavior: "Response received from the proxy server didn't match the response received directly from the main server",
                })
            }
            else {
                numPassed++;
                if (numPassed == numClients) {
                    return resolve({
                        passed: true,
                    })
                }
            }
        }

        for (let i = 0; i < numClients; i++) {
            fetch(`http://${spawnInstance.containerName}:${port}/${i}`)
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
export const nonBlockingSocket: TestFunction = async (port: number, spawnInstance: ContainerManager) => {
    return new Promise((resolve, _) => {
        const firstClient = new Socket();
        const secondClient = new Socket();

        spawnInstance.on('error', error => {
            spawnInstance?.kill();
            firstClient.removeAllListeners();
            secondClient.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: `Server crashed with error ${error}`,
                cleanup: () => {
                    firstClient.end();
                    secondClient.end();
                }
            })
        })


        const connectionFailedHandler = () => {
            firstClient.removeAllListeners();
            secondClient.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Server refused connection",
                cleanup: () => {
                    firstClient.end();
                    secondClient.end();
                }
            })
        };

        const connectionTimeoutHandler = () => {
            firstClient.removeAllListeners();
            secondClient.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Server connection timeout",
                cleanup: () => {
                    firstClient.end();
                    secondClient.end();
                }
            })
        }


        const connectionCloseHandler = () => {
            firstClient.removeAllListeners();
            secondClient.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Connection terminated / server not running on desired port",
                cleanup: () => {
                    firstClient.end();
                    secondClient.end();
                }
            })
        }

        const connectionErrorHandler = () => {
            firstClient.removeAllListeners();
            secondClient.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Cannot establish connection to server",
                cleanup: () => {
                    firstClient.end();
                    secondClient.end();
                }
            })
        }


        firstClient.on('connectionAttemptFailed', connectionFailedHandler);
        firstClient.on('connectionAttemptTimeout', connectionTimeoutHandler);
        firstClient.on('error', connectionErrorHandler);
        // firstClient.on('close', connectionCloseHandler);

        secondClient.on('connectionAttemptFailed', connectionFailedHandler);
        secondClient.on('connectionAttemptTimeout', connectionTimeoutHandler);
        secondClient.on('error', connectionErrorHandler);
        // secondClient.on('close', connectionCloseHandler);

        firstClient.connect(port, spawnInstance.containerName, () => {
            const file = createReadStream(path.join(process.cwd(), 'public', 'large-files', '4gb.txt'));
            file.pipe(firstClient);

            const firstClientWaitTimeout = setTimeout(() => {
                secondClient.connect(port, spawnInstance.containerName, () => {
                    const errorCallback = () => {
                        ;
                        clearTimeout(firstClientWaitTimeout);
                        clearTimeout(secondClientWaitTimeout);
                        firstClient.removeAllListeners();
                        secondClient.removeAllListeners();

                        return resolve({
                            passed: false,
                            observedBehavior: "Client connection was disconnected",
                            cleanup: () => {
                                firstClient.end();
                                secondClient.end();
                            }
                        })
                    };

                    // firstClient.off('error', connectionErrorHandler);
                    // secondClient.off('error', connectionErrorHandler);
                    firstClient.on('error', errorCallback);
                    secondClient.on('error', errorCallback)



                    const input = "hello world";
                    secondClient.write(input);

                    secondClient.on('data', () => {
                        clearTimeout(secondClientWaitTimeout);
                        clearTimeout(firstClientWaitTimeout)
                        firstClient.removeAllListeners();
                        secondClient.removeAllListeners();

                        return resolve({
                            passed: true,
                            cleanup: () => {
                                firstClient.end();
                                secondClient.end();
                            }
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
                        file.close();
                        clearTimeout(firstClientWaitTimeout);
                        spawnInstance.kill().then(() => {
                            return resolve({
                                passed: false,
                                observedBehavior: "Server did not respond to the second client within 30s",
                                cleanup: () => {
                                    firstClient.end();
                                    secondClient.end();
                                }
                            });
                        })


                    }, 5000);
                })
            }, 5000);

        })
    })
}

export const checkCpuUsage: TestFunction = (port: number, spawnInstance: ContainerManager) => {
    return new Promise((resolve, _) => {
        const NUM_ITERATIONS = 30;
        const client = new Socket();

        spawnInstance.on('error', error => {
            client.removeAllListeners();
            return resolve({
                passed: false,
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
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Server refused connection",
            })
        });

        client.on('connectionAttemptTimeout', () => {
            client.removeAllListeners();
            return resolve({
                passed: false,
                observedBehavior: "Server connection timed out",
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

        client.connect(port, spawnInstance.containerName, () => {
            const results = Array<number>(NUM_ITERATIONS);
            let index = NUM_ITERATIONS - 1;


            const interval = setInterval(async () => {
                if (index < 0) {
                    const average = calcAvergeUsage(results);
                    const observedBehavior = `CPU usage was ${average}%`;
                    client.destroy();
                    clearInterval(interval);
                    client.removeAllListeners();
                    return resolve({
                        observedBehavior,
                        passed: average <= 10,
                    });
                }
                try {
                    const { cpuUsage } = await spawnInstance.getResourceStats();
                    results[NUM_ITERATIONS - index - 1] = cpuUsage;
                    index--;
                }
                catch {
                    results[NUM_ITERATIONS - index - 1] = Infinity;
                    index--;
                }
            }, 1000);
        })
    });
}

export const checkMemUsage: TestFunction = (spawnInstance: ContainerManager) => {
    return new Promise(async resolve => {
        await spawnInstance.detachStream();
        const results: number[] = [];
        spawnInstance.on('error', error => {
            spawnInstance?.kill();
            return resolve({
                passed: false,
                observedBehavior: `Server crashed with error ${error}`
            })
        });

        const calcAverageUsage = (results: number[]) => {
            if (results.length == 0)
                return 0;
            let total = 0;
            for (let i = 0; i < results.length; i++)
                total += results[i]
            const average = total / results.length;
            return average;
        }

        const container = spawnInstance.container;
        const exec = await container.exec({
            AttachStderr: false,
            AttachStdout: false,
            Tty: false,
            AttachStdin: false,
            Cmd: ['sh', '-c', 'cat /usr/src/public/4gb.txt | netcat -q 0 localhost 8001']
        });


        await exec.start({ hijack: false, stdin: false });

        const interval = setInterval(() => {
            spawnInstance.getResourceStats()
                .then(({ memUsage }) => {
                    results.push(memUsage);
                })
                .catch(() => {
                    console.log("[Fetching resource stats]: Container already terminated...")
                })
        }, 1000);

        try {
            const exitCode = await new Promise((resolve, reject) => {
                const checkExec = () => {
                    exec.inspect((err, data) => {
                        if (err)
                            return reject(err);
                        if (data.Running)
                            return setTimeout(checkExec, 500);
                        else
                            return resolve(data.ExitCode);
                    })
                }

                checkExec();
            })


            if (exitCode != 0) {
                clearInterval(interval);
                await spawnInstance.attachStream();
                return resolve({
                    passed: false,
                    observedBehavior: `netcat localhost 8001 failed with exit code ${exitCode}`
                })
            }
            const average = calcAverageUsage(results);
            clearInterval(interval);
            if (average > 10) {
                await spawnInstance.attachStream();
                return resolve({
                    passed: false,
                    observedBehavior: `Observed an average memory usage of ${average}%`
                })
            }
            else {
                await spawnInstance.attachStream();
                return resolve({
                    passed: true,
                    observedBehavior: `Observed an average memory usage of ${average}%`
                })
            }
        }
        catch {
            clearInterval(interval);
            await spawnInstance.attachStream();
            return resolve({
                passed: false,
                observedBehavior: "something went wrong",
            })
        }
    })
}

export const prematureFileServerTest: TestFunction = (port: number, spawnInstance: ContainerManager) => {
    return new Promise((resolve) => {
        spawnInstance.once('error', (error) => {
            return resolve({
                passed: false,
                observedBehavior: `server crashed with error ${error}`
            })
        })

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

        let timeout = null;
        client.on('connect', () => {
            timeout = setTimeout(() => {
                client.removeAllListeners();
                return resolve({
                    passed: false,
                    observedBehavior: "Server didn't respond with any data",
                })
            }, 30000);
        })



        const verifyResultCallback = (data: Buffer) => {
            if (timeout !== null)
                clearTimeout(timeout);
            const expectedString = readFileSync(`${process.cwd()}/public/common/sample.txt`, { encoding: 'utf-8' });
            if (data.toString() == expectedString) {
                client.removeAllListeners();
                return resolve({
                    passed: true,
                });
            }
            else {
                client.removeAllListeners();
                return resolve({
                    passed: false,
                    observedBehavior: `Expected string: ${data.toString()}, received ${expectedString}`
                })
            }
        }

        client.on('data', verifyResultCallback);
        client.connect(port, spawnInstance.containerName);
    });
}

