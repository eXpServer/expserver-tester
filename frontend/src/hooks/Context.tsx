import { getToken } from "@/lib/rest";
import { WebSocket } from "@/lib/WebSocket";
import { FinalSummary, TestDetails } from "@/types";
import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";

interface SocketContextInterface {
    stageNo: number,
    userId: string,
    results: TestDetails[],
    summary: FinalSummary,
    resourceMetrics: { cpu: number, mem: number },
    terminalData: string[],
    binaryId: string,
    status: "pending" | "running" | "finished" | "force-stopped",
    loading: boolean,

    updateStage: (stageNo: number) => void,
    runTests: () => void,
    stopTests: () => void,
    updateBinaryId: (binaryId: string | null) => void;
}

export const SocketContext = createContext<SocketContextInterface>(null);

export const SocketContextProvider = ({
    children
}: {
    children: ReactNode
}) => {
    const [stageNo, setStageNo] = useState<number>(1);
    const [userId, setUserId] = useState<string>("");
    const [binaryId, setBinaryId] = useState<string>("");
    const socket = useRef<WebSocket>(new WebSocket());
    const [status, setStatus] = useState<"pending" | "running" | "finished" | "force-stopped">("pending");
    const [loading, setLoading] = useState<boolean>(false);

    const [results, setResults] = useState<TestDetails[]>([]);
    const [summary, setSummary] = useState<FinalSummary>();
    const [resourceMetrics, setResourceMetrics] = useState<{ cpu: number, mem: number }>();
    const [terminalData, setTerminalData] = useState<string[]>([]);

    useEffect(() => {
        const ws = socket.current;
        const preload = async () => {
            setLoading(true);
            const savedUserId = localStorage.getItem('userId');
            if (savedUserId) {
                setUserId(savedUserId);

                await ws.initialize(savedUserId);
                await setCallbacks(ws);
            }
            else {
                const token = await getToken();
                localStorage.setItem('userId', token);
                setUserId(token);

                await ws.initialize(token);
                await setCallbacks(ws);
            }
        }

        preload().then(() => {
            setLoading(false);
            updateStage(1);
        })

        return () => {
            void ws?.kill();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const testUpdateCallback = (data: TestDetails[]) => {
        console.log("test-update", data);
        setResults(data)
    }
    const testCompleteCallback = (data: FinalSummary) => {
        console.log("test-complete", data);
        setSummary(data);
        setStatus('finished');
    }
    const resourceMonitorCallback = (data: { cpu: number, mem: number }) => {
        console.log("resource-monitor", data);
        setResourceMetrics(data)
    }
    const terminalCallback = (data: string) => {
        console.log("terminal-update", data);
        setTerminalData([...terminalData, data])
    }

    const setCallbacks = async (socket: WebSocket) => {
        socket.setTestCallbacks(testUpdateCallback, testCompleteCallback);
        socket.setResourceMonitorCallbacks(resourceMonitorCallback);
        socket.setTerminalCallbacks(terminalCallback);
    }


    const updateStage = async (stageNo: number) => {
        setLoading(true);

        setStageNo(stageNo);
        const { binaryId, running, testDetails } = await socket.current.changeStage(stageNo);
        setBinaryId(binaryId);
        setStatus(running ? "running" : "pending");
        setResults(testDetails);

        setLoading(false);
    }

    const runTests = async () => {
        setLoading(true);

        const data = await socket.current.run();
        setResults(data);
        setStatus("running");

        setLoading(false);
    }

    const stopTests = async () => {
        setLoading(true);
        const summary = await socket.current.stop();
        setSummary(summary);
        setStatus("force-stopped");

        setLoading(false);
    }

    const updateBinaryId = (binaryId: string | null) => setBinaryId(binaryId);

    return (
        <SocketContext.Provider
            value={{
                // states
                stageNo,
                userId,
                results,
                summary,
                resourceMetrics,
                terminalData,
                binaryId,
                status,
                loading,


                //functions
                updateStage,
                runTests,
                stopTests,
                updateBinaryId,
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}