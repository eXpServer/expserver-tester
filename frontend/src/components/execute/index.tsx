'use client'
import { ChangeEvent, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import styles from './execute.module.css'
// import local from 'next/font/local'
import { deleteBinary, getToken, uploadBinary } from '@/lib/rest'
// import { WebSocket } from '@/lib/WebSocket'
import { io, Socket } from 'socket.io-client'
import { useSocketContext } from '@/hooks/useSocketContext'
const Execute = () => {

    const {
        stageNo,
        userId,
        status,
        binaryId,
        updateBinaryId,
        runTests,
        stopTests,
        results,
        summary,
    } = useSocketContext();
    const [file, setFile] = useState<File | null>(null);

    const disableButton = useMemo(() => {
        return (binaryId == null);
    }, [binaryId]);

    const handleUploadDelete = async () => {
        if (binaryId) {
            await deleteBinary(stageNo, userId);
            updateBinaryId(null);
            console.log('filel deleted successfully');
        }
        else {
            const response = await uploadBinary(stageNo, userId, file);
            updateBinaryId(response);
            console.log("file uploaded successfully");
        }
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.files);
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    }

    const handleRunStop = async () => {
        if (status == 'running')
            stopTests();
        else
            runTests();
    }

    return (
        <div className={styles.execute}>
            <div>Execute {stageNo}</div>
            <div className='flex items-center justify-center gap-2'>
                <input type="file" placeholder="select a file" className='border-[1px] w-[200px]' onChange={handleFileChange} />
                <button className='border-[1px] p-2 bg-blue-500 text-white' onClick={handleUploadDelete}>
                    {
                        binaryId ? 'Delete' : 'Upload'
                    }
                </button>
                <button disabled={disableButton} className={styles['execute-run']} onClick={handleRunStop}>
                    {
                        status == 'running' ? 'Stop' : 'Run'
                    }
                </button>
            </div>


            <div className='outline outline-black h-full mt-2'>
                {
                    results.map((result, index) => (
                        <div key={index} className='border-[1px] p-2'>
                            <div>input: {result.testInput}</div>
                            <div>expected: {result.expectedBehavior}</div>
                            <div>observed: {result.observedBehavior}</div>
                            <div>status: {result.status}</div>
                        </div>
                    ))
                }
                <div className='outline outline-red-200 h-full mt-2' >
                    <span> Test Status: {status}</span>
                    {
                        summary && (
                            <div>
                                <div>Passed: {summary.numPassed}</div>
                                <div>Failed: {summary.numFailed}</div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Execute;