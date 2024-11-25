import Docker, { Container } from 'dockerode';

export class ContainerManager {
    private _containerName: string;
    private _binaryId: string;
    private mappedPorts: Map<number, number>;
    private initialized: boolean;
    private container: Container | null;
    private ports: number[];
    private docker: Docker;
    private _stream: NodeJS.ReadWriteStream | null;

    get containerName(): string {
        return this._containerName;
    }

    get binaryId(): string {
        return this._binaryId;
    }

    get stream() {
        return this._stream;
    }

    public getMapppedPort(hostPort: number): number | null {
        const port = this.mappedPorts.get(hostPort);
        return port || null;
    }

    constructor(containerName: string, binaryId: string, ports: number[]) {
        this._containerName = containerName;
        this._binaryId = binaryId;
        this.ports = ports;
        this.mappedPorts = new Map();
        this.initialized = false;
        this.container = null;
        this.docker = new Docker();
    }

    public async start(): Promise<void> {
        if (this.initialized)
            return;

        await this.startContainer();

        for (const port of this.ports) {
            const portMapping = await this.getHostPortForContainer(port);
            this.mappedPorts.set(port, portMapping);
        }


        this.initialized = true;
    }

    public async attachStreams(): Promise<void> {
        const stream = await this.container.attach({
            stream: true,
            stdout: true,
            stderr: true,
        })


        this._stream = stream;
    }

    public async stop(): Promise<void> {
        if (!this.initialized || this.container === null)
            return;

        console.log(`Stopping container: ${this._containerName}`);
        await this.container.stop();
        console.log(`Removing container: ${this._containerName}`);
        await this.container.remove();

        this.initialized = false;
        this.container = null;
    }


    private async startContainer(): Promise<void> {
        this.container = await this.docker.createContainer({
            Image: 'test-image',
            name: this._containerName,
            Cmd: [`./${this._binaryId}`],
            ExposedPorts: this.getExposedPortsConfig(),
            HostConfig: {
                PublishAllPorts: true,
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