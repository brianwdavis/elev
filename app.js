const tableBodyElev = document.querySelector("#dataTableElev tbody");
const tableBodyEsc = document.querySelector("#dataTableEsc tbody");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");

const elevIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-240h120v-160h40v-100q0-33-23.5-56.5T360-580h-40q-33 0-56.5 23.5T240-500v100h40v160Zm95.5-394.5Q390-649 390-670t-14.5-35.5Q361-720 340-720t-35.5 14.5Q290-691 290-670t14.5 35.5Q319-620 340-620t35.5-14.5ZM520-520h200L620-680 520-520Zm100 240 100-160H520l100 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0 0v-560 560Z"/></svg>`;
const escIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-240h132l200-360h68q25 0 42.5-17.5T740-660q0-25-17.5-42.5T680-720H548L348-360h-68q-25 0-42.5 17.5T220-300q0 25 17.5 42.5T280-240Zm-80 120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>`

const colors = {
  GR: "#09f70db6",
  YL: "#c2cd4e",
  RD: "#f40505",
  SV: "#98969bcf",
  OR: "#ff9f43",
  BL: "#032cf8"
};

const gearButton = document.getElementById("gearButton");
const settingsPanel = document.getElementById("settingsPanel");
const userText = document.getElementById("userText");

// Toggle panel visibility
gearButton.addEventListener("click", () => {
  settingsPanel.classList.toggle("open");
});

// Cookie helpers
function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie =
    `${name}=${encodeURIComponent(value)};` +
    `expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
  const cookies = document.cookie.split(";")
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  
  return "";
}

// Load saved value on page load
window.addEventListener("DOMContentLoaded", () => {
  userText.value = getCookie("savedUserText");
})
// Save whenever the user types
userText.addEventListener("input", () => {
  setCookie("savedUserText", userText.value);
})
///


async function loadData() {
  // statusEl.textContent = "Loading...";

  try {
    const response = await fetch("./example.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    const records = json.ElevatorIncidents || [];

    const stationsResponse = await fetch("./stations.json", {
      cache: "no-store"
    });

    if (!stationsResponse.ok) {
      throw new Error(`HTTP ${stationsResponse.status}`);
    }

    const stationsJson = await stationsResponse.json();
    const stations = stationsJson.Stations || [];

    renderJumpLinks(records, "ELEVATOR");
    renderJumpLinks(records, "ESCALATOR");

    renderTable(records, "ELEVATOR", tableBodyElev, stations);
    renderTable(records, "ESCALATOR", tableBodyEsc, stations);

    // statusEl.textContent = `Loaded ${records.length} records`;
  } catch (err) {
    console.error(err);
    // statusEl.textContent = `Error loading data: ${err.message}`;
  }
}

function renderJumpLinks(records, type) {
  const jumpLinksContainer = document.getElementById(`jumpLinks${type === "ELEVATOR" ? "Elev" : "Esc"}`);
  jumpLinksContainer.innerHTML = "";
  jumpLinksContainer.innerHTML += type === "ELEVATOR" ? elevIcon : escIcon;
  
  const uniqueInitials = [...new Set(
    records
    .filter(record => record.UnitType === type)
    .map(record => record.StationName.charAt(0).toUpperCase())
    .sort((a, b) => a.localeCompare(b))
  )];

  uniqueInitials.forEach(initial => {
    const link = document.createElement("a");
    link.href = `#row-${initial}`;
    link.textContent = initial;
    jumpLinksContainer.appendChild(link).appendChild(document.createTextNode(" "));
  });
}

function renderTable(records, type, tableBody, stations) {
  tableBody.innerHTML = "";

  if (!records.length) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td colspan="3">No records found</td>
    `;

    tableBody.appendChild(row);
    return;
  }

  let sortedRecords = records
    .filter(record => record.UnitType === type)
    .sort(
      (current,next) => {
        return current.StationName.localeCompare(next.StationName)
      }
     );


  for (const record of sortedRecords) {
    const rowHead = document.createElement("tr");
    const row = document.createElement("tr");
    const rowSub = document.createElement("tr");

    const name = record.StationName ?? "";
    const initial = name.charAt(0).toUpperCase();

    const lines = getLineColors(stations, record.StationCode);

    const location = record.LocationDescription ?? "";
    const outReport = record.DateOutOfServ ?? "";
    const estReturn = record.EstimatedReturnToService ?? "";

    const friendlyTime = getFriendlyTime(outReport);

    rowHead.innerHTML = `
      <td colspan="3" class="headRow" id="row-${initial}">${escapeHtml(name)}</td>
    `;

    const linesContainer = document.createElement("span");

    lines.forEach((line) => {
      lineContainer = document.createElement("span");
      lineContainer.classList.add("lineIndicator");
      lineContainer.style.backgroundColor = colors[line] || "#000";
      lineContainer.style.width = "1.5rem";
      lineContainer.style.height = "1.5rem";
      lineContainer.style.display = "inline-block";
      lineContainer.style.marginRight = "4px";
      lineContainer.innerHTML += line
      linesContainer.appendChild(lineContainer);
    });

    rowHead.querySelector("td").appendChild(linesContainer);

    row.innerHTML = `
      <td>${fmtTime(outReport)}</td>
      <td>${friendlyTime}</td>
      <td>${fmtTime(estReturn)}</td>
    `;

    rowSub.innerHTML = `
      <td class = "subRow" colspan="3">
        ${escapeHtml(location)}
      </td>
    `;

    tableBody.appendChild(rowHead);
    tableBody.appendChild(row);
    tableBody.appendChild(rowSub);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtTime(value) {
  return String(value)
  .replace(/T/g, " ")
  .replace(/:[0-9]{2}$/, "");
}

function getFriendlyTime(timestamp) {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - new Date(timestamp).getTime()) / 1000);

  // Define cutoffs in seconds for each unit
  const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];
  const units = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];

  // Find the right unit to use
  const unitIndex = cutoffs.findIndex(cutoff => cutoff > Math.abs(diffInSeconds));
  
  // Divide by the previous cutoff to get the relative value
  const divisor = unitIndex === 0 ? 1 : cutoffs[unitIndex - 1];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  return rtf.format(-Math.floor(diffInSeconds / divisor), units[unitIndex]);
}


function getLineColors(stations, stationCode) {


    const st = stations.filter(station => station.Code === stationCode)[0];
    
    const lines = [st.LineCode1, st.LineCode2, st.LineCode3, st.LineCode4].filter(line => line !== null);


    return lines;
}

// refreshBtn.addEventListener("click", loadData);

loadData();