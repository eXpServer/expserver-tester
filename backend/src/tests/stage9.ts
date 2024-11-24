import { ChildProcessWithoutNullStreams } from "child_process";
import { TestFunction } from "../types";
import { Socket } from "net";
import { LOCALHOST } from "../constants";
import { getCpuUsage } from "../utils/process";

export const stage9checkCpuUsage: TestFunction = (port: number, spawnInstance: ChildProcessWithoutNullStreams) => {
    const testInput = "Creates an idle client connection and tracks CPU usage over the course of 20 seconds";
    const expectedBehavior = "CPU usage should be less than 10%";
    return new Promise((resolve, _) => {
        const NUM_ITERATIONS = 30;
        const client = new Socket();

        spawnInstance.on('error', error => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: `Server crashed with error ${error}`
            })
        })

        const calcAvergeUsage = (results: number[]) => {
            let total = 0;
            for (let i = 0; i < results.length; i++) {
                total += results[i];
            }
            const average = total / results.length;
            return average;
        }

        client.on('connectionAttemptFailed', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Server refused connection",
            })
        });

        client.on('connectionAttemptTimeout', () => {
            return resolve({
                passed: false,
                testInput,
                expectedBehavior,
                observedBehavior: "Server connection timed out",
            })
        })

        client.connect(port, LOCALHOST, () => {
            const results = Array<number>(NUM_ITERATIONS);
            let index = NUM_ITERATIONS - 1;


            const interval = setInterval(async () => {
                if (index < 0) {
                    const average = calcAvergeUsage(results);
                    const observedBehavior = `CPU usage was ${average}%`;
                    client.destroy();
                    clearInterval(interval);
                    return resolve({
                        testInput,
                        expectedBehavior,
                        observedBehavior,
                        passed: average <= 0.10,
                    });
                }

                const cpuUsage = await getCpuUsage(spawnInstance.pid);
                results[NUM_ITERATIONS - index - 1] = cpuUsage;
                index--;
            }, 1000);
        })
    });
}