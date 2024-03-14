import chalk from 'chalk';
import { spawn } from 'child_process';
import kill from 'tree-kill';
import * as P from './pidTable';
import { WorkingDirectory } from './readAndWrite';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function listRunningServices() {
    const processTable = P.getProcessTable();
    return processTable.map((entry) => entry.service);
}

async function startService(options: { service: string; cwd: string; command: string; args: string[] }) {
    if (options.cwd === '') {
        options.cwd = WorkingDirectory;
    }

    if (P.getProcessFromTable(options.service)) {
        console.log(`Service ${options.service} is already running.`);
        return;
    }

    console.log(
        `Starting command ${chalk.green.bold(options.service)} with args ${chalk.green.bold(options.args || `[]`)}`,
    );

    const process = spawn(options.command, options.args, {
        cwd: options.cwd,
        stdio: 'inherit',
        detached: true,
    });

    P.addProcessToTable(options.service, process);
}

async function killAllServices() {
    const processTable = P.getProcessTable();

    for (const entry of processTable) {
        try {
            await killService(entry.service);
        } catch (error) {
            console.error(`Failed to kill ${entry.service}:`, error);
        }
    }
}

async function killService(service: string) {
    const process = P.getProcessFromTable(service);
    if (!process) {
        console.log(`Service ${service} is not running.`);
        return;
    }

    console.log(`Killing command ${chalk.green.bold(service)}`);

    kill(process.pid as number, 'SIGKILL', (err) => {
        if (err) {
            console.error(`Failed to kill ${service}:`, err);
        }
    });

    await wait(200);
}

async function restartService(options: { service: string; cwd: string; command: string; args: string[] }) {
    const process = P.getProcessFromTable(options.service);
    if (!process) {
        console.log(`Service ${options.service} is not running. Still restarting...`);
    } else {
        await killService(options.service);
        P.removeProcessFromTable(options.service);
    }

    startService(options);
}

async function restartAllServices() {
    const processTable = P.getProcessTable();

    for (const entry of processTable) {
        await killService(entry.service);
        await wait(200);
    }

    for (const entry of processTable) {
        startService({
            service: entry.service,
            cwd: entry.process.spawnfile,
            command: entry.process.spawnargs[0],
            args: entry.process.spawnargs.slice(1),
        });
        await wait(200);
    }
}

async function startAllServices(
    services: {
        service: string;
        cwd: string;
        command: string;
        args: string[];
    }[],
) {
    for (const service of services) {
        startService(service);
        await wait(200);
    }

    console.log('All services started 🚀🚀🚀');
}

export {
    killAllServices,
    killService,
    listRunningServices,
    restartAllServices,
    restartService,
    startAllServices,
    startService,
};
