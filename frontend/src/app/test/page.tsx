"use client";

import axios from "axios";
import { ChangeEvent, useEffect, useState } from "react";
import { io, Socket } from 'socket.io-client';

const Test = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [userId, setUserId] = useState<string>("");
    const [stageDesc, setStageDesc] = useState<string>("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [stageNo, setStageNo] = useState<number>(8);

    const [results, setResults] = useState<string>("");
    const [terminal, setTerminal] = useState<string[]>([]);

    useEffect(() => {
        setStageNo(8);
        const preload = async () => {
            if (localStorage.getItem('userId'))
                setUserId(localStorage.getItem('userId'));
            else {
                const response = await axios.get<{ token: string }>('http://localhost:6969/token')
                setUserId(response.data.token);
                localStorage.setItem('userId', response.data.token);

            }
            const id = localStorage.getItem('userId');


            const socketIo = io('http://localhost:6970');
            setSocket(socketIo);





            socketIo.on('connection-ack', () => {
                console.log('connection-ack')
                socketIo.emit('request-state', ({ stageNo, userId: id }));
            })

            socketIo.on("current-state", (data) => {
                console.log('current-state')
                setResults(data);
            })

            socketIo.on('stage-tests-update', (data) => {
                console.log('stage-tests-update')
                setResults(data);
            })

            socketIo.on('stage-tests-complete', () => {
                console.log('stage-tests-complete')
            })

            socketIo.on('stage-terminal-update', (data) => {
                console.log('stage-terminal-update', data.toString());
                const temp = data.toString();
                setTerminal(temp.split('\n'));
            })

            socketIo.on('stage-terminal-complete', (data) => {
                const temp = data.toString();
                setTerminal(temp.split('\n'));
                console.log('stage-terminal-complete');

            })


            const stageDescRes = await axios.get(`http://localhost:6969/stage/${stageNo}`, {
                headers: {
                    Authorization: `Bearer ${id}`,
                }
            });

            console.log(stageDescRes.data);
            setStageDesc(stageDescRes.data.title + ' ' + stageDescRes.data.description);

        }

        void preload();
    }, []);

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0])
            setSelectedFile(event.target.files[0]);
    }

    const onSubmit = async () => {
        if (!selectedFile) {
            console.log("no file selected");
            return;
        }

        const formData = new FormData();
        formData.append('binary', selectedFile);

        try {
            const response = await axios.post(`http://localhost:6969/stage/${stageNo}/binary`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${userId}`
                }
            });

            console.log(response.data);
        }
        catch (error) {
            console.log(error);
        }
    }
    return (
        <div className="w-screen p-20 h-full min-h-screen text-white bg-neutral-800 flex flex-col justify-center items-center">
            <input
                type="file"
                onChange={onFileChange}
            />
            <button
                onClick={onSubmit}
            > Upload </button>

            <div className="flex gap-2 justify-center items-center">
                <button onClick={() => {
                    console.log(socket);
                    socket.emit('run')
                }}> Run </button>
                <button onClick={() => socket.emit('stop')}> Stop </button>
            </div>

            <div className="mt-5">
                {stageDesc}
                <br />
                userId: {userId}
                stageNo: {stageNo}
            </div>


            <div className="mt-5 h-full w-full p-4 bg-white text-black">
                {JSON.stringify(results)}
            </div>

            <div className="mt-5 h-full w-full p-4 bg-white text-black">
                {
                    terminal.map((line, index) => (
                        <div key={index}>
                            {line}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Test;