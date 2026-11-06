import { Test } from "../../types";
import { ipHashMultiClientTest, ipHashSameClientTest, roundRobinTest } from "../loadbalancing";

/**
 * Upstreams started by ContainerManager for stage 20.
 * Each one answers "upstream-<port>" on "/".
 */
const UPSTREAM_PORTS = [3000, 3001, 3002];

/**
 * Listener ports the stage 20 xps_config.json must define.
 * Every one of them proxies "/" to all three upstreams.
 */
const ROUND_ROBIN_PORT = 8001; // "load_balancing": "round_robin"
const IP_HASH_PORT = 8002; // "load_balancing": "ip_hash"
const DEFAULT_PORT = 8003; // no "load_balancing" field

const ROUNDS = 6;

const rrExpected = Array.from({ length: ROUNDS }, (_, i) => `request ${i + 1} -> upstream-${UPSTREAM_PORTS[i % UPSTREAM_PORTS.length]}`).join("\n");

const ipHashIps = ["127.0.0.2", "127.0.0.3", "127.0.0.4", "127.0.0.5", "127.0.0.6", "127.0.0.7"];

export const stage20Tests: Omit<Test, "status">[] = [
    {
        title: "Round robin across three upstreams",
        description:
            "This test ensures a route with \"load_balancing\": \"round_robin\" cycles through its upstreams in order",
        testInput: `Sends ${ROUNDS} requests, one after another, to the round_robin route on port ${ROUND_ROBIN_PORT}`,
        expectedBehavior: rrExpected,
        requireRestart: true, // the round robin counter must start at 0
        testFunction: async (...args) => {
            return await roundRobinTest(ROUND_ROBIN_PORT, UPSTREAM_PORTS, ROUNDS, ...args);
        },
    },
    {
        title: "Round robin is the default strategy",
        description:
            "This test ensures a reverse proxy route without a \"load_balancing\" field falls back to round robin",
        testInput: `Sends ${ROUNDS} requests, one after another, to the route on port ${DEFAULT_PORT} which has no load_balancing field`,
        expectedBehavior: rrExpected,
        requireRestart: true,
        testFunction: async (...args) => {
            return await roundRobinTest(DEFAULT_PORT, UPSTREAM_PORTS, ROUNDS, ...args);
        },
    },
    {
        title: "IP hash keeps a client on the same upstream",
        description:
            "This test ensures a route with \"load_balancing\": \"ip_hash\" always sends requests from one client IP to the same upstream",
        testInput: `Sends 5 requests from 127.0.0.2 to the ip_hash route on port ${IP_HASH_PORT}`,
        expectedBehavior: "All 5 requests are served by the same upstream",
        testFunction: async (...args) => {
            return await ipHashSameClientTest(IP_HASH_PORT, UPSTREAM_PORTS, "127.0.0.2", 5, ...args);
        },
    },
    {
        title: "IP hash depends on the client IP",
        description:
            "This test ensures ip_hash is stable for every client IP and that different client IPs are not all sent to a single upstream",
        testInput: `Sends 3 requests from each of ${ipHashIps.join(", ")} to the ip_hash route on port ${IP_HASH_PORT}`,
        expectedBehavior:
            "Each client IP is always served by the same upstream, and the client IPs are spread over at least two different upstreams",
        testFunction: async (...args) => {
            return await ipHashMultiClientTest(IP_HASH_PORT, UPSTREAM_PORTS, ipHashIps, 3, ...args);
        },
    },
];