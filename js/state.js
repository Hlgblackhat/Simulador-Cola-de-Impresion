// Traducción de estados internos a texto visible en pantalla
export const STATE_ES = { 
    IDLE: 'INACTIVA', 
    READY: 'LISTA', 
    PRINTING: 'IMPRIMIENDO', 
    PAUSED: 'PAUSADA', 
    ERROR: 'ERROR' 
};

// Nombres aleatorios para generar trabajos
export const randomNames = [
    'Informe mensual', 'Tesis parcial', 'Factura proveedor', 
    'Guía de laboratorio', 'Planilla de notas', 'Contrato interno', 
    'Manual técnico', 'Reporte ventas', 'Acta de reunión', 'Presentación final'
];

// Estado global de toda la simulación
export const state = {
    queue: [], 
    done: [], 
    activeJob: null,
    systemState: 'IDLE', 
    simulationTime: 0,
    nextId: 1, 
    paused: false, 
    error: false,
    speed: 1, 
    totalWaitTime: 0
};
