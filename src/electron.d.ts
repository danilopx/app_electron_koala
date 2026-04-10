interface ElectronPrintOptions {
  silent?: boolean;
  printBackground?: boolean;
  deviceName?: string;
  margins?: {
    marginType?: 'default' | 'none' | 'printableArea' | 'custom';
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: string | {
    width: number;
    height: number;
  };
  landscape?: boolean;
  scaleFactor?: number;
  copies?: number;
  timeoutMs?: number;
  verifyQueueStatus?: boolean;
  queueCheckDelayMs?: number;
  queueCheckAttempts?: number;
  queueCheckIntervalMs?: number;
  useDialogFallback?: boolean;
  dialogTimeoutMs?: number;
}

interface ElectronPrintHtmlOptions extends ElectronPrintOptions {
  html: string;
}

interface ElectronPrinterInfo {
  name?: string;
  displayName?: string;
  description?: string;
  isDefault?: boolean;
}

interface ElectronPrintResult {
  success: boolean;
  error: string | null;
}

interface ElectronSerialResult {
  success: boolean;
  error?: string | null;
  port?: string;
  path?: string;
  lastValue?: string;
}

interface ElectronSerialStatusResult extends ElectronSerialResult {
  reading?: boolean;
  raw?: string;
  value?: number | null;
  configuredPort?: string;
}

interface ElectronSerialPayload {
  raw: string;
  value: number | null;
  port: string;
  path: string;
}

interface ElectronSerialErrorPayload {
  error: string;
  port: string;
  path: string;
}

interface ElectronSerialClosedPayload {
  port: string;
  path: string;
  baudRate: number;
}

interface ElectronAutoExecutionSession {
  id: number;
  op: string;
  empresa: string;
  filial: string;
  produto: string;
  quantidade: number;
  porta: string;
  baudrate: number;
  status: string;
  ativa: number;
  created_at: string;
  updated_at: string;
}

interface ElectronAutoExecutionUpdatePayload {
  op: string;
  quantPar: number;
  totalProd: number;
  cicloMedio: number;
  tempo: number;
  tempoPrev: number;
  dataUltPc: string;
  rawValue: string;
}

interface ElectronSqliteInitResult {
  success: boolean;
  path?: string;
  error?: string | null;
}

interface ElectronSqliteRunResult {
  success: boolean;
  changes?: number;
  lastInsertRowid?: string;
  error?: string | null;
}

interface ElectronAutoCountPayload {
  empresa: string;
  filial: string;
  ordem: string;
  produto: string;
  porta: string;
  sinal: string;
  contadorCiclo: number;
  rawValue: string;
}

interface ElectronAutoOrderPayload {
  op: string;
  quantidade: number;
  quantPar: number;
  dataHora: string;
  dataUltPc: string;
  cicloMedio: number;
  tempo: number;
  totalProd: number;
  tempoPrev: number;
  perda: number;
}

interface ElectronAutoOrderRow extends ElectronAutoOrderPayload {
  codigo: number;
}

interface ElectronAutoApontamentoCicloPayload {
  op: string;
  empresa: string;
  filial: string;
  produto: string;
  quantidade: number;
  tipo: string;
  usuario: string;
  inicioEm: string;
  fimEm: string;
  tempoSegundos: number;
  tempoMinutos: number;
  observacao: string;
}

interface ElectronSqliteGetResult<T = any> {
  success: boolean;
  row?: T | null;
  error?: string | null;
}

interface ElectronSqliteAllResult<T = any> {
  success: boolean;
  rows?: T[];
  error?: string | null;
}

interface ElectronAppInfo {
  version: string;
  name: string;
  isPackaged: boolean;
}

interface ElectronAPI {
  isDesktop: boolean;
  getAppInfo: () => Promise<ElectronAppInfo>;
  getPrinters: () => Promise<ElectronPrinterInfo[]>;
  print: (options?: ElectronPrintOptions) => Promise<ElectronPrintResult>;
  printHtml: (options: ElectronPrintHtmlOptions) => Promise<ElectronPrintResult>;
  serial: {
    startReading: () => Promise<ElectronSerialResult>;
    stopReading: () => Promise<ElectronSerialResult>;
    reconnectReading: () => Promise<ElectronSerialResult>;
    getStatus: () => Promise<ElectronSerialStatusResult>;
    autoExecGetActive: () => Promise<ElectronSqliteGetResult<ElectronAutoExecutionSession>>;
    autoExecActivate: (payload: { op: string; empresa: string; filial: string; produto: string; quantidade: number }) => Promise<ElectronSqliteGetResult<ElectronAutoExecutionSession>>;
    autoExecPause: (payload?: { op?: string }) => Promise<ElectronSqliteGetResult<ElectronAutoExecutionSession>>;
    onData: (callback: (payload: ElectronSerialPayload) => void) => () => void;
    onError: (callback: (payload: ElectronSerialErrorPayload) => void) => () => void;
    onClosed: (callback: (payload: ElectronSerialClosedPayload) => void) => () => void;
    onAutoExecutionUpdate: (callback: (payload: ElectronAutoExecutionUpdatePayload) => void) => () => void;
  };
  sqlite: {
    init: (options?: { fileName?: string }) => Promise<ElectronSqliteInitResult>;
    apontamentoAutomatico: {
      registrarContagem: (payload: ElectronAutoCountPayload) => Promise<ElectronSqliteRunResult>;
      getOrdemByOp: (op: string) => Promise<ElectronSqliteGetResult<ElectronAutoOrderRow>>;
      upsertOrdem: (payload: ElectronAutoOrderPayload) => Promise<ElectronSqliteRunResult>;
      adjustQuantPar: (payload: { op: string; quantPar: number }) => Promise<ElectronSqliteGetResult<ElectronAutoOrderRow>>;
      registrarCicloApontamento: (payload: ElectronAutoApontamentoCicloPayload) => Promise<ElectronSqliteRunResult>;
    };
    parametros: {
      list: <T = any>() => Promise<ElectronSqliteAllResult<T>>;
      getById: <T = any>(id: number) => Promise<ElectronSqliteGetResult<T>>;
      getByKey: <T = any>(parametro: string) => Promise<ElectronSqliteGetResult<T>>;
      create: (payload: { parametro: string; valor: string; descricao: string }) => Promise<ElectronSqliteRunResult>;
      update: (payload: { id: number; parametro: string; valor: string; descricao: string; deleted?: string }) => Promise<ElectronSqliteRunResult>;
      delete: (id: number) => Promise<ElectronSqliteRunResult>;
    };
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
