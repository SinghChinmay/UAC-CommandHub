import express from 'express';
import path from 'path';
import z from 'zod';
import { getProcessTableServices } from './src/pidTable';
import { killAllServices, killService, restartService, startAllServices, startService } from './src/util';

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
