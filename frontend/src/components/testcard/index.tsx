import { TestStatus } from '@/types';
import styles from './testcard.module.css'

const TestCard = (props) => {
    return (
        <div className={styles['test-card']}>
                <div className={styles['test-name']}> Testcase {props.testNo}</div>
                <div className={`${styles['test-status']} ${styles[props.testStatus]}`}>{props.testStatus}</div>
        </div>
    )
};

export default TestCard;