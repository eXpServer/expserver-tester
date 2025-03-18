import { Test } from "../../types";
import { httpFileServerTest, httpProxyTest, httpRedirectTest } from "../http";

export const stage16Tests: Omit<Test, 'status'>[] = [
    {
        title: "File server (1)",
        description: "This tests verifies the server abides by the file serving config set by the custom xps_config file",
        testInput: "",
        expectedBehavior: "",
        testFunction: async (...args) => {
            const response = await httpFileServerTest('cat.jpg', 'image/jpeg', 8001, ...args);
            return response;
        }
    },
    {
        title: "File server (2)",
        description: "This tests verifies the server abides by the file serving config set by the custom xps_config file",
        testInput: "",
        expectedBehavior: "",
        testFunction: async (...args) => {
            const response = await httpFileServerTest('sample.pdf', 'application/pdf', 8001, ...args);
            return response;
        }
    },
    {
        title: "File server (3)",
        description: "This tests verifies the server abides by the file serving config set by the custom xps_config file",
        testInput: "",
        expectedBehavior: "",
        testFunction: async (...args) => {
            const response = await httpFileServerTest('sample.txt', 'text/plain', 8001, ...args);
            return response;
        }
    },
    {
        title: "Redirect",
        description: "",
        testInput: "",
        expectedBehavior: "",
        testFunction: async (...args) => {
            const response = httpRedirectTest('redirect', 'http://localhost:8002/', 8001, ...args);
            return response;
        }
    },
    {
        title: "HTTP Proxy",
        description: "",
        testInput: "",
        expectedBehavior: "",
        testFunction: async (...args) => {
            const response = httpProxyTest('cat.jpg', 8002, 3000, ...args);
            return response;
        }
    }
]