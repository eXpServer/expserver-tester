# Stage 15: HTTP Response Module 

## Overview
In Phase 2, we shall make use of the HTTP protocol for communication between the client and the server. Read more about http [here](https://developer.mozilla.org/en-US/docs/Web/HTTP). 

In this stage, we implement the response parser module. This module will be responsible for reading the request from the client and parsing the data into an in-memory data structure in order to extract information from the request and to handle different requests accordingly

The tests done within this stage will ensure the parser has been written properly by testing the server with a variety of valid and invalid http requests and verifying the output the server provides

## Constraints to be followed
- All ports `8001`, `8002`, `8003`, `8004` listen to http requests
- The server should expect the all files to be shared from the `public/` directory
- The `public/` directory should be expected to be present within the same relative path to the executable as given within the documentation

## Tests

### Valid request (jpg file)
This test aims to ensure that the requested file is served and verifies that the headers match what is expected.
```js
testInput: "Sends a request to the server requesting for a .jpg file"
expectedBehaviour: "The server sends the file to the client with appropriate mime-types and other headers"
```

### Valid request (pdf file)
This test aims to ensure that the requested file is served and verifies that the headers match what is expected.
```js
testInput: "Sends a request to the server requesting for a .pdf file"
expectedBehaviour: "The server sends the file to the client with appropriate mime-types and other headers"
```

### Valid request (plain text file)
This test aims to ensure that the requested file is served and verifies that the headers match what is expected.
```js
testInput: "Sends a request to the server requesting for a .txt file"
expectedBehaviour: "The server sends the file to the client with appropriate mime-types and other headers"
```

### File not found
This test aims to ensure the error handling in case the user requests a file that isn't found within the public directory.
```js
testInput: "Sends a request to the server requesting for a file that doesn't exist"
expectedBehaviour: "The server returns a 404 Not Found response"
```

### Missing HTTP Version
This test aims to ensure proper error handling of the server in case of an invalid HTTP request.
```js
testInput: "Sends a request to the server without specifying HTTP version"
expectedBehaviour: "The server returns a 400 Bad Request response"
```

### Invalid HTTP Method
This test aims to ensure proper error handling of the server in case of an invalid HTTP request.
```js
testInput: "Sends a request to the server with an invalid HTTP method"
expectedBehaviour: "The server returns a 400 Bad Request response"
```

### Missing Host Header
This test aims to ensure proper error handling of the server in case of an invalid HTTP request.
```js
testInput: "Sends a request to the server without specifying the host (mandatory header field)"
expectedBehaviour: "The server returns a 400 Bad Request response"
```

### Invalid HTTP Version
This test aims to ensure proper error handling of the server in case of an invalid HTTP request.
```js
testInput: "Sends a request to the server with a non-existent HTTP Version"
expectedBehaviour: "The server returns a 400 Bad Request response"
```

### Improperly formatted request (headers)
This test aims to ensure proper error handling of the server in case of an invalid HTTP request.
```js
testInput: "Sends a request to the server without colon separation between the key-value "pairs in the headers
expectedBehaviour: "The server returns a 400 Bad Request response"
```
