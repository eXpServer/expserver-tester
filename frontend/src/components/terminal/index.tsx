import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './terminal.module.css'


const Terminal = () => {
    const {terminalData} = useSocketContext()
    return(
        <div className={styles['terminal']}>
            <div className={styles['terminal-heading']}>Stage 8 &gt; </div>
            {
                terminalData.map((i, indx)=>(
                    <div key = {indx} className={styles['terminal-message']}>
                        {i}
                    </div>
                ))
            }
        </div>
    )
};

export default Terminal