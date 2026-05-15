import { state } from './state.js';

// Referencias a elementos visuales del Autómata
export const edgeEls = {
    add: document.getElementById('edge-add'),
    start: document.getElementById('edge-start'),
    finishIdle: document.getElementById('edge-finish-idle'),
    finishReady: document.getElementById('edge-finish-ready'),
    pause: document.getElementById('edge-pause'),
    resume: document.getElementById('edge-resume'),
    error: document.getElementById('edge-error'),
    errorReturn: document.getElementById('edge-error-return')
};

export const edgeLabels = {
    add: document.getElementById('label-add'),
    start: document.getElementById('label-start'),
    finishIdle: document.getElementById('label-finish-idle'),
    finishReady: document.getElementById('label-finish-ready'),
    pause: document.getElementById('label-pause'),
    resume: document.getElementById('label-resume'),
    error: document.getElementById('label-error'),
    errorReturn: document.getElementById('label-clear-error')
};

export const stateNodes = ['IDLE', 'READY', 'PRINTING', 'PAUSED', 'ERROR'].reduce((a, k) => {
    a[k] = document.getElementById(`state-${k}`);
    return a;
}, {});

// Referencias a la Red de Petri
export const petriEdgeSets = {
    enqueue: ['petri-enqueue-in', 'petri-enqueue-out'],
    start: ['petri-start-in', 'petri-start-out'],
    finish: ['petri-finish-in', 'petri-finish-out'],
    return: ['petri-return-in', 'petri-return-out'],
    error: ['petri-error-in-1', 'petri-error-in-2'],
    clearError: ['petri-error-out-1', 'petri-error-out-2'],
    pause: ['petri-pause-in-1', 'petri-pause-in-2'],
    resume: ['petri-pause-out-1', 'petri-pause-out-2']
};

export const petriPlaces = {
    queue: document.getElementById('place-queue'),
    free: document.getElementById('place-free'),
    printing: document.getElementById('place-printing'),
    done: document.getElementById('place-done'),
    error: document.getElementById('place-error'),
    paused: document.getElementById('place-paused')
};

// Funciones de utilidad visual
export function clearNodeHighlights() {
    Object.values(stateNodes).forEach(e => e.classList.remove('flash-source', 'flash-target'));
    Object.values(petriPlaces).forEach(e => e.classList.remove('flash-source', 'flash-target'));
}

export function clearActiveEdges() {
    Object.values(edgeEls).forEach(e => e.classList.remove('active-edge'));
    Object.values(edgeLabels).forEach(e => e.classList.remove('active-label'));
    Object.values(petriEdgeSets).flat().forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-edge');
    });
    clearNodeHighlights();
}

export function activateAutomatonEdge(name) {
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

export function activatePetriFlow(name) {
    (petriEdgeSets[name] || []).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('active-edge');
    });
}
