import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './testContainer.module.css'
import { useEffect, useState } from 'react';

const TestContainer = () => {
    const {binaryId} = useSocketContext();
    const [fileUploaded, setFileUploaded] = useState<boolean>(false)

    useEffect(()=>{
        if(binaryId == ""){
            setFileUploaded(false);
        }
        else{
            setFileUploaded(true);
        }
    }, [binaryId]);

    return (
        <div className={styles['test-container']}>
            {fileUploaded?<div> binary file uploaded</div> : <div className={styles['test-container-idle']}> Upload a binary file to test</div>}
        </div>
    )
}

export default TestContainer;