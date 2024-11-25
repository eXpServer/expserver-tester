# Stage 9: Epoll Edge Triggering

## Overview
As of the previous stage, we have started working with non-blocking sockets, but we noticed during one of the experiments a very peculiar issue. Even during an idle TCP connection, CPU utilization kept increasing unnecessarily. This is due to the default behavior of Epoll. 
Epoll has 2 main modes: 
- Level Triggering
- Edge Triggering


By default Epoll runs on level triggerign mode, which informs the user as long as a file descriptor is ready to either be read from or written to. This is the reason for the unnecessary CPU utilization, as any file descriptor that has an associated empty buffer will be seen as **can be written to**, leading to unnecessary calls to `connection_loop_write_handler`.

Epoll edge triggering works in a more efficient manner, by only informing the user a file descriptor is ready, when it changes state from `not-ready` to `ready`. This results in further consequences as the server now needs to manage the state of each file descriptor so as to not miss any notifications that weren't instantly handled.

The tests within this stage, ensures the proper use of edge triggering by measuring CPU usage over the course of a few seconds and ensuring the average CPU utilization is below a certain threshold.



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
