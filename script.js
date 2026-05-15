// Traducción de estados internos a texto visible en pantalla
const STATE_ES = { IDLE: 'INACTIVA', READY: 'LISTA', PRINTING: 'IMPRIMIENDO', PAUSED: 'PAUSADA', ERROR: 'ERROR' };

// Estado global de toda la simulación
const state = {
    queue: [], done: [], activeJob: null,
    systemState: 'IDLE', simulationTime: 0,
    nextId: 1, paused: false, error: false,
    speed: 1, totalWaitTime: 0
};

// Referencias a elementos HTML de controles, indicadores y listas
const els = {
    docName: document.getElementById('docName'),
    docPages: document.getElementById('docPages'),
    printerSpeed: document.getElementById('printerSpeed'),
    speedValue: document.getElementById('speedValue'),
    addJobBtn: document.getElementById('addJobBtn'),
    randomJobBtn: document.getElementById('randomJobBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    errorBtn: document.getElementById('errorBtn'),
    clearErrorBtn: document.getElementById('clearErrorBtn'),
    resetBtn: document.getElementById('resetBtn'),
    stateText: document.getElementById('stateText'),
    queueCount: document.getElementById('queueCount'),
    doneCount: document.getElementById('doneCount'),
    avgWait: document.getElementById('avgWait'),
    stateBadge: document.getElementById('stateBadge'),
    printerDescription: document.getElementById('printerDescription'),
    activeJobContent: document.getElementById('activeJobContent'),
    queueList: document.getElementById('queueList'),
    doneList: document.getElementById('doneList'),
    jobProgress: document.getElementById('jobProgress'),
    progressText: document.getElementById('progressText'),
    systemClock: document.getElementById('systemClock'),
    tokenQueue: document.getElementById('tokenQueue'),
    tokenFree: document.getElementById('tokenFree'),
    tokenPrinting: document.getElementById('tokenPrinting'),
    tokenDone: document.getElementById('tokenDone'),
    tokenError: document.getElementById('tokenError'),
    tokenPaused: document.getElementById('tokenPaused'),
    chipP1: document.getElementById('chip-p1'),
    chipP2: document.getElementById('chip-p2'),
    chipP3: document.getElementById('chip-p3'),
    chipP4: document.getElementById('chip-p4'),
    chipP5: document.getElementById('chip-p5'),
    chipP6: document.getElementById('chip-p6'),
    tEnqueue: document.getElementById('tEnqueue'),
    tStart: document.getElementById('tStart'),
    tFinish: document.getElementById('tFinish'),
    tReturn: document.getElementById('tReturn'),
    tErrorIn: document.getElementById('tErrorIn'),
    tErrorOut: document.getElementById('tErrorOut'),
    tPauseIn: document.getElementById('tPauseIn'),
    tPauseOut: document.getElementById('tPauseOut')
};

// Elementos SVG del autómata
const edgeEls = {
    add: document.getElementById('edge-add'),
    start: document.getElementById('edge-start'),
    finishIdle: document.getElementById('edge-finish-idle'),
    finishReady: document.getElementById('edge-finish-ready'),
    pause: document.getElementById('edge-pause'),
    resume: document.getElementById('edge-resume'),
    error: document.getElementById('edge-error'),
    errorReturn: document.getElementById('edge-error-return')
};

// Etiquetas del autómata
const edgeLabels = {
    add: document.getElementById('label-add'),
    start: document.getElementById('label-start'),
    finishIdle: document.getElementById('label-finish-idle'),
    finishReady: document.getElementById('label-finish-ready'),
    pause: document.getElementById('label-pause'),
    resume: document.getElementById('label-resume'),
    error: document.getElementById('label-error'),
    errorReturn: document.getElementById('label-clear-error')
};

// Tramos de la red de Petri que se deben iluminar por cada transición
const petriEdgeSets = {
    enqueue: ['petri-enqueue-in', 'petri-enqueue-out'],
    start: ['petri-start-in', 'petri-start-out'],
    finish: ['petri-finish-in', 'petri-finish-out'],
    return: ['petri-return-in', 'petri-return-out'],
    error: ['petri-error-in-1', 'petri-error-in-2'],
    clearError: ['petri-error-out-1', 'petri-error-out-2'],
    pause: ['petri-pause-in-1', 'petri-pause-in-2'],
    resume: ['petri-pause-out-1', 'petri-pause-out-2']
};

// Etiquetas de la red de Petri
const petriLabels = {
    enqueue: document.getElementById('petri-label-enqueue'),
    start: document.getElementById('petri-label-start'),
    finish: document.getElementById('petri-label-finish'),
    return: document.getElementById('petri-label-return'),
    error: document.getElementById('petri-label-error'),
    clearError: document.getElementById('petri-label-clear-error'),
    pause: document.getElementById('petri-label-pause')
};

// Nodos del autómata como referencias directas
const stateNodes = ['IDLE', 'READY', 'PRINTING', 'PAUSED', 'ERROR'].reduce((a, k) => {
    a[k] = document.getElementById(`state-${k}`);
    return a;
}, {});

// Lugares de la red de Petri
const petriPlaces = {
    queue: document.getElementById('place-queue'),
    free: document.getElementById('place-free'),
    printing: document.getElementById('place-printing'),
    done: document.getElementById('place-done'),
    error: document.getElementById('place-error'),
    paused: document.getElementById('place-paused')
};

// Nombres aleatorios para generar trabajos
const randomNames = ['Informe mensual', 'Tesis parcial', 'Factura proveedor', 'Guía de laboratorio', 'Planilla de notas', 'Contrato interno', 'Manual técnico', 'Reporte ventas', 'Acta de reunión', 'Presentación final'];

// Limpia solo el brillo de nodos y lugares
function clearNodeHighlights() {
    Object.values(stateNodes).forEach(e => e.classList.remove('flash-source', 'flash-target'));
    Object.values(petriPlaces).forEach(e => e.classList.remove('flash-source', 'flash-target'));
}

// Limpia flechas, etiquetas y también los resaltados de nodos/lugares
function clearActiveEdges() {
    Object.values(edgeEls).forEach(e => e.classList.remove('active-edge'));
    Object.values(edgeLabels).forEach(e => e.classList.remove('active-label'));
    Object.values(petriEdgeSets).flat().forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-edge');
    });
    Object.values(petriLabels).forEach(e => { if (e) e.classList.remove('active-label'); });
    clearNodeHighlights();
}

// Resalta los nodos origen/destino del autómata según la transición
function highlightAutomatonNodes(name) {
    const map = {
        enqueue: ['IDLE', 'READY'],
        start: ['READY', 'PRINTING'],
        finish: ['PRINTING', state.queue.length > 0 ? 'READY' : 'IDLE'],
        pause: ['PRINTING', 'PAUSED'],
        resume: ['PAUSED', 'PRINTING'],
        error: ['PRINTING', 'ERROR'],
        clearError: ['ERROR', 'PRINTING']
    };
    const [s, t] = map[name] || [];
    if (s && stateNodes[s]) stateNodes[s].classList.add('flash-source');
    if (t && stateNodes[t]) stateNodes[t].classList.add('flash-target');
}

// Resalta los lugares origen/destino de la red de Petri
function highlightPetriPlaces(name) {
    const map = {
        enqueue: ['queue', 'free'],
        start: ['free', 'printing'],
        finish: ['printing', 'done'],
        return: ['done', 'free'],
        error: ['printing', 'error'],
        pause: ['printing', 'paused']
    };
    const [s, t] = map[name] || [];
    if (s && petriPlaces[s]) petriPlaces[s].classList.add('flash-source');
    if (t && petriPlaces[t]) petriPlaces[t].classList.add('flash-target');
}

// Resalta una flecha concreta del autómata
function activateAutomatonEdge(name) {
    const map = {
        enqueue: ['add', 'add'],
        start: ['start', 'start'],
        finish: [state.queue.length > 0 ? 'finishReady' : 'finishIdle', state.queue.length > 0 ? 'finishReady' : 'finishIdle'],
        pause: ['pause', 'pause'],
        resume: ['resume', 'resume'],
        error: ['error', 'error'],
        clearError: ['errorReturn', 'errorReturn']
    };
    const [ek, lk] = map[name] || [];
    if (ek && edgeEls[ek]) edgeEls[ek].classList.add('active-edge');
    if (lk && edgeLabels[lk]) edgeLabels[lk].classList.add('active-label');
}

// Resalta el recorrido de la red de Petri
function activatePetriFlow(name) {
    (petriEdgeSets[name] || []).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('active-edge');
    });

    if (petriLabels[name]) petriLabels[name].classList.add('active-label');
}

// Dispara la animación visual de la transición
function fireTransition(name) {
    const map = {
        enqueue: [els.tEnqueue],
        start: [els.tStart],
        finish: [els.tFinish],
        return: [els.tReturn],
        error: [els.tErrorIn],
        clearError: [els.tErrorOut],
        pause: [els.tPauseIn],
        resume: [els.tPauseOut]
    };

    // Limpia primero todas las transiciones "fired"
    clearActiveEdges();
    Object.values(map).flat().forEach(e => e && e.classList.remove('fired'));

    const nodes = map[name];
    if (!nodes || !nodes.length) return;

    // Prende la transición con un pequeño retardo visual
    nodes.forEach((node, i) => {
        setTimeout(() => {
            if (node) node.classList.add('fired');
        }, i * 250);
    });

    // Enciende la flecha, etiqueta, nodos y lugares relacionados
    activateAutomatonEdge(name);
    activatePetriFlow(name);
    highlightAutomatonNodes(name);
    highlightPetriPlaces(name);

    // Luego de la animación se quita todo
    setTimeout(() => {
        Object.values(map).flat().forEach(e => e && e.classList.remove('fired'));
        clearActiveEdges();
    }, 1200);
}

// Configuración del estado superior según el estado actual
function getBadgeConfig() {
    if (state.error) return { text: 'Con error', className: 'badge error' };
    if (state.paused && state.activeJob) return { text: 'Pausada', className: 'badge paused' };
    if (state.activeJob) return { text: 'Imprimiendo', className: 'badge printing' };
    return { text: 'Inactiva', className: 'badge idle' };
}

// Calcula el estado real del sistema
function updateSystemState() {
    if (state.error) state.systemState = 'ERROR';
    else if (state.paused && state.activeJob) state.systemState = 'PAUSED';
    else if (state.activeJob) state.systemState = 'PRINTING';
    else if (state.queue.length > 0) state.systemState = 'READY';
    else state.systemState = 'IDLE';
}

// Agrega un nuevo trabajo a la cola
function addJob(name, pages) {
    const cleanName = (name || `Documento ${state.nextId}`).trim();
    const totalPages = Math.max(1, Math.min(25, Number(pages) || 1));
    state.queue.push({ id: state.nextId++, name: cleanName, pages: totalPages, remainingPages: totalPages, createdAt: state.simulationTime, startedAt: null, finishedAt: null, waitTime: 0, status: 'waiting' });
    fireTransition('enqueue');
    updateSystemState();
    maybeStartNextJob();
    render();
}

// Si no hay error, ni pausa, ni trabajo activo, arranca el siguiente
function maybeStartNextJob() {
    if (state.error || state.paused || state.activeJob || state.queue.length === 0) return;
    const next = state.queue.shift();
    next.startedAt = state.simulationTime;
    next.waitTime = next.startedAt - next.createdAt;
    next.status = 'printing';
    state.activeJob = next;
    fireTransition('start');
    updateSystemState();
}

// Termina el trabajo activo y pasa al siguiente si existe
function finishActiveJob() {
    if (!state.activeJob) return;
    state.activeJob.finishedAt = state.simulationTime;
    state.activeJob.status = 'done';
    state.done.unshift(state.activeJob);
    state.totalWaitTime += state.activeJob.waitTime;
    state.activeJob = null;
    fireTransition('finish');
    updateSystemState();
    setTimeout(() => {
        fireTransition('return');
        updateSystemState();
        maybeStartNextJob();
    }, 600);
}

// Simula un error en la impresión
function simulateError() {
    if (!state.activeJob || state.error) return;

    state.error = true;
    state.paused = false;

    // Limpia resaltados anteriores antes de mostrar el error
    clearActiveEdges();

    // Marca P3 como origen y P5 como destino
    petriPlaces.printing.classList.add('flash-source');
    petriPlaces.error.classList.add('flash-target');

    activateAutomatonEdge('error');
    activatePetriFlow('error');
    fireTransition('error');

    updateSystemState();
    render();
}

// Limpia el error y vuelve desde P5 hacia P3
function clearError() {
    if (!state.error) return;

    state.error = false;

    // Limpia resaltados anteriores antes de resolver
    clearActiveEdges();

    petriPlaces.error.classList.add('flash-source');
    petriPlaces.printing.classList.add('flash-target');

    activateAutomatonEdge('clearError');
    activatePetriFlow('clearError');
    fireTransition('clearError');

    updateSystemState();
    render();

    setTimeout(() => {
        clearActiveEdges();
        if (!state.paused) maybeStartNextJob();
        render();
    }, 1200);
}

// Pausa o reanuda el trabajo activo
function togglePause() {
    if (!state.activeJob || state.error) return;

    state.paused = !state.paused;
    clearActiveEdges();

    if (state.paused) {
        petriPlaces.printing.classList.add('flash-source');
        petriPlaces.paused.classList.add('flash-target');

        activateAutomatonEdge('pause');
        activatePetriFlow('pause');
        fireTransition('pause');
    } else {
        petriPlaces.paused.classList.add('flash-source');
        petriPlaces.printing.classList.add('flash-target');

        activateAutomatonEdge('resume');
        activatePetriFlow('resume');
        fireTransition('resume');
    }

    updateSystemState();
    render();
}

// Reinicia toda la simulación
function resetSystem() {
    state.queue = [];
    state.done = [];
    state.activeJob = null;
    state.systemState = 'IDLE';
    state.simulationTime = 0;
    state.nextId = 1;
    state.paused = false;
    state.error = false;
    state.totalWaitTime = 0;
    clearActiveEdges();
    render();
}

// Avanza el tiempo de simulación cada segundo
function tick() {
    state.simulationTime += 1;
    if (!state.error && !state.paused && state.activeJob) {
        state.activeJob.remainingPages = Math.max(0, state.activeJob.remainingPages - state.speed);
        if (state.activeJob.remainingPages <= 0) finishActiveJob();
    } else if (!state.error && !state.activeJob) {
        maybeStartNextJob();
    }
    updateSystemState();
    render();
}

// Renderiza la lista de cola
function renderQueue() {
    if (!state.queue.length) {
        els.queueList.innerHTML = '<div class="job"><div class="job-title">Sin trabajos</div><div class="job-meta">Agrega documentos.</div></div>';
        return;
    }
    els.queueList.innerHTML = state.queue.map((j, i) => `<article class="job"><div class="job-top"><div class="job-title">#${j.id} — ${j.name}</div><span class="pill waiting">Cola</span></div><div class="job-meta">Págs: ${j.pages} · Pos: ${i + 1} · ${state.simulationTime - j.createdAt}s esp.</div></article>`).join('');
}

// Renderiza la lista de trabajos completados
function renderDone() {
    if (!state.done.length) {
        els.doneList.innerHTML = '<div class="job"><div class="job-title">Sin completados</div></div>';
        return;
    }
    els.doneList.innerHTML = state.done.map(j => `<article class="job"><div class="job-top"><div class="job-title">#${j.id} — ${j.name}</div><span class="pill done">Listo</span></div><div class="job-meta">${j.pages} págs · ${j.waitTime}s esp. · t=${j.finishedAt}s</div></article>`).join('');
}

// Renderiza el trabajo activo y su progreso
function renderActiveJob() {
    if (!state.activeJob) {
        els.activeJobContent.innerHTML = '<div class="muted">Sin trabajo activo.</div>';
        els.jobProgress.style.width = '0%';
        els.progressText.textContent = '0%';
        return;
    }
    const pct = Math.max(0, Math.min(100, ((state.activeJob.pages - state.activeJob.remainingPages) / state.activeJob.pages) * 100));
    els.jobProgress.style.width = `${pct}%`;
    els.progressText.textContent = `${Math.round(pct)}%`;
    els.activeJobContent.innerHTML = `<div class="job"><div class="job-top"><div class="job-title">#${state.activeJob.id} — ${state.activeJob.name}</div><span class="pill active">${state.paused ? 'Pausado' : 'Imprimiendo'}</span></div><div class="job-meta">Restantes: ${Math.max(0, state.activeJob.remainingPages)} / ${state.activeJob.pages} págs</div><div class="job-meta">Inició t=${state.activeJob.startedAt}s · espera ${state.activeJob.waitTime}s</div></div>`;
}

// Renderiza textos, contadores y estado superior
function renderStats() {
    updateSystemState();
    const b = getBadgeConfig();
    els.stateText.textContent = STATE_ES[state.systemState] || state.systemState;
    els.queueCount.textContent = state.queue.length;
    els.doneCount.textContent = state.done.length;
    els.avgWait.textContent = state.done.length ? `${(state.totalWaitTime / state.done.length).toFixed(1)} s` : '0 s';
    els.stateBadge.className = b.className;
    els.stateBadge.textContent = b.text;
    els.systemClock.textContent = `t = ${state.simulationTime} s`;
    if (state.error) els.printerDescription.textContent = 'Falla detectada. Limpia el error.';
    else if (state.paused && state.activeJob) els.printerDescription.textContent = 'Impresión pausada.';
    else if (state.activeJob) els.printerDescription.textContent = `Imprimiendo: ${state.activeJob.name}`;
    else if (state.queue.length) els.printerDescription.textContent = 'Lista para el siguiente trabajo.';
    else els.printerDescription.textContent = 'Sin trabajo.';
}

// Colorea el autómata según el estado general
function renderAutomaton() {
    Object.entries(stateNodes).forEach(([k, n]) => {
        n.classList.remove('active', 'inactive', 'error-on');
        n.classList.add(k === state.systemState ? (k === 'ERROR' ? 'error-on' : 'active') : 'inactive');
    });
}

// Actualiza tokens y marcados de la red de Petri
function renderPetriNet() {
    const p1 = state.queue.length;
    const p2 = state.activeJob ? 0 : 1;
    const p3 = state.activeJob ? 1 : 0;
    const p4 = state.done.length;
    const p5 = state.error ? 1 : 0;
    const p6 = state.paused ? 1 : 0;

    els.tokenQueue.textContent = p1;
    els.tokenFree.textContent = p2;
    els.tokenPrinting.textContent = p3;
    els.tokenDone.textContent = p4;
    els.tokenError.textContent = p5;
    els.tokenPaused.textContent = p6;

    els.chipP1.textContent = `P1 Cola: ${p1}`;
    els.chipP2.textContent = `P2 Libre: ${p2}`;
    els.chipP3.textContent = `P3 Impr: ${p3}`;
    els.chipP4.textContent = `P4 Listo: ${p4}`;
    els.chipP5.textContent = `P5 Error: ${p5}`;
    els.chipP6.textContent = `P6 Pausado: ${p6}`;
}

// Render principal: llama a todas las actualizaciones visuales
function render() {
    renderStats();
    renderQueue();
    renderDone();
    renderActiveJob();
    renderAutomaton();
    renderPetriNet();
    els.pauseBtn.disabled = !state.activeJob || state.error;
    els.clearErrorBtn.disabled = !state.error;
}

// Botón agregar trabajo
els.addJobBtn.addEventListener('click', () => {
    addJob(els.docName.value, Number(els.docPages.value));
    els.docName.value = '';
    els.docPages.value = 5;
    els.docName.focus();
});

// Botón trabajo aleatorio
els.randomJobBtn.addEventListener('click', () => {
    addJob(randomNames[Math.floor(Math.random() * randomNames.length)], Math.floor(Math.random() * 10) + 2);
});

// Eventos de botones principales
els.pauseBtn.addEventListener('click', togglePause);
els.errorBtn.addEventListener('click', simulateError);
els.clearErrorBtn.addEventListener('click', clearError);
els.resetBtn.addEventListener('click', resetSystem);

// Cambia la velocidad de impresión
els.printerSpeed.addEventListener('input', () => {
    state.speed = Number(els.printerSpeed.value);
    els.speedValue.textContent = state.speed;
});

// Enter en el nombre del documento agrega trabajo
els.docName.addEventListener('keydown', e => { if (e.key === 'Enter') els.addJobBtn.click(); });

// Inicializa velocidad y arranca el render
state.speed = Number(els.printerSpeed.value);
render();

// Reloj de simulación
setInterval(tick, 1000);
