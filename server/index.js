const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {exec} = require('child_process');
const readline = require('readline');
const path = require('path');
const net = require('net');
const { promiseHooks } = require('v8');

const app = express();
const PORT = 6969;


// Multer configuration to preserve the original filename and use absolute paths
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use path.resolve to get the absolute path for the uploads directory
        const uploadPath = path.resolve(__dirname, 'uploads/');
        cb(null, uploadPath);  // Pass the absolute path to Multer
    },
    filename: function (req, file, cb) {
        // Save the file with its original name
        cb(null, file.originalname);
    }
});

// Multer to handle file uploads
const upload = multer({storage: storage});

app.post('/upload',upload.fields([{name: 'binaryFile'}, {name: 'testcaseFile'}]), (req,res) => {
    try{
        const binaryPath = path.resolve(req.files['binaryFile'][0].path);
        const testcasesPath = path.resolve(req.files['testcaseFile'][0].path);

        console.log('binary path: ', binaryPath);
        console.log('testcase Path: ', testcasesPath);

        // executing the binary file in localhost: 8080
        const child = exec(`chmod +x ${binaryPath} && ${binaryPath}`, (err, stdout, stderr) => {
            if(err){
                console.error(`ERROR: ${err.message}`);
                return res.status(500).send(`${stderr.message}`);
            }
            console.log('TCP server has started');
        })

        setTimeout(() => {

            const rl = readline.createInterface({
                input: fs.createReadStream(testcasesPath),
                crlfDelay: Infinity
            })

            // to store the testcases in array.
            const testCases = [], outPut = [];

            rl.on('line', (line) => {
                console.log(line.trim());
                testCases.push(line.trim());
                const revStr = line.trim().split('').reverse().join('');
                console.log(revStr);
                outPut.push(revStr);
            })
            rl.on('close', () => {
                const client = new net.Socket();
                client.connect(8080,'127.0.0.1', () => {
                    console.log('Connected to TCP server');
                    
                    helper(0);
                    var passed = true;

                    function helper(index){
                        if(index < testCases.length){
                            const line = testCases[index];
                            client.write(line);
                            client.once('data', (data) => {
                                const response = data.toString();
                                if(response === outPut[index]){
                                    console.log(`TEST ${index} PASSED input = ${testCases[index]} output = ${response}`);
                                }
                                else{
                                    console.log(`TEST ${index} FAILED, input = ${testCases[index]} output = ${response}`);
                                    passed = false;
                                }

                                helper(index+1);
                            });
                        }
                        else{
                            if(passed){
                                console.log('All testcases passed');
                            }
                            else{
                                console.log('Few test failed');
                            }
                        }
                    }
                    // traverse through testCases array and write to server one by one
                    // for(i = 0; i < testCases.length; i++){
                    //     client.write(testCases[i]);
                    //     client.on('data', (data) => {
                    //         const response = data.toString();
                    //         if(outPut[i] === response){
                    //             console.log(`testcase ${i} passed: ${testCases[i]}, expected: ${outPut[i]}, response: ${response}`);
                    //         }
                    //         else{
                    //             console.log(`testcase ${i} failed: ${testCases[i]}, expected: ${outPut[i]}, response: ${response}`);
                    //         }
                    //     })
                    // }

                    // client.destroy();

                })
                client.on('error',(err) => {
                    console.error("socket error: ", err);
                });
            })

            // const client = new net.Socket();
            // client.connect(8080,'127.0.0.1', () => {
            //     console.log('Connected to TCP server');


            // })
            // client.on('error',(err) => {
            //     console.error("socket error: ", err);
            // });
        }, 5000);
        
        // console.log(child.pid);
        
    }
    catch(error){
        console.error('server error: ', error);
        res.status(500).send('Internal server error');
    }
})



// start the node server
app.listen(PORT,() => {
    console.log(`server running on port: ${PORT}`);
});


// curl -F "binaryFile=@./tcp_server" -F "testcaseFile=@./testcases.txt" http://localhost:6969/upload
