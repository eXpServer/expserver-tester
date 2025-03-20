import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './terminal.module.css'
import { useEffect } from 'react';


const Terminal = () => {
    const { terminalData, stageNo } = useSocketContext()

    useEffect(() => {
        console.log(terminalData)
    }, [terminalData]);


    return (
        <div className={styles['terminal']}>
            <div className={styles['terminal-heading']}>Stage {stageNo} &gt; </div>
            {
                terminalData.map((i, indx) => (
                    <div key={indx} className={styles['terminal-message']}>
                        {i}
                    </div>
                ))
            }
        </div>
    )
};

export default Terminal