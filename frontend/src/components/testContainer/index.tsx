import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './testContainer.module.css'
import { useEffect, useMemo, useState } from 'react';
import TestCard from '../testcard';

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
                <TestCard testStatus = {'pending'} testNo = {1} />
                <TestCard testStatus = {'running'} testNo = {2} />
                <TestCard testStatus = {'passed'} testNo = {3} />
                <TestCard testStatus = {'failed'} testNo = {4} />
            </div> : 
            <div className={styles['test-container-idle']}> Upload a binary file to test</div>}
        </div>
    )
}

export default TestContainer;