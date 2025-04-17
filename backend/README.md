## eXpServer Tester Utility -- Backend

## Prerequisites
- [node v18+](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/)
- [Docker](https://docs.docker.com/engine/install/)
- preferably a unix environment

## Directory structure
```plaintext
eXpServer Backend/
├── Dockerfile
├── package.json
├── prisma/
│   └── schema.prisma           ## Database schema
├── public/                     ## Statically served files
│   ├── description
│   └── large-files
├── src/
│   ├── api/
│   │   └── <api router>/
│   │       ├── controllers.ts      ## Handlers for each route      
│   │       └── routes.ts           ## Routes for the given api router
│   ├── constants.ts                ## Common constants
│   ├── core/
│   │   ├── ContainerManager.ts
│   │   ├── Core.ts
│   │   ├── ResrouceMonitor.ts
│   │   ├── StageRunner.ts
│   │   ├── StageWatcher.ts
│   │   ├── TerminalStream.ts
│   │   └── Timer.ts
│   ├── generate-description.ts
│   ├── index.ts                    ## Entry point
│   ├── middleware/
│   ├── tests/
│   │   ├── index.ts
│   │   └── stages/
│   │       ├── index.ts
│   │       ├── stage<num>.ts
│   ├── types.ts
│   ├── utils/
│   └── Dockerfile
├── README.md
├── release.md
├── tsconfig.json
├── uploads/
├── Dockerfile.prod
├── Dockerfile
├── docker-compose.yaml
└── docker-compose.prod.yaml
```


## Installation
- clone the repo 
```bash
git clone https://github.com/eXpServer/expserver-tester.git
```

- cd into frontend directory
```bash
cd frontend
```

- install the dependencies
[Docker installation](https://docs.docker.com/engine/install/)
[nvm installation](https://github.com/nvm-sh/nvm)

## Usage
- build and execute the program
```bash
docker compose -f docker-compose.prod.yaml up --build # the --build can be omitted in subsequent runs
```

- (Alternative) compile and run executable
```bash
npm run compile # requires node v18
./compile/build-<linux / macos/ win.exe>
```

- (Run in development mode)
```bash
docker compose -f docker-compose.yaml up --build # the --build can be omitted in subsequent runs
```

## Note for contributors
- When updating test cases, corresponding description for each stage can be generated using the command
```bash
npm run generate-desc
```