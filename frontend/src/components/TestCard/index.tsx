import { TestStatus } from '@/types';
import styles from './testcard.module.css'
import Image from 'next/image';
import Info from '/public/info.svg'
import { useState } from 'react';
import Dialog from '../Dialog';

const TestCard = (props) => {
    const [dialog, setDialog] = useState<boolean>(false);
    const handleDialog = () => {
        setDialog((prevDialog) => !prevDialog);
    }

    return (
        <div className={styles['test-card']}>
            <div className={styles['test-name']}> Testcase {props.testNo}
                {props.result.status === 'failed' &&
                    <div className={styles['test-info']}>
                        <Image className={styles['test-info-img']} src={Info} alt='info' height={16} width={16} onClick={handleDialog}></Image>
                    </div>
                }
            </div>
            {dialog &&
                <>
                    <Dialog
                        title={props.result.title}
                        testNo={props.testNo}
                        description={props.result.description}
                        expectedBehaviour={props.result.expectedBehavior}
                        observedBehaviour={props.result.observedBehavior}
                        testInput={props.result.testInput}
                        handleDialog={handleDialog}
                    />
                    {/* <button className={styles['dialog-close-button-container']} onClick={handleDialog}>Close</button> */}
                </>
            }
            <div className={`${styles['test-status']} ${styles[props.testStatus]}`}>{props.result.status.replace(/^\w/, (c) => c.toUpperCase())}</div>
        </div>
    )
};

export default TestCard;