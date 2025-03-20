import { dialog } from 'framer-motion/client';
import styles from './dialog.module.css'

const Dialog = (props) => {
    return (
        <div className={styles['dialog']}>
            <div className={styles['dialog-container']}>
                <div className={styles['dialog-title-container']}> Testcase {props.testNo} failed!

                    <button className={styles['dialog-close-button']} onClick={props.handleDialog}>Close</button>
                </div>
                <div className={styles['dialog-content-container']}>
                    <div className={styles['dialog-content-title']}>{props.title}</div>
                    <div className={styles['dialog-content-description']}>{props.description}</div>
                    {props.expectedBehaviour !== "" && <div className={styles['dialog-content-expected']}><span className={styles['dialog-subtitles']}>Expected Behaviour:</span> {props.expectedBehaviour}</div>}
                    {props.observedBehaviour !== "" && <div className={styles['dialog-content-observed']}><span className={styles['dialog-subtitles']}>Observed Behaviour:</span> {props.observedBehaviour}</div>}
                    {props.testInput !== "" && <div className={styles['dialog-content-input']}><span className={styles['dialog-subtitles']}>Test Input:</span> {props.testInput}</div>}
                </div>
            </div>
        </div>
    )
};

export default Dialog;