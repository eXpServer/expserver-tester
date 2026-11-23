import { ContainerManager } from "../core/ContainerManager";
import { TestFunctionReturnType } from "../types";

/**
 * Runs a test body and makes sure it always produces a result.
 *
 *  - If the server container reports an "error" (it crashed) while the test
 *    is running, the test fails immediately instead of waiting for a timeout.
 *  - If the body throws, the error becomes a failed result.
 *  - The crash listener is always removed afterwards. The container object
 *    lives across tests, so leftover listeners would pile up.
 */
export const withCrashGuard = async (
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