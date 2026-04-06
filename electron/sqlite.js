const path = require('path');

let DatabaseSync;

try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (_error) {
  DatabaseSync = null;
}

class ElectronSqlite {
  constructor() {
    this.db = null;
    this.dbPath = '';
  }

  init(baseDir, fileName = 'simplify.db') {
    if (!DatabaseSync) {
      throw new Error('SQLite nativo indisponivel neste runtime do Electron/Node.');
    }

    const resolvedFileName = this.resolveFileName(fileName);
    const nextPath = path.join(baseDir, resolvedFileName);

    if (this.db) {
      if (this.dbPath !== nextPath) {
        throw new Error(`SQLite ja inicializado em outro arquivo: ${this.dbPath}`);
      }

      return { path: this.dbPath };
    }

    this.dbPath = nextPath;
    this.db = new DatabaseSync(this.dbPath);
    this.configureConnection();

    return { path: this.dbPath };
  }

  ensureDb() {
    if (!this.db) {
      throw new Error('Banco SQLite nao inicializado.');
    }

    return this.db;
  }

  run(sql, params) {
    const statement = this.ensureDb().prepare(this.normalizeSql(sql));
    const result = this.executeStatement(statement, params, 'run');

    return {
      changes: Number(result?.changes ?? 0),
      lastInsertRowid: String(result?.lastInsertRowid ?? ''),
    };
  }

  get(sql, params) {
    const statement = this.ensureDb().prepare(this.normalizeSql(sql));
    return this.executeStatement(statement, params, 'get');
  }

  all(sql, params) {
    const statement = this.ensureDb().prepare(this.normalizeSql(sql));
    return this.executeStatement(statement, params, 'all');
  }

  exec(sql) {
    this.ensureDb().exec(this.normalizeSql(sql));
    return { success: true };
  }

  transaction(callback) {
    const db = this.ensureDb();
    db.exec('BEGIN IMMEDIATE');

    try {
      const result = callback();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPath = '';
    }

    return { success: true };
  }

  configureConnection() {
    const db = this.ensureDb();
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
    `);
  }

  normalizeSql(sql) {
    const normalized = String(sql || '').trim();
    if (!normalized) {
      throw new Error('SQL nao informado.');
    }

    return normalized;
  }

  executeStatement(statement, params, method) {
    if (params === undefined || params === null) {
      return statement[method]();
    }

    if (Array.isArray(params)) {
      return statement[method](...params);
    }

    if (typeof params === 'object') {
      return statement[method](params);
    }

    return statement[method](params);
  }

  resolveFileName(fileName) {
    const sanitized = path.basename(String(fileName || 'simplify.db').trim() || 'simplify.db');
    return sanitized.toLowerCase().endsWith('.db') ? sanitized : `${sanitized}.db`;
  }
}

module.exports = new ElectronSqlite();
