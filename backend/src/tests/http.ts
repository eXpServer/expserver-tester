import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { HttpRequestTest, TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { buildHttpResponse, parseHttpResponse, verifyResponseOutput } from "../utils/http";

export const httpRequestParser: TestFunction = (hostPort: number, requestInfo: HttpRequestTest, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = requestInfo.info;
    const expectedBehavior = buildHttpResponse(requestInfo.expectedResponse)

    return new Promise((resolve, _) => {
        const client = new Socket();

        client.on('connectionAttemptFailed', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server refused connection",
            })
        })

        client.on('connectionAttemptTimeout', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "server connection timed out",
            })
        })

        const verifyResponseCallback = (data: Buffer) => {
            const responseText = data.toString();
            client.off('data', verifyResponseCallback);
            client.end();

            const parsedResponse = parseHttpResponse(responseText);
            console.log(responseText)
            if (!verifyResponseOutput(parsedResponse, requestInfo.expectedResponse)) {
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: responseText,
                    cleanup: () => client.destroy()
                })
            }
            else {
                return resolve({
                    passed: true,
                    testInput,
                    expectedBehavior,
                    observedBehavior: expectedBehavior,
                    cleanup: () => client.destroy()
                })
            }
        }

        client.on('data', verifyResponseCallback);

        client.connect(port, LOCALHOST, () => client.write(requestInfo.request))
    })
}