import { Injectable } from '@angular/core';

export interface SqliteParametroPayload {
  parametro: string;
  valor: string;
  descricao: string;
  deleted?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  private initialized = false;
  private initializationPromise?: Promise<void>;

  private get api() {
    const sqliteApi = window.electronAPI?.sqlite;
    if (!sqliteApi) {
      throw new Error('SQLite disponivel apenas no app desktop Electron.');
    }

    return sqliteApi;
  }

  async init(fileName: string = 'simplify.db'): Promise<void> {
    const result = await this.api.init({ fileName });
    if (!result.success) {
      throw new Error(result.error || 'Falha ao inicializar SQLite.');
    }

    this.initialized = true;
  }

  async ensureInit(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.init().finally(() => {
        this.initializationPromise = undefined;
      });
    }

    await this.initializationPromise;
  }

  async listParametros<T = any>(): Promise<T[]> {
    await this.ensureInit();
    const result = await this.api.parametros.list<T>();
    if (!result.success) {
      throw new Error(result.error || 'Falha ao listar parametros.');
    }

    return result.rows ?? [];
  }

  async getParametroById<T = any>(id: number): Promise<T | null> {
    await this.ensureInit();
    const result = await this.api.parametros.getById<T>(id);
    if (!result.success) {
      throw new Error(result.error || 'Falha ao consultar parametro.');
    }

    return result.row ?? null;
  }

  async getParametroByKey<T = any>(parametro: string): Promise<T | null> {
    await this.ensureInit();
    const result = await this.api.parametros.getByKey<T>(parametro);
    if (!result.success) {
      throw new Error(result.error || 'Falha ao consultar parametro por chave.');
    }

    return result.row ?? null;
  }

  async createParametro(payload: SqliteParametroPayload): Promise<number> {
    await this.ensureInit();
    const result = await this.api.parametros.create(payload);
    if (!result.success) {
      throw new Error(result.error || 'Falha ao criar parametro.');
    }

    return Number(result.lastInsertRowid || 0);
  }

  async updateParametro(id: number, payload: SqliteParametroPayload): Promise<void> {
    await this.ensureInit();
    const result = await this.api.parametros.update({ id, ...payload });
    if (!result.success) {
      throw new Error(result.error || 'Falha ao atualizar parametro.');
    }
  }

  async deleteParametro(id: number): Promise<void> {
    await this.ensureInit();
    const result = await this.api.parametros.delete(id);
    if (!result.success) {
      throw new Error(result.error || 'Falha ao excluir parametro.');
    }
  }
}
