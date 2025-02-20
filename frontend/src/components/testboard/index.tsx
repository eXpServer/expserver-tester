import Description from "../description";
import DescTerminalContainer from "../descTerminalContainer";
import Execute from "../execute";
import styles from "./testboard.module.css"

const Testboard = () => {
    return (
        <div className={styles.testboard}>
            {/* description */}
            {/* <Description/> */}
            <DescTerminalContainer/>
            <Execute/>
            {/* console */}
        </div>
    )
}

export default Testboard;