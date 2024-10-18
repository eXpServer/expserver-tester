"use client";

import { useState, useEffect, useRef } from 'react';

const Terminal = () => {
    const [history, setHistory] = useState(['Welcome to the custom terminal!']);
    const [input, setInput] = useState('');
    const terminalRef = useRef(null);

    useEffect(() => {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [history]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeCommand(input);
            setInput('');
        }
    };

    const executeCommand = (command) => {
        let output;
        if (command === 'help') {
            output = 'Available commands: help, echo, clear';
        } else if (command.startsWith('echo ')) {
            output = command.slice(5);
        } else if (command === 'clear') {
            setHistory([]);
            return;
        } else {
            output = `Unknown command: ${command}`;
        }
        setHistory([...history, `$ ${command}`, output]);
    };

    return (
        <div
            className="bg-black text-white font-mono h-72 w-full p-4 overflow-y-auto border border-gray-700"
            ref={terminalRef}
        >
            <div className="whitespace-pre-wrap">
                {history.map((line, index) => (
                    <div key={index}>{line}</div>
                ))}
            </div>
            <div className="flex">
                <span>&gt;&nbsp;</span>
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="bg-black text-white outline-none border-none font-mono flex-grow"
                />
            </div>
        </div>
    );
};

export default Terminal;
