"use client";

import { ChangeEvent, useState } from "react";
import axios from 'axios';


export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0])
      setSelectedFile(event.target.files[0]);
  }

  const onSubmit = async () => {
    if (!selectedFile) {
      console.log("no file selected");
      return;
    }

    const formData = new FormData();
    formData.append('binary', selectedFile);

    try {
      const response = await axios.post('http://localhost:6969/stage1', formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      console.log(response.data);
    }
    catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="w-screen h-screen bg-neutral-800 flex flex-col gap-8 items-center justify-center">
      <input
        type="file"
        className="border border-white hover:border-black p-2 font-semibold text-2xl rounded-lg bg-neutral-200 hover:bg-neutral-700 text-black hover:text-white"
        onChange={onFileChange}
      />

      <button
        onClick={onSubmit}
        className="border border-white hover:border-black p-2 font-semibold text-2xl rounded-lg bg-neutral-200 hover:bg-neutral-700 text-black hover:text-white"
      >
        Run binary
      </button>
    </div>
  );
}
