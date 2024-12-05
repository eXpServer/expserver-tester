import { ChildProcessWithoutNullStreams } from "child_process";
import { TestFunction } from "../types";
import { setupHttpServer } from "../utils/dummyServer";
import { ContainerManager } from "../core/ContainerManager";

export const stage5ProxyMultipleConnections: TestFunction = (hostPort: number, spawnInstance: ContainerManager) => {
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


        // const serverInstance = setupHttpServer(serverPort, listenerCallback, errorCallback);
    })
}