# Stage 6: Core & Loop Module

## Overview
In this stage, we move around some of the existing functions to further clean up the code. The tests within this stage ensures that the functionality acheived in the previous stage is unaffected

## Constraints to be followed
- The server should run on ports `8001`, `8002`, `8003`, `8004`
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors


## Tests

### Single client -- input / output
This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on
```js
testInput: "client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Multiple clients on same port -- input / output
This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client
```js
testInput: "Connect multiple clients to server and sent string simultaneously",
expectedBehavior: "Each of the clients should receive their reversed versions of the string that they sent",
```

### Error Handling
In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected
```js
testInput: "client forcefully disconnects"
expectedBehavior: "Previous and new clients are able to send and receive output as expected"
```
