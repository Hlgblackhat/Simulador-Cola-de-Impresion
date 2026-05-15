import { state, STATE_ES } from './state.js';
import { stateNodes, petriPlaces } from './visuals.js';

export const els = {
    docName: document.getElementById('docName'),
    docPages: document.getElementById('docPages'),
    printerSpeed: document.getElementById('printerSpeed'),
    speedValue: document.getElementById('speedValue'),
    queueCount: document.getElementById('queueCount'),
    doneCount: document.getElementById('doneCount'),
    avgWait: document.getElementById('avgWait'),
    stateText: document.getElementById('stateText'),
    stateBadge: document.getElementById('stateBadge'),
    printerDescription: document.getElementById('printerDescription'),
    activeJobContent: document.getElementById('activeJobContent'),
    queueList: document.getElementById('queueList'),
    doneList: document.getElementById('doneList'),
    jobProgress: document.getElementById('jobProgress'),
    progressText: document.getElementById('progressText'),
    systemClock: document.getElementById('systemClock'),
    pauseBtn: document.getElementById('pauseBtn'),
    clearErrorBtn: document.getElementById('clearErrorBtn'),
    tokenQueue: document.getElementById('tokenQueue'),
    tokenFree: document.getElementById('tokenFree'),
    tokenPrinting: document.getElementById('tokenPrinting'),
    tokenDone: document.getElementById('tokenDone'),
    tokenError: document.getElementById('tokenError'),
    tokenPaused: document.getElementById('tokenPaused'),
    chips: [
        document.getElementById('chip-p1'),
        document.getElementById('chip-p2'),
        document.getElementById('chip-p3'),
        document.getElementById('chip-p4'),
        document.getElementById('chip-p5'),
        document.getElementById('chip-p6')
    ]
};

export function renderStats() {
    els.stateText.textContent = STATE_ES[state.systemState];
    els.queueCount.textContent = state.queue.length;
    els.doneCount.textContent = state.done.length;
    els.avgWait.textContent = state.done.length 
        ? `${(state.totalWaitTime / state.done.length).toFixed(1)} s` 
        : '0 s';
    els.systemClock.textContent = `t = ${state.simulationTime} s`;

    const config = getBadgeConfig();
    els.stateBadge.textContent = config.text;
    els.stateBadge.className = config.className;
    els.printerDescription.textContent = config.desc;
}

function getBadgeConfig() {
    if (state.error) return { text: 'Con error', className: 'badge error', desc: 'Falla detectada. Limpia el error.' };
    if (state.paused && state.activeJob) return { text: 'Pausada', className: 'badge paused', desc: 'Impresión pausada.' };
    if (state.activeJob) return { text: 'Imprimiendo', className: 'badge printing', desc: `Imprimiendo: ${state.activeJob.name}` };
    return { text: 'Inactiva', className: 'badge idle', desc: state.queue.length ? 'Lista para el siguiente.' : 'Sin trabajo.' };
}

export function renderLists() {
    // Cola
    els.queueList.innerHTML = state.queue.length 
        ? state.queue.map((j, i) => `
            <article class="job">
                <div class="job-top">
                    <div class="job-title">#${j.id} — ${j.name}</div>
                    <span class="pill waiting">Cola</span>
                </div>
                <div class="job-meta">Págs: ${j.pages} · Pos: ${i + 1}</div>
            </article>`).join('')
        : '<div class="muted">Sin trabajos</div>';

    // Completados
    els.doneList.innerHTML = state.done.length
        ? state.done.map(j => `
            <article class="job">
                <div class="job-top">
                    <div class="job-title">#${j.id} — ${j.name}</div>
                    <span class="pill done">Listo</span>
                </div>
                <div class="job-meta">${j.pages} págs · ${j.waitTime}s esp.</div>
            </article>`).join('')
        : '<div class="muted">Sin completados</div>';
}

export function renderActiveJob() {
    if (!state.activeJob) {
        els.activeJobContent.innerHTML = '<div class="muted">Sin trabajo activo.</div>';
        els.jobProgress.style.width = '0%';
        els.progressText.textContent = '0%';
        return;
    }
    const pct = ((state.activeJob.pages - state.activeJob.remainingPages) / state.activeJob.pages) * 100;
    els.jobProgress.style.width = `${pct}%`;
    els.progressText.textContent = `${Math.round(pct)}%`;
    els.activeJobContent.innerHTML = `
        <div class="job">
            <div class="job-title">#${state.activeJob.id} — ${state.activeJob.name}</div>
            <div class="job-meta">Restantes: ${Math.max(0, state.activeJob.remainingPages)} / ${state.activeJob.pages}</div>
        </div>`;
}

export function renderGraphs() {
    // Autómata
    Object.entries(stateNodes).forEach(([k, n]) => {
        n.classList.remove('active', 'inactive', 'error-on');
        n.classList.add(k === state.systemState ? (k === 'ERROR' ? 'error-on' : 'active') : 'inactive');
    });

    // Petri
    const markings = [
        state.queue.length, 
        state.activeJob ? 0 : 1, 
        state.activeJob ? 1 : 0, 
        state.done.length, 
        state.error ? 1 : 0, 
        state.paused ? 1 : 0
    ];
    
    [els.tokenQueue, els.tokenFree, els.tokenPrinting, els.tokenDone, els.tokenError, els.tokenPaused].forEach((el, i) => {
        el.textContent = markings[i];
    });

    els.chips.forEach((chip, i) => {
        const labels = ['P1 Cola', 'P2 Libre', 'P3 Impr', 'P4 Listo', 'P5 Error', 'P6 Pausado'];
        chip.textContent = `${labels[i]}: ${markings[i]}`;
    });
}
