# Stage 5: TCP Proxy

## Overview
In this stage, we shall deviate a bit from our current implementation to explore a concept that is widely used in networks, [proxy servers](https://en.wikipedia.org/wiki/Proxy_server). 


## Constraints to be followed
- The proxy server should run on port `8080`
- The proxy server should expect the upstream server to run on port `3000`
- The proxy server should handle any unexpected error scenarios accordingly


## Tests

### Proxy response checking
Creates multiple clients, each of them connects to the proxy server and _simultaneously_ sends an auto-genereated `GET` request unique to each client. Upon receiving a response from the proxy, a similar client connects to the upstream server directly and ensures both the responses are identical.
```js
testInput: "Multiple clients are created and each of them sends a unique message and expects a unique response"
expectedBehavior: "The response received by each client from the proxy server, should match the expected resopnse, as if the client was directly connected to the upstream server"
```