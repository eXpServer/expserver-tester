import Docker, { Container } from 'dockerode';
import { EventEmitter } from 'eventemitter3';
import { IMAGE_NAME, WORKDIR } from '../constants';
export class ContainerManager extends EventEmitter {
    private _containerName: string;
    private _binaryId: string;
    private mappedPorts: Map<number, number>;
    private initialized: boolean;
    private _running: boolean;
    private container: Container | null;
    private ports: number[];
    private docker: Docker;
    private _stream: NodeJS.ReadWriteStream | null;
    private _pid: number;

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

    constructor(containerName: string, binaryId: string, ports: number[]) {
        super();
        this._containerName = containerName;
        this._binaryId = binaryId;
        this.ports = ports;
        this.mappedPorts = new Map();
        this.initialized = false;
        this.container = null;
        this.docker = new Docker();
        this._running = false;
        this.initialized = false;
    }

    public async start(): Promise<void> {
        console.log("hello");
        if (this.initialized)
            return;

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
                console.log(event);
                this._running = false;
                const inspect = this.container.inspect().then((data) => {
                    const exitCode = data.State.ExitCode;
                    this.emit('close', exitCode);
                    console.log('close');
                    if (this.initialized)
                        this.emit('error', exitCode);

                })

            }
        })
    }


    public async attachStreams(): Promise<void> {
        const stream = await this.container.attach({
            stream: true,
            stdout: true,
            stderr: true,
        })


        this._stream = stream;
    }

    public async kill(): Promise<void> {
        if (!this.initialized || this.container === null)
            return;

        this.initialized = false;
        const inspect = await this.container.inspect();
        if (inspect.State.Running) {
            console.log(`Stopping container: ${this._containerName}`);
            await this.container.kill();
        }
        console.log(`Removing container: ${this._containerName}`);
        await this.container.remove({ force: true });

        this.container = null;

        return;
    }


    private async startContainer(): Promise<void> {
        this.container = await this.docker.createContainer({
            Image: IMAGE_NAME,
            name: this._containerName,
            Cmd: [`./${this._binaryId}`],
            ExposedPorts: this.getExposedPortsConfig(),
            HostConfig: {
                PublishAllPorts: true,
                Binds: [`${process.cwd()}/uploads/:${WORKDIR}`]
            }
        });

        console.log(`Starting container: ${this._containerName}`);
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