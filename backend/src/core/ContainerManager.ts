import Docker, { Container } from 'dockerode';
import { EventEmitter } from 'eventemitter3';
import { IMAGE_NAME, WORKDIR } from '../constants';
import { readFileSync } from 'fs';
export class ContainerManager extends EventEmitter {
    private _containerName: string;
    private _binaryId: string;
    private mappedPorts: Map<number, number>;
    private initialized: boolean;
    private _running: boolean;
    private container: Container | null;
    private readonly ports: number[] = [3000, 8001, 8002, 8003, 8004, 8080];
    private docker: Docker;
    private _stream: NodeJS.ReadWriteStream | null;
    private _pid: number;
    private containerConfig: Object;

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

    public getMapppedPort(hostPort: number): number | null {
        const port = this.mappedPorts.get(hostPort);
        return port || null;
    }

    constructor(containerName: string, binaryId: string, createDummaryServer: boolean) {
        super();
        this._containerName = containerName;
        this._binaryId = binaryId;
        this.mappedPorts = new Map();
        this.initialized = false;
        this.container = null;
        this.docker = new Docker();
        this._running = false;
        this.initialized = false;

        this.containerConfig = {
            Image: IMAGE_NAME,
            name: this._containerName,
            Cmd: createDummaryServer
                ? [
                    'sh', '-c',
                    `python3 -m http.server 3000 > /dev/null 2>&1 & ./${this._binaryId}`
                ] : [
                    `./${this._binaryId}`
                ],
            ExposedPorts: this.getExposedPortsConfig(),
            HostConfig: {
                PublishAllPorts: true,
                Binds: [`${process.cwd()}/uploads/:${WORKDIR}`],
            }
        }
    }

    public async start(): Promise<void> {
        if (this.initialized)
            return;
        console.log("restarting container");
        await this.startContainer();

        for (const port of this.ports) {
            const portMapping = await this.getHostPortForContainer(port);
            this.mappedPorts.set(port, portMapping);
        }

        this._pid = (await this.container.inspect()).State.Pid


        this.initialized = true;
        this._running = true;


        const eventStream = await this.docker.getEvents();
        eventStream.on('data', (chunk) => {
            const event = JSON.parse(chunk.toString());
            if (event.Type == 'container' && event.Actor.Attributes.name == this._containerName && (event.Action == 'stop' || event.Action == 'die')) {
                this._running = false;
                if (!this.container)
                    return;
                this.container.inspect().then((data) => {
                    const exitCode = data.State.ExitCode;
                    this.emit('close', exitCode);
                    console.log('died', this.containerName, exitCode);
                    if (this.initialized)
                        this.emit('error', exitCode);

                })

            }
        })
    }

    public async kill(): Promise<void> {
        if (!this.initialized || !this.running || this.container === null)
            return;

        this.initialized = false;
        // const inspect = await this.container.inspect();
        // if (inspect.State.Running) {
        //     console.log(`Stopping container: ${this._containerName}`);
        //     await this.container.kill();
        //     console.log('stopped container');
        // }
        console.log(`Removing container: ${this._containerName}`);
        console.log(this.container);
        await this.container.remove({ force: true });

        this.container = null;
        this._stream = null;
        this._running = false;
        this._pid = -1;
        this.mappedPorts = new Map();

        return;
    }

    private async attachStream(): Promise<void> {
        if (!this.container)
            return;

        this._stream = await this.container.attach({
            stream: true,
            stdout: true,
            stderr: true,
        })


        this._stream.on('data', (chunk) => {
            this.emit('stdout', chunk.toString());
        })

        this._stream.on('error', (err) => {
            this.emit('stderr', err);
        })

        this._stream.on('end', () => {
            this.emit('end', '--- End of Stream ---');
        })
    }



    private async startContainer(): Promise<void> {
        try {
            this.container = await this.docker.createContainer(this.containerConfig);
        }
        catch {
            const existingContainer = this.docker.getContainer(this._containerName);
            if (existingContainer)
                await existingContainer.remove({ force: true });

            this.container = await this.docker.createContainer(this.containerConfig);
        }

        await this.attachStream();

        console.log(`Starting container: ${this._containerName} `);
        await this.container.start();
        await this.waitForContainerToRun();
    }

    private getExposedPortsConfig(): Record<string, {}> {
        const exposedPorts: Record<string, {}> = {};

        for (const port of this.ports) {
            exposedPorts[`${port}/tcp`] = {};
        }

        return exposedPorts;
    }

    private waitForContainerToRun(): Promise<void> {
        return new Promise((resolve) => {
            if (this.initialized)
                return resolve();
            const interval = setInterval(async () => {
                const data = await this.container.inspect();
                const isRunning = data.State.Running;
                if (isRunning) {
                    clearInterval(interval);
                    this.initialized = true;
                    return resolve();
                }
            }, 1000);
        })
    }

    public async getResourceStats(): Promise<{ cpuUsage: number, memUsage: number }> {
        if (!this.initialized || !this.container)
            return { cpuUsage: -1, memUsage: -1 };

        const exec = await this.container.exec({
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
                const lines = output.split('\n');
                if (lines.length < 2)
                    return reject('no data returned');

                const data = lines[1].trim().split(/\s+/);
                if (data.length < 2)
                    return reject('unexpected output');

                const cpuUsage = parseFloat(data[0]);
                const memUsage = parseFloat(data[1]);

                return resolve({
                    cpuUsage,
                    memUsage,
                });
            })
        })
    }

    private async getHostPortForContainer(portNo: number): Promise<number | null> {
        if (!this.initialized || !this.container)
            return null;

        const data = await this.container.inspect();
        const portMapping = data.NetworkSettings.Ports[`${portNo}/tcp`];

        if (portMapping && portMapping.length > 0)
            return parseInt(portMapping[0].HostPort, 10);
        return null;
    }

    // public on(event: string, callback: (...args: any[]) => void): void {
    //     if (!this.initialized || !this.container) return;

    //     // this._container.modem.followProgress(this._container, callback);
    // }

}