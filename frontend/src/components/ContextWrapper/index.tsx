"use client";

import { SocketContextProvider } from "@/hooks/Context";
import { ReactNode } from "react";

const ContextWrapper = ({
    children
}: {
    children: ReactNode
}) => {
    return (
        <SocketContextProvider>
            {children}
        </SocketContextProvider>
    )
}

export default ContextWrapper;