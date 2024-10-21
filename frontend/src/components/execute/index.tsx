'use client'
import { ChangeEvent, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import styles from './execute.module.css'
// import local from 'next/font/local'
import { getToken, uploadBinary } from '@/lib/rest'
// import { WebSocket } from '@/lib/WebSocket'
import { io, Socket } from 'socket.io-client'
import { useSocketContext } from '@/hooks/useSocketContext'
const Execute = () => {

    const { stageNo, userId, status, binaryId, updateBinaryId } = useSocketContext();
    const [file, setFile] = useState<File | null>(null);
    
    const disableButton = useMemo(() => {
        return (status == 'running' || binaryId == null);
    }, [status, binaryId]);

    const handleUploadFile = async () => {
        const response = await uploadBinary(stageNo, userId, file);
        updateBinaryId(response);
        // console.log(response);
        
    }   

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.files);
        if(event.target.files && event.target.files[0]){
            setFile(event.target.files[0]);
        }
    }

    return(
        <div className={styles.execute}>
            <div>Execute {stageNo}</div>
            <div>
                <input type = "file" placeholder = "select a file" className='border-[1px] w-[200px]' onChange={handleFileChange}/>
                <button disabled={disableButton} className={styles['execute-run']}>Run</button>
            </div>
        </div>
    )
}

export default Execute;