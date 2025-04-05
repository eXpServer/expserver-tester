import styles from "./ramGraph.module.css"

const RamGraph = () => {
    return (
        <div className={styles['ram-graph']}>
            <div className={styles['ram-graph-vertical-scale']}>
                <div className={styles['scale']}></div>
                <div className={styles['scale']}></div>
                <div className={styles['scale']}></div>
                <div className={styles['scale']}></div>
            </div>
            <div className={styles['ram-graph-container']}>

            </div>
        </div>
    );
};

export default RamGraph;