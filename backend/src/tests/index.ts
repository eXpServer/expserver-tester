import { StageTest, TestStatus } from "../types";
import { stage1ErrorChecking, stage1StringReversal } from "./stage1";
import { stage2CheckConnectionWhenNoServer, stage2InputOutput, stage2UnexpectedServerDisconnect } from "./stage2";
import { stage3ErrorHandling, stage3MultipleClients } from "./stage3";
import { stage5ProxyMultipleConnections } from "./stage5";
import { stage8NonBlockingTest } from "./stage8";

export const tests: StageTest = {
    stage1: {
        stageName: "TCP Server",
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "String reversal",
                description: "generate 10 random strings and see if the eXpServer gives the response we expect",
                testInput: "abc",
                expectedBehavior: "cba",
                testFunction: async (...args: any[]) => {
                    const response = await stage1StringReversal(8080, ...args)
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Checking error handling",
                description: "Force disconnection of the client should result in the server exiting with proper error code",
                expectedBehavior: "Process exited with code 0",
                testFunction: async (...args: any[]) => {
                    const response = await stage1ErrorChecking(8080, ...args);
                    return response;
                },
                status: TestStatus.Pending,
            }
        ]
    },
    stage2: {
        stageName: 'TCP Client',
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "404 Server Not Found?",
                description: "When the server isn't running / refuses connection, the client should handle it and exit with proper error code",
                testInput: "No server running on port 8080",
                expectedBehavior: "Client exited with code 1",
                testFunction: async (...args: any[]) => {
                    const response = await stage2CheckConnectionWhenNoServer(...args);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Checking input / output",
                description: "Sends 10 strings via terminal input manuallly and sees if the client is able to send it properly to a dummy server",
                testInput: "abcd",
                expectedBehavior: "Messaged received successfully by the server",
                testFunction: async (...args: any[]) => {
                    const response = await stage2InputOutput(...args);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error Handling when server unexpectedly disconnects",
                description: "The client is only able to connect to a single server, and when the server diconnects unexpected an appropriate error should be thrown by the client",
                testInput: "Force disconnect the dummy server",
                expectedBehavior: "Client exited with code 1",
                testFunction: async (...args: any[]) => {
                    const response = await stage2UnexpectedServerDisconnect(...args);
                    return response;
                },
                status: TestStatus.Pending,
            }
        ]
    },
    stage3: {
        stageName: 'UDP Multithreading',
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "Single client - input output",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "Previous tests are conducted with multiple connections simultaneously to ensure proper handling of multiple connections",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their respective input, but reversed",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "Checks how the server handles unexpected client disconnections. Multiple clients are initially connected to the server. Once a client disconnects abrupty, the server should still be able to handle existing connections and new connections without halting",
                testInput: "client disconnects",
                expectedBehavior: "Previous and new clients are able to send and receive output as expected",
                testFunction: async (...args) => {
                    const response = await stage3ErrorHandling(8080, ...args);
                    return response;

                },
                status: TestStatus.Pending,
            }
        ],
    },
    stage4: {
        stageName: "Linux Epoll",
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "Single client - input output",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "Previous tests are conducted with multiple connections simultaneously to ensure proper handling of multiple connections",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their respective input, but reversed",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "Checks how the server handles unexpected client disconnections. Multiple clients are initially connected to the server. Once a client disconnects abrupty, the server should still be able to handle existing connections and new connections without halting",
                testInput: "client disconnects",
                expectedBehavior: "Previous and new clients are able to send and receive output as expected",
                testFunction: async (...args) => {
                    const response = await stage3ErrorHandling(8080, ...args);
                    return response;

                },
                status: TestStatus.Pending,
            }
        ],
    },
    stage5: {
        stageName: 'TCP Proxy',
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "proxy response checking -- multiple clients",
                description: "creates multiple clients and verifies if the clients receive the responses meant for them, as well as if the response is matching the response received directly from the dummy server",
                testInput: "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2",
                expectedBehavior: "client 1 receives response from /test/1 && client 2 gets response from /test/2",
                testFunction: async () => {
                    const response = await stage5ProxyMultipleConnections(8080);
                    return response;
                },
                status: TestStatus.Pending,

            },
        ]
    },
    stage6: {
        stageName: "Listener and Connection Module",
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "Single client - input output on port 8001",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Single client - input output on port 8002",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8002);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Single client - input output on port 8003",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8003);
                    return response;
                },
                status: TestStatus.Pending,
            },

            {
                title: "Single client - input output on port 8004",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8004);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "Previous tests are conducted with multiple connections simultaneously to ensure proper handling of multiple connections",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their respective input, but reversed",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "Checks how the server handles unexpected client disconnections. Multiple clients are initially connected to the server. Once a client disconnects abrupty, the server should still be able to handle existing connections and new connections without halting",
                testInput: "client disconnects",
                expectedBehavior: "Previous and new clients are able to send and receive output as expected",
                testFunction: async (...args) => {
                    const response = await stage3ErrorHandling(8001, ...args);
                    return response;

                },
                status: TestStatus.Pending,
            }
        ],
    },
    stage7: {
        stageName: "Core and Loop Modules",
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "Single client - input output on port 8001",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Single client - input output on port 8002",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8002);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Single client - input output on port 8003",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8003);
                    return response;
                },
                status: TestStatus.Pending,
            },

            {
                title: "Single client - input output on port 8004",
                description: "Single client is connected to the server to ensure previous functionalities are working",
                testInput: "abcd",
                expectedBehavior: "dcba",
                testFunction: async () => {
                    const response = await stage1StringReversal(8004);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "Previous tests are conducted with multiple connections simultaneously to ensure proper handling of multiple connections",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their respective input, but reversed",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "Checks how the server handles unexpected client disconnections. Multiple clients are initially connected to the server. Once a client disconnects abrupty, the server should still be able to handle existing connections and new connections without halting",
                testInput: "client disconnects",
                expectedBehavior: "Previous and new clients are able to send and receive output as expected",
                testFunction: async (...args) => {
                    const response = await stage3ErrorHandling(8001, ...args);
                    return response;

                },
                status: TestStatus.Pending,
            }
        ],
    },
    stage8: {
        stageName: "Non-blocking Sockets",
        descriptionFilePath: "/sample.md",
        tests: [
            {
                title: "Non-blocking server",
                description: "creates a tcp connection to the tcp server running on the given port sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking waits for 5 seconds, then creates a second connection",
                expectedBehavior: "the second connection is able to send and receive data from the server",
                testFunction: async () => {
                    const response = await stage8NonBlockingTest(8001);
                    return response;
                },
                status: TestStatus.Pending,
            }
        ],
    }
}