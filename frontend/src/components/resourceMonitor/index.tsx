import { useSocketContext } from '@/hooks/useSocketContext';
import styles from './resourceMonitor.module.css'
import { useEffect, useState } from 'react';
import Image from 'next/image';
import update from '/public/update.svg'



const ResourceMonitor = () => {
    const {binaryId, status} = useSocketContext();
    //const [sec, setSec] = useState<number>(0);
    //const [min, setMin]  = useState<number>(0);
    const [tempStatus, setTempStatus] = useState<string>('running0');
    const [isRunning, setIsRunning] = useState<boolean>(true);

    useEffect(() => {
        if(tempStatus == 'running'){
            setIsRunning(true);
        }
        else{
            setIsRunning(false);
        }
    }, [tempStatus]);

    const [secondsElapsed, setSecondsElapsed] = useState(0);
    // const [intervalId, setIntervalId] = useState(null); // to track the interval id for pausing

    const min = Math.floor(secondsElapsed / 60);
    const sec = secondsElapsed % 60;

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null; // Store interval locally
    
        if (tempStatus === 'running') {
          // Reset the timer to 0 and start counting
          setSecondsElapsed(0);
    
          // Start the timer (runs every second)
          interval = setInterval(() => {
            setSecondsElapsed((prevSeconds) => prevSeconds + 1);
          }, 1000);
        } 
    
        // Cleanup the interval when the component unmounts or tempStatus changes
        return () => {
          if (interval) {
            clearInterval(interval); // Clear the interval when paused
          }
        };
      }, [tempStatus]);

    return (
        <div className={styles['resource-monitor']}>
            <div className={styles['execution-status-container']}>
                <div>
                    {isRunning &&
                        <div className={styles['execution-status']}>
                            <Image src={update} alt='update' width={20} height={20} draggable = {false} className={styles['running-img']}/>
                            <div>Running</div>
                        </div>
                    }
                </div>
                
                <div className={styles['time-elapsed-container']}>
                    <div className={styles['time-elapsed-heading']}>Time elapsed</div>
                    <div className={styles['time-elapsed-timer']}>{min}<span>min </span>{sec}<span>s </span></div>
                </div>
            </div>
            <div className={styles['resource-monitor-container']}>

            </div>
        </div>
    )
}

export default ResourceMonitor;