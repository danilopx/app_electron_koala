const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getAppInfo: () => ipcRenderer.invoke('desktop:get-app-info'),
  getPrinters: () => ipcRenderer.invoke('desktop:get-printers'),
  print: (options) => ipcRenderer.invoke('desktop:print', options),
  printHtml: (options) => ipcRenderer.invoke('desktop:print-html', options),
  serial: {
    startReading: () => ipcRenderer.invoke('serial:start-reading'),
    stopReading: () => ipcRenderer.invoke('serial:stop-reading'),
    reconnectReading: () => ipcRenderer.invoke('serial:reconnect-reading'),
    getStatus: () => ipcRenderer.invoke('serial:get-status'),
    autoExecGetActive: () => ipcRenderer.invoke('serial:auto-exec:get-active'),
    autoExecActivate: (payload) => ipcRenderer.invoke('serial:auto-exec:activate', payload),
    autoExecPause: (payload) => ipcRenderer.invoke('serial:auto-exec:pause', payload),
    onData: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('serial:data', listener);
      return () => ipcRenderer.removeListener('serial:data', listener);
    },
    onError: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('serial:error', listener);
      return () => ipcRenderer.removeListener('serial:error', listener);
    },
    onClosed: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('serial:closed', listener);
      return () => ipcRenderer.removeListener('serial:closed', listener);
    },
    onAutoExecutionUpdate: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('apontamento-auto:update', listener);
      return () => ipcRenderer.removeListener('apontamento-auto:update', listener);
    },
  },
  sqlite: {
    init: (options) => ipcRenderer.invoke('sqlite:init', options),
    apontamentoAutomatico: {
      registrarContagem: (payload) => ipcRenderer.invoke('sqlite:apontamento-auto:registrar-contagem', payload),
      getOrdemByOp: (op) => ipcRenderer.invoke('sqlite:apontamento-auto-ordem:get-by-op', { op }),
      upsertOrdem: (payload) => ipcRenderer.invoke('sqlite:apontamento-auto-ordem:upsert', payload),
      adjustQuantPar: (payload) => ipcRenderer.invoke('sqlite:apontamento-auto-ordem:adjust-quant-par', payload),
      registrarCicloApontamento: (payload) => ipcRenderer.invoke('sqlite:apontamento-auto-ciclo:registrar', payload),
    },
    parametros: {
      list: () => ipcRenderer.invoke('sqlite:parametros:list'),
      getById: (id) => ipcRenderer.invoke('sqlite:parametros:get-by-id', { id }),
      getByKey: (parametro) => ipcRenderer.invoke('sqlite:parametros:get-by-key', { parametro }),
      create: (payload) => ipcRenderer.invoke('sqlite:parametros:create', payload),
      update: (payload) => ipcRenderer.invoke('sqlite:parametros:update', payload),
      delete: (id) => ipcRenderer.invoke('sqlite:parametros:delete', { id }),
    },
  }
});
