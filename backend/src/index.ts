import express from "express";
import cors from 'cors';
import net from 'net';
import { toASCII } from "punycode";
import multer from 'multer'
import path from 'path';
import { execFile } from "child_process";
import fs from 'fs';
const PORT = 6969;

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' })

const revString = (str: string) => {
    const len = str.length;
    const arr = str.split('');
    const excludeNewLine = arr.slice(0, len - 1).reverse();

    return [...excludeNewLine, arr[len - 1]].join('');
}

app.post("/stage1", upload.single('binary'), (req, res) => {

    if (!req.file)
        return res.status(400).send({ message: "No file uploaded" });

    const binaryPath = path.join(__dirname, '..', req.file.path);
    console.log(binaryPath);

    fs.chmod(binaryPath, 0o755, err => {
        if (err) {
            console.log("failed to set permissions", err);
            return res.status(500).send({ message: "Failed to set executable permissions", error: err });
        }

        const child = execFile(binaryPath, (error, stdout, stderr) => {
            fs.unlinkSync(binaryPath);

            if (error) {
                console.error(error);
                return res.status(500).send({ message: "Error executing binary file", error: stderr })
            }

            console.log("Binary running...");
        })

        setTimeout(() => {
            /* create a tcp socket */
            const client = new net.Socket();

            /* 
                strings to test 
                newline appended to end to imitate how netcat sends the strings
                note: the strrev function written in the server side code in stage 1 considers the last char to be a /n and reverses accordingly, thus without the newline the string won't be reversed correctly
            */
            const testStrings = [
                toASCII("hello"),
                toASCII("abcdefghijklmnopqrstuvwxyz\n"),
                toASCII("R3G9XUJ8k0Y6t1RzVbO0k7WTQpl8IwH\n"),
                toASCII("qL5rKM8zX4h7aYOiW2t1UpBFGwJ0nZ9kVQ\n"),
                toASCII("L8N3u7qz9FjV5oPkp6XYyBiR1lW0Tr0DWm\n"),
                toASCII("Aj3D6V7sKq2Zt1Lw08yRnFb9OpxhYGo9v4J\n"),
                toASCII("Qx2B9wFL3V8t7kP0Zr1o6JYc4OipjR5uG\n"),
                toASCII("yW7v9O6y2QF5R0TzK3X9mL1pB8kN4GJ\n"),
                toASCII("t1X5Q8P9Lk7RzJ3o0Fv2yN4bGm6w8iW\n"),
                toASCII("Y6L5Q2z8K9T0Rp1F3oJm4v7nXWbGJ\n"),
                toASCII("Rz1V7k9Q3oL8T6X0F5y2pN4bGmWiJ\n"),
                toASCII("5K9t1Q2X7v0R3F8LpJ6yN4bGmWZi\n"),
            ];

            const testResults: {
                input: string,
                expected?: string,
                output?: string,
                result: boolean,
            }[] = testStrings.map(str => ({ input: str, result: false }));

            /* callback in case an error occurs */
            client.on('error', error => {
                console.log('Connection Error: ', error);
            })



            /**
             * sends the index'th string to server and waits for data to come back
             * verifies if the data is same as the sent data
             * if so considers the test as passed
             * else considers the test as failed
             * recusively calls the same function for (index+1)'th string
             * @param index index number of string
             * @returns void
             */
            const writeStringToServer = (index: number) => {
                if (index >= testStrings.length) {
                    // note: can't end the connection here as prior to phase 1, closing a connection will terminate the server processing causing an error
                    // client.end();
                    return res.status(200).send(testResults);
                }

                const dataToSend = testStrings[index];

                const checkRecvdCallback = (data: Buffer) => {
                    client.off('data', checkRecvdCallback);
                    const receivedData = data.toString();
                    const reversedData = revString(receivedData);

                    if (reversedData == dataToSend) {
                        console.log(`Test ${index + 1}: Passed ✓`);
                        testResults[index].expected = revString(dataToSend);
                        testResults[index].output = receivedData;
                        testResults[index].result = true;
                    }
                    else {
                        console.log(`Test ${index + 1}: Failed ×`);
                        testResults[index].expected = revString(dataToSend);
                        testResults[index].output = receivedData;
                        testResults[index].result = false;
                    }

                    return writeStringToServer(index + 1);
                }

                client.on('data', checkRecvdCallback);
                client.write(dataToSend);
            }

            client.connect(8080, '127.0.0.1', () => {
                console.log("---Connected to server---");

                return writeStringToServer(0);

            })
        }, 3000);

    })


});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));