"use client"
import { useState } from 'react'
import styles from './sidebar.module.css'
import { useSocketContext } from '@/hooks/useSocketContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const router = useRouter();
    const [currPhase, setCurrPhase] = useState<number>(-2);
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

    const svgRender = (phaseId) => {
        if(currPhase === phaseId){
            if (phaseId === -2){
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 17.25H7.63C7.3 16.1 6.25 15.25 5 15.25C3.48 15.25 2.25 16.48 2.25 18C2.25 19.52 3.48 20.75 5 20.75C6.25 20.75 7.3 19.9 7.63 18.75H21C21.41 18.75 21.75 18.41 21.75 18C21.75 17.59 21.41 17.25 21 17.25ZM5 19.25C4.31 19.25 3.75 18.69 3.75 18C3.75 17.31 4.31 16.75 5 16.75C5.69 16.75 6.25 17.31 6.25 18C6.25 18.69 5.69 19.25 5 19.25ZM21 11.25H16.63C16.3 10.1 15.25 9.25 14 9.25C12.75 9.25 11.7 10.1 11.37 11.25H3C2.59 11.25 2.25 11.59 2.25 12C2.25 12.41 2.59 12.75 3 12.75H11.37C11.7 13.9 12.75 14.75 14 14.75C15.25 14.75 16.3 13.9 16.63 12.75H21C21.41 12.75 21.75 12.41 21.75 12C21.75 11.59 21.41 11.25 21 11.25ZM14 13.25C13.31 13.25 12.75 12.69 12.75 12C12.75 11.31 13.31 10.75 14 10.75C14.69 10.75 15.25 11.31 15.25 12C15.25 12.69 14.69 13.25 14 13.25ZM3 6.75H5.37C5.7 7.9 6.75 8.75 8 8.75C9.25 8.75 10.3 7.9 10.63 6.75H21C21.41 6.75 21.75 6.41 21.75 6C21.75 5.59 21.41 5.25 21 5.25H10.63C10.3 4.1 9.25 3.25 8 3.25C6.75 3.25 5.7 4.1 5.37 5.25H3C2.59 5.25 2.25 5.59 2.25 6C2.25 6.41 2.59 6.75 3 6.75ZM8 4.75C8.69 4.75 9.25 5.31 9.25 6C9.25 6.69 8.69 7.25 8 7.25C7.31 7.25 6.75 6.69 6.75 6C6.75 5.31 7.31 4.75 8 4.75Z" fill="white"/>
                    </svg>
                )
            }
            else if(phaseId == -1){
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 17.25H7.63C7.3 16.1 6.25 15.25 5 15.25C3.48 15.25 2.25 16.48 2.25 18C2.25 19.52 3.48 20.75 5 20.75C6.25 20.75 7.3 19.9 7.63 18.75H21C21.41 18.75 21.75 18.41 21.75 18C21.75 17.59 21.41 17.25 21 17.25ZM5 19.25C4.31 19.25 3.75 18.69 3.75 18C3.75 17.31 4.31 16.75 5 16.75C5.69 16.75 6.25 17.31 6.25 18C6.25 18.69 5.69 19.25 5 19.25ZM21 11.25H16.63C16.3 10.1 15.25 9.25 14 9.25C12.75 9.25 11.7 10.1 11.37 11.25H3C2.59 11.25 2.25 11.59 2.25 12C2.25 12.41 2.59 12.75 3 12.75H11.37C11.7 13.9 12.75 14.75 14 14.75C15.25 14.75 16.3 13.9 16.63 12.75H21C21.41 12.75 21.75 12.41 21.75 12C21.75 11.59 21.41 11.25 21 11.25ZM14 13.25C13.31 13.25 12.75 12.69 12.75 12C12.75 11.31 13.31 10.75 14 10.75C14.69 10.75 15.25 11.31 15.25 12C15.25 12.69 14.69 13.25 14 13.25ZM3 6.75H5.37C5.7 7.9 6.75 8.75 8 8.75C9.25 8.75 10.3 7.9 10.63 6.75H21C21.41 6.75 21.75 6.41 21.75 6C21.75 5.59 21.41 5.25 21 5.25H10.63C10.3 4.1 9.25 3.25 8 3.25C6.75 3.25 5.7 4.1 5.37 5.25H3C2.59 5.25 2.25 5.59 2.25 6C2.25 6.41 2.59 6.75 3 6.75ZM8 4.75C8.69 4.75 9.25 5.31 9.25 6C9.25 6.69 8.69 7.25 8 7.25C7.31 7.25 6.75 6.69 6.75 6C6.75 5.31 7.31 4.75 8 4.75Z" fill="white"/>
                    </svg>
                )
            }
            else{
                return(
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.6 14C3.6 13.2268 4.2268 12.6 5 12.6H12.4V21.4H5C4.2268 21.4 3.6 20.7732 3.6 20V14Z" stroke="white" stroke-width="1.2"/>
                        <path d="M12.6 12.6H21.4V20C21.4 20.7732 20.7732 21.4 20 21.4H12.6V12.6Z" stroke="white" stroke-width="1.2"/>
                        <path d="M12.6 5C12.6 4.2268 13.2268 3.6 14 3.6H20C20.7732 3.6 21.4 4.2268 21.4 5V12.4H12.6V5Z" stroke="white" stroke-width="1.2"/>
                    </svg>
                )
            }
        }
        else{
            if (phaseId === -2){
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 17.25H7.63C7.3 16.1 6.25 15.25 5 15.25C3.48 15.25 2.25 16.48 2.25 18C2.25 19.52 3.48 20.75 5 20.75C6.25 20.75 7.3 19.9 7.63 18.75H21C21.41 18.75 21.75 18.41 21.75 18C21.75 17.59 21.41 17.25 21 17.25ZM5 19.25C4.31 19.25 3.75 18.69 3.75 18C3.75 17.31 4.31 16.75 5 16.75C5.69 16.75 6.25 17.31 6.25 18C6.25 18.69 5.69 19.25 5 19.25ZM21 11.25H16.63C16.3 10.1 15.25 9.25 14 9.25C12.75 9.25 11.7 10.1 11.37 11.25H3C2.59 11.25 2.25 11.59 2.25 12C2.25 12.41 2.59 12.75 3 12.75H11.37C11.7 13.9 12.75 14.75 14 14.75C15.25 14.75 16.3 13.9 16.63 12.75H21C21.41 12.75 21.75 12.41 21.75 12C21.75 11.59 21.41 11.25 21 11.25ZM14 13.25C13.31 13.25 12.75 12.69 12.75 12C12.75 11.31 13.31 10.75 14 10.75C14.69 10.75 15.25 11.31 15.25 12C15.25 12.69 14.69 13.25 14 13.25ZM3 6.75H5.37C5.7 7.9 6.75 8.75 8 8.75C9.25 8.75 10.3 7.9 10.63 6.75H21C21.41 6.75 21.75 6.41 21.75 6C21.75 5.59 21.41 5.25 21 5.25H10.63C10.3 4.1 9.25 3.25 8 3.25C6.75 3.25 5.7 4.1 5.37 5.25H3C2.59 5.25 2.25 5.59 2.25 6C2.25 6.41 2.59 6.75 3 6.75ZM8 4.75C8.69 4.75 9.25 5.31 9.25 6C9.25 6.69 8.69 7.25 8 7.25C7.31 7.25 6.75 6.69 6.75 6C6.75 5.31 7.31 4.75 8 4.75Z" fill="black"/>
                    </svg>
                )
            }
            else if(phaseId == -1){
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 17.25H7.63C7.3 16.1 6.25 15.25 5 15.25C3.48 15.25 2.25 16.48 2.25 18C2.25 19.52 3.48 20.75 5 20.75C6.25 20.75 7.3 19.9 7.63 18.75H21C21.41 18.75 21.75 18.41 21.75 18C21.75 17.59 21.41 17.25 21 17.25ZM5 19.25C4.31 19.25 3.75 18.69 3.75 18C3.75 17.31 4.31 16.75 5 16.75C5.69 16.75 6.25 17.31 6.25 18C6.25 18.69 5.69 19.25 5 19.25ZM21 11.25H16.63C16.3 10.1 15.25 9.25 14 9.25C12.75 9.25 11.7 10.1 11.37 11.25H3C2.59 11.25 2.25 11.59 2.25 12C2.25 12.41 2.59 12.75 3 12.75H11.37C11.7 13.9 12.75 14.75 14 14.75C15.25 14.75 16.3 13.9 16.63 12.75H21C21.41 12.75 21.75 12.41 21.75 12C21.75 11.59 21.41 11.25 21 11.25ZM14 13.25C13.31 13.25 12.75 12.69 12.75 12C12.75 11.31 13.31 10.75 14 10.75C14.69 10.75 15.25 11.31 15.25 12C15.25 12.69 14.69 13.25 14 13.25ZM3 6.75H5.37C5.7 7.9 6.75 8.75 8 8.75C9.25 8.75 10.3 7.9 10.63 6.75H21C21.41 6.75 21.75 6.41 21.75 6C21.75 5.59 21.41 5.25 21 5.25H10.63C10.3 4.1 9.25 3.25 8 3.25C6.75 3.25 5.7 4.1 5.37 5.25H3C2.59 5.25 2.25 5.59 2.25 6C2.25 6.41 2.59 6.75 3 6.75ZM8 4.75C8.69 4.75 9.25 5.31 9.25 6C9.25 6.69 8.69 7.25 8 7.25C7.31 7.25 6.75 6.69 6.75 6C6.75 5.31 7.31 4.75 8 4.75Z" fill="black"/>
                    </svg>
                )
            }
            else{
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.6 14C3.6 13.2268 4.2268 12.6 5 12.6H12.4V21.4H5C4.2268 21.4 3.6 20.7732 3.6 20V14Z" stroke="black" stroke-width="1.2"/>
                        <path d="M12.6 12.6H21.4V20C21.4 20.7732 20.7732 21.4 20 21.4H12.6V12.6Z" stroke="black" stroke-width="1.2"/>
                        <path d="M12.6 5C12.6 4.2268 13.2268 3.6 14 3.6H20C20.7732 3.6 21.4 4.2268 21.4 5V12.4H12.6V5Z" stroke="black" stroke-width="1.2"/>
                    </svg>
                )
            }
        }

    }

    return (
        <div className={styles.sidebar}>
            {navOptions.map((item,id) => (
                <div key = {id} className={styles['option-main-container']}>
                    <div className={`${styles['option-container']} ${currPhase === item.phaseId ? currPhase < 0 ? styles['active-option-custom-intro'] : styles['active-option-container'] : styles['inactive-option-container']} `} onClick={() => handlePhaseChange(item)}>
                        <div>
                            {/* {currPhase === item.phaseId ? 
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
                            } */}

                            {svgRender(item.phaseId)}
                            
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