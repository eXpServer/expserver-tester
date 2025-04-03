import { useEffect, useState } from "react";
import styles from "./cpuDial.module.css"

const CpuDial = () => {
    // just to test\
    const [convertedNumber, setConvertedNumber] = useState<number>(0);

    useEffect(()=>{
        let counter = 0;
        const interval = setInterval(() => {
            if(counter >= 30){
                clearInterval(interval);
                return;
            }
            const randomNumber = Math.floor(Math.random()*101);
            const convertedVal = Math.round((randomNumber/100)*270);
            setConvertedNumber(convertedVal);
            counter++;
        }, 1000);

        return () => clearInterval(interval)

    },[])
    return (
        <div className={styles['cpu-dial']}>
            <div className={styles['cpu-dial-container']}>
                <div className={styles['outer-circle']}>
                    <div className={styles['middle-circle']}>
                        {/* range: 0 - 135 deg */}
                        <div className={`${styles['inner-quadrant']} ${styles['inner-quadrant-one']}`}
                        style={{ transform: `rotateZ(${Math.min(46 + convertedNumber, 135)}deg)` }}>

                        </div>
                        {/* range: 0 - 225 deg */}
                        <div className={`${styles['inner-quadrant']} ${styles['inner-quadrant-two']}`}
                        style={{ transform: `rotateZ(${Math.min(46 + convertedNumber, 225)}deg)` }}>

                        </div>
                        {/* range: 0 - 315 deg */}
                        <div className={`${styles['inner-quadrant']} ${styles['inner-quadrant-three']}`}
                        style={{ transform: `rotateZ(${Math.min(46+ convertedNumber, 315)}deg)` }}>

                        </div>
                        <div className={styles['inner-circle']}>
                            {convertedNumber}
                        </div>
                        <div className={styles['outer-quadrant']}>

                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
};


export default CpuDial;
