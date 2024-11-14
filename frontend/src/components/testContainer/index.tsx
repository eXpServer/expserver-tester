import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './testContainer.module.css'
import { useEffect, useMemo, useState } from 'react';

const TestContainer = () => {
    const {binaryId} = useSocketContext();

    const [numOfTests, setNumOfTest] = useState<number>(3);


    const fileUploaded = useMemo(() => {
        if (binaryId)
            return true;
        else
            return false;
    }, [binaryId])

    return (
        <div className={styles['test-container']}>
            {fileUploaded ?
            <div className={styles['test-container-active']}>
                <div className={styles['test-card']}>
                    <div className={styles['test-name']}> Testcase 1</div>
                    <div className={styles['test-status']}>Passed</div>
                </div>
            </div> : 
            <div className={styles['test-container-idle']}> Upload a binary file to test</div>}
        </div>
    )
}

export default TestContainer;