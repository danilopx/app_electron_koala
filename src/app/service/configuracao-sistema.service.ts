import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  DEFAULT_SYSTEM_CONFIG,
  mapParametrosToOperationalContext,
  mapParametrosToSystemConfig,
  OPERATIONAL_CONTEXT_PARAMS,
  OperationalContextStore,
  OperationalContextValues,
  OPTIONAL_SYSTEM_CONFIG_PARAMS,
  REQUIRED_SYSTEM_CONFIG_PARAMS,
  RuntimeConfigStore,
  SystemConfigValues,
} from '../config/runtime-config';
import { ParametrosService } from './parametros.service';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracaoSistemaService {
  private initialized = false;
  private readonly runtimeChangesSubject = new BehaviorSubject<SystemConfigValues>(DEFAULT_SYSTEM_CONFIG);
  readonly runtimeChanges$ = this.runtimeChangesSubject.asObservable();

  constructor(
    private parametrosService: ParametrosService,
    private httpClient: HttpClient,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      RuntimeConfigStore.reset();
      OperationalContextStore.reset();
      await this.ensureDefaultSystemParams();
      await this.ensureDefaultOperationalContext();
    } catch {
      RuntimeConfigStore.reset();
      OperationalContextStore.reset();
    } finally {
      this.initialized = true;
    }
  }

  isConfigured(): boolean {
    return this.getMissingRequiredParams().length === 0;
  }

  getCurrentValues(): SystemConfigValues {
    const current = RuntimeConfigStore.getAll();
    const setor = this.getStringOrDefault(current.setor, DEFAULT_SYSTEM_CONFIG.setor);
    const processo = this.getStringOrDefault(current.processo, DEFAULT_SYSTEM_CONFIG.processo);

    return {
      production: current.production ?? DEFAULT_SYSTEM_CONFIG.production,
      apiRoot: this.getStringOrDefault(current.apiRoot, DEFAULT_SYSTEM_CONFIG.apiRoot),
      admUser: this.getStringOrDefault(current.admUser, DEFAULT_SYSTEM_CONFIG.admUser),
      pass: current.pass ?? DEFAULT_SYSTEM_CONFIG.pass,
      grupo: this.getStringOrDefault(current.grupo, DEFAULT_SYSTEM_CONFIG.grupo),
      filial: this.getStringOrDefault(current.filial, DEFAULT_SYSTEM_CONFIG.filial),
      codigoEquipamento: this.getStringOrDefault(current.codigoEquipamento, DEFAULT_SYSTEM_CONFIG.codigoEquipamento),
      baudRate: this.getStringOrDefault(current.baudRate, DEFAULT_SYSTEM_CONFIG.baudRate),
      setor,
      processo,
      apManual: current.apManual ?? DEFAULT_SYSTEM_CONFIG.apManual,
      apAuto: current.apAuto ?? DEFAULT_SYSTEM_CONFIG.apAuto,
      apAutoMenu: current.apAutoMenu ?? DEFAULT_SYSTEM_CONFIG.apAutoMenu,
      apForaMultiplo: current.apForaMultiplo ?? DEFAULT_SYSTEM_CONFIG.apForaMultiplo,
    };
  }

  getFormDefaults(): SystemConfigValues {
    return {
      ...DEFAULT_SYSTEM_CONFIG,
      ...this.getCurrentValues(),
      pass: '',
    };
  }

  applySystemParameterValue(parametro: string, valor: string): void {
    const normalizedKey = String(parametro || '').trim().toUpperCase();
    if (!normalizedKey) {
      return;
    }

    const current = this.getCurrentValues();

    switch (normalizedKey) {
      case 'PR_AMBIENTE':
        RuntimeConfigStore.load({ production: String(valor).trim().toLowerCase() === 'true' });
        break;
      case 'PR_APIPROTHEUS':
        RuntimeConfigStore.load({ apiRoot: String(valor ?? '').trim() });
        break;
      case 'PR_USER':
        RuntimeConfigStore.load({ admUser: String(valor ?? '').trim() });
        break;
      case 'PR_SENHA':
        RuntimeConfigStore.load({ pass: String(valor ?? '').trim() });
        break;
      case 'PR_GRUPO':
        RuntimeConfigStore.load({ grupo: String(valor ?? '').trim() });
        break;
      case 'PR_FILIAL':
        RuntimeConfigStore.load({ filial: String(valor ?? '').trim() });
        break;
      case 'PR_CODIGO_EQUIPAMENTO':
        RuntimeConfigStore.load({ codigoEquipamento: String(valor ?? '').trim() });
        break;
      case 'PR_BAUDRATE':
        RuntimeConfigStore.load({ baudRate: String(valor ?? '').trim() });
        break;
      case 'PR_SETOR':
        RuntimeConfigStore.load({ setor: String(valor ?? '').trim() });
        break;
      case 'PR_PROCESSO':
        RuntimeConfigStore.load({ processo: String(valor ?? '').trim() });
        break;
      case 'PR_APMANUAL':
        RuntimeConfigStore.load({ apManual: String(valor).trim().toLowerCase() === 'true' });
        break;
      case 'PR_APAUTO':
        RuntimeConfigStore.load({ apAuto: String(valor).trim().toLowerCase() === 'true' });
        break;
      case 'PR_MENU_APAUTO':
        RuntimeConfigStore.load({ apAutoMenu: String(valor).trim().toLowerCase() === 'true' });
        break;
      case 'PR_APFORAMULT':
        RuntimeConfigStore.load({ apForaMultiplo: String(valor).trim().toLowerCase() === 'true' });
        break;
      default:
        return;
    }

    this.runtimeChangesSubject.next(this.getCurrentValues());
  }

  getOperationalContextValues(): OperationalContextValues {
    const current = OperationalContextStore.getAll();
    const grupo = String(current.grupo ?? '').trim();
    const filial = String(current.filial ?? '').trim();
    const tenantId = String(current.tenantId ?? '').trim();
    const grupofilial = String(current.grupofilial ?? '').trim();

    return {
      grupo,
      filial,
      tenantId,
      grupofilial,
      cnpj: String(current.cnpj ?? '').trim(),
    };
  }

  hasOperationalContextSelection(): boolean {
    const current = this.getOperationalContextValues();
    return !!(current.grupo && current.filial && current.grupofilial);
  }

  getMissingRequiredParams(): string[] {
    const current = this.getCurrentValues();

    return REQUIRED_SYSTEM_CONFIG_PARAMS
      .filter((definition) => {
        const value = current[definition.field];
        if (definition.field === 'production') {
          return value !== true;
        }

        return !String(value ?? '').trim();
      })
      .map((definition) => definition.parametro);
  }

  async saveInitialConfig(values: SystemConfigValues): Promise<void> {
    const payloadByField: Record<keyof SystemConfigValues, string> = {
      production: values.production ? 'true' : 'false',
      apiRoot: values.apiRoot.trim(),
      admUser: values.admUser.trim(),
      pass: values.pass.trim(),
      grupo: values.grupo.trim(),
      filial: values.filial.trim(),
      codigoEquipamento: values.codigoEquipamento.trim(),
      baudRate: values.baudRate.trim(),
      setor: values.setor.trim(),
      processo: values.processo.trim(),
      apManual: values.apManual ? 'true' : 'false',
      apAuto: values.apAuto ? 'true' : 'false',
      apAutoMenu: values.apAutoMenu ? 'true' : 'false',
      apForaMultiplo: values.apForaMultiplo ? 'true' : 'false',
    };

    for (const definition of [...REQUIRED_SYSTEM_CONFIG_PARAMS, ...OPTIONAL_SYSTEM_CONFIG_PARAMS]) {
      const valor = payloadByField[definition.field];
      const existente = await this.parametrosService.getByParametro(definition.parametro);

      if (existente) {
        await this.parametrosService.update(existente.id, {
          parametro: definition.parametro,
          valor,
          descricao: definition.descricao,
          deleted: '',
        });
        continue;
      }

      await this.parametrosService.create({
        parametro: definition.parametro,
        valor,
        descricao: definition.descricao,
      });
    }

    RuntimeConfigStore.reset();
    RuntimeConfigStore.load(values);
    this.runtimeChangesSubject.next(this.getCurrentValues());
    await this.ensureDefaultOperationalContext();
  }

  async updateOperationalContext(values: Partial<OperationalContextValues>): Promise<void> {
    const current = this.getOperationalContextValues();
    const nextValues: OperationalContextValues = {
      grupo: String(values.grupo ?? current.grupo).trim(),
      filial: String(values.filial ?? current.filial).trim(),
      tenantId: String(values.tenantId ?? current.tenantId).trim(),
      grupofilial: String(values.grupofilial ?? current.grupofilial).trim(),
      cnpj: String(values.cnpj ?? current.cnpj).trim(),
    };

    if (!nextValues.tenantId && nextValues.grupo && nextValues.filial) {
      nextValues.tenantId = `${nextValues.grupo},${nextValues.filial}`;
    }

    if (!nextValues.grupofilial && nextValues.grupo && nextValues.filial) {
      nextValues.grupofilial = `${nextValues.grupo}/${nextValues.filial}`;
    }

    for (const definition of OPERATIONAL_CONTEXT_PARAMS) {
      const valor = String(nextValues[definition.field] ?? '').trim();
      const existente = await this.parametrosService.getByParametro(definition.parametro);

      if (existente) {
        await this.parametrosService.update(existente.id, {
          parametro: definition.parametro,
          valor,
          descricao: definition.descricao,
          deleted: '',
        });
        continue;
      }

      await this.parametrosService.create({
        parametro: definition.parametro,
        valor,
        descricao: definition.descricao,
      });
    }

    OperationalContextStore.reset();
    OperationalContextStore.load(nextValues);
  }

  async clearOperationalContextSelection(): Promise<void> {
    await this.updateOperationalContext({
      grupo: '',
      filial: '',
      tenantId: '',
      grupofilial: '',
      cnpj: '',
    });
  }

  async validateInitialConfig(values: SystemConfigValues): Promise<void> {
    const baseUrl = this.normalizeApiRoot(values.apiRoot);
    const urlAPI = `${baseUrl}api/oauth2/v1/token`;
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', values.admUser.trim())
      .set('password', values.pass.trim());

    const response = await firstValueFrom(
      this.httpClient.post<any>(urlAPI, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-PO-No-Error': 'true',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type',
          'Referrer-Policy': 'no-referrer-when-downgrade',
        },
      })
    );

    if (!response?.access_token) {
      throw new Error('Configuracao invalida para autenticacao no Protheus.');
    }
  }

  async ensureDefaultSystemParams(): Promise<void> {
    const defaults = [...OPTIONAL_SYSTEM_CONFIG_PARAMS].map((definition) => ({
      parametro: definition.parametro,
      descricao: definition.descricao,
      valor: this.getDefaultParamValue(definition.field),
    }));

    for (const item of defaults) {
      const existente = await this.parametrosService.getByParametro(item.parametro);
      if (existente) {
        continue;
      }

      await this.parametrosService.create(item);
    }

    RuntimeConfigStore.load(mapParametrosToSystemConfig(await this.parametrosService.getAll()));
  }

  async ensureDefaultOperationalContext(): Promise<void> {
    const defaults: OperationalContextValues = {
      grupo: '',
      filial: '',
      tenantId: '',
      grupofilial: '',
      cnpj: '',
    };

    for (const definition of OPERATIONAL_CONTEXT_PARAMS) {
      const existente = await this.parametrosService.getByParametro(definition.parametro);
      const valor = String(defaults[definition.field] ?? '').trim();

      if (existente) {
        if (!String(existente.valor ?? '').trim()) {
          await this.parametrosService.update(existente.id, {
            valor,
            descricao: definition.descricao,
            deleted: '',
          });
        }
        continue;
      }

      await this.parametrosService.create({
        parametro: definition.parametro,
        valor,
        descricao: definition.descricao,
      });
    }

    OperationalContextStore.load(
      mapParametrosToOperationalContext(await this.parametrosService.getAll())
    );
  }

  private getStringOrDefault(value: string | undefined, fallback: string): string {
    const normalized = String(value ?? '').trim();
    return normalized || fallback;
  }

  private normalizeApiRoot(value: string): string {
    const normalized = String(value || '').trim();
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }

  private getDefaultParamValue(field: keyof SystemConfigValues): string {
    const value = DEFAULT_SYSTEM_CONFIG[field];
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    return String(value ?? '').trim();
  }
}
