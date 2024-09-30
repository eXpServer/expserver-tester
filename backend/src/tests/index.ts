import { Socket } from "net";
import { generateRandomStrings, reverseString } from "../utils/string"
import { TestStatus } from "../types";
import { LOCALHOST } from "../constants";
import { ChildProcessWithoutNullStreams } from "child_process";

const stringReversal = (port: number, spawnInstance: ChildProcessWithoutNullStreams) => {
    return new Promise((resolve, _) => {
        const testStrings = generateRandomStrings(100, 10);

        const client = new Socket();

        const writeToServer = (index: number) => {
            const input = testStrings[index];

            const verifyResultCallback = (data: Buffer) => {
                const expected = reverseString(input);
                const output = data.toString();

                if (output !== expected) {
                    return resolve({
                        status: TestStatus.Failed,
                        data: { input, output, expected },
                        cleanup: () => {
                            client.end();
                        }
                    })
                }
                else {
                    if (index == testStrings.length - 1) {
                        return resolve({
                            status: TestStatus.Passed,
                            data: { input, output, expected },
                            cleanup: () => {
                                client.end();
                            }
                        })
                    }
                    else {
                        return writeToServer(index + 1);
                    }
                }
            }


            client.once('data', verifyResultCallback);
            client.write(input);
        }

        client.connect(port, LOCALHOST, () => writeToServer(0));

    })
}

export default {
    stringReversal
}