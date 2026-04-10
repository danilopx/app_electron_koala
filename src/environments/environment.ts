import {
  DEFAULT_SYSTEM_CONFIG,
  OperationalContextStore,
  RuntimeConfigStore,
} from '../app/config/runtime-config';

export const environment = {
  get production(): boolean {
    return RuntimeConfigStore.getBoolean('production', DEFAULT_SYSTEM_CONFIG.production);
  },
  get apiRoot(): string {
    return RuntimeConfigStore.getString('apiRoot');
  },
  get admUser(): string {
    return RuntimeConfigStore.getString('admUser');
  },
  get pass(): string {
    return RuntimeConfigStore.getString('pass');
  },
  get grupo(): string {
    return OperationalContextStore.getString('grupo') || RuntimeConfigStore.getString('grupo');
  },
  get filial(): string {
    return OperationalContextStore.getString('filial') || RuntimeConfigStore.getString('filial');
  },
  get tenantId(): string {
    return OperationalContextStore.getString('tenantId') || [this.grupo, this.filial].filter(Boolean).join(',');
  },
  get grupofilial(): string {
    return OperationalContextStore.getString('grupofilial') || [this.grupo, this.filial].filter(Boolean).join('/');
  },
  get cnpj(): string {
    return OperationalContextStore.getString('cnpj');
  },
  get codigoEquipamento(): string {
    return RuntimeConfigStore.getString('codigoEquipamento');
  },
  get baudRate(): string {
    return RuntimeConfigStore.getString('baudRate');
  },
  get setor(): string {
    return RuntimeConfigStore.getString('setor');
  },
  get processo(): string {
    return RuntimeConfigStore.getString('processo');
  },
  get apManual(): boolean {
    return RuntimeConfigStore.getBoolean('apManual', DEFAULT_SYSTEM_CONFIG.apManual);
  },
  get apAuto(): boolean {
    return RuntimeConfigStore.getBoolean('apAuto', DEFAULT_SYSTEM_CONFIG.apAuto);
  },
  get apAutoMenu(): boolean {
    return RuntimeConfigStore.getBoolean('apAutoMenu', DEFAULT_SYSTEM_CONFIG.apAutoMenu);
  },
  get apForaMultiplo(): boolean {
    return RuntimeConfigStore.getBoolean('apForaMultiplo', DEFAULT_SYSTEM_CONFIG.apForaMultiplo);
  },
};
