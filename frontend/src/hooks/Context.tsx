import { getToken } from "@/lib/rest";
import { WebSocket } from "@/lib/WebSocket";
import { FinalSummary, TestDetails } from "@/types";
import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";

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
    const [stageNo, setStageNo] = useState<number>(-1);
    const [userId, setUserId] = useState<string>("");
    const [binaryId, setBinaryId] = useState<string>("");
    const [socket, setSocket] = useState<WebSocket>(null);
    const [status, setStatus] = useState<"pending" | "running" | "finished" | "force-stopped">("pending");
    const [loading, setLoading] = useState<boolean>(false);

    const [results, setResults] = useState<TestDetails[]>();
    const [summary, setSummary] = useState<FinalSummary>();
    const [resourceMetrics, setResourceMetrics] = useState<{ cpu: number, mem: number }>();
    const [terminalData, setTerminalData] = useState<string[]>([]);

    useEffect(() => {
        const preload = async () => {
            setLoading(true);

            const savedUserId = localStorage.getItem('userId');
            const newSocket = new WebSocket();
            if (savedUserId) {
                setUserId(savedUserId);

                await newSocket.initialize(savedUserId);
                setSocket(newSocket);
                await setCallbacks(newSocket);
            }
            else {
                const token = await getToken();
                localStorage.setItem('userId', token);
                setUserId(token);

                await newSocket.initialize(token);
                setSocket(newSocket);
                await setCallbacks(newSocket);
            }

            setLoading(false);
        }

        void preload();

        return () => {
            void socket?.kill();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const testUpdateCallback = (data: TestDetails[]) => setResults(data)
    const testCompleteCallback = (data: FinalSummary) => {
        setSummary(data);
        setStatus('finished');
    }
    const resourceMonitorCallback = (data: { cpu: number, mem: number }) => setResourceMetrics(data)
    const terminalCallback = (data: string) => setTerminalData([...terminalData, data])

    const setCallbacks = async (socket: WebSocket) => {
        socket.setTestCallbacks(testUpdateCallback, testCompleteCallback);
        socket.setResourceMonitorCallbacks(resourceMonitorCallback);
        socket.setTerminalCallbacks(terminalCallback);
    }


    const updateStage = async (stageNo: number) => {
        setLoading(true);

        setStageNo(stageNo);
        const { binaryId, running, testDetails } = await socket.changeStage(stageNo);
        setBinaryId(binaryId);
        setStatus(running ? "running" : "pending");
        setResults(testDetails);

        setLoading(false);
    }

    const runTests = async () => {
        setLoading(true);

        const data = await socket.run();
        setResults(data);
        setStatus("running");

        setLoading(false);
    }

    const stopTests = async () => {
        setLoading(true);

        const summary = await socket.stop();
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