import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';

export interface Parametro {
  id: number;
  parametro: string;
  valor: string;
  descricao: string;
  deleted: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {

  constructor(private sqlite: SqliteService) { }

  async getAll(): Promise<Parametro[]> {
    return this.sqlite.listParametros<Parametro>();
  }

  async getById(id: number): Promise<Parametro | null> {
    return this.sqlite.getParametroById<Parametro>(id);
  }

  async create(param: Omit<Parametro, 'id' | 'deleted' | 'created_at' | 'updated_at'>): Promise<number> {
    return this.sqlite.createParametro({
      parametro: param.parametro,
      valor: param.valor,
      descricao: param.descricao,
    });
  }

  async update(id: number, param: Partial<Parametro>): Promise<void> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('Parametro nao encontrado.');
    }

    await this.sqlite.updateParametro(id, {
      parametro: param.parametro ?? current.parametro,
      valor: param.valor ?? current.valor,
      descricao: param.descricao ?? current.descricao,
      deleted: param.deleted ?? current.deleted,
    });
  }

  async delete(id: number): Promise<void> {
    await this.sqlite.deleteParametro(id);
  }

  async getByParametro(parametro: string): Promise<Parametro | null> {
    return this.sqlite.getParametroByKey<Parametro>(parametro);
  }
}
