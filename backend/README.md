## eXpServer Tester Utility -- Backend

## Prerequisites
- `node v18+`


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
```bash
npm install
npm run setup
npm run generate-large-file
```


## Usage
- build and execute the program
```bash
npm run build
npm run start
```

- (Alternative) compile and run executable
```bash
npm run compile # requires node v18
./compile/build-<linux / macos/ win.exe>
```


## Note for contributors
- When updating test cases, corresponding description for each stage can be generated using the command
```bash
npm run generate-desc
```