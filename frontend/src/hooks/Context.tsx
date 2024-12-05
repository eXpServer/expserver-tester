import { getStageDescription, getToken } from "@/lib/rest";
import { WebSocket } from "@/lib/WebSocket";
import { FinalSummary, TestDetails, TestStatus } from "@/types";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";

interface SocketContextInterface {
    stageNo: number,
    userId: string,
    description: string,
    results: TestDetails[],
    summary: FinalSummary,
    resourceMetrics: { cpu: number, mem: number },
    terminalData: string[],
    fileName: string,
    binaryId: string,
    status: "pending" | "running" | "finished" | "force-stopped",
    loading: boolean,

    initializeSocket: () => Promise<boolean>,
    updateStage: (stageNo: number) => void,
    runTests: () => void,
    stopTests: () => void,
    updateBinaryId: (binaryId: string | null) => void,
    resetResults: () => void,
}

export const SocketContext = createContext<SocketContextInterface>(null);

export const SocketContextProvider = ({
    children
}: {
    children: ReactNode
}) => {
    const [stageNo, setStageNo] = useState<number>(-1);
    const [userId, setUserId] = useState<string | null>("");
    const [fileName, setFileName] = useState<string | null>(null);
    const [binaryId, setBinaryId] = useState<string | null>(null);
    const socket = useRef<WebSocket>(new WebSocket());
    const [status, setStatus] = useState<"pending" | "running" | "finished" | "force-stopped">("pending");
    const [loading, setLoading] = useState<boolean>(false);
    const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
    const [results, setResults] = useState<TestDetails[]>([]);
    const [summary, setSummary] = useState<FinalSummary>();
    const [resourceMetrics, setResourceMetrics] = useState<{ cpu: number, mem: number }>();
    const [terminalData, setTerminalData] = useState<string[]>([]);
    const [description, setDescription] = useState<string>("");

    useEffect(() => {
        getStageDescription(stageNo, userId).then(data => {
            setDescription(data);
        })
    }, [stageNo, userId, binaryId]);

    const initializeSocket = async (): Promise<boolean> => {
        const ws = socket.current;

        if (socketInitialized) return true;

        setLoading(true);

        let savedUserId = localStorage.getItem('userId');
        if (!savedUserId) {
            const token = await getToken();
            localStorage.setItem('userId', token);
            savedUserId = token;
        }

        setUserId(savedUserId);
        await ws.initialize(savedUserId);

        await setCallbacks(ws);

        setLoading(false);
        setSocketInitialized(true);

        return true;
    }

    const testUpdateCallback = (data: TestDetails[]) => {
        setResults(data);
    }
    const testCompleteCallback = (data: FinalSummary) => {
        setSummary(data);
        setStatus('finished');
    };
    const resourceMonitorCallback = (data: { cpu: number, mem: number }) => {
        console.log('Resource Monitor:', data);
        setResourceMetrics(data)
    };
    const terminalCallback = (data: string) => {
        // console.log(data);
        setTerminalData([...terminalData, data])
    };

    const setCallbacks = async (socket: WebSocket) => {
        socket.setTestCallbacks(testUpdateCallback, testCompleteCallback);
        socket.setResourceMonitorCallbacks(resourceMonitorCallback);
        socket.setTerminalCallbacks(terminalCallback);
    }

    const resetResults = () => {
        setResults(prev => prev.map(ele => ({ ...ele, status: TestStatus.Pending })));
    }

    const updateStage = async (newStageNo: number) => {
        if (newStageNo == stageNo)
            return;
        setLoading(true);

        setStageNo(newStageNo);
        const { fileName, binaryId, running, testDetails } = await socket.current.changeStage(newStageNo);
        setBinaryId(binaryId);
        setStatus(running ? "running" : "pending");
        setResults(testDetails);
        setFileName(fileName);

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
                description,
                results,
                summary,
                resourceMetrics,
                terminalData,
                fileName,
                binaryId,
                status,
                loading,


                //functions
                initializeSocket,
                updateStage,
                runTests,
                stopTests,
                updateBinaryId,
                resetResults,
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}