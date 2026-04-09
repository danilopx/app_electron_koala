const fs = require('fs');
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const packageJson = require('../package.json');
const { autoUpdater } = require('electron-updater');
const sqlite = require('./sqlite');
const { runSqliteMigrations } = require('./sqlite-migrations');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const localAppData =
  process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || __dirname, 'AppData', 'Local');

app.setPath('userData', path.join(localAppData, 'Koala'));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

const isDev = !app.isPackaged;
let mainWindow;
let serialPortInstance = null;
let serialParserInstance = null;
let serialBuffer = '';
let serialCurrentPort = '';
let serialStartPromise = null;
let autoExecutionSession = null;
let autoExecutionLastSignal = '0';
let isShuttingDown = false;
let autoUpdaterInitialized = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearSerialState({ resetBuffer = true } = {}) {
  serialPortInstance = null;
  serialParserInstance = null;
  serialCurrentPort = '';
  if (resetBuffer) {
    serialBuffer = '';
  }
}

async function safeCloseSerialPort(portInstance) {
  if (!portInstance) {
    return;
  }

  try {
    if (typeof portInstance.drain === 'function' && portInstance.isOpen) {
      await new Promise((resolve) => {
        portInstance.drain(() => resolve());
      });
    }
  } catch (_error) {}

  try {
    if (typeof portInstance.flush === 'function' && portInstance.isOpen) {
      await new Promise((resolve) => {
        portInstance.flush(() => resolve());
      });
    }
  } catch (_error) {}

  try {
    if (portInstance.isOpen) {
      await new Promise((resolve) => {
        portInstance.close(() => resolve());
      });
    }
  } catch (_error) {}

  try {
    if (typeof portInstance.destroy === 'function') {
      portInstance.destroy();
    }
  } catch (_error) {}
}

function isSerialAccessDeniedError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('access denied') || message.includes('permission denied') || message.includes('resource busy');
}

function createSerialPortInstance(portPath, baudRate, configuredPort) {
  const portInstance = new SerialPort({
    path: portPath,
    baudRate,
    autoOpen: false,
  });

  const parserInstance = portInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  parserInstance.on('data', (line) => {
    const raw = String(line || '').trim();
    if (!raw) {
      return;
    }

    serialBuffer = raw;
    notifySerialPayload('serial:data', {
      raw,
      value: extractNumericValue(raw),
      port: configuredPort,
      path: portPath,
      baudRate,
    });

    const signal = normalizeBinarySignal(raw);
    if (!signal || !autoExecutionSession) {
      return;
    }

    if (signal === '1' && autoExecutionLastSignal !== '1') {
      autoExecutionLastSignal = '1';
      processAutomaticPieceCount(raw);
      return;
    }

    if (signal === '0') {
      autoExecutionLastSignal = '0';
    }
  });

  portInstance.on('error', (error) => {
    notifySerialPayload('serial:error', {
      error: error instanceof Error ? error.message : 'Falha na leitura serial.',
      port: configuredPort,
      path: portPath,
      baudRate,
    });
  });

  portInstance.on('close', () => {
    notifySerialPayload('serial:closed', {
      port: configuredPort,
      path: portPath,
      baudRate,
    });
    clearSerialState({ resetBuffer: false });
  });

  return { portInstance, parserInstance };
}

function getMainWindow() {
  return BrowserWindow.getFocusedWindow() || mainWindow;
}

function notifySerialPayload(channel, payload) {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) {
    return;
  }

  win.webContents.send(channel, payload);
}

function notifyAutoExecutionUpdate(payload) {
  notifySerialPayload('apontamento-auto:update', payload);
}

function getConfiguredPortaCom() {
  const row = sqlite.get(
    `
      SELECT valor
      FROM parametro
      WHERE parametro = 'PR_PORTACOM'
        AND deleted = ''
      LIMIT 1
    `,
    [],
  );

  return String(row?.valor || '').trim();
}

function getConfiguredBaudRate() {
  const row = sqlite.get(
    `
      SELECT valor
      FROM parametro
      WHERE parametro = 'PR_BAUDRATE'
        AND deleted = ''
      LIMIT 1
    `,
    [],
  );

  const value = Number(String(row?.valor || '').trim());
  return Number.isFinite(value) && value > 0 ? value : 9600;
}

function normalizeSerialPath(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) {
    return '';
  }

  if (process.platform === 'win32') {
    return value.toUpperCase();
  }

  if (value.startsWith('/dev/')) {
    return value;
  }

  return `/dev/${value}`;
}

async function stopSerialReading() {
  serialStartPromise = null;

  if (serialParserInstance) {
    serialParserInstance.removeAllListeners();
    serialParserInstance = null;
  }

  if (serialPortInstance) {
    const currentInstance = serialPortInstance;
    serialPortInstance.removeAllListeners();
    await safeCloseSerialPort(currentInstance);
  }

  clearSerialState();
}

function extractNumericValue(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) {
    return null;
  }

  const normalized = value.replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBinarySignal(rawValue) {
  const raw = String(rawValue || '').trim();
  if (raw === '0' || raw === '1') {
    return raw;
  }

  const numeric = extractNumericValue(raw);
  if (numeric === 0 || numeric === 1) {
    return String(numeric);
  }

  return '';
}

function calculateAverageCycleSeconds(lastPieceAt, currentDate, currentAverage) {
  if (!lastPieceAt) {
    return Number(currentAverage || 0);
  }

  const intervalSeconds = Math.max(0, (currentDate.getTime() - lastPieceAt.getTime()) / 1000);
  if (!(intervalSeconds > 0)) {
    return Number(currentAverage || 0);
  }

  const maxAcceptedInterval = currentAverage > 0 ? currentAverage * 3 : 120;
  if (intervalSeconds > maxAcceptedInterval) {
    return Number(currentAverage || 0);
  }

  if (!(currentAverage > 0)) {
    return intervalSeconds;
  }

  return Number((((currentAverage * 4) + intervalSeconds) / 5).toFixed(2));
}

function getActiveAutoExecutionSession() {
  return sqlite.get(
    `
      SELECT id, op, empresa, filial, produto, quantidade, porta, baudrate, status, ativa, created_at, updated_at
      FROM apontamento_automatico_execucao
      WHERE ativa = 1
        AND status = 'ATIVA'
      LIMIT 1
    `,
    [],
  ) || null;
}

function loadAutoExecutionSession() {
  autoExecutionSession = getActiveAutoExecutionSession();
  if (!autoExecutionSession) {
    autoExecutionLastSignal = '0';
  }
}

function getAutomaticOrderState(op) {
  return sqlite.get(
    `
      SELECT
        codigo,
        op,
        quantidade,
        quant_par AS quantPar,
        data_hora AS dataHora,
        data_ultpc AS dataUltPc,
        ciclo_medio AS cicloMedio,
        tempo,
        total_prod AS totalProd,
        tempo_prev AS tempoPrev,
        perda
      FROM apontamento_automatico_ordem
      WHERE op = ?
      LIMIT 1
    `,
    [op],
  ) || null;
}

function getAutomaticExecutionSessionByOp(op) {
  return sqlite.get(
    `
      SELECT id, op, empresa, filial, produto, quantidade, porta, baudrate, status, ativa, created_at, updated_at
      FROM apontamento_automatico_execucao
      WHERE op = ?
      LIMIT 1
    `,
    [op],
  ) || null;
}

function getLatestAutomaticCountRow(op) {
  return sqlite.get(
    `
      SELECT
        id,
        empresa,
        filial,
        ordem,
        produto,
        porta,
        sinal,
        contador_ciclo AS contadorCiclo,
        raw_value AS rawValue,
        created_at AS createdAt
      FROM apontamento_automatico_contagem
      WHERE ordem = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 1
    `,
    [op],
  ) || null;
}

function upsertAutomaticOrderState(payload) {
  return sqlite.run(
    `
      INSERT INTO apontamento_automatico_ordem (
        op,
        quantidade,
        quant_par,
        data_hora,
        data_ultpc,
        ciclo_medio,
        tempo,
        total_prod,
        tempo_prev,
        perda
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(op) DO UPDATE SET
        quantidade = excluded.quantidade,
        quant_par = excluded.quant_par,
        data_hora = COALESCE(NULLIF(apontamento_automatico_ordem.data_hora, ''), excluded.data_hora),
        data_ultpc = excluded.data_ultpc,
        ciclo_medio = excluded.ciclo_medio,
        tempo = excluded.tempo,
        total_prod = excluded.total_prod,
        tempo_prev = excluded.tempo_prev,
        perda = excluded.perda
    `,
    [
      payload.op,
      payload.quantidade,
      payload.quantPar,
      payload.dataHora,
      payload.dataUltPc,
      payload.cicloMedio,
      payload.tempo,
      payload.totalProd,
      payload.tempoPrev,
      payload.perda,
    ],
  );
}

function adjustAutomaticOrderCount(op, targetQuantPar) {
  const normalizedOp = String(op || '').trim();
  const normalizedTarget = Math.max(0, Math.trunc(Number(targetQuantPar || 0)));

  if (!normalizedOp) {
    throw new Error('OP invalida para ajustar contagem automatica.');
  }

  const existing = getAutomaticOrderState(normalizedOp);
  if (!existing) {
    throw new Error('Nao existe estado salvo para a OP informada.');
  }

  const currentQuantPar = Math.max(0, Math.trunc(Number(existing.quantPar || 0)));
  const diff = normalizedTarget - currentQuantPar;
  const context = getAutomaticExecutionSessionByOp(normalizedOp) || getLatestAutomaticCountRow(normalizedOp);
  const empresa = String(context?.empresa || '').trim();
  const filial = String(context?.filial || '').trim();
  const produto = String(context?.produto || '').trim();
  const porta = String(context?.porta || getConfiguredPortaCom() || '').trim();
  const cycleSeconds = Number(existing.cicloMedio || 0) > 0 ? Number(existing.cicloMedio || 0) : 1;
  const now = new Date();

  sqlite.transaction(() => {
    if (diff > 0) {
      const startTime = new Date(now.getTime() - ((diff - 1) * cycleSeconds * 1000));

      for (let index = 0; index < diff; index += 1) {
        const createdAt = new Date(startTime.getTime() + (index * cycleSeconds * 1000)).toISOString();
        sqlite.run(
          `
            INSERT INTO apontamento_automatico_contagem (
              empresa,
              filial,
              ordem,
              produto,
              porta,
              sinal,
              contador_ciclo,
              raw_value,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            empresa,
            filial,
            normalizedOp,
            produto,
            porta,
            'ACERTO',
            currentQuantPar + index + 1,
            'ACERTO',
            createdAt,
          ],
        );
      }
    }

    if (diff < 0) {
      const rowsToDelete = sqlite.all(
        `
          SELECT id
          FROM apontamento_automatico_contagem
          WHERE ordem = ?
          ORDER BY datetime(created_at) DESC, id DESC
          LIMIT ?
        `,
        [normalizedOp, Math.abs(diff)],
      );

      for (const row of rowsToDelete) {
        sqlite.run(
          `
            DELETE FROM apontamento_automatico_contagem
            WHERE id = ?
          `,
          [row.id],
        );
      }
    }
  });

  const latestRow = getLatestAutomaticCountRow(normalizedOp);
  const dataHora = String(existing.dataHora || now.toISOString()).trim() || now.toISOString();
  const endAt = latestRow?.createdAt ? new Date(latestRow.createdAt) : now;
  const startAt = new Date(dataHora);
  const tempo = Number.isNaN(startAt.getTime()) ? Number(existing.tempo || 0) : Math.max(0, (endAt.getTime() - startAt.getTime()) / 60000);
  const quantidade = Number(existing.quantidade || 0);
  const totalProd = Math.max(0, Number(existing.totalProd || 0) + diff);
  const cicloMedio = Number(existing.cicloMedio || 0);
  const tempoPrev = cicloMedio > 0 ? (cicloMedio * Math.max(0, quantidade - totalProd)) / 60 : 0;

  upsertAutomaticOrderState({
    op: normalizedOp,
    quantidade,
    quantPar: normalizedTarget,
    dataHora,
    dataUltPc: String(latestRow?.createdAt || '').trim(),
    cicloMedio,
    tempo,
    totalProd,
    tempoPrev,
    perda: Number(existing.perda || 0),
  });

  const updated = getAutomaticOrderState(normalizedOp);
  notifyAutoExecutionUpdate({
    op: normalizedOp,
    quantPar: Number(updated?.quantPar || normalizedTarget),
    totalProd: Number(updated?.totalProd || totalProd),
    cicloMedio: Number(updated?.cicloMedio || cicloMedio),
    tempo: Number(updated?.tempo || tempo),
    tempoPrev: Number(updated?.tempoPrev || tempoPrev),
    dataUltPc: String(updated?.dataUltPc || '').trim(),
    rawValue: 'ACERTO',
  });

  return updated;
}

function processAutomaticPieceCount(rawValue) {
  if (!autoExecutionSession) {
    return null;
  }

  const now = new Date();
  const op = String(autoExecutionSession.op || '').trim();
  const existing = getAutomaticOrderState(op);
  const startedAt = existing?.dataHora ? new Date(existing.dataHora) : now;
  const lastPieceAt = existing?.dataUltPc ? new Date(existing.dataUltPc) : null;
  const quantPar = Number(existing?.quantPar || 0) + 1;
  const totalProd = Number(existing?.totalProd || 0) + 1;
  const quantidade = Number(existing?.quantidade || autoExecutionSession.quantidade || 0);
  const cicloMedio = calculateAverageCycleSeconds(lastPieceAt, now, Number(existing?.cicloMedio || 0));
  const tempo = Math.max(0, (now.getTime() - startedAt.getTime()) / 60000);
  const remainingPieces = Math.max(0, quantidade - totalProd);
  const tempoPrev = cicloMedio > 0 ? (cicloMedio * remainingPieces) / 60 : 0;

  sqlite.run(
    `
      INSERT INTO apontamento_automatico_contagem (
        empresa,
        filial,
        ordem,
        produto,
        porta,
        sinal,
        contador_ciclo,
        raw_value
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      String(autoExecutionSession.empresa || '').trim(),
      String(autoExecutionSession.filial || '').trim(),
      op,
      String(autoExecutionSession.produto || '').trim(),
      String(autoExecutionSession.porta || '').trim(),
      '1',
      quantPar,
      String(rawValue || '').trim(),
    ],
  );

  upsertAutomaticOrderState({
    op,
    quantidade,
    quantPar,
    dataHora: existing?.dataHora || now.toISOString(),
    dataUltPc: now.toISOString(),
    cicloMedio,
    tempo,
    totalProd,
    tempoPrev,
    perda: Number(existing?.perda || 0),
  });

  const updated = getAutomaticOrderState(op);
  notifyAutoExecutionUpdate({
    op,
    quantPar: Number(updated?.quantPar || quantPar),
    totalProd: Number(updated?.totalProd || totalProd),
    cicloMedio: Number(updated?.cicloMedio || cicloMedio),
    tempo: Number(updated?.tempo || tempo),
    tempoPrev: Number(updated?.tempoPrev || tempoPrev),
    dataUltPc: updated?.dataUltPc || now.toISOString(),
    rawValue: String(rawValue || '').trim(),
  });

  return updated;
}

async function startSerialReading() {
  if (serialStartPromise) {
    return serialStartPromise;
  }

  serialStartPromise = (async () => {
  const configuredPort = getConfiguredPortaCom();
  const configuredBaudRate = getConfiguredBaudRate();
  if (!configuredPort) {
    throw new Error('Parametro PR_PORTACOM nao configurado.');
  }

  const portPath = normalizeSerialPath(configuredPort);
  if (!portPath) {
    throw new Error('Porta serial invalida para o parametro PR_PORTACOM.');
  }

  if (serialPortInstance && serialPortInstance.isOpen && serialCurrentPort === portPath) {
    return {
      success: true,
      port: configuredPort,
      path: portPath,
      lastValue: serialBuffer,
    };
  }

  await stopSerialReading();

  const openAttempts = [0, 500, 1500, 3000];

  let lastError = null;

  for (const delayMs of openAttempts) {
    if (delayMs > 0) {
      await wait(delayMs);
    }

    const { portInstance, parserInstance } = createSerialPortInstance(portPath, configuredBaudRate, configuredPort);
    serialPortInstance = portInstance;
    serialParserInstance = parserInstance;
    serialCurrentPort = portPath;

    try {
      await new Promise((resolve, reject) => {
        serialPortInstance.open((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      await safeCloseSerialPort(portInstance);
      clearSerialState();

      if (!isSerialAccessDeniedError(error)) {
        throw error;
      }
    }
  }

  if (lastError) {
    const message = String(lastError?.message || lastError || '').trim();
    throw new Error(`Nao foi possivel assumir a porta ${configuredPort}. Feche outros programas que possam estar usando a balanca e tente novamente. Detalhe: ${message}`);
  }

  return {
    success: true,
    port: configuredPort,
    path: portPath,
    baudRate: configuredBaudRate,
    lastValue: serialBuffer,
  };
  })();

  try {
    return await serialStartPromise;
  } finally {
    serialStartPromise = null;
  }
}

async function restoreAutomaticExecutionSerial() {
  try {
    loadAutoExecutionSession();
    if (!autoExecutionSession) {
      return;
    }

    await startSerialReading();
  } catch (error) {
    console.error('[electron] Falha ao restaurar leitura serial automatica:', error);
  }
}

function printWebContents(targetWindow, options = {}) {
  const printOptions = {
    silent: Boolean(options.silent),
    printBackground: options.printBackground !== false,
    deviceName: options.deviceName || undefined,
  };

  if (options.pageSize) {
    printOptions.pageSize = options.pageSize;
  }

  if (options.margins) {
    printOptions.margins = options.margins;
  }

  if (options.landscape !== undefined) {
    printOptions.landscape = Boolean(options.landscape);
  }

  if (options.scaleFactor) {
    printOptions.scaleFactor = Number(options.scaleFactor);
  }

  if (options.copies) {
    printOptions.copies = Number(options.copies);
  }

  return new Promise((resolve) => {
    targetWindow.webContents.print(
      printOptions,
      (success, failureReason) => {
        resolve({
          success,
          error: success ? null : failureReason || 'Falha ao imprimir.'
        });
      }
    );
  });
}

async function printHtmlContent(html, options = {}) {
  const printWindow = new BrowserWindow({
    show: false,
    frame: false,
    width: 420,
    height: 320,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    return await printWebContents(printWindow, options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao preparar impressao.'
    };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function readDesktopConfigUrl() {
  const configPath = path.join(__dirname, 'desktop-config.json');

  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    const value = String(parsed?.desktopAppUrl || '').trim();
    return isHttpUrl(value) ? value : null;
  } catch (_error) {
    return null;
  }
}

function hasAppUpdateConfig() {
  const updateConfigPath = path.join(process.resourcesPath || '', 'app-update.yml');
  return fs.existsSync(updateConfigPath);
}

async function setupAutoUpdater() {
  if (autoUpdaterInitialized || !app.isPackaged || !hasAppUpdateConfig()) {
    return;
  }

  autoUpdaterInitialized = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('error', (error) => {
    console.error('[electron] Falha na verificacao de atualizacoes:', error);
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[electron] Atualizacao disponivel:', info?.version || info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[electron] Aplicacao atualizada:', info?.version || info);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log('[electron] Baixando atualizacao:', {
      percent: progress?.percent,
      transferred: progress?.transferred,
      total: progress?.total,
      bytesPerSecond: progress?.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    try {
      const response = await dialog.showMessageBox({
        type: 'info',
        title: 'Atualizacao disponivel',
        message: `A versao ${info?.version || 'nova'} foi baixada.`,
        detail: 'Deseja reiniciar agora para concluir a atualizacao?',
        buttons: ['Reiniciar agora', 'Depois'],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      });

      if (response.response === 0) {
        await stopSerialReading();
        sqlite.close();
        isShuttingDown = true;
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      console.error('[electron] Falha ao exibir dialogo de atualizacao:', error);
    }
  });

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('[electron] Falha ao verificar atualizacoes:', error);
  }
}

function getAppUrl() {
  const startUrl = process.env.ELECTRON_START_URL;
  const remoteAppUrl =
    process.env.KOALA_DESKTOP_URL ||
    readDesktopConfigUrl() ||
    packageJson.desktopAppUrl;

  if (isHttpUrl(startUrl)) {
    return startUrl.trim();
  }

  if (isDev) {
    return 'http://127.0.0.1:4301/#/login';
  }

  if (isHttpUrl(remoteAppUrl)) {
    return remoteAppUrl.trim();
  }

  return null;
}

async function createWindow() {
  const iconPath = path.join(__dirname, '..', 'src', 'assets', 'Simplify.ico');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const appUrl = getAppUrl();

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[electron] Falha ao carregar URL:', {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  if (!appUrl) {
    const missingUrlHtml = `
      <!doctype html>
      <html lang="pt-br">
        <head>
          <meta charset="utf-8">
          <title>Koala</title>
          <style>
            body {
              margin: 0;
              font-family: Segoe UI, Arial, sans-serif;
              background: #f3f4f6;
              color: #1f2937;
            }
            .wrap {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 32px;
              box-sizing: border-box;
            }
            .card {
              width: min(560px, 100%);
              background: #ffffff;
              border: 1px solid #d1d5db;
              border-radius: 16px;
              padding: 28px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            }
            h1 {
              margin: 0 0 12px;
              font-size: 24px;
            }
            p {
              margin: 0 0 12px;
              line-height: 1.5;
            }
            code {
              background: #e5e7eb;
              padding: 2px 6px;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <h1>URL remota nao configurada</h1>
              <p>Este executavel foi configurado para carregar o frontend hospedado na nuvem.</p>
              <p>Defina <code>desktopAppUrl</code> no <code>package.json</code> ou a variavel <code>KOALA_DESKTOP_URL</code>.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(missingUrlHtml)}`);
    return;
  }

  console.log('[electron] Carregando URL:', appUrl);
  await mainWindow.loadURL(appUrl);

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    const isF12 = input.key === 'F12' && input.type === 'keyDown';
    const isCtrlShiftI =
      input.key.toLowerCase() === 'i' &&
      input.control &&
      input.shift &&
      input.type === 'keyDown';

    if (isF12 || isCtrlShiftI) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

ipcMain.handle('desktop:get-printers', async () => {
  const win = getMainWindow();

  if (!win) {
    return [];
  }

  return win.webContents.getPrintersAsync();
});

ipcMain.handle('serial:start-reading', async () => {
  try {
    return await startSerialReading();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao iniciar leitura serial.',
    };
  }
});

ipcMain.handle('serial:stop-reading', async () => {
  try {
    await stopSerialReading();
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao parar leitura serial.',
    };
  }
});

ipcMain.handle('serial:reconnect-reading', async () => {
  try {
    await stopSerialReading();
    return await startSerialReading();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao reconectar leitura serial.',
    };
  }
});

ipcMain.handle('serial:get-status', async () => {
  try {
    return {
      success: true,
      reading: Boolean(serialPortInstance && serialPortInstance.isOpen),
      raw: serialBuffer,
      value: extractNumericValue(serialBuffer),
      path: serialCurrentPort,
      configuredPort: getConfiguredPortaCom(),
      baudRate: getConfiguredBaudRate(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar status serial.',
    };
  }
});

ipcMain.handle('serial:auto-exec:get-active', async () => {
  try {
    loadAutoExecutionSession();
    return {
      success: true,
      row: autoExecutionSession,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar execucao automatica.',
    };
  }
});

ipcMain.handle('serial:auto-exec:activate', async (_event, payload = {}) => {
  try {
    const op = String(payload?.op || '').trim();
    const empresa = String(payload?.empresa || '').trim();
    const filial = String(payload?.filial || '').trim();
    const produto = String(payload?.produto || '').trim();
    const quantidade = Number(payload?.quantidade || 0);
    const porta = getConfiguredPortaCom();
    const baudrate = getConfiguredBaudRate();

    if (!op || !empresa || !filial || !produto) {
      throw new Error('Dados invalidos para ativar a execucao automatica.');
    }

    sqlite.transaction(() => {
      sqlite.run(
        `
          UPDATE apontamento_automatico_execucao
          SET ativa = 0, status = 'PAUSADA', updated_at = datetime('now')
        `,
        [],
      );

      sqlite.run(
        `
          INSERT INTO apontamento_automatico_execucao (
            op,
            empresa,
            filial,
            produto,
            quantidade,
            porta,
            baudrate,
            status,
            ativa
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVA', 1)
          ON CONFLICT(op) DO UPDATE SET
            empresa = excluded.empresa,
            filial = excluded.filial,
            produto = excluded.produto,
            quantidade = excluded.quantidade,
            porta = excluded.porta,
            baudrate = excluded.baudrate,
            status = 'ATIVA',
            ativa = 1,
            updated_at = datetime('now')
        `,
        [op, empresa, filial, produto, quantidade, porta, baudrate],
      );
    });

    loadAutoExecutionSession();
    autoExecutionLastSignal = '0';
    await startSerialReading();

    return {
      success: true,
      row: autoExecutionSession,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao ativar execucao automatica.',
    };
  }
});

ipcMain.handle('serial:auto-exec:pause', async (_event, payload = {}) => {
  try {
    const op = String(payload?.op || '').trim();

    if (op) {
      sqlite.run(
        `
          UPDATE apontamento_automatico_execucao
          SET ativa = 0, status = 'PAUSADA', updated_at = datetime('now')
          WHERE op = ?
        `,
        [op],
      );
    } else {
      sqlite.run(
        `
          UPDATE apontamento_automatico_execucao
          SET ativa = 0, status = 'PAUSADA', updated_at = datetime('now')
          WHERE ativa = 1
        `,
        [],
      );
    }

    loadAutoExecutionSession();

    return {
      success: true,
      row: autoExecutionSession,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao pausar execucao automatica.',
    };
  }
});

ipcMain.handle('desktop:print', async (_event, options = {}) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;

  if (!win) {
    return { success: false, error: 'Janela principal indisponivel.' };
  }

  return printWebContents(win, options);
});

ipcMain.handle('desktop:print-html', async (_event, payload = {}) => {
  if (!payload || typeof payload.html !== 'string' || !payload.html.trim()) {
    return { success: false, error: 'Conteudo HTML da etiqueta nao informado.' };
  }

  return printHtmlContent(payload.html, payload);
});

ipcMain.handle('sqlite:init', async (_event, payload = {}) => {
  try {
    const fileName = String(payload?.fileName || 'simplify.db').trim() || 'simplify.db';
    const initResult = sqlite.init(app.getPath('userData'), fileName);
    runSqliteMigrations(sqlite);

    return {
      success: true,
      ...initResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao inicializar SQLite.',
    };
  }
});

ipcMain.handle('sqlite:parametros:list', async () => {
  try {
    return {
      success: true,
      rows: sqlite.all(
        `
          SELECT id, parametro, valor, descricao, deleted, created_at, updated_at
          FROM parametro
          WHERE deleted = ''
          ORDER BY parametro
        `,
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao listar parametros.',
    };
  }
});

ipcMain.handle('sqlite:parametros:get-by-id', async (_event, payload = {}) => {
  try {
    const id = Number(payload?.id || 0);
    if (!id) {
      throw new Error('Id do parametro invalido.');
    }

    return {
      success: true,
      row: sqlite.get(
        'SELECT id, parametro, valor, descricao, deleted, created_at, updated_at FROM parametro WHERE id = ?',
        [id],
      ) || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar parametro.',
    };
  }
});

ipcMain.handle('sqlite:parametros:get-by-key', async (_event, payload = {}) => {
  try {
    const parametro = String(payload?.parametro || '').trim();
    if (!parametro) {
      throw new Error('Parametro invalido.');
    }

    return {
      success: true,
      row: sqlite.get(
        `
          SELECT id, parametro, valor, descricao, deleted, created_at, updated_at
          FROM parametro
          WHERE parametro = ?
        `,
        [parametro],
      ) || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar parametro por chave.',
    };
  }
});

ipcMain.handle('sqlite:parametros:create', async (_event, payload = {}) => {
  try {
    const parametro = String(payload?.parametro || '').trim();
    const valor = String(payload?.valor || '').trim();
    const descricao = String(payload?.descricao || '').trim();

    if (!parametro || !descricao) {
      throw new Error('Dados do parametro invalidos.');
    }

    return {
      success: true,
      ...sqlite.run(
        `
          INSERT INTO parametro (parametro, valor, descricao, deleted)
          VALUES (?, ?, ?, '')
          ON CONFLICT(parametro) DO UPDATE SET
            valor = excluded.valor,
            descricao = excluded.descricao,
            deleted = '',
            updated_at = datetime('now')
        `,
        [parametro, valor, descricao],
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao criar parametro.',
    };
  }
});

ipcMain.handle('sqlite:parametros:update', async (_event, payload = {}) => {
  try {
    const id = Number(payload?.id || 0);
    const parametro = String(payload?.parametro || '').trim();
    const valor = String(payload?.valor || '').trim();
    const descricao = String(payload?.descricao || '').trim();
    const deleted = String(payload?.deleted ?? '').trim() === '*' ? '*' : '';

    if (!id || !parametro || !descricao) {
      throw new Error('Dados do parametro invalidos.');
    }

    return {
      success: true,
      ...sqlite.run(
        `
          UPDATE parametro
          SET parametro = ?, valor = ?, descricao = ?, deleted = ?, updated_at = datetime('now')
          WHERE id = ?
        `,
        [parametro, valor, descricao, deleted, id],
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao atualizar parametro.',
    };
  }
});

ipcMain.handle('sqlite:parametros:delete', async (_event, payload = {}) => {
  try {
    const id = Number(payload?.id || 0);
    if (!id) {
      throw new Error('Id do parametro invalido.');
    }

    return {
      success: true,
      ...sqlite.run(
        `
          UPDATE parametro
          SET deleted = '*', updated_at = datetime('now')
          WHERE id = ?
        `,
        [id],
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao excluir parametro.',
    };
  }
});

ipcMain.handle('sqlite:apontamento-auto:registrar-contagem', async (_event, payload = {}) => {
  try {
    const empresa = String(payload?.empresa || '').trim();
    const filial = String(payload?.filial || '').trim();
    const ordem = String(payload?.ordem || '').trim();
    const produto = String(payload?.produto || '').trim();
    const porta = String(payload?.porta || '').trim();
    const sinal = String(payload?.sinal || '').trim();
    const contadorCiclo = Number(payload?.contadorCiclo || 0);
    const rawValue = String(payload?.rawValue || '').trim();

    if (!empresa || !filial || !ordem || !produto || !porta || !sinal || !(contadorCiclo > 0)) {
      throw new Error('Dados invalidos para registrar contagem automatica.');
    }

    return {
      success: true,
      ...sqlite.run(
        `
          INSERT INTO apontamento_automatico_contagem (
            empresa,
            filial,
            ordem,
            produto,
            porta,
            sinal,
            contador_ciclo,
            raw_value
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [empresa, filial, ordem, produto, porta, sinal, contadorCiclo, rawValue],
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao registrar contagem automatica.',
    };
  }
});

ipcMain.handle('sqlite:apontamento-auto-ordem:get-by-op', async (_event, payload = {}) => {
  try {
    const op = String(payload?.op || '').trim();
    if (!op) {
      throw new Error('OP invalida para consultar apontamento automatico.');
    }

    return {
      success: true,
      row: sqlite.get(
        `
          SELECT
            codigo,
            op,
            quantidade,
            quant_par AS quantPar,
            data_hora AS dataHora,
            data_ultpc AS dataUltPc,
            ciclo_medio AS cicloMedio,
            tempo,
            total_prod AS totalProd,
            tempo_prev AS tempoPrev,
            perda
          FROM apontamento_automatico_ordem
          WHERE op = ?
          LIMIT 1
        `,
        [op],
      ) || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar ordem automatica.',
    };
  }
});

ipcMain.handle('sqlite:apontamento-auto-ordem:upsert', async (_event, payload = {}) => {
  try {
    const op = String(payload?.op || '').trim();
    const quantidade = Number(payload?.quantidade || 0);
    const quantPar = Number(payload?.quantPar || 0);
    const dataHora = String(payload?.dataHora || '').trim() || new Date().toISOString();
    const dataUltPc = String(payload?.dataUltPc || '').trim();
    const cicloMedio = Number(payload?.cicloMedio || 0);
    const tempo = Number(payload?.tempo || 0);
    const totalProd = Number(payload?.totalProd || 0);
    const tempoPrev = Number(payload?.tempoPrev || 0);
    const perda = Number(payload?.perda || 0);

    if (!op) {
      throw new Error('OP invalida para gravar apontamento automatico.');
    }

    return {
      success: true,
      ...sqlite.run(
        `
          INSERT INTO apontamento_automatico_ordem (
            op,
            quantidade,
            quant_par,
            data_hora,
            data_ultpc,
            ciclo_medio,
            tempo,
            total_prod,
            tempo_prev,
            perda
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(op) DO UPDATE SET
            quantidade = excluded.quantidade,
            quant_par = excluded.quant_par,
            data_hora = COALESCE(NULLIF(apontamento_automatico_ordem.data_hora, ''), excluded.data_hora),
            data_ultpc = excluded.data_ultpc,
            ciclo_medio = excluded.ciclo_medio,
            tempo = excluded.tempo,
            total_prod = excluded.total_prod,
            tempo_prev = excluded.tempo_prev,
            perda = excluded.perda
        `,
        [op, quantidade, quantPar, dataHora, dataUltPc, cicloMedio, tempo, totalProd, tempoPrev, perda],
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao gravar ordem automatica.',
    };
  }
});

ipcMain.handle('sqlite:apontamento-auto-ordem:adjust-quant-par', async (_event, payload = {}) => {
  try {
    const op = String(payload?.op || '').trim();
    const quantPar = Number(payload?.quantPar || 0);

    if (!op) {
      throw new Error('OP invalida para ajustar contagem automatica.');
    }

    return {
      success: true,
      row: adjustAutomaticOrderCount(op, quantPar),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao ajustar contagem automatica.',
    };
  }
});

app.whenReady().then(async () => {
  await createWindow();
  loadAutoExecutionSession();
  await restoreAutomaticExecutionSerial();
  await setupAutoUpdater();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
      await restoreAutomaticExecutionSerial();
      await setupAutoUpdater();
    }
  });
});

app.on('before-quit', (event) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  event.preventDefault();

  void (async () => {
    try {
      await stopSerialReading();
      sqlite.close();
    } finally {
      app.exit(0);
    }
  })();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }

  if (process.platform === 'darwin') {
    void stopSerialReading();
    sqlite.close();
  }
});
