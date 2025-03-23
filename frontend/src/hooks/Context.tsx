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
    timer: number,

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
    const [timer, setTimer] = useState<number>(-1);

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

    const testPreflightCallback = (data: { timeTaken: number, testDetails: TestDetails[] }) => {
        console.log('hi', data);
        setResults(data.testDetails);
        setTimer(data.timeTaken);
    };

    const resourceMonitorCallback = (data: { cpu: number, mem: number }) => {
        setResourceMetrics(data)
    };

    const terminalCallback = (data: string[]) => {
        setTerminalData(data)
    };

    const timerCallack = (data: number) => {
        setTimer(data);
    }

    const setCallbacks = async (socket: WebSocket) => {
        socket.setTestCallbacks(testUpdateCallback, testCompleteCallback, testPreflightCallback);
        socket.setResourceMonitorCallbacks(resourceMonitorCallback);
        socket.setTerminalCallbacks(terminalCallback);
        socket.setTimerCallbacks(timerCallack);
    }

    const resetResults = () => {
        setResults(prev => prev.map(ele => ({ ...ele, status: TestStatus.Pending })));
    }

    const resetContext = () => {
        setSummary(null);
        setTimer(-1);
        setTerminalData([]);
    }

    const updateStage = async (newStageNo: number) => {
        if (newStageNo == stageNo)
            return;
        setLoading(true);

        setStageNo(newStageNo);
        resetContext();
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
                timer,


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