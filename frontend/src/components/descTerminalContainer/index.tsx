import { useState } from 'react';
import Description from '../description';
import styles from './descTermianlContainer.module.css'

const DescTerminalContainer = () => {
    const [terminalState, setTerminalState] = useState<boolean>(false);
    return(
        <div className={styles['desc-terminal-container']}>
            <div className={styles['desc-terminal-navbar']}>
                <div className={styles['desc-terminal-nav-option']}>Description</div>
                <div className={styles['desc-terminal-nav-option']}>Terminal</div>
            </div>
            <Description/>
        </div>
    )
};

export default DescTerminalContainer;