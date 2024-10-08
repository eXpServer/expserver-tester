import { TestFunction } from "../types";
import Express from "express";


const setupServer = (serverPort: number, listenerCallback: () => Promise<void> | void, errorCallback: (err: Error) => Promise<void> | void) => {
    const httpServer = Express();

    httpServer.get('/:num', (req, res) => {
        const num = req.params.num;
        res.setHeader('Date', 'doesnt-matter');
        res.json({ message: "Hello, World!", num });
    })

    const serverInstance = httpServer.listen(serverPort, listenerCallback);
    serverInstance.on('error', errorCallback);

    return serverInstance;
}

// export const stage5ProxySingleConnection: TestFunction = (port) => {
//     const testInput = "Client sends a GET request to the dummy server, as well as the proxy server";
//     const expectedBehavior = "The response received from the proxy should match the dummy server"
//     const serverPort = 3000;



//     const fetchFromPort = async (portToCall: number): Promise<string> => {
//         const response = await fetch(`http://localhost:${portToCall}/1`)
//         const statusLine = `HTTP/1.1 ${response.status} ${response.statusText}`;

//         const headers = [...response.headers.entries()]
//             .map(([key, value]) => `${key}: ${value}`)
//             .join('\n')

//         const body = await response.text();
//         const fullResponse = `${statusLine}\n${headers}\n\n${body}`;

//         return fullResponse;
//     }

//     return new Promise((resolve, _) => {

//         const listenerCallback = async () => {
//             const responseFromServer = await fetchFromPort(serverPort);
//             const responseFromProxy = await fetchFromPort(port);

//             console.log(responseFromServer);
//             serverInstance.close();

//             if (responseFromProxy == responseFromServer) {
//                 return resolve({
//                     passed: true,
//                     observedBehavior: expectedBehavior,
//                 })
//             }
//             else {
//                 return resolve({
//                     passed: false,
//                     observedBehavior: "The response from the proxy doesn't match the response from dummy server",
//                 })
//             }
//         }

//         const errorCallback = (err: Error) => {
//             return resolve({
//                 passed: false,
//                 observedBehavior: "Can't create dummy server,  check if port 3000 is busy",
//             })
//         }


//         const serverInstance = setupServer(serverPort, listenerCallback, errorCallback);
//     })
// }

// export const stage5ProxyMultipleConnections: TestFunction = (port: number) => {
//     const testInput = "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2";
//     const expectedBehavior = "client 1 receives response from /test/1 && client 2 gets response from /test/2";
//     const serverPort = 3000;
//     return new Promise((resolve, _) => {


//         const fetchFromPort = async (portToCall: number) => {
//             const responses: string[] = [];
//             for (let i = 0; i < 100; i++) {
//                 console.log("hello", "start", i);
//                 const response = await fetch(`http://localhost:${portToCall}/${i}`);
//                 console.log("hello", "end", i);
//                 const statusLine = `HTTP/1.1 ${response.status} ${response.statusText}`;

//                 const headers = [...response.headers.entries()]
//                     .map(([key, value]) => `${key}: ${value}`)
//                     .join('\n')

//                 const body = await response.text();
//                 const fullResponse = `${statusLine}\n${headers}\n\n${body}`;

//                 responses.push(fullResponse);
//             };

//             return responses;
//         }

//         const listenerCallback = async () => {
//             const responseFromServer = await fetchFromPort(serverPort);
//             const responseFromProxy = await fetchFromPort(port);

//             console.log(responseFromProxy, responseFromServer);
//             serverInstance.close();
//             if (responseFromServer.every((value, index) => value === responseFromProxy[index])) {
//                 return resolve({
//                     passed: true,
//                     observedBehavior: expectedBehavior,
//                 })
//             }
//             else {
//                 return resolve({
//                     passed: false,
//                     observedBehavior: "The response from the proxy doesn't match the response from dummy server",
//                 })
//             }
//         }

//         const errorCallback = (err: Error) => {
//             return resolve({
//                 passed: false,
//                 observedBehavior: "Can't create dummy server,  check if port 3000 is busy",
//             })
//         }


//         const serverInstance = setupServer(serverPort, listenerCallback, errorCallback);
//     })
// }

export const stage5ProxyMultipleConnections: TestFunction = (port: number) => {
    const testInput = "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2";
    const expectedBehavior = "client 1 receives response from /test/1 && client 2 gets response from /test/2";
    const serverPort = 3000;
    const numClients = 3;

    return new Promise((resolve, _) => {

        let numPassed = 0;
        const verifyResponse = async (proxyServerResponse: string, route: number) => {
            console.log("hello", route);
            const uri = `http://localhost:${serverPort}/${route}`;

            const serverResponse = await fetch(uri);

            const statusLine = `HTTP/1.1 ${serverResponse.status} ${serverResponse.statusText}`;

            const headers = [...serverResponse.headers.entries()]
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')

            const body = await serverResponse.text();
            const fullResponse = `${statusLine}\n${headers}\n\n${body}`;

            serverInstance.close();
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
                        observedBehavior: expectedBehavior,
                    })
                }
            }
        }

        const listenerCallback = () => {
            for (let i = 0; i < numClients; i++) {
                fetch(`http://localhost:${port}/${i}`).then(res => {

                    const statusLine = `HTTP/1.1 ${res.status} ${res.statusText}`;

                    const headers = [...res.headers.entries()]
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n')

                    res.text().then(body => {
                        const fullResponse = `${statusLine}\n${headers}\n\n${body}`;
                        verifyResponse(fullResponse, i);
                    })
                })
            }
        }

        const errorCallback = (err: Error) => {
            return resolve({
                passed: false,
                observedBehavior: "Can't create dummy server,  check if port 3000 is busy",
            })
        }


        const serverInstance = setupServer(serverPort, listenerCallback, errorCallback);
    })
}