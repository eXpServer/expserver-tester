# Stage 16: HTTP Config Module

## Overview

## Constraints to be followed

## Tests
### Test 1: File server (1)
This tests verifies the server abides by the file serving config set by the custom xps_config file

```js
testInput: "Sends a request to the server requesting for a .jpg file"
expectedBehavior: "Server responds with a 200 status code and body containing data of mime-type image/jpg"
```

### Test 2: File server (2)
This tests verifies the server abides by the file serving config set by the custom xps_config file

```js
testInput: "Sends a request to the server requesting for a .pdf file"
expectedBehavior: "Server responds with a 200 status code and body containing data of mime-type application/pdf"
```

### Test 3: File server (3)
This tests verifies the server abides by the file serving config set by the custom xps_config file

```js
testInput: "Sends a request to the server requesting for a .txt file"
expectedBehavior: "Server responds with a 200 status code and body containing data of mime-type text/plain"
```

### Test 4: Redirect (1)
This test checks the server's redirect functionality

```js
testInput: "Client makes a request to the route http://localhost:8001/redirect"
expectedBehavior: "Client should receive a response of status 302 and redirect to http://localhost:8002/"
```

### Test 5: HTTP Proxy
This test checks the server's upstream functionality

```js
testInput: "Client makes a request to http://localhost:8002/cat.jpg"
expectedBehavior: "The response that the client receives should match what is received from http://localhost:3000/cat.jpg"
```

