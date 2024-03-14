const filePath = process.cwd();

export async function readAndSendJson() {
    try {
        const services = await Bun.file(filePath + '/.temp.json', { type: 'application/json' }).json();
        return services as {
            services: {
                service: string;
                cwd: string;
                command: string;
                args: string[];
            }[];
            configName: string;
        }[];
    } catch (error) {
        const createFile = Bun.write(filePath + '/.temp.json', '[]');
        return [];
    }
}

export async function writeJson(data: any) {
    try {
        const write = Bun.write(filePath + '/.temp.json', JSON.stringify(data));
        return true;
    } catch (error) {
        return false;
    }
}
