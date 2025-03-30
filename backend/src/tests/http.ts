import { Socket } from "net";
import { ContainerManager } from "../core/ContainerManager";
import { HttpRequestTest, TestFunction } from "../types";
import { LOCALHOST } from "../constants";
import { parseHttpResponse, verifyResponseOutput } from "../utils/http";

export const httpRequestParser: TestFunction = (hostPort: number, requestInfo: HttpRequestTest, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);

    return new Promise((resolve, _) => {
        const client = new Socket();

        client.on('connectionAttemptFailed', () => {
            return resolve({
                passed: false,
                observedBehavior: "server refused connection",
            })
        })

        client.on('connectionAttemptTimeout', () => {
            return resolve({
                passed: false,
                observedBehavior: "server connection timed out",
            })
        })

        const verifyResponseCallback = (data: Buffer) => {
            const responseText = data.toString();
            client.off('data', verifyResponseCallback);
            client.end();

            const parsedResponse = parseHttpResponse(responseText);
            if (!verifyResponseOutput(parsedResponse, requestInfo.expectedResponse)) {
                return resolve({
                    passed: false,
                    observedBehavior: responseText,
                    cleanup: () => client.destroy()
                })
            }
            else {
                return resolve({
                    passed: true,
                    cleanup: () => client.destroy()
                })
            }
        }

        client.on('data', verifyResponseCallback);

        client.connect(port, LOCALHOST, () => client.write(requestInfo.request))
    })
}

const matchHeaders = (proxyHeaders: Headers, serverHeaders: Headers): boolean => {
    let result: boolean = true;
    proxyHeaders.forEach((value, key) => {
        if (serverHeaders.get(key) !== value)
            result = false;
    });
    return result;
}

const matchBody = (proxyBody: string, serverBody: string) => {
    return (proxyBody === serverBody);
}

export const httpProxyTest: TestFunction = (fileName: string, hostPort: number, proxyHostPort, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort)
    const proxyPort = spawnInstance.getMapppedPort(proxyHostPort);

    return new Promise(async resolve => {
        let responseFromProxy: Response;
        try {
            responseFromProxy = await fetch(`http://localhost:${proxyPort}/${fileName}`);
        }
        catch (error) {
            console.log(`Error: ${error.cause.code}`)
        }
        let responseFromServer: Response;

        try {
            responseFromServer = await fetch(`http://localhost:${port}/${fileName}`);
        }
        catch (error) {
            console.log(`Error: ${error.cause.code}`)
        }

        if (
            (responseFromProxy.status != responseFromServer.status) ||
            (!matchHeaders(responseFromProxy.headers, responseFromServer.headers)) ||
            (!matchBody(await responseFromProxy.text(), await responseFromServer.text()))
        ) {
            return resolve({
                passed: false,
                observedBehavior: "Response received from server didn't match that received from proxy",
            });
        }
        else {
            return resolve({
                passed: true,
            })
        }

    })
}

export const httpFileServerTest: TestFunction = (fileName: string, mimeType: string, hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);

    return new Promise(async resolve => {
        let response: Response;
        try {
            response = await fetch(`http://localhost:${port}/${fileName}`);
        }
        catch (error) {
            return resolve({
                passed: false,
                observedBehavior: `Error: ${error.cause.code}`,
            })
        }

        const receivedMimeType = response.headers.get('Content-Type');
        if (response.status != 200) {
            return resolve({
                passed: false,
                observedBehavior: `Expected status 200, received ${response.status}`,
            })
        }
        else if (receivedMimeType != mimeType) {
            return resolve({
                passed: false,
                observedBehavior: `Expected file of type ${mimeType}, recieved ${receivedMimeType}`
            })
        }
        else {
            return resolve({
                passed: true,
            })
        }
    })
}

export const httpRedirectTest: TestFunction = (path: string, redirectUrl: string, hostPort: number, spawnInstance: ContainerManager) => {
    const port = spawnInstance.getMapppedPort(hostPort);

    return new Promise(async resolve => {
        let response: Response;
        try {
            response = await fetch(`http://localhost:${port}/${path}`, { redirect: 'manual' });
        }
        catch (error) {
            return resolve({
                passed: false,
                observedBehavior: `Error: ${error.cause.code}`,
            })
        }

        const receivedRedirectUrl = response.headers.get('location');
        if (response.status != 302) {
            return resolve({
                passed: false,
                observedBehavior: `Expected a status code 302 but received ${response.status}`,
            })
        }
        else if (response.headers.get('location') !== redirectUrl) {
            return resolve({
                passed: false,
                observedBehavior: `Expected redirect to ${redirectUrl} but received ${receivedRedirectUrl || 'N/A'}`,
            })
        }

        return resolve({
            passed: true,
        })
    })
}