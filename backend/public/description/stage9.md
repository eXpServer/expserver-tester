# Stage 9: Epoll Edge Triggering

## Overview


## Constraints to be followed
- The server should run on ports `8001`, `8002`, `8003`, `8004`
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors


## Tests

### CPU Usage
This test verifies that the process doesn't consume CPU time unnecessarily by creating an idle client connection and tracks CPU usage over the course of 20 seconds
```js
testInput: "Creates an idle client connection and tracks CPU usage over the course of 20 seconds",
expectedBehavior: "CPU usage should be less than 10%",
```

