# Stage 21: Request Timeouts

## Overview
This stage validates the request timeout. The server must close client connections that stay inactive for the default 60 second timeout, and must reset the timer whenever the client sends or receives data.

## Constraints to be followed
- The default HTTP request timeout is 60 seconds
- Every session has its own timer, and a session is destroyed when its timer expires
- The timer must be reset on every read from and every write to the client
- Closing one inactive session must not affect other sessions
- The tests wait in real time, so running this stage takes around 5 minutes

## Tests
### Test 1: Idle connection is closed after the default timeout
This test ensures the server closes a connection that stays inactive for the default 60 second request timeout

```js
testInput: "Opens a connection to the server on port 8001 and sends nothing"
expectedBehavior: "The server closes the connection between 55 and 70 seconds after it was opened"
```

### Test 2: Client activity resets the timeout
This test ensures the session timer is reset when the client sends data, so the connection is not closed at the original expiry time

```js
testInput: "Opens a connection, waits 30 seconds, sends one HTTP request, then stays idle"
expectedBehavior: "The request is answered, and the connection is closed between 55 and 70 seconds after that request, not 60 seconds after it was opened"
```

### Test 3: Keep-alive requests keep the connection open
This test ensures every request and response on a keep-alive connection resets the timer

```js
testInput: "Sends 1 requests on one connection, 35 seconds apart (0 seconds in total, longer than the 60 second timeout)"
expectedBehavior: "All 1 requests are answered on the same connection and the connection is never closed in between"
```

### Test 4: Sessions time out independently
This test ensures every session has its own timer, and that one session timing out does not affect the others

```js
testInput: "Opens connection A, opens connection B 30 seconds later, and keeps both idle"
expectedBehavior: "Connection A is closed between 55 and 70 seconds after it was opened, connection B stays open until its own timeout, and B is closed between 55 and 70 seconds after it was opened"
```

