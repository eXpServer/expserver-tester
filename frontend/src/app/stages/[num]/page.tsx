"use client";

import Testboard from "@/components/testboard";
import { useSocketContext } from "@/hooks/useSocketContext";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const { updateStage, loading, initializeSocket } = useSocketContext();
  const params = useParams();
  const pageNum = (params['num'] as string);

  useEffect(() => {
    const stageNo = parseInt(pageNum);
    if (isNaN(stageNo))
      notFound();
    const asyncFn = async () => {
      await initializeSocket();
      updateStage(stageNo);
    }

    void asyncFn();
  }, [pageNum, initializeSocket, updateStage]);

  return (
    <div className="h-[calc(100vh-50px)] w-[calc(100dvw-300px)]">
      {
        loading ? <div className="fixed top-0 left-0 h-screen w-screen bg-red-200 text-black">Loading...</div> : null
      }
      <Testboard />
    </div>
  );
}

export default Page;