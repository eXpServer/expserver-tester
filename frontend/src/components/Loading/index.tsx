import { motion } from "framer-motion";

/**
 * Loading component
 */
const Loading = () => {
    return (
        <motion.div
            className="fixed top-0 left-0 h-screen w-screen bg-red-200 text-black"
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
            }}
            exit={{
                opacity: 0,
            }}
        >
            Loading...
        </motion.div>
    )
}

export default Loading;