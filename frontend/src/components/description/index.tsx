import styles from './description.module.css'
import { useState, useEffect } from 'react';
import { useSocketContext } from '@/hooks/useSocketContext';
import { getStageDescription } from '@/lib/rest';
import Markdown from '../Markdown';

const Description = () => {
    const { stageNo, userId, description } = useSocketContext();



    return (
        <div className={styles.description}>
            <Markdown text={description} />
        </div>
    )
};


export default Description;