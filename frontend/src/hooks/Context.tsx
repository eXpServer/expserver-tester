import { getToken } from "@/lib/rest";
import { WebSocket } from "@/lib/WebSocket";
import { TestDetails } from "@/types";
import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";

interface SocketContextInterface {
    stageNo: number,
    userId: string,
    results: TestDetails[],
    binaryId: string,
    status: "pending" | "running" | "finished" | "force-stopped",
    loading: boolean,

    updateStage: (stageNo: number) => void,
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
    const [resourceMetrics, setResourceMetrics] = useState<{ cpu: number, mem: number }>();
    const [terminalData, setTerminalData] = useState<string[]>([]);

    useEffect(() => {
        const preload = async () => {
            setLoading(true);

            const savedUserId = localStorage.getItem('userId');
            if (savedUserId) {
                setUserId(savedUserId);
                setSocket(new WebSocket(savedUserId));
            }
            else {
                const token = await getToken();
                localStorage.setItem('userId', token);
                setUserId(token);
                setSocket(new WebSocket(token));
            }

            setLoading(false);
        }

        void preload();
    }, []);


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

        await socket.run();
        setStatus("running");

        setLoading(false);
    }

    const stopTests = async () => {
        setLoading(true);

        await socket.stop();
        setStatus("force-stopped");

        setLoading(false);
    }

    // const testUpdateCallback = (data) => {
    //     const testDetails = JSON.parse(data.toString())
    // }

    const setCallbacks = async () => {

    }


    return (
        <SocketContext.Provider
            value={{
                // states
                stageNo,
                userId,
                results,
                binaryId,
                status,
                loading,


                //functions
                updateStage,
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}