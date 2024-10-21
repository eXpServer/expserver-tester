"use client";

// import { ChangeEvent, useState } from "react";
// import axios from 'axios';
// import Execute from "@/components/execute";
import Testboard from "@/components/testboard";
import { useSocketContext } from "@/hooks/useSocketContext";
import { useEffect } from "react";

export default function Home() {
  const { stageNo, updateStage, loading } = useSocketContext();

  return (
    <div className="h-[calc(100vh-50px)] w-full">
      {
        loading ? <div>Loading...</div> : null
      }
      <Testboard />
    </div>
  );
}
