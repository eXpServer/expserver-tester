import styles from './description.module.css'
import { useSocketContext } from '@/hooks/useSocketContext';
import Markdown from '@/components/Markdown';

const Description = () => {
    const { description } = useSocketContext();

    return (
        <div className={styles.description}>
            <Markdown text={description} />
        </div>
    )
};


export default Description;