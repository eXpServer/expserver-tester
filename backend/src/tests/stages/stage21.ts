import { Test } from "../../types";
import {
    MAX_CLOSE_S,
    MIN_CLOSE_S,
    activityResetTest,
    idleTimeoutTest,
    independentSessionsTest,
    keepAliveTest,
} from "../timeouts";

/**
 * Port the stage 21 xps_config.json listens on.
 */
const PORT = 8001;

/**
 * The default request timeout is 60 seconds, so every test here waits in
 * real time. Together the tests take about 5 minutes.
 */
const WINDOW = `between ${MIN_CLOSE_S} and ${MAX_CLOSE_S} seconds`;

const IDLE_BEFORE_REQUEST_S = 30;
const KEEP_ALIVE_REQUESTS = 1;
const KEEP_ALIVE_INTERVAL_S = 35;
const SESSION_GAP_S = 30;

export const stage21Tests: Omit<Test, "status">[] = [
    {
        title: "Idle connection is closed after the default timeout",
        description:
            "This test ensures the server closes a connection that stays inactive for the default 60 second request timeout",
        testInput: `Opens a connection to the server on port ${PORT} and sends nothing`,
        expectedBehavior: `The server closes the connection ${WINDOW} after it was opened`,
        testFunction: async (...args) => {
            return await idleTimeoutTest(PORT, ...args);
        },
    },
    {
        title: "Client activity resets the timeout",
        description:
            "This test ensures the session timer is reset when the client sends data, so the connection is not closed at the original expiry time",
        testInput: `Opens a connection, waits ${IDLE_BEFORE_REQUEST_S} seconds, sends one HTTP request, then stays idle`,
        expectedBehavior: `The request is answered, and the connection is closed ${WINDOW} after that request, not 60 seconds after it was opened`,
        testFunction: async (...args) => {
            return await activityResetTest(PORT, IDLE_BEFORE_REQUEST_S, ...args);
        },
    },
    {
        title: "Keep-alive requests keep the connection open",
        description:
            "This test ensures every request and response on a keep-alive connection resets the timer",
        testInput: `Sends ${KEEP_ALIVE_REQUESTS} requests on one connection, ${KEEP_ALIVE_INTERVAL_S} seconds apart (${(KEEP_ALIVE_REQUESTS - 1) * KEEP_ALIVE_INTERVAL_S} seconds in total, longer than the 60 second timeout)`,
        expectedBehavior: `All ${KEEP_ALIVE_REQUESTS} requests are answered on the same connection and the connection is never closed in between`,
        testFunction: async (...args) => {
            return await keepAliveTest(PORT, KEEP_ALIVE_REQUESTS, KEEP_ALIVE_INTERVAL_S, ...args);
        },
    },
    {
        title: "Sessions time out independently",
        description:
            "This test ensures every session has its own timer, and that one session timing out does not affect the others",
        testInput: `Opens connection A, opens connection B ${SESSION_GAP_S} seconds later, and keeps both idle`,
        expectedBehavior: `Connection A is closed ${WINDOW} after it was opened, connection B stays open until its own timeout, and B is closed ${WINDOW} after it was opened`,
        testFunction: async (...args) => {
            return await independentSessionsTest(PORT, SESSION_GAP_S, ...args);
        },
    },
];