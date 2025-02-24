# Stage 10: Pipe Module 

## Overview
With the introduction of Epoll Edge Triggering, we had fixed a major performance issue, i.e., CPU Usage. Using the Pipe Module, we implement another form of performance improvement, this time in the memory side

**Note**
Due to current hardware advances, the actual difference in memory usage can not be tested to a verifable amount.

## Constraints to be followed 
- The server should run on ports `8001`, `8002`, `8003`, `8004`
- String reversal should be replaced with string write-back moving forwards 
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors

## Tests

### CPU Usage
This test verifies that the process doesn't consume CPU time unnecessarily by creating an idle client connection and tracks CPU usage over the course of 20 seconds
```js
testInput: "Creates an idle client connection and tracks CPU usage over the course of 20 seconds",
expectedBehavior: "CPU usage should be less than 10%",
```

### Non-blocking server
Creates a tcp connection to the tcp server running on the given port sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking waits for 5 seconds, then creates a second connection
```js
testInput: "a client is connected to the server and sends a large file, but does not receive any data from the server. After 30 seconds, a second client is connected to the server, and verifies if the server responds"
expectedBehavior: "the second connection is able to send and receive data from the server"

```

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