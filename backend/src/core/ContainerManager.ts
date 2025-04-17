import Docker, { Container } from 'dockerode';
import { EventEmitter } from 'eventemitter3';
import { HOST_PWD, IMAGE_NAME, PUBLIC_DIR, WORKDIR } from '../constants';
export class ContainerManager extends EventEmitter {
    private _containerName: string;
    private _binaryId: string;
    private initialized: boolean;
    private _running: boolean;
    private _container: Container | null;
    private readonly ports: number[] = [3000, 8001, 8002, 8003, 8004, 8080];
    private docker: Docker;
    private _stream: NodeJS.ReadWriteStream | null;
    private _pid: number;
    private containerConfig: Object;
    private timeoutRef: NodeJS.Timeout | null;
    private pythonServerRunning: boolean;
    public static removingContainers = new Set<string>();

    get containerName(): string {
        return this._containerName;
    }

    get pid(): number {
        return this._pid;
    }

    get binaryId(): string {
        return this._binaryId;
    }

    get stream() {
        return this._stream;
    }

    get running() {
        return this._running;
    }

    get container() {
        return this._container;
    }

    constructor(containerName: string, binaryId: string, requiresXpsConfig: boolean, publicPath: string) {
        super();
        this._containerName = containerName;
        this._binaryId = binaryId;
        this.initialized = false;
        this._container = null;
        this.docker = new Docker();
        this._running = false;
        this.initialized = false;
        this.timeoutRef = null;
        this.pythonServerRunning = false;


        const customPublicDir = `${HOST_PWD}/public/${publicPath}`;

        this.containerConfig = {
            Image: IMAGE_NAME,
            name: this._containerName,
            Cmd: ['sh', '-c', `nohup python3 -m http.server 3000 -d ${PUBLIC_DIR} > /dev/null 2>&1 & echo $! > /tmp/http_server.pid && exec ./${this._binaryId} ${requiresXpsConfig ? `${PUBLIC_DIR}/xps_config.json` : ''}`],
            HostConfig: {
                Binds: [`${HOST_PWD}/uploads:${WORKDIR}`, `${customPublicDir}:${PUBLIC_DIR}`],
                NetworkMode: "backend_mynet",
            }
        }
    }

    public async start(): Promise<void> {
        if (this.timeoutRef)
            clearTimeout(this.timeoutRef)

        if (this.initialized || this.running)
            return;

        try {
            await this.startContainer();
            if (!this.initialized) {
                return;
            }
        }
        catch (error) {
            this.timeoutRef = setTimeout(() => {
                this.start();
            }, 1000);
            return;
        }

        this._pid = (await this._container.inspect()).State.Pid

        const eventStream = await this.docker.getEvents();
        eventStream.on('data', (chunk) => {
            const event = JSON.parse(chunk.toString());
            if (event.Type == 'container' && event.Actor.Attributes.name == this._containerName && (event.Action == 'stop' || event.Action == 'die')) {
                console.log("container shut down");
                this._running = false;
                if (!this._container)
                    return;
                this._container.inspect().then((data) => {
                    const exitCode = data.State.ExitCode;
                    this.emit('close', exitCode);
                    if (this.initialized)
                        this.emit('error', exitCode);

                })

            }
        })

        this._running = true;
    }


    public async restartContainer(): Promise<void> {
        console.log('restarting container');
        try {
            await this._container.restart();
            this._pid = (await this._container.inspect()).State.Pid

        }
        catch (error) {
            console.log(error);
            await this._container.start();
        }
    }

    public async kill(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.initialized || (this._container === null))
                return;
            if (ContainerManager.removingContainers.has(this._containerName)) {
                console.log(`Container: ${this._containerName} is already being removed`);
                return;
            }

            ContainerManager.removingContainers.add(this._containerName);
            try {
                this.initialized = false;
                this._running = false;
                const inspect = await this._container.inspect();
                if (inspect.State.Running) {
                    console.log(`Stopping container: ${this._containerName}`);
                    await this._container.kill();
                }
                console.log(`Removing container: ${this._containerName}`);
                await this._container.remove({ force: true });

                this._container = null;
                this._stream = null;
                this._pid = -1;
            }
            catch (error) {
                if (error.statusCode != 409)
                    console.log(error);
            }
            ContainerManager.removingContainers.delete(this._containerName);

            setTimeout(() => {
                return resolve();
            }, 1000); // wait 1 second for proper shut down of container
        })
    }

    public async detachStream(): Promise<void> {
        if (!this._container)
            return;

        this.emit('stdout', "-- stream paused to prevent overflow in case of unnecessary print statements --\n");

        if (this._stream) {
            this._stream.removeAllListeners();
            this._stream = null;
        }
    }

    public async attachStream(): Promise<void> {
        if (!this._container)
            return;

        this._stream = await this._container.attach({
            stream: true,
            stdout: true,
            stderr: true,
        })

        this.emit('stdout', '-- stream started / resumed --\n');


        this._stream.on('data', (chunk) => {
            this.emit('stdout', chunk.toString());
        })

        this._stream.on('error', (err) => {
            this.emit('stderr', err);
        })

        this._stream.on('end', () => {
            this.emit('end', '--- End of Stream ---\n');
        })
    }



    private async startContainer(): Promise<void> {
        try {
            this._container = await this.docker.createContainer(this.containerConfig);
        }
        catch {
            const existingContainer = this.docker.getContainer(this._containerName);
            if (existingContainer)
                await existingContainer.remove({ force: true });

            this._container = await this.docker.createContainer(this.containerConfig);
        }

        await this.attachStream();
        this.pythonServerRunning = true;
        await this._container.start();
        try {
            const message = await this.waitForContainerToRun();
            console.log(message);
        }
        catch (error) {
            console.log(error)
        }
    }

    private waitForContainerToRun(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.initialized)
                return resolve("already initialized");
            const interval = setInterval(async () => {
                const data = await this._container.inspect();
                const isRunning = data.State.Running;
                const hasExited = data.State.Status == 'exited';
                const exitCode = data.State.ExitCode;
                console.log(isRunning, hasExited, exitCode)
                if (hasExited) {
                    clearInterval(interval);
                    this.initialized = false;
                    return reject(`Container ${this._containerName} exited with code ${exitCode}`);
                }
                if (isRunning) {
                    clearInterval(interval);
                    this.initialized = true;
                    return resolve(`Started container: ${this._containerName} `);
                }
            }, 1000);
        })
    }

    public async getResourceStats(): Promise<{ cpuUsage: number, memUsage: number }> {
        if (!this.initialized || !this._container)
            return { cpuUsage: -1, memUsage: -1 };

        const exec = await this._container.exec({
            Cmd: ['ps', '-p', '1', '-o', '%cpu,%mem,cmd'],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({
            hijack: true,
            stdin: false,
        });

        let output = '';
        stream.on('data', chunk => {
            output += chunk.toString();
        })

        return new Promise((resolve, reject) => {
            stream.on('end', () => {
                try {
                    const lines = output.split('\n');
                    const data = lines[1].match(/^[^\d]*(\d+\.\d+)\s+(\d+\.\d+)/m);
                    if (data) {
                        const [_, cpu, mem] = data;
                        const cpuUsage = parseFloat(cpu);
                        const memUsage = parseFloat(mem);
                        return resolve({
                            cpuUsage,
                            memUsage,
                        });
                    }
                    else {
                        return reject({
                            cpuUsage: 0,
                            memUsage: 0,
                        });
                    }
                }
                catch (e) {
                    return reject({
                        cpuUsage: 0,
                        memUsage: 0,
                    });
                }
            })
        })
    }

    public stopPythonServer() {
        return new Promise(async (resolve) => {
            const exec = await this._container.exec({
                Cmd: ['sh', '-c', 'kill $(cat /tmp/http_server.pid) && rm -f /tmp/http_server.pid'],
                AttachStderr: false,
                AttachStdout: false,
            });

            await exec.start({ hijack: true, stdin: false });

            setTimeout(() => {
                resolve({ message: "shutdown" })
            }, 1000);
        })
    }
}