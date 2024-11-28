# Use a minimal base image (e.g., for a Go binary, use 'alpine' for smaller size)
FROM alpine:latest

# Install necessary libraries (if your binary requires any)
# Example: Install libc if it's a C/C++ binary
RUN apk add --no-cache libc6-compat

# Set working directory inside the container
WORKDIR /usr/src/app


# Expose port 8000 (the port your binary will listen on inside the container)
EXPOSE 8080
EXPOSE 8001
EXPOSE 8002
EXPOSE 8003
EXPOSE 8004
