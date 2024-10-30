import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './testContainer.module.css'
import { useEffect, useMemo, useState } from 'react';

const TestContainer = () => {
    const {binaryId} = useSocketContext();

    const fileUploaded = useMemo(() => {
        if (binaryId)
            return true;
        else
            return false;
    }, [binaryId])

    return (
        <div className={styles['test-container']}>
            {fileUploaded?<div> binary file uploaded</div> : <div className={styles['test-container-idle']}> Upload a binary file to test</div>}
        </div>
    )
}

export default TestContainer;