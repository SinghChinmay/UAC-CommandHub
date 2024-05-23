import express from 'express';
import path from 'path';
import z from 'zod';
import { getProcessTableServices } from './src/pidTable';
import { readAndSendJson, writeJson } from './src/readAndWrite';
import {
    killAllServices,
    killAllServicesForced,
    killService,
    restartService,
    startAllServices,
    startService,
} from './src/util';

const app = express();
const port = process.env.PORT || 4000;

const zbody = z.object({
    service: z.string(),
    cwd: z.string(),
    command: z.string(),
    args: z.array(z.string()),
});

const zAction = z.enum(['start', 'restart', 'kill-all', 'start-all', 'stop', 'list']);

app.use(express.json());

app.get('/load-config-names', async (req, res) => {
    const data = await readAndSendJson();

    const configNames = data.map((d) => d.configName);

    res.json({ configNames });
});

app.post(`/save-config-name`, async (req, res) => {
    const data = await readAndSendJson();
    const configName = req.body.configName;

    if (!configName) {
        res.status(400).json({ message: 'Config name is required' });
        return;
    }

    if (data.some((d) => d.configName === configName)) {
        res.status(400).json({ message: 'Config name already exists' });
        return;
    }

    data.push({
        services: [],
        configName,
    });
    await writeJson(data);
    res.json({ message: 'Saved config name' });
});

app.get('/load-config/:configName', async (req, res) => {
    const data = await readAndSendJson();
    const configName = req.params.configName;
    const config = data.find((d) => d.configName === configName);

    console.log({ config });
    if (!config) {
        res.status(404).json({ message: 'Config not found' });
        return;
    }

    res.json(config.services);
});

app.post('/save-config/', async (req, res) => {
    const data = await readAndSendJson();
    const configName = req.body.configName;
    const config = data.find((d) => d.configName === configName);
    if (!config) {
        res.status(404).json({ message: 'Config not found' });
        return;
    }

    config.services = req.body.services;
    await writeJson(data);
    res.json({ message: 'Saved config' });
});

// requestSchema validates the request body
app.post('/:action', async (req, res) => {
    try {
        const action = zAction.parse(req.params.action);

        if (action === 'kill-all') {
            await killAllServices();
            res.json({ message: 'Killed all services' });
            return;
        }

        if (action === 'list') {
            res.json({ services: getProcessTableServices() });
            return;
        }

        if (action === 'start-all') {
            const zStartAll = z.array(zbody).parse(req.body);
            startAllServices(zStartAll);
            res.json({ message: 'Started all services' });
            return;
        }

        const body = zbody.parse(req.body);
        switch (action) {
            case 'start':
                await startService(body);
                res.json({ message: `Started ${body.service}` });
                return;
            case 'stop':
                await killService(body.service);
                res.json({ message: `Stopped ${body.service}` });
                return;
            case 'restart':
                await restartService(body);
                res.json({ message: `Restarted ${body.service}` });
                return;

            default:
                res.status(400).json({ message: `Invalid action: ${action}` });
                return;
        }
    } catch (error: any) {
        res.status(500).json({ message: `Error processing ${error.message}`, error });
        return;
    }
});

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.use('/', express.static(path.join(process.cwd(), 'public')));

app.all('*', (req, res) => {
    res.status(404).json({ message: 'Not found' });
    return;
});

app.listen(4000, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

function handleExit(signal: string) {
    console.log(`Received ${signal}, shutting down.`);
    killAllServicesForced();
}

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGBREAK', () => handleExit('SIGBREAK'));
process.on('SIGTERM', () => handleExit('SIGTERM'));
process.on('SIGHUP', () => handleExit('SIGHUP'));
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    handleExit('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    handleExit('unhandledRejection');
});
process.on('beforeExit', () => handleExit('beforeExit'));
process.on('exit', () => handleExit('exit'));
