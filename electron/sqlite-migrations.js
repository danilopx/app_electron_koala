function createParametroSchema(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS parametro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parametro TEXT NOT NULL UNIQUE,
      valor TEXT NOT NULL,
      descricao TEXT NOT NULL,
      deleted TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function rebuildParametroTable(sqlite, columnNames) {
  const deletedColumn = columnNames.includes('deleted') ? 'deleted' : (columnNames.includes('DELETED') ? 'DELETED' : "''");
  const createdAtColumn = columnNames.includes('created_at') ? 'created_at' : "datetime('now')";
  const updatedAtColumn = columnNames.includes('updated_at') ? 'updated_at' : "datetime('now')";

  sqlite.exec(`
    CREATE TABLE parametro_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parametro TEXT NOT NULL UNIQUE,
      valor TEXT NOT NULL,
      descricao TEXT NOT NULL,
      deleted TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO parametro_new (id, parametro, valor, descricao, deleted, created_at, updated_at)
    SELECT
      id,
      parametro,
      valor,
      descricao,
      deleted,
      created_at,
      updated_at
    FROM (
      SELECT
        id,
        trim(COALESCE(parametro, '')) AS parametro,
        COALESCE(valor, '') AS valor,
        COALESCE(descricao, '') AS descricao,
        COALESCE(${deletedColumn}, '') AS deleted,
        COALESCE(${createdAtColumn}, datetime('now')) AS created_at,
        COALESCE(${updatedAtColumn}, datetime('now')) AS updated_at,
        ROW_NUMBER() OVER (
          PARTITION BY trim(COALESCE(parametro, ''))
          ORDER BY
            CASE WHEN COALESCE(${deletedColumn}, '') = '' THEN 0 ELSE 1 END,
            COALESCE(${updatedAtColumn}, '') DESC,
            id DESC
        ) AS row_num
      FROM parametro
    ) deduplicated
    WHERE row_num = 1
      AND parametro <> '';

    DROP TABLE parametro;
    ALTER TABLE parametro_new RENAME TO parametro;
  `);
}

function ensureParametroSchema(sqlite) {
  const table = sqlite.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'parametro'");
  if (!table) {
    createParametroSchema(sqlite);
    return;
  }

  const parametroColumns = sqlite.all('PRAGMA table_info(parametro)');
  const columnNames = parametroColumns.map((column) => String(column.name || ''));
  const normalizedNames = columnNames.map((name) => name.toLowerCase());

  const expectedColumns = ['id', 'parametro', 'valor', 'descricao', 'deleted', 'created_at', 'updated_at'];
  const missingExpectedColumn = expectedColumns.some((column) => !normalizedNames.includes(column));
  const hasLegacyDeleted = columnNames.includes('DELETED');

  if (missingExpectedColumn || hasLegacyDeleted) {
    rebuildParametroTable(sqlite, columnNames);
  }
}

function ensureApontamentoAutomaticoContagemSchema(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS apontamento_automatico_contagem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa TEXT NOT NULL,
      filial TEXT NOT NULL,
      ordem TEXT NOT NULL,
      produto TEXT NOT NULL,
      porta TEXT NOT NULL,
      sinal TEXT NOT NULL,
      contador_ciclo INTEGER NOT NULL,
      raw_value TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_apontamento_auto_ordem
    ON apontamento_automatico_contagem (empresa, filial, ordem, created_at);
  `);
}

function ensureApontamentoAutomaticoOrdemSchema(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS apontamento_automatico_ordem (
      codigo INTEGER PRIMARY KEY AUTOINCREMENT,
      op TEXT NOT NULL UNIQUE,
      quantidade REAL NOT NULL DEFAULT 0,
      quant_par REAL NOT NULL DEFAULT 0,
      data_hora TEXT NOT NULL DEFAULT (datetime('now')),
      data_ultpc TEXT NOT NULL DEFAULT '',
      ciclo_medio REAL NOT NULL DEFAULT 0,
      tempo REAL NOT NULL DEFAULT 0,
      total_prod REAL NOT NULL DEFAULT 0,
      tempo_prev REAL NOT NULL DEFAULT 0,
      perda REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_apontamento_auto_ordem_op
    ON apontamento_automatico_ordem (op);
  `);
}

function ensureApontamentoAutomaticoExecucaoSchema(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS apontamento_automatico_execucao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      op TEXT NOT NULL UNIQUE,
      empresa TEXT NOT NULL,
      filial TEXT NOT NULL,
      produto TEXT NOT NULL,
      quantidade REAL NOT NULL DEFAULT 0,
      porta TEXT NOT NULL DEFAULT '',
      baudrate INTEGER NOT NULL DEFAULT 9600,
      status TEXT NOT NULL DEFAULT 'PAUSADA',
      ativa INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_apontamento_auto_execucao_ativa
    ON apontamento_automatico_execucao (ativa, status);
  `);
}

function ensureApontamentoAutomaticoApontamentoCicloSchema(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS apontamento_automatico_apontamento_ciclo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      op TEXT NOT NULL,
      empresa TEXT NOT NULL,
      filial TEXT NOT NULL,
      produto TEXT NOT NULL,
      quantidade REAL NOT NULL DEFAULT 0,
      tipo TEXT NOT NULL DEFAULT '',
      usuario TEXT NOT NULL DEFAULT '',
      inicio_em TEXT NOT NULL,
      fim_em TEXT NOT NULL,
      tempo_segundos REAL NOT NULL DEFAULT 0,
      tempo_minutos REAL NOT NULL DEFAULT 0,
      observacao TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_apontamento_auto_ciclo_op
    ON apontamento_automatico_apontamento_ciclo (op, created_at);
  `);
}

function runSqliteMigrations(sqlite) {
  sqlite.transaction(() => {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    sqlite.exec('DROP VIEW IF EXISTS v_parametro_ativos');

    ensureParametroSchema(sqlite);
    ensureApontamentoAutomaticoContagemSchema(sqlite);
    ensureApontamentoAutomaticoOrdemSchema(sqlite);
    ensureApontamentoAutomaticoExecucaoSchema(sqlite);
    ensureApontamentoAutomaticoApontamentoCicloSchema(sqlite);

    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_parametro_deleted ON parametro (deleted);

      DROP TRIGGER IF EXISTS trg_parametro_updated_at;
      CREATE TRIGGER trg_parametro_updated_at
      AFTER UPDATE ON parametro
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE parametro
        SET updated_at = datetime('now')
        WHERE id = OLD.id;
      END;

      UPDATE parametro
      SET created_at = datetime('now')
      WHERE created_at IS NULL OR trim(created_at) = '';

      UPDATE parametro
      SET updated_at = datetime('now')
      WHERE updated_at IS NULL OR trim(updated_at) = '';
    `);

    sqlite.exec(`
      CREATE VIEW v_parametro_ativos AS
      SELECT id, parametro, valor, descricao, deleted, created_at, updated_at
      FROM parametro
      WHERE deleted = '';
    `);

    sqlite.exec(`
      INSERT OR IGNORE INTO parametro (parametro, valor, descricao, deleted) VALUES
        ('PR_TNINIFIM1', '06:00-14:00', 'Horario do turno 1', ''),
        ('PR_TNINIFIM2', '14:00-22:00', 'Horario do turno 2', ''),
        ('PR_TNINIFIM3', '22:00-06:00', 'Horario do turno 3', ''),
        ('PR_PORTACOM', 'COM1', 'Porta para dispositivo de contagem', ''),
        ('PR_BAUDRATE', '9600', 'Baud rate da porta serial', ''),
        ('PR_MENU_APAUTO', 'true', 'Exibe o menu de apontamento automatico', ''),
        ('PR_APFORAMULT', 'false', 'Permite apontamento fora do multiplo', '');
    `);

    sqlite.run(
      `
        UPDATE parametro
        SET parametro = ?, updated_at = datetime('now')
        WHERE parametro = ?
      `,
      ['PR_PORTACOM', 'porta_com'],
    );

    sqlite.run(
      `
        UPDATE parametro
        SET parametro = ?, updated_at = datetime('now')
        WHERE parametro = ?
      `,
      ['PR_TNINIFIM1', 'horario_turno_1'],
    );

    sqlite.run(
      `
        UPDATE parametro
        SET parametro = ?, updated_at = datetime('now')
        WHERE parametro = ?
      `,
      ['PR_TNINIFIM2', 'horario_turno_2'],
    );

    sqlite.run(
      `
        UPDATE parametro
        SET parametro = ?, updated_at = datetime('now')
        WHERE parametro = ?
      `,
      ['PR_TNINIFIM3', 'horario_turno_3'],
    );

    sqlite.run(
      `
        DELETE FROM parametro
        WHERE parametro = ?
      `,
      ['quantidade_caixa_padrao'],
    );

    sqlite.run(
      `
        DELETE FROM parametro
        WHERE parametro = ?
      `,
      ['PR_SETOR_PROCESSO'],
    );

    sqlite.run(
      `
        INSERT INTO app_meta (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      ['schema_version', '4'],
    );
  });
}

module.exports = {
  runSqliteMigrations,
};
