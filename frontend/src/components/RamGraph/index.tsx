import styles from "./ramGraph.module.css"

const RamGraph = () => {
    return (
        <div className={styles['ram-graph']}>
            <div className={styles['ram-graph-vertical-scale']}>
                <div className={styles['scale']}>
                    <div className={'scale-value'}>100</div>
                </div>
                <div className={styles['scale']}>
                    <div className={'scale-value'}>75</div>
                </div>
                <div className={styles['scale']}>
                    <div className={'scale-value'}>50</div>
                </div>
                <div className={styles['scale']}>
                    <div className={'scale-value'}>25</div>
                </div>
            </div>
            <div className={styles['ram-graph-container']}>

            </div>
        </div>
    );
};

export default RamGraph;