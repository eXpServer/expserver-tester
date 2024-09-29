import { BINARY_WAIT_TIME, FILE_EXECUTABLE_PERMS, LOCALHOST, SERVER_PORT_TEMP } from "../constants";
import { spawnProcess } from "../utils/process";
import { generateRandomStrings, reverseString } from "../utils/string";
import { Socket, createServer } from "net";
import { chmod } from "fs";
import { Result, TestTypes } from "../types";


export const stringTestCases = (filePath: string, port: number): Promise<{
    exitCode: number,
    results: Result[],
}> => {
    return new Promise((resolve, reject) => {
        const client = new Socket();
        const testData = generateRandomStrings(100, 10);
        const testResults: Result[] = testData.map(str => ({
            input: str,
            expected: reverseString(str),
            passed: false,
            type: TestTypes.String
        }))

        chmod(filePath, FILE_EXECUTABLE_PERMS, err => {
            if (err) {
                return reject('PERM_ERROR')
            }
            const child = spawnProcess(filePath);


            if (child == undefined) {
                return reject('SPAWN_ERROR');
            }

            child.on('error', () => {
                return reject('CONNECTION_ERROR')
            })

            child.on('close', (code) => {
                resolve({
                    exitCode: code || 0,
                    results: testResults,
                })
            })

            // put in child.on('spwaan);
            setTimeout(() => {
                const writeStringToServer = (index: number) => {
                    if (index >= testData.length) {
                        client.end();
                        return;
                    }

                    const dataToSend = testData[index];

                    const checkRecvd = (data: Buffer) => {
                        client.off('data', checkRecvd);
                        const receivedData = data.toString();
                        const reversedData = reverseString(dataToSend);

                        testResults[index].output = receivedData;
                        testResults[index].passed = (receivedData == reversedData);

                        return writeStringToServer(index + 1);
                    }

                    client.on('data', checkRecvd); //handle cases when no response
                    client.on('close', () => {
                        if (!child.killed)
                            child.kill('SIGINT');
                    })
                    client.write(dataToSend);

                }

                client.connect(port, LOCALHOST, () => {
                    return writeStringToServer(0);
                })

            }, BINARY_WAIT_TIME);

        })
    })
}

export const clientTestCases = (filePath: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const testData = generateRandomStrings(100, 10);
        const testResults: Result[] = testData.map(str => ({
            input: str,
            expected: reverseString(str),
            passed: false,
            type: TestTypes.String
        }))
        const server = createServer(socket => {
            socket.on('data', data => {
                const inputString = data.toString();
                const outputString = reverseString(inputString);
                socket.write(outputString);
            });

            socket.on('end', () => {
                console.log('Connection closed')
                server.close();
            });

            socket.on('error', (error) => console.log(error));
        });




        server.listen(SERVER_PORT_TEMP, () => {
            chmod(filePath, FILE_EXECUTABLE_PERMS, err => {
                if (err) {
                    return reject('PERM_ERROR')
                }

                const child = spawnProcess(filePath);
                if (child == undefined) {
                    return reject('SPAWN_ERROR');
                }

                child.on('error', () => {
                    return reject('CONNECTION_ERROR')
                })

                child.on('close', (code) => {
                    resolve({
                        exitCode: code || 0,
                        results: testResults,
                    })
                })

                setTimeout(() => {
                    const writeStringToServer = (index: number) => {
                        console.log("hello", index);
                        if (index >= testData.length) {
                            server.close();
                            child.kill();
                            return;
                        }

                        const dataToSend = testData[index].substring(0, testData[index].length - 1);

                        const checkRecvd = (data: Buffer) => {
                            const stringFromServer = data.toString();
                            if (stringFromServer == reverseString(dataToSend)) {
                                testResults[index].passed = true;
                            }
                            child.stdout.off('data', checkRecvd);
                            writeStringToServer(index + 1);
                        };

                        child.stdout.on('data', checkRecvd);
                        child.stdin.write(dataToSend);
                        child.stdin.end();
                    }

                    writeStringToServer(0);
                }, BINARY_WAIT_TIME)
            });
        });
    });
}