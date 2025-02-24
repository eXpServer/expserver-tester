import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction } from "../types";

export const stage11ProxyErrorHandling: TestFunction = async (hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);
    const testInput = "Proxy server unexpectedly shuts down"
    const expectedBehavior = "Server shouldn't crash"
    await spawnInstance.stopPythonServer();
    return new Promise((resolve, _) => {

        spawnInstance.on('close', (code) => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server terminated with Error code ${code}`,
            })
        })

        fetch(`http://localhost:${port}`).catch(err => {
            if (err.cause?.code == 'UND_ERR_SOCKET') {
                return resolve({
                    passed: true,
                    testInput,
                    expectedBehavior,
                    observedBehavior: "Server terminated client connection without any crashes",
                })
            }
            else {
                return resolve({
                    passed: false,
                    testInput,
                    expectedBehavior,
                    observedBehavior: `Server terminated client with error: ${err.code}`
                })
            }
        })
    });
}