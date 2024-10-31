"use client"
import { useState } from 'react'
import styles from './sidebar.module.css'
import { useSocketContext } from '@/hooks/useSocketContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const router = useRouter();
    const [currPhase, setCurrPhase] = useState<number>(0);
    const {updateStage, stageNo} = useSocketContext();

    const navOptions = [
        {
            phase: 'Introduction',
            phaseId: -2,
            dropDownPresent: false,
            stages: []
        },
        {
            phase: 'Custom',
            phaseId: -1,
            dropDownPresent: false,
            stages: []
        },
        {
            phase: 'Phase 0',
            phaseId: 0,
            dropDownPresent: true,
            stages: [1,2,3,4,5]
        },
        {
            phase: 'Phase 1',
            phaseId: 1,
            dropDownPresent: true,
            stages: [6,7,8,9,10,11,12,13]
        },
        {
            phase: 'Phase 2',
            phaseId: 2,
            dropDownPresent: true,
            stages: [14,15,16,17]
        },
        {
            phase: 'Phase 3',
            phaseId: 3,
            dropDownPresent: true,
            stages: [18,19,20,21,22]
        },
        {
            phase: 'Phase 4',
            phaseId: 4,
            dropDownPresent: true,
            stages: [23,24,25]
        }
    ]
    
    const handlePhaseChange = (item) => {
        if(item.phaseId >= 0){
            setCurrPhase(item.phaseId);
            router.push(`/stages/${item.stages[0]}`);

        }
        else{
            setCurrPhase(item.phaseId);
            router.push('/');
        }

        console.log(item)
    }

    const handleStageChange = (stage) => {
        if(stage !== stageNo){
            router.push(`/stages/${stage}`);
        }
    }

    return (
        <div className={styles.sidebar}>
            {navOptions.map((item,id) => (
                <div key = {id} className={styles['option-main-container']}>
                    <div className={`${styles['option-container']} ${currPhase === item.phaseId ? currPhase < 0 ? styles['active-option-custom-intro'] : styles['active-option-container'] : styles['inactive-option-container']} `} onClick={() => handlePhaseChange(item)}>
                        <div>
                            {currPhase === item.phaseId ? 
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.6 14C3.6 13.2268 4.2268 12.6 5 12.6H12.4V21.4H5C4.2268 21.4 3.6 20.7732 3.6 20V14Z" stroke="white" stroke-width="1.2"/>
                                    <path d="M12.6 12.6H21.4V20C21.4 20.7732 20.7732 21.4 20 21.4H12.6V12.6Z" stroke="white" stroke-width="1.2"/>
                                    <path d="M12.6 5C12.6 4.2268 13.2268 3.6 14 3.6H20C20.7732 3.6 21.4 4.2268 21.4 5V12.4H12.6V5Z" stroke="white" stroke-width="1.2"/>
                                </svg> :
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.6 14C3.6 13.2268 4.2268 12.6 5 12.6H12.4V21.4H5C4.2268 21.4 3.6 20.7732 3.6 20V14Z" stroke="black" stroke-width="1.2"/>
                                    <path d="M12.6 12.6H21.4V20C21.4 20.7732 20.7732 21.4 20 21.4H12.6V12.6Z" stroke="black" stroke-width="1.2"/>
                                    <path d="M12.6 5C12.6 4.2268 13.2268 3.6 14 3.6H20C20.7732 3.6 21.4 4.2268 21.4 5V12.4H12.6V5Z" stroke="black" stroke-width="1.2"/>
                                </svg>
                            }
                            
                        </div>
                        <div className={styles.phase}>{item.phase}</div>
                    </div>
                    <AnimatePresence>
                        {
                            currPhase == item.phaseId &&
                            <motion.div 
                                className={styles['stage-container']} 
                                initial = {{height: 0, opactiy: 1}}
                                animate = {{height: 'auto', opacity: 1}}
                                exit = {{height: 0, opacity: 1}}
                                transition = {{duration: 0.3, ease: 'easeInOut'}}
                            >
                                    {item.stages?.map((stage) => (
                                        <div key = {stage} className={`${styles['stage']} ${stageNo === stage ? styles['active-stage'] : styles['inactive-stage']}`} onClick={() => handleStageChange(stage)}> Stage {stage}</div>
                                    ))}
                            </motion.div>
                        }
                    </AnimatePresence>
                </div>
            ))}
        </div>
    )
}

export default Sidebar;