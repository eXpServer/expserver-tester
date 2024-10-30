'use client'
import { ChangeEvent, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import styles from './execute.module.css'
// import local from 'next/font/local'
import { deleteBinary, getToken, uploadBinary } from '@/lib/rest'
// import { WebSocket } from '@/lib/WebSocket'
import { io, Socket } from 'socket.io-client'
import { useSocketContext } from '@/hooks/useSocketContext'
import Image from 'next/image'
import add from '/public/add.svg'
import play from '/public/play.svg'
import info from '/public/info.svg'
import stop from '/public/stop.svg'
import TestContainer from '../testContainer'
import ResourceMonitor from '../resourceMonitor'

const Execute = () => {

    const { stageNo, userId, status, binaryId, updateBinaryId, runTests } = useSocketContext();
    const [file, setFile] = useState<File | null>(null);
    const [myFile, setMyFile] = useState<string>("Choose a file");

    const disableRunButton = useMemo(() => {
        return (status == 'running' || file == null);
    }, [status, file]);

    const isFileUploaded = useMemo(() => {
        if (binaryId)
            return true;
        else 
            return false;
    }, [binaryId]); 


    const handleUploadFile = async () => {
        const response = await uploadBinary(stageNo, userId, file);
        updateBinaryId(response);
        console.log("file uploaded successfully");

        // set isFileUpload to true only for postive response. with alert[file uploaded successfully]
        // updateBinaryId("1234567");

        // else alert[file upload failed]

    }

    const handleFileChange = (event) => {
        console.log(event.target.files);
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setMyFile(event.target.files[0].name);
        }
    }

    const handleRunFile = async () => {
        runTests();
    }

    const handleInfoClick = () => {
        alert('Information about binary file here');
    }

    return (
        <div className={styles.execute}>
            <div className={styles['execute-heading']}>Execute</div>
            <div className={styles['upload-container']}>
                <div className={styles['upload-heading']}>Binary File <Image src={info} alt='info' height={16} width={16} onClick={handleInfoClick} className={styles['info']} /></div>
                <div className={styles['upload-inner-container']}>
                    <div className={styles['upload-file-container']}>
                        <input type="file" placeholder="select a file" className={styles['file-input']} id="file-input" onChange={handleFileChange} />
                        <label htmlFor={isFileUploaded ? 'none' : 'file-input'} className={styles['custom-file-input']}> <Image src={add} alt='add-img' height={20} width={20} draggable={false} /> Add </label>
                        <input className={styles['add-file-input']} type='text' disabled value={myFile} />
                    </div>
                    <button className={`${styles['execute-button']} ${isFileUploaded ? styles['execute-run'] : styles['execute-upload']}`} onClick={isFileUploaded ? handleRunFile : handleUploadFile}>
                        {isFileUploaded ? status == 'running' ? <div className={styles['execute-active-run']}><Image src={stop} alt='stop' height={20} width={20} draggable={false} />Stop</div> : <div className={styles['execute-active-run']}><Image src={play} alt='run' height={20} width={20} draggable={false} />Run</div> : <div>Upload</div>}
                    </button>
                </div>
            </div>
            {isFileUploaded && <ResourceMonitor />}
            <TestContainer />
        </div>
    )
}

export default Execute;