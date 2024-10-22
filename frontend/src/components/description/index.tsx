import styles from './description.module.css'
import { useState, useEffect } from 'react';
import { useSocketContext } from '@/hooks/useSocketContext';
import { getStageDescription } from '@/lib/rest';
import Markdown from '../Markdown';

const Description = () => {
    const { stageNo, userId } = useSocketContext();
    const [description, setDescription] = useState<string>("");

    useEffect(() => {
        console.log(stageNo, userId);
        getStageDescription(stageNo, userId).then(data => {
            console.log(data);
            setDescription(data);
        })
    }, [stageNo, userId]);
    return (
        <div className={styles.description}>
            <Markdown text={description} />
        </div>
    )
};


export default Description;