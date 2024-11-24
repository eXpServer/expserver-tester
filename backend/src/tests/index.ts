import { StageTest, TestStatus } from "../types";
import { stage1ErrorChecking, stage1StringReversal } from "./stage1";
import { stage3ErrorHandling, stage3MultipleClients } from "./stage3";
import { stage5ProxyMultipleConnections } from "./stage5";
import { stage8NonBlockingTest } from "./stage8";
import { stage9checkCpuUsage } from "./stage9";

export const tests: StageTest = {
    stage1: {
        stageName: "TCP Server",
        descriptionFilePath: "/description/stage1.md",
        tests: [
            {
                title: "Checking error handling",
                description: "Checks how the server behaves when the client unexpectedly disconnects. In the current version of the server, we are not implementing proper handling of such a situation and thus the server should terminate with error code 1",
                testInput: "Force disconnection of the client",
                expectedBehavior: "Process exited with code 1",
                testFunction: async (...args: any[]) => {
                    const response = await stage1ErrorChecking(8080, ...args);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "String reversal",
                description: "Ensures proper working of the server by verifying if the string returned by the server matches the expected output",
                testInput: "client sends a randomly generated string to the server",
                expectedBehavior: "client receives reversed version of the input",
                testFunction: async (...args: any[]) => {
                    const response = await stage1StringReversal(8080, ...args)
                    return response;
                },
                status: TestStatus.Pending,
            },
        ]
    },
    stage3: {
        stageName: 'UDP Multithreading',
        descriptionFilePath: "/description/stage3.md",
        tests: [
            {
                title: "Single client - input output",
                description: "This test ensures that the server runs as expected when a singular client is connected",
                testInput: "client sends a randomly generated string to the server",
                expectedBehavior: "client receives reversed version of the input",
                testFunction: async () => {
                    const response = await stage1StringReversal(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client",
                testInput: "Connect multiple clients to server and sends unique string simultaneously",
                expectedBehavior: "Each of the clients should receive reversed versions of their input",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected",
                testInput: "client forcefully disconnects",
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
        descriptionFilePath: "/description/stage4.md",
        tests: [
            {
                title: "Single client - input output",
                description: "This test ensures that the server runs as expected when a singular client is connected",
                testInput: "client sends a randomly generated string to the server",
                expectedBehavior: "client receives reversed version of the input",
                testFunction: async () => {
                    const response = await stage1StringReversal(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their reversed versions of the string that they sent",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8080);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected",
                testInput: "client forcefully disconnects",
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
        descriptionFilePath: "/description/stage5.md",
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
        descriptionFilePath: "/description/stage6.md",
        tests: [
            {
                title: "Single client - input output",
                description: "This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on",
                testInput: "client sends a randomly generated string to the server",
                expectedBehavior: "client receives reversed version of the input",
                testFunction: async () => {
                    const responses = [
                        await stage1StringReversal(8001),
                        await stage1StringReversal(8002),
                        await stage1StringReversal(8003),
                        await stage1StringReversal(8004)
                    ];

                    if (responses.some(response => response.passed == false)) {
                        return ({
                            passed: true,
                            testInput: responses[0].testInput,
                            expectedBehavior: responses[0].expectedBehavior,
                            observedBehavior: "Server didn't work as expected on all ports",
                        })
                    }
                    else {
                        return ({
                            passed: true,
                            testInput: responses[0].testInput,
                            expectedBehavior: responses[0].expectedBehavior,
                            observedBehavior: responses[0].expectedBehavior,
                        })
                    }
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their reversed versions of the string that they sent",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected",
                testInput: "client forcefully disconnects",
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
        descriptionFilePath: "/description/stage7.md",
        tests: [
            {
                title: "Single client - input output",
                description: "This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on",
                testInput: "client sends a randomly generated string to the server",
                expectedBehavior: "client receives reversed version of the input",
                testFunction: async () => {
                    const responses = [
                        await stage1StringReversal(8001),
                        await stage1StringReversal(8002),
                        await stage1StringReversal(8003),
                        await stage1StringReversal(8004)
                    ];

                    if (responses.some(response => response.passed == false)) {
                        return ({
                            passed: true,
                            testInput: responses[0].testInput,
                            expectedBehavior: responses[0].expectedBehavior,
                            observedBehavior: "Server didn't work as expected on all ports",
                        })
                    }
                    else {
                        return ({
                            passed: true,
                            testInput: responses[0].testInput,
                            expectedBehavior: responses[0].expectedBehavior,
                            observedBehavior: responses[0].expectedBehavior,
                        })
                    }
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their reversed versions of the string that they sent",
                testFunction: async () => {
                    const response = await stage3MultipleClients(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected",
                testInput: "client forcefully disconnects",
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
        descriptionFilePath: "/description/stage8.md",
        tests: [
            {
                title: "Non-blocking server",
                description: "creates a tcp connection to the tcp server running on the given port sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking waits for 5 seconds, then creates a second connection",
                testInput: "a client is connected to the server and sends a large file, but does not receive any data from the server. After 30 seconds, a second client is connected to the server, and verifies if the server responds",
                expectedBehavior: "the second connection is able to send and receive data from the server",
                testFunction: async () => {
                    const response = await stage8NonBlockingTest(8001);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Single client - input output",
                description: "This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on",
                testInput: "client sends a randomly generated string to the server",
                expectedBehavior: "client receives reversed version of the input",
                testFunction: async () => {
                    const responses = [
                        await stage1StringReversal(8001),
                        await stage1StringReversal(8002),
                        await stage1StringReversal(8003),
                        await stage1StringReversal(8004)
                    ];

                    if (responses.some(response => response.passed == false)) {
                        return ({
                            passed: true,
                            testInput: responses[0].testInput,
                            expectedBehavior: responses[0].expectedBehavior,
                            observedBehavior: "Server didn't work as expected on all ports",
                        })
                    }
                    else {
                        return ({
                            passed: true,
                            testInput: responses[0].testInput,
                            expectedBehavior: responses[0].expectedBehavior,
                            observedBehavior: responses[0].expectedBehavior,
                        })
                    }
                },
                status: TestStatus.Pending,
            },
            {
                title: "Multiple clients to same port - input output",
                description: "This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client",
                testInput: "Connect multiple clients to server and sent string simultaneously",
                expectedBehavior: "Each of the clients should receive their reversed versions of the string that they sent",
                testFunction: async (...args) => {
                    const response = await stage3MultipleClients(8001, ...args);
                    return response;
                },
                status: TestStatus.Pending,
            },
            {
                title: "Error handling",
                description: "In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected",
                testInput: "client forcefully disconnects",
                expectedBehavior: "Previous and new clients are able to send and receive output as expected",
                testFunction: async (...args) => {
                    const response = await stage3ErrorHandling(8001, ...args);
                    return response;

                },
                status: TestStatus.Pending,
            },
        ],
    },
    stage9: {
        stageName: "Epoll Edge Triggered",
        descriptionFilePath: "/description/stage9.md",
        tests: [
            {
                title: "CPU usage",
                description: "This test verifies that the process doesn't consume CPU time unnecessarily by creating an idle client connection and tracks CPU usage over the course of 20 seconds",
                testInput: "Creates an idle client connection and tracks CPU usage over the course of 20 seconds",
                expectedBehavior: "CPU usage should be less than 10%",
                testFunction: async (...args) => {
                    const response = await stage9checkCpuUsage(8001, ...args);
                    return response;
                },
                status: TestStatus.Pending,
            }
        ]
    }
}