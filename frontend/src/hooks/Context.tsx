import { createContext, ReactNode } from "react";

interface SocketContextInterface {

}

export const SocketContext = createContext<SocketContextInterface>(null);

export const SocketContextProvider = ({
    children
}: {
    children: ReactNode
}) => {

    return (
        <SocketContext.Provider
            value={{}}
        >
            {children}
        </SocketContext.Provider>
    )
}