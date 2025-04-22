# Stage 16: Directory Browsing

## Overview

## Constraints to be followed

## Tests
### Test 1: Verify Headers
The server should provide valid headers and status response for the request, which is verified in this test

```js
testInput: "The client sends a GET request on path '/' to the server"
expectedBehavior: "Client sends an html page containing links to all the directories contained within the page"
```

### Test 2: Verify population of content on directories
This test ensures that the HTML file served consists of all the directories and files present in the actual directory

```js
testInput: "The client sends a GET request on path '/'"
expectedBehavior: "Client expects links to the files and directories present in that directory (note: client already knows contents of the direcotry)"
```

### Test 3: Verify file serving
This test ensures that the server is able to serve files properly, as done in previous

```js
testInput: "Client sends a GET request on a file"
expectedBehavior: "Server should send the file with appropriate mime-type and other relevant headers"
```

### Test 4: Full Directory walk
This test runs a deep pass through each file and directory starting at the root, and ensures all files and directories give output as expected

```js
testInput: "sends an initial GET request to path '/', and also to each file within each route"
expectedBehavior: "all of the directories should serve html files, containing all the expected links. And all the files should be served properly as done in previous stages"
```

