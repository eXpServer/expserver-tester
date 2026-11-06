import http from "http";
import type { Container } from "dockerode";
import { ContainerManager } from "../core/ContainerManager";
import { TestFunction, TestFunctionReturnType } from "../types";

/**
 * Each stage 20 upstream answers every request with its own name,
 * e.g. the server on port 3001 responds with "upstream-3001".
 */
export const upstreamName = (port: number) => `upstream-${port}`;

type UpstreamResponse = { status: number; body: string };

/**
 * Plain HTTP GET with keep-alive disabled, so every call is a brand new
 * connection and the proxy has to pick an upstream again.
 */
const fetchUpstream = (host: string, port: number): Promise<UpstreamResponse> => {
    return new Promise((resolve, reject) => {
        const req = http.get(
            { host, port, path: "/", agent: false, headers: { Connection: "close" }, timeout: 5000 },
            (res) => {
                let body = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => resolve({ status: res.statusCode ?? 0, body: body.trim() }));
                res.on("error", reject);
            }
        );
        req.on("error", reject);
        req.on("timeout", () => req.destroy(new Error("request timed out")));
    });
};

/**
 * Runs a command inside the server container and returns its output.
 * Tty is enabled so the output is not multiplexed.
 */
const runInContainer = async (container: Container, cmd: string[]): Promise<string> => {
    const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
    });
    const stream = await exec.start({ hijack: true, stdin: false, Tty: true } as any);

    return new Promise((resolve, reject) => {
        let output = "";
        stream.on("data", (chunk: Buffer) => (output += chunk.toString()));
        stream.on("end", () => resolve(output.replace(/\r/g, "").trim()));
        stream.on("error", reject);
    });
};

/**
 * Sends one request to the proxy from the given source IP.
 *
 * All of 127.0.0.0/8 is local inside the container, so the request can be
 * made from 127.0.0.2, 127.0.0.3, ... without any network setup.
 * The request runs inside the container because the tester itself always
 * connects from a single Docker network address.
 */
const PY_GET = [
    "import http.client, sys",
    'c = http.client.HTTPConnection("127.0.0.1", int(sys.argv[2]), source_address=(sys.argv[1], 0), timeout=5)',
    'c.request("GET", "/", headers={"Connection": "close"})',
    "r = c.getresponse()",
    'print(str(r.status) + " " + r.read().decode().strip())',
].join("\n");

const fetchFromSourceIp = async (container: Container, sourceIp: string, port: number): Promise<UpstreamResponse> => {
    const output = await runInContainer(container, ["python3", "-c", PY_GET, sourceIp, String(port)]);
    const lastLine = output.split("\n").pop() ?? "";
    const match = lastLine.match(/^(\d{3}) (.*)$/);
    if (!match)
        throw new Error(`no valid response from ${sourceIp} -> port ${port}: ${output.slice(-200) || "empty output"}`);
    return { status: Number(match[1]), body: match[2] };
};

/**
 * Resolves with a failed result if the server crashes mid-test,
 * and turns thrown errors into failed results.
 */
const withCrashGuard = async (
    spawnInstance: ContainerManager,
    work: () => Promise<TestFunctionReturnType>
): Promise<TestFunctionReturnType> => {
    let onError!: (error: unknown) => void;
    const crashed = new Promise<TestFunctionReturnType>((resolve) => {
        onError = (error) => resolve({ passed: false, observedBehavior: `server crashed with error ${error}` });
        spawnInstance.once("error", onError);
    });

    try {
        return await Promise.race([work(), crashed]);
    } catch (error) {
        return {
            passed: false,
            observedBehavior: error instanceof Error ? error.message : String(error),
        };
    } finally {
        spawnInstance.off("error", onError);
    }
};

/**
 * Sends `requests` sequential requests to the proxy and checks that the
 * upstreams are picked in order, wrapping around: 3000, 3001, 3002, 3000, ...
 */
export const roundRobinTest: TestFunction = (
    port: number,
    upstreamPorts: number[],
    requests: number,
    spawnInstance: ContainerManager
) => {
    return withCrashGuard(spawnInstance, async () => {
        const expected = Array.from({ length: requests }, (_, i) => upstreamName(upstreamPorts[i % upstreamPorts.length]));
        const observed: string[] = [];

        for (let i = 0; i < requests; i++) {
            const { status, body } = await fetchUpstream(spawnInstance.containerName, port);
            observed.push(status === 200 ? body : `status ${status}`);
        }

        const passed = expected.every((value, i) => observed[i] === value);
        return {
            passed,
            expectedBehavior: expected.map((v, i) => `request ${i + 1} -> ${v}`).join("\n"),
            observedBehavior: observed.map((v, i) => `request ${i + 1} -> ${v}`).join("\n"),
        };
    });
};

/**
 * Sends several requests from a single source IP and checks that they
 * are all served by the same (valid) upstream.
 */
export const ipHashSameClientTest: TestFunction = (
    port: number,
    upstreamPorts: number[],
    sourceIp: string,
    requests: number,
    spawnInstance: ContainerManager
) => {
    return withCrashGuard(spawnInstance, async () => {
        const valid = new Set(upstreamPorts.map(upstreamName));
        const observed: string[] = [];

        for (let i = 0; i < requests; i++) {
            const { status, body } = await fetchFromSourceIp(spawnInstance.container, sourceIp, port);
            observed.push(status === 200 ? body : `status ${status}`);
        }

        const allSame = observed.every((value) => value === observed[0]);
        const allValid = observed.every((value) => valid.has(value));

        return {
            passed: allSame && allValid,
            observedBehavior: `${sourceIp} was served by: ${observed.join(", ")}`,
        };
    });
};

/**
 * Sends several requests from each of several source IPs. Checks that
 *  1. every IP is always served by the same upstream, and
 *  2. the IPs are not all pinned to one upstream, i.e. the client IP is
 *     really what drives the selection.
 *
 * It deliberately does not check which upstream an IP maps to, because that
 * depends on how the student converts inet_pton() output to a number.
 */
export const ipHashMultiClientTest: TestFunction = (
    port: number,
    upstreamPorts: number[],
    sourceIps: string[],
    requestsPerIp: number,
    spawnInstance: ContainerManager
) => {
    return withCrashGuard(spawnInstance, async () => {
        const valid = new Set(upstreamPorts.map(upstreamName));
        const mapping: Record<string, string> = {};

        for (const ip of sourceIps) {
            const seen: string[] = [];
            for (let i = 0; i < requestsPerIp; i++) {
                const { status, body } = await fetchFromSourceIp(spawnInstance.container, ip, port);
                seen.push(status === 200 ? body : `status ${status}`);
            }

            if (!seen.every((value) => value === seen[0] && valid.has(value))) {
                return {
                    passed: false,
                    observedBehavior: `${ip} was not served by a single valid upstream: ${seen.join(", ")}`,
                };
            }
            mapping[ip] = seen[0];
        }

        const summary = sourceIps.map((ip) => `${ip} -> ${mapping[ip]}`).join("\n");
        const distinct = new Set(Object.values(mapping));
        if (distinct.size < 2) {
            return {
                passed: false,
                observedBehavior: `All ${sourceIps.length} client IPs were sent to the same upstream, so the client IP does not seem to influence selection:\n${summary}`,
            };
        }

        return { passed: true, observedBehavior: summary };
    });
};