import { useState } from 'react';
import Description from '../description';
import styles from './descTermianlContainer.module.css'
import Terminal from '../terminal';

const DescTerminalContainer = () => {
    const [terminalState, setTerminalState] = useState<boolean>(false);

    const handleTerminalState = (state) => {
        setTerminalState(state);
        console.log("clicked")
    }
    return(
        <div className={styles['desc-terminal-container']}>
            <div className={styles['desc-terminal-navbar']}>
                <div className={`${styles['desc-terminal-nav-option']} ${!terminalState && styles['active-nav-desc']}`} onClick={() => handleTerminalState(false)}>Description</div>
                <div className={`${styles['desc-terminal-nav-option']} ${terminalState && styles['active-nav-terminal']}`} onClick = {() => handleTerminalState(true)}>Console</div>
            </div>
            {
                terminalState ? <Terminal/> : <Description/>
            }
            {/* <Description/> */}
        </div>
    )
};

export default DescTerminalContainer;