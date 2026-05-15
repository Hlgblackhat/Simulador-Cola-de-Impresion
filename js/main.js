import { state, randomNames } from './state.js';
import { updateSystemState, addJob, maybeStartNextJob, finishActiveJob, fireTransition } from './engine.js';
import { els, renderStats, renderLists, renderActiveJob, renderGraphs } from './ui.js';
import { petriPlaces, clearActiveEdges, activateAutomatonEdge, activatePetriFlow } from './visuals.js';

function render() {
    renderStats();
    renderLists();
    renderActiveJob();
    renderGraphs();
    els.pauseBtn.disabled = !state.activeJob || state.error;
    els.clearErrorBtn.disabled = !state.error;
}

function tick() {
    state.simulationTime += 1;
    if (!state.error && !state.paused && state.activeJob) {
        state.activeJob.remainingPages = Math.max(0, state.activeJob.remainingPages - state.speed);
        if (state.activeJob.remainingPages <= 0) finishActiveJob(render);
    } else if (!state.error && !state.activeJob) {
        maybeStartNextJob(render);
    }
    updateSystemState();
    render();
}

// Inicialización de Eventos
document.getElementById('addJobBtn').addEventListener('click', () => {
    addJob(els.docName.value, els.docPages.value, render);
    els.docName.value = '';
    els.docName.focus();
});

document.getElementById('randomJobBtn').addEventListener('click', () => {
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const pages = Math.floor(Math.random() * 10) + 2;
    addJob(name, pages, render);
});

els.pauseBtn.addEventListener('click', () => {
    if (!state.activeJob || state.error) return;
    state.paused = !state.paused;
    
    const transition = state.paused ? 'pause' : 'resume';
    const source = state.paused ? 'printing' : 'paused';
    const target = state.paused ? 'paused' : 'printing';
    
    petriPlaces[source].classList.add('flash-source');
    petriPlaces[target].classList.add('flash-target');
    
    fireTransition(transition);
    updateSystemState();
    render();
});

document.getElementById('errorBtn').addEventListener('click', () => {
    if (!state.activeJob || state.error) return;
    state.error = true;
    state.paused = false;
    
    petriPlaces.printing.classList.add('flash-source');
    petriPlaces.error.classList.add('flash-target');
    
    fireTransition('error');
    updateSystemState();
    render();
});

els.clearErrorBtn.addEventListener('click', () => {
    if (!state.error) return;
    state.error = false;
    
    petriPlaces.error.classList.add('flash-source');
    petriPlaces.printing.classList.add('flash-target');
    
    fireTransition('clearError', () => {
        if (!state.paused) maybeStartNextJob(render);
        render();
    });
    updateSystemState();
    render();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    Object.assign(state, {
        queue: [], done: [], activeJob: null,
        systemState: 'IDLE', simulationTime: 0,
        nextId: 1, paused: false, error: false, totalWaitTime: 0
    });
    render();
});

els.printerSpeed.addEventListener('input', () => {
    state.speed = Number(els.printerSpeed.value);
    els.speedValue.textContent = state.speed;
});

// Inicio
state.speed = Number(els.printerSpeed.value);
render();
setInterval(tick, 1000);
