const API_BASE = "";

const translations = {
    sk: {
        appTitle: "API Change Tracker",
        appSubtitle: "Sledovanie zmien v OpenAPI špecifikáciách",
        globalControlHeading: "Globálna kontrola",
        intervalLabel: "Interval kontroly:",
        intervalEvery1: "Každú 1 hodinu",
        intervalEvery5: "Každých 5 hodín",
        intervalEvery10: "Každých 10 hodín",
        intervalEvery24: "Každých 24 hodín",
        languageLabel: "Jazyk:",
        languageSk: "Slovensky",
        languageEn: "English",
        advancedSettingsToggle: "Rozšírené nastavenia",
        hideAdvancedSettingsToggle: "Skryť rozšírené nastavenia",
        saveSettings: "Uložiť nastavenia",
        addEndpointHeading: "Pridať sledovaný endpoint",
        appNameLabel: "Názov aplikácie",
        appUrlLabel: "URL OpenAPI JSON",
        appNamePlaceholder: "Napr. IWB-Pilot API",
        appUrlPlaceholder: "https://...",
        addButton: "Pridať",
        noNameUrlError: "Vyplň názov aj URL.",
        endpointAdded: "Endpoint pridaný, prebieha prvá kontrola...",
        connectionError: "Chyba pripojenia k serveru.",
        endpointsHeading: "Sledované API",
        nameHeader: "Názov",
        urlHeader: "URL",
        checkedHeader: "Posledná kontrola",
        statusHeader: "Stav",
        countHeader: "Počet zmien",
        actionsHeader: "Akcie",
        noEndpoints: "Zatiaľ nemáš pridané žiadne API.",
        detailsHeading: "Detaily vybraného API",
        selectApi: "Vyber API zo zoznamu vyššie.",
        changesSection: "Zmeny",
        logsSection: "Logy kontrol",
        dateHeader: "Dátum",
        typeHeader: "Typ",
        detailHeader: "Detail",
        messageHeader: "Správa",
        noChanges: "Zatiaľ žiadne zmeny.",
        noLogs: "Zatiaľ žiadne logy.",
        loadingSettingsError: "Nepodarilo sa načítať nastavenia.",
        savingError: "Chyba pri ukladaní.",
        savedSettings: "Nastavenia uložené.",
        currentInterval: "Aktuálny interval kontroly: každých {0} hodín.",
        savedInterval: "Uložené. Interval: každých {0} hodín.",
        checking: "Kontrolujem...",
        check: "Skontrolovať",
        delete: "Zmazať",
        deleteConfirm: "Naozaj zmazať toto API?",
        statusOk: "OK",
        statusChanged: "Zmeny",
        statusError: "Chyba",
        statusNoChange: "Žiadne zmeny",
        statusNever: "Nikdy",
        loadEndpointsError: "Nepodarilo sa načítať zoznam API.",
        loadChangesError: "Chyba pri načítaní zmien.",
        loadLogsError: "Chyba pri načítaní logov."
    },
    en: {
        appTitle: "API Change Tracker",
        appSubtitle: "Track changes in OpenAPI specifications",
        globalControlHeading: "Global check",
        intervalLabel: "Check interval:",
        intervalEvery1: "Every 1 hour",
        intervalEvery5: "Every 5 hours",
        intervalEvery10: "Every 10 hours",
        intervalEvery24: "Every 24 hours",
        languageLabel: "Language:",
        languageSk: "Slovensky",
        languageEn: "English",
        advancedSettingsToggle: "Advanced settings",
        hideAdvancedSettingsToggle: "Hide advanced settings",
        saveSettings: "Save settings",
        addEndpointHeading: "Add tracked endpoint",
        appNameLabel: "Application name",
        appUrlLabel: "OpenAPI JSON URL",
        appNamePlaceholder: "E.g. IWB-Pilot API",
        appUrlPlaceholder: "https://...",
        addButton: "Add",
        noNameUrlError: "Enter both name and URL.",
        endpointAdded: "Endpoint added, initial check is running...",
        connectionError: "Server connection error.",
        endpointsHeading: "Tracked APIs",
        nameHeader: "Name",
        urlHeader: "URL",
        checkedHeader: "Last checked",
        statusHeader: "Status",
        countHeader: "Change count",
        actionsHeader: "Actions",
        noEndpoints: "You don't have any APIs yet.",
        detailsHeading: "Selected API details",
        selectApi: "Choose an API from the list above.",
        changesSection: "Changes",
        logsSection: "Check logs",
        dateHeader: "Date",
        typeHeader: "Type",
        detailHeader: "Detail",
        messageHeader: "Message",
        noChanges: "No changes yet.",
        noLogs: "No logs yet.",
        loadingSettingsError: "Unable to load settings.",
        savingError: "Error saving settings.",
        savedSettings: "Settings saved.",
        currentInterval: "Current check interval: every {0} hours.",
        savedInterval: "Saved. Interval: every {0} hours.",
        checking: "Checking...",
        check: "Check",
        delete: "Delete",
        deleteConfirm: "Do you really want to delete this API?",
        statusOk: "OK",
        statusChanged: "Changes",
        statusError: "Error",
        statusNoChange: "No changes",
        statusNever: "Never",
        loadEndpointsError: "Unable to load API list.",
        loadChangesError: "Error loading changes.",
        loadLogsError: "Error loading logs."
    }
};

let currentLang = "sk";

function translate(key) {
    return translations[currentLang] && translations[currentLang][key] ? translations[currentLang][key] : key;
}

function translateFormat(key, ...args) {
    let text = translate(key);
    args.forEach((arg, index) => {
        text = text.replace(`{${index}}`, arg);
    });
    return text;
}

function translateStatus(status) {
    if (status === "ok") return translate("statusOk");
    if (status === "changed") return translate("statusChanged");
    if (status === "error") return translate("statusError");
    if (status === "no_change") return translate("statusNoChange");
    return translate("statusNever");
}

function applyTranslations() {
    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        const text = translate(key);
        if (text) el.textContent = text;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const text = translate(key);
        if (text && el.placeholder !== undefined) el.placeholder = text;
    });
}

// elements
const endpointsTableBody = document.querySelector("#endpoints-table tbody");
const endpointsEmpty = document.getElementById("endpoints-empty");

const addForm = document.getElementById("add-endpoint-form");
const formMessage = document.getElementById("form-message");

const intervalSelect = document.getElementById("interval-select");
const intervalInfo = document.getElementById("interval-info");
const langSelect = document.getElementById("language-select");
const saveSettingsBtn = document.getElementById("save-settings");
const toggleAdvancedBtn = document.getElementById("toggle-advanced");
const advancedSettings = document.getElementById("advanced-settings");

const detailsPlaceholder = document.getElementById("details-placeholder");
const detailsContent = document.getElementById("details-content");
const detailsTitle = document.getElementById("details-title");
const changesTableBody = document.querySelector("#changes-table tbody");
const changesEmpty = document.getElementById("changes-empty");
const logsTableBody = document.querySelector("#logs-table tbody");
const logsEmpty = document.getElementById("logs-empty");

let currentEndpointId = null;

async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/settings`);
        const data = await res.json();
        const hours = data.interval_hours;
        currentLang = data.language || "sk";
        langSelect.value = currentLang;

        if (hours === 1) intervalSelect.value = "1";
        else if (hours === 5) intervalSelect.value = "5";
        else if (hours === 10) intervalSelect.value = "10";
        else intervalSelect.value = "24";

        applyTranslations();
        intervalInfo.textContent = translateFormat("currentInterval", hours);
        intervalInfo.classList.remove("error");
    } catch (e) {
        applyTranslations();
        intervalInfo.textContent = translate("loadingSettingsError");
        intervalInfo.classList.add("error");
    }
}

saveSettingsBtn.addEventListener("click", async () => {
    const intervalId = intervalSelect.value;
    const language = langSelect.value;

    try {
        const res = await fetch(`${API_BASE}/api/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interval_id: intervalId, language })
        });
        const data = await res.json();
        if (res.ok) {
            currentLang = data.language || currentLang;
            langSelect.value = currentLang;
            applyTranslations();
            intervalInfo.textContent = translateFormat("savedInterval", data.interval_hours);
            intervalInfo.classList.remove("error");
        } else {
            intervalInfo.textContent = data.error || translate("savingError");
            intervalInfo.classList.add("error");
        }
    } catch (e) {
        intervalInfo.textContent = translate("connectionError");
        intervalInfo.classList.add("error");
    }
});

toggleAdvancedBtn?.addEventListener("click", () => {
    if (!advancedSettings) return;
    advancedSettings.classList.toggle("hidden");
    toggleAdvancedBtn.textContent = advancedSettings.classList.contains("hidden") ? translate("advancedSettingsToggle") : translate("hideAdvancedSettingsToggle");
});

async function loadEndpoints() {
    try {
        const res = await fetch(`${API_BASE}/api/endpoints`);
        const data = await res.json();

        endpointsTableBody.innerHTML = "";

        if (!data.length) {
            endpointsEmpty.textContent = translate("noEndpoints");
            endpointsEmpty.classList.remove("hidden");
            return;
        }

        endpointsEmpty.classList.add("hidden");

        data.forEach(ep => {
            const tr = document.createElement("tr");

            const tdName = document.createElement("td");
            const link = document.createElement("button");
            link.textContent = ep.name;
            link.className = "secondary";
            link.addEventListener("click", () => {
                selectEndpoint(ep);
            });
            tdName.appendChild(link);

            const tdUrl = document.createElement("td");
            tdUrl.textContent = ep.url;

            const tdChecked = document.createElement("td");
            tdChecked.textContent = ep.last_checked ? ep.last_checked : translate("statusNever");

            const tdStatus = document.createElement("td");
            const badge = document.createElement("span");
            badge.classList.add("status-badge");
            badge.textContent = translateStatus(ep.last_status);
            if (ep.last_status === "ok") {
                badge.classList.add("status-ok");
            } else if (ep.last_status === "changed") {
                badge.classList.add("status-changed");
            } else if (ep.last_status === "error") {
                badge.classList.add("status-error");
            } else {
                badge.classList.add("status-never");
            }
            tdStatus.appendChild(badge);

            const tdCount = document.createElement("td");
            tdCount.textContent = ep.change_count;

            const tdActions = document.createElement("td");
            tdActions.className = "actions";

            const checkBtn = document.createElement("button");
            checkBtn.textContent = translate("check");
            checkBtn.addEventListener("click", async () => {
                checkBtn.disabled = true;
                checkBtn.textContent = translate("checking");
                await manualCheck(ep.id);
                await loadEndpoints();
                if (currentEndpointId === ep.id) {
                    await loadDetails(ep.id, ep.name);
                }
                checkBtn.disabled = false;
                checkBtn.textContent = translate("check");
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = translate("delete");
            deleteBtn.classList.add("secondary");
            deleteBtn.addEventListener("click", async () => {
                if (!confirm(translate("deleteConfirm"))) return;
                await deleteEndpoint(ep.id);
                if (currentEndpointId === ep.id) {
                    currentEndpointId = null;
                    detailsContent.classList.add("hidden");
                    detailsPlaceholder.classList.remove("hidden");
                }
                await loadEndpoints();
            });

            tdActions.appendChild(checkBtn);
            tdActions.appendChild(deleteBtn);

            tr.appendChild(tdName);
            tr.appendChild(tdUrl);
            tr.appendChild(tdChecked);
            tr.appendChild(tdStatus);
            tr.appendChild(tdCount);
            tr.appendChild(tdActions);

            endpointsTableBody.appendChild(tr);
        });
    } catch (e) {
        endpointsEmpty.textContent = translate("loadEndpointsError");
        endpointsEmpty.classList.remove("hidden");
    }
}

addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const url = document.getElementById("url").value.trim();

    if (!name || !url) {
        formMessage.textContent = translate("noNameUrlError");
        formMessage.classList.add("error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/endpoints`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, url })
        });
        const data = await res.json();
        if (!res.ok) {
            formMessage.textContent = data.error || translate("savingError");
            formMessage.classList.add("error");
            return;
        }

        formMessage.textContent = translate("endpointAdded");
        formMessage.classList.remove("error");
        addForm.reset();

        if (data.id) {
            await manualCheck(data.id);
        }

        await loadEndpoints();
    } catch (e2) {
        formMessage.textContent = translate("connectionError");
        formMessage.classList.add("error");
    }
});

async function manualCheck(id) {
    try {
        await fetch(`${API_BASE}/api/check/${id}`, {
            method: "POST"
        });
    } catch (e) {
        console.error(e);
    }
}

async function deleteEndpoint(id) {
    try {
        await fetch(`${API_BASE}/api/endpoints/${id}`, {
            method: "DELETE"
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadChanges(id) {
    try {
        const res = await fetch(`${API_BASE}/api/changes/${id}`);
        const data = await res.json();
        changesTableBody.innerHTML = "";

        if (!data.length) {
            changesEmpty.classList.remove("hidden");
            return;
        }

        changesEmpty.classList.add("hidden");

        data.forEach(ch => {
            const tr = document.createElement("tr");
            const tdDate = document.createElement("td");
            tdDate.textContent = ch.created_at;

            const tdType = document.createElement("td");
            tdType.textContent = ch.change_type;

            const tdDetail = document.createElement("td");
            tdDetail.textContent = ch.detail;

            tr.appendChild(tdDate);
            tr.appendChild(tdType);
            tr.appendChild(tdDetail);
            changesTableBody.appendChild(tr);
        });
    } catch (e) {
        changesEmpty.textContent = translate("loadChangesError");
        changesEmpty.classList.remove("hidden");
    }
}

async function loadLogs(id) {
    try {
        const res = await fetch(`${API_BASE}/api/logs/${id}`);
        const data = await res.json();
        logsTableBody.innerHTML = "";

        if (!data.length) {
            logsEmpty.classList.remove("hidden");
            return;
        }

        logsEmpty.classList.add("hidden");

        data.forEach(log => {
            const tr = document.createElement("tr");

            const tdDate = document.createElement("td");
            tdDate.textContent = log.created_at;

            const tdStatus = document.createElement("td");
            tdStatus.textContent = log.status;

            const tdMsg = document.createElement("td");
            tdMsg.textContent = log.message || "";

            tr.appendChild(tdDate);
            tr.appendChild(tdStatus);
            tr.appendChild(tdMsg);
            logsTableBody.appendChild(tr);
        });
    } catch (e) {
        logsEmpty.textContent = translate("loadLogsError");
        logsEmpty.classList.remove("hidden");
    }
}

async function loadDetails(id, name) {
    currentEndpointId = id;
    detailsTitle.textContent = name;
    detailsPlaceholder.classList.add("hidden");
    detailsContent.classList.remove("hidden");
    await loadChanges(id);
    await loadLogs(id);
}

function selectEndpoint(ep) {
    loadDetails(ep.id, ep.name);
}

window.addEventListener("load", async () => {
    await loadSettings();
    await loadEndpoints();
});