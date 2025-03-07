import { Test } from "../../types";
import { proxyServerCrashHandling } from "../errorhandling";
import { prematureFileServerTest, proxyMultipleConnections } from "../loadtests";

export const stage13Tests: Omit<Test, 'status'>[] = [
    {
        title: "proxy response checking -- multiple clients",
        description: "creates multiple clients and verifies if the clients receive the responses meant for them, as well as if the response is matching the response received directly from the dummy server",
        testInput: "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2",
        expectedBehavior: "client 1 receives response from /test/1 && client 2 gets response from /test/2",
        testFunction: async (...args) => {
            const response = await proxyMultipleConnections(8001, ...args);
            return response;
        },

    },
    {
        title: "Error handling",
        description: "",
        testInput: "",
        expectedBehavior: "",
        testFunction: async (...args) => {
            const response = await proxyServerCrashHandling(8001, ...args);
            return response;

        },
    },
    {
        title: "File server response",
        description: "This test ensures the file server responds with the 'sample.txt' file stored within the public folder",
        testInput: "Connects to the file server",
        expectedBehavior: "Server responds with the contents of 'sample.txt' without needing any input from the client",
        testFunction: async (...args) => {
            const response = await prematureFileServerTest(8002, ...args);
            return response;
        }
    },
]