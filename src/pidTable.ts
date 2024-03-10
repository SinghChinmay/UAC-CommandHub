import { ChildProcess, spawnSync } from 'child_process';

let processTable: {
    process: ChildProcess;
    service: string;
}[] = [];

export function getProcessTable() {
    return processTable;
}

export function addProcessToTable(service: string, process: ChildProcess) {
    processTable.push({ service, process: process });
}

export function getProcessFromTable(service: string) {
    return processTable.find((entry) => entry.service === service)?.process;
}

export function removeProcessFromTable(service: string) {
    const index = processTable.findIndex((entry) => entry.service === service);
    processTable.splice(index, 1);
}

export function getProcessTableSize() {
    return processTable.length;
}

export function getProcessTableServices() {
    return processTable.map((entry) => entry.service);
}

export function addMultipleProcesssToTable(processes: typeof processTable) {
    processTable.push(...processes);
}

export function getMultipleProcesssFromTable(services: string[]) {
    return processTable.filter((entry) => services.includes(entry.service));
}

export function removeMultipleProcesssFromTable(services: string[]) {
    processTable = processTable.filter((entry) => !services.includes(entry.service));
}

export function clearProcessTable() {
    processTable.splice(0);
}

// a job to keep the process table clean
setInterval(() => {
    processTable = processTable.filter((entry) => {
        if (!entry.process.pid) {
            return false;
        }
        // get process status from the operating system
        let result;
        let output;
        if (process.platform === 'win32') {
            result = spawnSync('tasklist', ['/FI', `PID eq ${entry.process.pid}`, '/FO', 'CSV']);
            output = result.stdout.toString().trim().split('\n')[1];
        } else {
            result = spawnSync('ps', ['-p', entry.process.pid.toString(), '-o', 'comm=']);
            output = result.stdout.toString().trim();
        }

        if (entry.process.killed || entry.process.exitCode !== null || output === '') {
            return false;
        }
        return true;
    });
}, 3000);
