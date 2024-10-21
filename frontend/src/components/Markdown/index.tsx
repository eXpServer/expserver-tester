import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose your favorite theme
import styles from './styles.module.css';
import 'github-markdown-css/github-markdown.css';
import remarkGfm from 'remark-gfm';
const Markdown = ({
    text
}: {
    text: string
}) => {
    return (
        <div className={styles.markdownBody}>
            <ReactMarkdown
                components={{
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <SyntaxHighlighter
                                style={okaidia}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
                remarkPlugins={[remarkGfm]}
            >
                {text}
            </ReactMarkdown>
        </div>
    )
}

export default Markdown;