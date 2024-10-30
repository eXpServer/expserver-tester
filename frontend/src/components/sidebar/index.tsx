"use client"
import { useState } from 'react'
import styles from './sidebar.module.css'
import { useSocketContext } from '@/hooks/useSocketContext';
import { useRouter } from 'next/navigation';
const Sidebar = () => {
    const router = useRouter();
    const [currPhase, setCurrPhase] = useState<number>(0);
    const {updateStage, stageNo} = useSocketContext();

    const navOptions = [
        {
            phase: 'Introduction',
            phaseId: -2,
            dropDownPresent: false,
        },
        {
            phase: 'Custom',
            pahseId: -1,
            dropDownPresent: false,
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
        if(item.phaseId != -2 && item.phaseId != -1){
            setCurrPhase(item.phaseId);
            router.push(`/stages/${item.stages[0]}`)

        }
        else{
            setCurrPhase(item.phaseId);
        }

        console.log(item)
    }   

    return (
        <div className={styles.sidebar}>
            {navOptions.map((item,id) => (
                <div key = {id}>
                    <div className={`${styles['option-container']} ${currPhase === item.phaseId ? styles['active-option-container'] : styles['inactive-option-container']} `} onClick={() => handlePhaseChange(item)}>
                        <div>Logo</div>
                        <div className={styles.phase}>{item.phase}</div>
                    </div>
                    {
                        currPhase == item.phaseId &&
                        <div className={styles['stage-container']} >
                                {item.stages?.map((stage) => (
                                    <div key = {stage} className={`${styles['stage']} ${stageNo === stage ? styles['active-stage'] : styles['inactive-stage']}`}> stage {stage}</div>
                                ))}
                        </div>
                    }
                </div>
            ))}
        </div>
    )
}

export default Sidebar;