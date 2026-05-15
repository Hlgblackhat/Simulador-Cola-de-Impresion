import { state } from './state.js';
import { clearActiveEdges, activateAutomatonEdge, activatePetriFlow, stateNodes, petriPlaces } from './visuals.js';

export function updateSystemState() {
    if (state.error) state.systemState = 'ERROR';
    else if (state.paused && state.activeJob) state.systemState = 'PAUSED';
    else if (state.activeJob) state.systemState = 'PRINTING';
    else if (state.queue.length > 0) state.systemState = 'READY';
    else state.systemState = 'IDLE';
}

export function fireTransition(name, callback) {
    const transitions = {
        enqueue: [document.getElementById('tEnqueue')],
        start: [document.getElementById('tStart')],
        finish: [document.getElementById('tFinish')],
        return: [document.getElementById('tReturn')],
        error: [document.getElementById('tErrorIn')],
        clearError: [document.getElementById('tErrorOut')],
        pause: [document.getElementById('tPauseIn')],
        resume: [document.getElementById('tPauseOut')]
    };

    clearActiveEdges();
    const nodes = transitions[name];
    if (nodes) {
        nodes.forEach(n => n?.classList.add('fired'));
        activateAutomatonEdge(name);
        activatePetriFlow(name);
        
        setTimeout(() => {
            nodes.forEach(n => n?.classList.remove('fired'));
            clearActiveEdges();
            if (callback) callback();
        }, 1200);
    }
}

export function addJob(name, pages, onUpdate) {
    const cleanName = (name || `Documento ${state.nextId}`).trim();
    const totalPages = Math.max(1, Math.min(25, Number(pages) || 1));
    
    state.queue.push({
        id: state.nextId++,
        name: cleanName,
        pages: totalPages,
        remainingPages: totalPages,
        createdAt: state.simulationTime,
        status: 'waiting'
    });
    
    fireTransition('enqueue');
    updateSystemState();
    if (onUpdate) onUpdate();
}

export function maybeStartNextJob(onUpdate) {
    if (state.error || state.paused || state.activeJob || state.queue.length === 0) return;
    
    const next = state.queue.shift();
    next.startedAt = state.simulationTime;
    next.waitTime = next.startedAt - next.createdAt;
    next.status = 'printing';
    state.activeJob = next;
    
    fireTransition('start');
    updateSystemState();
    if (onUpdate) onUpdate();
}

export function finishActiveJob(onUpdate) {
    if (!state.activeJob) return;
    
    state.activeJob.finishedAt = state.simulationTime;
    state.activeJob.status = 'done';
    state.done.unshift(state.activeJob);
    state.totalWaitTime += state.activeJob.waitTime;
    state.activeJob = null;
    
    fireTransition('finish', () => {
        fireTransition('return', () => {
            maybeStartNextJob(onUpdate);
            if (onUpdate) onUpdate();
        });
    });
    updateSystemState();
    if (onUpdate) onUpdate();
}
