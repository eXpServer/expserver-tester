import Description from "../description";
import Execute from "../execute";
import styles from "./testboard.module.css"

const Testboard = () => {
    return (
        <div className={styles.testboard}>
            {/* description */}
            <Description/>
            <Execute/>
            {/* console */}
        </div>
    )
}

export default Testboard;