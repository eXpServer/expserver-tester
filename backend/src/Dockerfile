FROM debian:bookworm-slim

RUN apt-get update

RUN apt-get install -y libc6-dev \ 
    vim git nano make gcc tar wget \ 
    build-essential \
    libreadline-dev \ 
    gdb \ 
    curl \
    zlib1g-dev \
    python3 \
    python3-pip \
    netcat-openbsd \
    procps

WORKDIR /usr/src/app

EXPOSE 3000
EXPOSE 8080
EXPOSE 8001
EXPOSE 8002
EXPOSE 8003
EXPOSE 8004