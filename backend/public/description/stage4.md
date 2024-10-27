# Stage 4: Linux Epoll

## Overview 
We have explored UDP and multithreading in the previous stage. We now move back to TCP as our transport layer protocol, and explore an alternative to multithreading to handle multiple connections, namely [Linux Epoll](https://en.wikipedia.org/wiki/Epoll). The tests done in this stage, ensures that the server behaves exactly the same as it did in the previous stage, even after moving to the new protocol stack.

## Constraints to be followed
- The server is expected to run on port `8080`
- Server should be able to accept an incoming TCP connection and properly handle any errors that might occur.
- Server should receive string and reverse it, while leaving any trailing `\n` intact.
    - eg: `abcd\n` should be reversed as `dcba\n`


## Tests

### Test 1: String reversal - Single client
This test ensures that the server runs as expected when a singular client is connected
```js
testInput: "Client sends a randomly generated string to the server"
expectedBehavior: "Client receives reversed version of the input"
```
### Test 2: String reversal - Multiple clients
This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client
```js
testInput: "Connect multiple clients to server and sends unique string simultaneously"
expectedBehavior: "Each of the clients should receive reversed versions of their input"
```

### Test 3: Error handling
In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected
```js
testInput: "Three clients are created, two of which are connected to the server. One of them is forcefully terminated. Upon successfuly termination of the client, the third client connects to server"
expectedBehavior: "The server should not crash upon disconnection of the client. Both the previous and the new client should be able to send and receive strings, which are tested."
```
