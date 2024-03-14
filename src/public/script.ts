const debug = true;

const services = new Set([
    {
        service: 'echo name',
        command: 'echo',
        args: ['name'],
        cwd: '/home',
    },
    {
        service: 'ping to google',
        command: 'ping',
        args: ['google.com'],
        cwd: '/home',
    },
    {
        service: 'get name of current user',
        command: 'whoami',
        args: [],
        cwd: '/home',
    },
]);

function updateServiceStatus() {
    fetch('/list', {
        method: 'POST',
    })
        .then((response) => response.json())
        .then((data) => {
            services.forEach((service) => {
                const serviceRow = document.getElementById(`service-${service.service}`);
                if (serviceRow) {
                    if (data.services.includes(service.service)) {
                        serviceRow.classList.add('running');
                        debug && console.log(`adding running class to ${service.service}`);
                    } else {
                        serviceRow.classList.remove('running');
                    }
                }
            });
        })
        .catch((error) => console.log('Error fetching service list:', error));
}

function manageService(action: string, service: string) {
    debug && console.log(`${action}: ${service}`);
    debug && console.log([...services].find((s) => s.service === service));
    fetch(`/${action}`, {
        method: 'POST',
        body: JSON.stringify([...services].find((s) => s.service === service)),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => response.text())
        .then((data) => console.log(`${action}: ${service} - ${data}`))
        .catch((error) => console.error(`Error with service ${service}:`, error));
}

function killAllServices() {
    fetch('/kill-all', { method: 'POST' })
        .then((response) => response.text())
        .then((data) => console.log(`Response: ${data}`))
        .catch((error) => console.error('Error killing all services:', error));
}

function startAllServices() {
    fetch('/start-all', {
        method: 'POST',
        body: JSON.stringify([...services]),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => response.text())
        .then((data) => console.log(`Response: ${data}`))
        .catch((error) => console.error('Error starting all services:', error));
}

function addService(e: Event) {
    e.preventDefault();
    // Get form values
    const serviceNameInput = document.getElementById('serviceName') as HTMLInputElement;
    const serviceCommandInput = document.getElementById('serviceCommand') as HTMLInputElement;
    const serviceArgsInput = document.getElementById('serviceArgs') as HTMLInputElement;
    const serviceCwdInput = document.getElementById('serviceCwd') as HTMLInputElement;

    const service = {
        service: serviceNameInput ? serviceNameInput.value : '',
        command: serviceCommandInput ? serviceCommandInput.value : '',
        args: serviceArgsInput ? serviceArgsInput.value.split(',').map((arg) => arg.trim()) : [],
        cwd: serviceCwdInput ? serviceCwdInput.value : '',
    };

    // Add the service to the array
    services.add(service);

    clearTable();
    init();

    console.log('Service added:', service);
}

function init() {
    const servicesList = document.getElementById('services-list');
    [...services].forEach((service) => {
        const row = document.createElement('tr');
        row.id = `service-${service.service}`; // Assign an ID to each row for later reference
        const nameCell = document.createElement('td');
        nameCell.textContent = service.service;
        row.appendChild(nameCell); // Add the name cell to the row

        ['start', 'stop', 'restart'].forEach((action) => {
            const actionCell = document.createElement('td');
            const actionLink = document.createElement('a');
            actionLink.onclick = () => manageService(action, service.service);
            actionLink.href = '#';
            actionLink.textContent = action.charAt(0).toUpperCase() + action.slice(1);

            actionLink.style.display = 'block';
            actionLink.style.width = '100%';
            actionLink.style.height = '100%';
            actionLink.style.padding = '2px';

            actionCell.appendChild(actionLink);

            row.appendChild(actionCell);
        });

        servicesList && servicesList.appendChild(row);
    });
}

function clearTable() {
    const servicesList = document.getElementById('services-list');
    if (servicesList) {
        while (servicesList.firstChild) {
            servicesList.removeChild(servicesList.firstChild);
        }
    }
}

function saveConfigFn(e: Event) {
    e.preventDefault();

    const configSource = document.getElementById('configSource') as HTMLSelectElement;

    fetch('/save-config', {
        method: 'POST',
        body: JSON.stringify({ services: [...services], configName: configSource.value }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => response.text())
        .then((data) => console.log(`Response: ${data}`))
        .catch((error) => console.error('Error saving config:', error));
}

function loadConfigFn(e: Event) {
    e.preventDefault();

    const configSource = document.getElementById('configSource') as HTMLSelectElement;

    fetch(`/load-config/${configSource.value}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.length === 0) {
                throw 'No data';
            }

            services.clear();
            data.forEach((service: { service: string; command: string; args: string[]; cwd: string }) =>
                services.add(service),
            );
            clearTable();
            init();
        })
        .catch((error) => console.error('Error loading config:', error));
}

function saveConfigNameFn(e: Event) {
    e.preventDefault();

    const saveConfigName = document.getElementById('configName') as HTMLInputElement;

    fetch('/save-config-name', {
        method: 'POST',
        body: JSON.stringify({ configName: saveConfigName.value }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(async (response) => await response.text())
        .then((data) => console.log(`Response: ${data}`))
        .catch((error) => console.error('Error saving config name:', error));
}

function loadConfigNames() {
    fetch('/load-config-names')
        .then((response) => response.json())
        .then((data) => {
            const configSource = document.getElementById('configSource') as HTMLSelectElement;
            configSource.innerHTML = '';

            data.configNames.forEach((configName: string) => {
                const option = document.createElement('option');
                option.value = configName;
                option.text = configName;
                configSource.appendChild(option);
            });

            // console.log('Config names loaded:', data.configNames);
        })
        .catch((error) => console.error('Error loading config names:', error));
}

window.onload = () => {
    init();

    const killAllButton = document.getElementById('kill-all-btn');
    const startAllButton = document.getElementById('start-all-btn');
    const addServiceButton = document.getElementById('add-service-btn');

    const saveConfig = document.getElementById('saveConfig');
    const loadConfig = document.getElementById('loadConfig');
    const saveConfigName = document.getElementById('saveConfigName');

    if (saveConfigName) {
        saveConfigName.onclick = saveConfigNameFn;
    }

    if (saveConfig) {
        saveConfig.onclick = saveConfigFn;
    }

    if (loadConfig) {
        loadConfig.onclick = loadConfigFn;
    }

    if (addServiceButton) {
        addServiceButton.onclick = addService;
    }

    if (killAllButton) {
        killAllButton.onclick = killAllServices;
    }

    if (startAllButton) {
        startAllButton.onclick = startAllServices;
    }

    // Poll the service status every 3 seconds
    setInterval(updateServiceStatus, 3000);
    updateServiceStatus(); // Initial update on page load
    loadConfigNames();
};
