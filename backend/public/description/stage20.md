# Stage 20: Load Balancing

## Overview
This stage validates load balancing in the reverse proxy. Three upstream servers run on ports 3000, 3001 and 3002, and each one replies with its own name (`upstream-3000`, `upstream-3001`, `upstream-3002`) so the tester can tell which one handled a request.

## Constraints to be followed
- A reverse proxy route can list multiple upstreams, and the server must pick one for every request
- `round_robin` must pick the upstreams in order and wrap around after the last one
- `ip_hash` must always pick the same upstream for the same client IP
- If `load_balancing` is not specified for a route, the server must use `round_robin`
- The tester provides the config. It defines listeners on ports `8001` (`round_robin`), `8002` (`ip_hash`) and `8003` (no `load_balancing` field)

## Tests
### Test 1: Round robin across three upstreams
This test ensures a route with "load_balancing": "round_robin" cycles through its upstreams in order

```js
testInput: "Sends 6 requests, one after another, to the round_robin route on port 8001"
expectedBehavior: "request 1 -> upstream-3000
request 2 -> upstream-3001
request 3 -> upstream-3002
request 4 -> upstream-3000
request 5 -> upstream-3001
request 6 -> upstream-3002"
```

### Test 2: Round robin is the default strategy
This test ensures a reverse proxy route without a "load_balancing" field falls back to round robin

```js
testInput: "Sends 6 requests, one after another, to the route on port 8003 which has no load_balancing field"
expectedBehavior: "request 1 -> upstream-3000
request 2 -> upstream-3001
request 3 -> upstream-3002
request 4 -> upstream-3000
request 5 -> upstream-3001
request 6 -> upstream-3002"
```

### Test 3: IP hash keeps a client on the same upstream
This test ensures a route with "load_balancing": "ip_hash" always sends requests from one client IP to the same upstream

```js
testInput: "Sends 5 requests from 127.0.0.2 to the ip_hash route on port 8002"
expectedBehavior: "All 5 requests are served by the same upstream"
```

### Test 4: IP hash depends on the client IP
This test ensures ip_hash is stable for every client IP and that different client IPs are not all sent to a single upstream

```js
testInput: "Sends 3 requests from each of 127.0.0.2, 127.0.0.3, 127.0.0.4, 127.0.0.5, 127.0.0.6, 127.0.0.7 to the ip_hash route on port 8002"
expectedBehavior: "Each client IP is always served by the same upstream, and the client IPs are spread over at least two different upstreams"
```

