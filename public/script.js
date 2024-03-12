// script.ts
var updateServiceStatus = function() {
  fetch("/list", {
    method: "POST"
  }).then((response) => response.json()).then((data) => {
    services.forEach((service) => {
      const serviceRow = document.getElementById(`service-${service.service}`);
      if (serviceRow) {
        if (data.services.includes(service.service)) {
          serviceRow.classList.add("running");
          debug && console.log(`adding running class to ${service.service}`);
        } else {
          serviceRow.classList.remove("running");
        }
      }
    });
  }).catch((error) => console.log("Error fetching service list:", error));
};
var manageService = function(action, service) {
  debug && console.log(`${action}: ${service}`);
  debug && console.log([...services].find((s) => s.service === service));
  fetch(`/${action}`, {
    method: "POST",
    body: JSON.stringify([...services].find((s) => s.service === service)),
    headers: {
      "Content-Type": "application/json"
    }
  }).then((response) => response.text()).then((data) => console.log(`${action}: ${service} - ${data}`)).catch((error) => console.error(`Error with service ${service}:`, error));
};
var killAllServices = function() {
  fetch("/kill-all", { method: "POST" }).then((response) => response.text()).then((data) => console.log(`Response: ${data}`)).catch((error) => console.error("Error killing all services:", error));
};
var startAllServices = function() {
  fetch("/start-all", {
    method: "POST",
    body: JSON.stringify([...services]),
    headers: {
      "Content-Type": "application/json"
    }
  }).then((response) => response.text()).then((data) => console.log(`Response: ${data}`)).catch((error) => console.error("Error starting all services:", error));
};
var addService = function() {
  const serviceNameInput = document.getElementById("serviceName");
  const serviceCommandInput = document.getElementById("serviceCommand");
  const serviceArgsInput = document.getElementById("serviceArgs");
  const serviceCwdInput = document.getElementById("serviceCwd");
  const service = {
    service: serviceNameInput ? serviceNameInput.value : "",
    command: serviceCommandInput ? serviceCommandInput.value : "",
    args: serviceArgsInput ? serviceArgsInput.value.split(",").map((arg) => arg.trim()) : [],
    cwd: serviceCwdInput ? serviceCwdInput.value : ""
  };
  services.add(service);
  clearTable();
  init();
  console.log("Service added:", service);
};
var init = function() {
  const servicesList = document.getElementById("services-list");
  [...services].forEach((service) => {
    const row = document.createElement("tr");
    row.id = `service-${service.service}`;
    const nameCell = document.createElement("td");
    nameCell.textContent = service.service;
    row.appendChild(nameCell);
    ["start", "stop", "restart"].forEach((action) => {
      const actionCell = document.createElement("td");
      const actionLink = document.createElement("a");
      actionLink.onclick = () => manageService(action, service.service);
      actionLink.href = "#";
      actionLink.textContent = action.charAt(0).toUpperCase() + action.slice(1);
      actionLink.style.display = "block";
      actionLink.style.width = "100%";
      actionLink.style.height = "100%";
      actionLink.style.padding = "2px";
      actionCell.appendChild(actionLink);
      row.appendChild(actionCell);
    });
    servicesList && servicesList.appendChild(row);
  });
};
var clearTable = function() {
  const servicesList = document.getElementById("services-list");
  if (servicesList) {
    while (servicesList.firstChild) {
      servicesList.removeChild(servicesList.firstChild);
    }
  }
};
var debug = true;
var services = new Set([
  {
    service: "echo name",
    command: "echo",
    args: ["name"],
    cwd: "/home"
  },
  {
    service: "ping to google",
    command: "ping",
    args: ["google.com"],
    cwd: "/home"
  },
  {
    service: "get name of current user",
    command: "whoami",
    args: [],
    cwd: "/home"
  }
]);
window.onload = () => {
  init();
  const killAllButton = document.getElementById("kill-all-btn");
  const startAllButton = document.getElementById("start-all-btn");
  const addServiceButton = document.getElementById("add-service-btn");
  if (addServiceButton) {
    addServiceButton.onclick = addService;
  }
  if (killAllButton) {
    killAllButton.onclick = killAllServices;
  }
  if (startAllButton) {
    startAllButton.onclick = startAllServices;
  }
  setInterval(updateServiceStatus, 3000);
  updateServiceStatus();
};
