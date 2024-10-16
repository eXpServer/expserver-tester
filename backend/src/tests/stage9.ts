import { ChildProcessWithoutNullStreams } from "child_process";
import { TestFunction } from "../types";
import { Socket } from "net";
import { LOCALHOST } from "../constants";
import { getCpuUsage } from "../utils/process";

export const stage9checkCpuUsage: TestFunction = (port: number, spawnInstance: ChildProcessWithoutNullStreams) => {
    const testInput = "Creates an idle client connection and tracks CPU usage over the course of 20 seconds";
    const expectedBehavior = "CPU usage should be less than 10%";
    return new Promise((resolve, _) => {
        const NUM_ITERATIONS = 20;
        const client = new Socket();

        const calcAvergeUsage = (results: number[]) => {
            let total = 0;
            for (let i = 0; i < results.length; i++) {
                total += results[i];
            }
            const average = total / results.length;
            return average;
        }

        client.connect(port, LOCALHOST, () => {
            const results = Array<number>(NUM_ITERATIONS);
            let index = 19;


            const interval = setInterval(async () => {
                if (index < 0) {
                    const average = calcAvergeUsage(results);
                    const observedBehavior = `CPU usage was ${average}%`;
                    client.end();
                    clearInterval(interval);
                    return resolve({
                        testInput,
                        expectedBehavior,
                        observedBehavior,
                        passed: average <= 10,
                    });
                }

                const cpuUsage = await getCpuUsage(spawnInstance.pid);
                results[NUM_ITERATIONS - index - 1] = cpuUsage;
                index--;
            }, 1000);
        })
    });
}