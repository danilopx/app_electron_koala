export interface SystemConfigValues {
  production: boolean;
  apiRoot: string;
  admUser: string;
  pass: string;
  grupo: string;
  filial: string;
  codigoEquipamento: string;
  baudRate: string;
  setor: string;
  processo: string;
  apManual: boolean;
  apAuto: boolean;
  apForaMultiplo: boolean;
}

export interface OperationalContextValues {
  grupo: string;
  filial: string;
  tenantId: string;
  grupofilial: string;
  cnpj: string;
}

export interface SystemConfigParamDefinition {
  parametro: string;
  field: keyof SystemConfigValues;
  descricao: string;
}

export interface OperationalContextParamDefinition {
  parametro: string;
  field: keyof OperationalContextValues;
  descricao: string;
}

export const REQUIRED_SYSTEM_CONFIG_PARAMS: SystemConfigParamDefinition[] = [
  { parametro: 'PR_AMBIENTE', field: 'production', descricao: 'Ambiente de producao' },
  { parametro: 'PR_APIPROTHEUS', field: 'apiRoot', descricao: 'URL base da API Protheus' },
  { parametro: 'PR_USER', field: 'admUser', descricao: 'Usuario administrador de integracao' },
  { parametro: 'PR_SENHA', field: 'pass', descricao: 'Senha do usuario administrador de integracao' },
  { parametro: 'PR_GRUPO', field: 'grupo', descricao: 'Grupo padrao do sistema' },
  { parametro: 'PR_FILIAL', field: 'filial', descricao: 'Filial padrao do sistema' },
  { parametro: 'PR_CODIGO_EQUIPAMENTO', field: 'codigoEquipamento', descricao: 'Codigo do equipamento' },
];

export const OPTIONAL_SYSTEM_CONFIG_PARAMS: SystemConfigParamDefinition[] = [
  { parametro: 'PR_BAUDRATE', field: 'baudRate', descricao: 'Baud rate da porta serial' },
  { parametro: 'PR_SETOR', field: 'setor', descricao: 'Setor' },
  { parametro: 'PR_PROCESSO', field: 'processo', descricao: 'Processo' },
  { parametro: 'PR_APMANUAL', field: 'apManual', descricao: 'Habilita a rotina de apontamento manual' },
  { parametro: 'PR_APAUTO', field: 'apAuto', descricao: 'Habilita a rotina de apontamento automatico' },
  { parametro: 'PR_APFORAMULT', field: 'apForaMultiplo', descricao: 'Permite apontamento fora do multiplo' },
];

export const DEFAULT_SYSTEM_CONFIG: SystemConfigValues = {
  production: true,
  apiRoot: 'http://docfy.koalaenergy.com.br:8085/rest/',
  admUser: 'admin',
  pass: '',
  grupo: '03',
  filial: '01',
  codigoEquipamento: '',
  baudRate: '9600',
  setor: '',
  processo: '',
  apManual: true,
  apAuto: true,
  apForaMultiplo: false,
};

export const OPERATIONAL_CONTEXT_PARAMS: OperationalContextParamDefinition[] = [
  { parametro: 'CTX_GRUPO', field: 'grupo', descricao: 'Grupo operacional atual' },
  { parametro: 'CTX_FILIAL', field: 'filial', descricao: 'Filial operacional atual' },
  { parametro: 'CTX_TENANTID', field: 'tenantId', descricao: 'Tenant atual da sessao' },
  { parametro: 'CTX_GRUPOFILIAL', field: 'grupofilial', descricao: 'Descricao atual de grupo e filial' },
  { parametro: 'CTX_CNPJ', field: 'cnpj', descricao: 'CNPJ da filial atual' },
];

export class RuntimeConfigStore {
  private static values: Partial<SystemConfigValues> = {};

  static reset(): void {
    this.values = {};
  }

  static load(values: Partial<SystemConfigValues>): void {
    this.values = {
      ...this.values,
      ...values,
    };
  }

  static getString(key: Exclude<keyof SystemConfigValues, 'production' | 'apManual' | 'apAuto' | 'apForaMultiplo'>): string {
    const value = this.values[key];
    return typeof value === 'string' ? value : '';
  }

  static getBoolean(key: 'production' | 'apManual' | 'apAuto' | 'apForaMultiplo', fallback = false): boolean {
    const value = this.values[key];
    return typeof value === 'boolean' ? value : fallback;
  }

  static getAll(): Partial<SystemConfigValues> {
    return { ...this.values };
  }
}

export class OperationalContextStore {
  private static values: Partial<OperationalContextValues> = {};

  static reset(): void {
    this.values = {};
  }

  static load(values: Partial<OperationalContextValues>): void {
    this.values = {
      ...this.values,
      ...values,
    };
  }

  static getString(key: keyof OperationalContextValues): string {
    const value = this.values[key];
    return typeof value === 'string' ? value : '';
  }

  static getAll(): Partial<OperationalContextValues> {
    return { ...this.values };
  }
}

export function mapParametrosToSystemConfig(parametros: Array<{ parametro: string; valor: string }>): Partial<SystemConfigValues> {
  const config: Partial<SystemConfigValues> = {};

  for (const definition of [...REQUIRED_SYSTEM_CONFIG_PARAMS, ...OPTIONAL_SYSTEM_CONFIG_PARAMS]) {
    const item = parametros.find((parametro) => parametro.parametro === definition.parametro);
    if (!item) {
      continue;
    }

    if (
      definition.field === 'production'
      || definition.field === 'apManual'
      || definition.field === 'apAuto'
      || definition.field === 'apForaMultiplo'
    ) {
      config[definition.field] = String(item.valor).trim().toLowerCase() === 'true' as any;
      continue;
    }

    config[definition.field] = String(item.valor ?? '').trim() as any;
  }

  return config;
}

export function mapParametrosToOperationalContext(
  parametros: Array<{ parametro: string; valor: string }>
): Partial<OperationalContextValues> {
  const context: Partial<OperationalContextValues> = {};

  for (const definition of OPERATIONAL_CONTEXT_PARAMS) {
    const item = parametros.find((parametro) => parametro.parametro === definition.parametro);
    if (!item) {
      continue;
    }

    context[definition.field] = String(item.valor ?? '').trim() as never;
  }

  return context;
}
