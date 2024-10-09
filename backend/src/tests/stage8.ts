import { LOCALHOST } from "../constants";
import { TestFunction } from "../types";
import { Socket } from 'net'
import fs from 'fs';
import path from 'path';
import { cwd } from "process";
import { reverseString } from "../utils/string";


/**
 * creates a tcp connection to the tcp server running on the given port
 * sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking
 * waits for 5 seconds, then creates a second connection
 * @param port number
 * @returns 
 */
export const stage8NonBlockingTest: TestFunction = async (port: number) => {
    const expectedBehavior = "server should be able to handle multiple connections simultaneously, and should not block on a single connection";
    return new Promise((resolve, _) => {
        const firstClient = new Socket();
        const secondClient = new Socket();

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
                            observedBehavior: expectedBehavior
                        })
                    })

                    const secondClientWaitTimeout = setTimeout(() => {
                        clearTimeout(secondClientWaitTimeout);
                        firstClient.end();
                        secondClient.end();
                        clearTimeout(firstClientWaitTimeout)

                        return resolve({
                            passed: false,
                            observedBehavior: "Server did not respond to the second client within 30s"
                        });
                    }, 30000);
                })
            }, 5000);

        })
    })
}