import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  PoDialogService,
  PoDynamicFormField,
  PoModalComponent,
  PoNotificationService,
  PoToolbarAction,
  PoToolbarProfile,
} from '@po-ui/ng-components';
import { LoginService } from '../../service/login.service';
import { Router } from '@angular/router';
//import { GoogleMapsModule } from '@angular/google-maps'
import { NgForm } from '@angular/forms';
import { SessionStorageService } from './service/session-storage.service';
import { Subject, firstValueFrom, from, of } from 'rxjs';
import { Filial, Grupo } from './enums/filiais';
import { EmpresaService } from '../../service/empresa.service';
import { ProtheusService } from '../../service/protheus.service';
import { ConfiguracaoSistemaService } from '../../service/configuracao-sistema.service';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OperationalContextStore } from '../../config/runtime-config';

@Component({
  selector: 'app-header',
  templateUrl: './header.conponent.html',
  styleUrls: ['./header.component.css'],
  providers: [PoNotificationService],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(PoModalComponent, { static: false }) poModal!: PoModalComponent;
  private unsubscribe = new Subject<void>();
  private isViewReady = false;
  private pendingOpenDialog = false;

  constructor(
    private empresaService: EmpresaService,
    private protheusService: ProtheusService,
    private configuracaoSistemaService: ConfiguracaoSistemaService,
    private sessionStorageService: SessionStorageService,
    public loginService: LoginService,
    private router: Router,
    private poDialog: PoDialogService,
    private poNotification: PoNotificationService,
  ) {}
  formValue = {};
  titleDetailsModal = 'Selecione Grupo/Filial ?';
  title = '';
  PedidoForm?: NgForm;
  profile!: PoToolbarProfile;
  fields!: Array<PoDynamicFormField>;
  gurpoAcesso = '';
  menuOpen = false;
  brandSubtitle = 'Koala';
  brandTitle = 'Koala Energy';
  userDisplay = '';
  groupDisplay = '';
  filialDisplay = '';
  groupCodeDisplay = '';
  filialCodeDisplay = '';
  groupAndFilialCodeDisplay = '';
  papelDisplay = '';
  codigoEquipamentoDisplay = '';
  setorDisplay = '';
  processoDisplay = '';
  isLoadingFiliais = false;
  private hasLoadedFiliais = false;

  ngOnInit() {
    this.sessionStorageService.sessionStorageReady$.subscribe((ready) => {
      if (ready) {
        this.checkSessionStorage();
      }
    });

    if (this.hasAccessToken()) {
      this.checkSessionStorage();
    }
  }

  ngAfterViewInit() {
    this.isViewReady = true;
    if (this.pendingOpenDialog) {
      this.pendingOpenDialog = false;
      this.openDialog();
    }
  }

  private checkSessionStorage() {
    const grupoLocal = OperationalContextStore.getString('grupo');
    const filialLocal = OperationalContextStore.getString('filial');
    const grupoFilialRaw = OperationalContextStore.getString('grupofilial');
    const parsed = this.parseGrupoFilial(grupoFilialRaw);
    const filialDesc = parsed?.filialLabel || this.getFilial(grupoLocal, filialLocal) || '';
    const grupoDesc = parsed?.grupoLabel || this.getGrupo(grupoLocal) || '';
    const _usuario = sessionStorage.getItem('username') ?? '';
    const papelCodigo = (sessionStorage.getItem('papel_codigo') ?? '').trim();
    const papel = (sessionStorage.getItem('papel') ?? '').trim();
    this.gurpoAcesso = sessionStorage.getItem('grupoAcesso') ?? '';
    this.profile = this.getProfile(grupoLocal, _usuario.toString().toUpperCase(), filialDesc.toString());
    if (this.configuracaoSistemaService.hasOperationalContextSelection()) {
      this.title = `Grupo: ${grupoDesc} | Filial: ${filialDesc}`;
      this.userDisplay = _usuario.toString().toUpperCase();
      this.groupCodeDisplay = grupoLocal;
      this.filialCodeDisplay = filialLocal;
      this.groupAndFilialCodeDisplay = [grupoLocal, filialLocal].filter(Boolean).join('/');
      this.groupDisplay = grupoDesc ? `Grupo: ${grupoDesc}` : 'Grupo nao identificado';
      this.filialDisplay = filialDesc ? `Filial: ${filialDesc}` : 'Filial nao identificada';
      this.papelDisplay = this.buildPapelDisplay(papelCodigo, papel);
      this.codigoEquipamentoDisplay = environment.codigoEquipamento || '';
      this.setorDisplay = environment.setor || '';
      this.processoDisplay = environment.processo || '';
    } else {
      this.groupCodeDisplay = '';
      this.filialCodeDisplay = '';
      this.groupAndFilialCodeDisplay = '';
      if (this.isViewReady) {
        this.openDialog();
      } else {
        this.pendingOpenDialog = true;
      }
    }
  }

  private buildPapelDisplay(papelCodigo: string, papel: string): string {
    if (papelCodigo && papel) {
      return `Papel: ${papelCodigo} - ${papel}`;
    }
    if (papelCodigo) {
      return `Papel: ${papelCodigo}`;
    }
    if (papel) {
      return `Papel: ${papel}`;
    }
    return '';
  }

  private parseGrupoFilial(raw: string): { grupoLabel: string; filialLabel: string } | null {
    const value = (raw || '').trim();
    if (!value) return null;
    const [grupoPart, rest] = value.split('/');
    if (!grupoPart || !rest) return null;
    const [filialCode, filialName] = rest.split('-', 2);
    const grupoLabel = grupoPart.trim();
    const filialLabel = filialName ? filialName.trim() : filialCode.trim();
    if (!grupoLabel || !filialLabel) return null;
    return { grupoLabel, filialLabel };
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /*  getCamposForm(grupos: string): Array<PoDynamicFormField> {
  
  
          if (grupos.length >= 3) {
  
              return [{ property: 'grupo', gridColumns: 12, gridSmColumns: 12, options: ['01-Arotubi Componentes/Sistemas', '02-Eletropolar/Austral'] }]
  
          } else if (grupos.length == 2) {
  
              if (this.gurpos == '01') {
                  return [{ property: 'grupo', gridColumns: 12, gridSmColumns: 12, options: ['01-Arotubi Componentes/Sistemas'] }]
              } else {
  
                  return [{ property: 'grupo', gridColumns: 12, gridSmColumns: 12, options: ['02-Eletropolar/Austral'] }]
  
              }
  
          } else {
  
              return []
  
          }
      }*/

  private loadCamposForm(): void {
    if (!this.hasAccessToken()) {
      this.fields = [];
      return;
    }
    if (this.isLoadingFiliais || this.hasLoadedFiliais) {
      return;
    }
    this.isLoadingFiliais = true;
    const tenantIds = this.getTenantCandidates();
    if (!tenantIds.length) {
      this.fields = [];
      this.isLoadingFiliais = false;
      return;
    }

    const headerTenantId = this.getHeaderTenantId();
    from(tenantIds)
      .pipe(
        concatMap((tenantId) =>
          this.protheusService.getFiliaisByTenant(
            tenantId,
            this.empresaFromTenantId(tenantId),
            headerTenantId,
          ).pipe(
            map((response) => ({ tenantId, response })),
            catchError(() => of({ tenantId, response: null })),
          ),
        ),
        toArray(),
      )
      .subscribe((results) => {
        const options = this.buildFilialOptionsFromResponses(
          results.map((r) => r?.response),
          this.getAllowedTenantIdsOnly(),
        );
        this.fields = this.buildCamposForm(options);
        this.hasLoadedFiliais = true;
        this.isLoadingFiliais = false;
      });
  }

  private buildCamposForm(options: string[]): Array<PoDynamicFormField> {
    if (!options.length) {
      return [];
    }
    return [
      {
        property: 'grupo_filial',
        gridColumns: 12,
        gridSmColumns: 12,
        options,
      },
    ];
  }

  private hasAccessToken(): boolean {
    return !!(sessionStorage.getItem('access_token') || localStorage.getItem('access_token'));
  }

  private getTenantCandidates(): string[] {
    const candidates: string[] = [];

    const storedAllowed = sessionStorage.getItem('allowedTenants');
    if (storedAllowed) {
      try {
        const list = JSON.parse(storedAllowed);
        if (Array.isArray(list)) {
          list.forEach((t) => {
            if (typeof t === 'string') candidates.push(t);
          });
        }
      } catch {
        // ignore parse errors
      }
    }

    const infoRaw = sessionStorage.getItem('infoUser');
    if (infoRaw) {
      try {
        const info = JSON.parse(infoRaw);
        const extracted = this.extractAllowedTenantsFromInfoUser(info);
        extracted.forEach((t) => candidates.push(t));
      } catch {
        // ignore parse errors
      }
    }

    const storedTenant = environment.tenantId;
    if (storedTenant) candidates.push(storedTenant);
    const grupo = environment.grupo;
    const filial = environment.filial;
    if (grupo && filial) candidates.push(`${grupo},${filial}`);
    return this.uniqueTenantIds(candidates);
  }

  private getHeaderTenantId(): string {
    const selectedTenant = environment.tenantId;
    if (selectedTenant && selectedTenant.trim()) {
      return selectedTenant.trim();
    }
    return '';
  }

  private getAllowedTenantIdsOnly(): string[] {
    const allowed: string[] = [];
    const storedAllowed = sessionStorage.getItem('allowedTenants');
    if (storedAllowed) {
      try {
        const list = JSON.parse(storedAllowed);
        if (Array.isArray(list)) {
          list.forEach((t) => {
            if (typeof t === 'string') allowed.push(t);
          });
        }
      } catch {
        // ignore parse errors
      }
    }
    return this.uniqueTenantIds(allowed);
  }

  private extractAllowedTenantsFromInfoUser(decoded: any): string[] {
    if (!decoded || typeof decoded !== 'object') return [];
    const root = decoded as Record<string, any>;

    const result: string[] = [];
    const seen = new Set<string>();

    const addTenant = (raw?: string) => {
      const value = (raw ?? '').trim();
      if (!value) return;
      const normalized = this.normalizeTenantId(value);
      if (!normalized) return;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    };

    const addFromMap = (map: Record<string, any>) => {
      const pick = (keys: string[]) => {
        for (const k of keys) {
          if (k in map) return map[k];
        }
        return undefined;
      };

      const tenant = pick(['tenantId', 'tenantid', 'tenant', 'codigo', 'Codigo']);
      if (typeof tenant === 'string') {
        addTenant(tenant);
        return;
      }

      const empresa = pick(['empresa', 'Empresa', 'CodigoEmpresa', 'codEmpresa']);
      const filial = pick(['filial', 'Filial', 'CodigoFilial', 'codFilial']);
      if (typeof empresa === 'string' && typeof filial === 'string') {
        addTenant(`${empresa.trim()},${filial.trim()}`);
        return;
      }

      const grupo = pick(['grupo', 'Grupo', 'USR_GRPEMP', 'USR_GRUPO', 'CodigoGrupo']);
      const filialCode = pick(['filial', 'Filial', 'USR_FILIAL', 'CodigoFilial', 'codFilial']);
      if (typeof grupo === 'string' && typeof filialCode === 'string') {
        addTenant(`${grupo.trim()},${filialCode.trim()}`);
        return;
      }

      const grupoOnly = pick(['grupo', 'Grupo', 'CodigoGrupo']);
      const entradas = pick(['entradas', 'Entradas']);
      if (typeof grupoOnly === 'string' && Array.isArray(entradas)) {
        entradas.forEach((e) => {
          if (typeof e === 'string' && e.trim()) {
            addTenant(`${grupoOnly.trim()},${e.trim()}`);
          }
        });
      }
    };

    const addFromList = (list: any[]) => {
      list.forEach((item) => {
        if (typeof item === 'string') {
          addTenant(item);
        } else if (item && typeof item === 'object') {
          addFromMap(item as Record<string, any>);
        }
      });
    };

    const walk = (node: any) => {
      if (Array.isArray(node)) {
        addFromList(node);
        return;
      }
      if (node && typeof node === 'object') {
        Object.values(node).forEach((v) => {
          if (Array.isArray(v) || (v && typeof v === 'object')) {
            walk(v);
          }
        });
      }
    };

    [
      'entradas',
      'Entradas',
      'tenants',
      'tenantIds',
      'acesso',
      'acessos',
      'filiais',
      'Filiais',
      'empresas',
      'Empresas',
      'grupos',
      'Grupos',
      'data',
    ].forEach((key) => {
      if (key in root) walk(root[key]);
    });

    return result;
  }

  private uniqueTenantIds(items: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    items.forEach((raw) => {
      const normalized = this.normalizeTenantId(raw);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    });
    return result;
  }

  private normalizeTenantId(value: string): string {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (trimmed.includes(',')) return trimmed;
    const dashIndex = trimmed.indexOf('-');
    if (dashIndex > 0) {
      const left = trimmed.substring(0, dashIndex).trim();
      const right = trimmed.substring(dashIndex + 1).trim();
      if (left && right) return `${left},${right}`;
    }
    return trimmed;
  }

  private empresaFromTenantId(tenantId: string): string {
    const parts = tenantId.split(/[,\\-]/);
    return parts.length ? parts[0].trim() : tenantId.trim();
  }

  private buildFilialOptionsFromResponses(responses: Array<any>, allowedTenants: string[]): string[] {
    const byCodigo = new Map<string, string>();
    const allowedSet = new Set(allowedTenants.filter((t) => t.includes(',')));
    const allowedGroups = new Set(
      allowedTenants
        .map((t) => t.split(',')[0]?.trim())
        .filter((g) => g && g.length <= 2),
    );
    responses.forEach((response) => {
      if (!response || (response.status !== 200 && response.status !== 201)) {
        return;
      }
      const decoded = response?.body;
      const items = this.extractFilialItems(decoded);
      items.forEach((item) => {
        const empresa = this.pickString(item, ['CodigoEmpresa', 'empresa', 'EMPRESA']);
        const filial = this.pickString(item, ['CodigoFilial', 'filial', 'FILIAL']);
        if (!empresa || !filial) return;

        const razao = this.pickString(item, ['RazaoSocial', 'razao', 'nome', 'NOME']);
        const codigo = `${empresa.trim()},${filial.trim()}`;
        if (allowedSet.size > 0 && !allowedSet.has(codigo)) {
          const empresaKey = empresa.trim();
          if (!allowedGroups.has(empresaKey)) {
            return;
          }
        }
        const label = `${empresa.trim()}/${filial.trim()}${razao ? '-' + razao.trim() : ''}`;
        byCodigo.set(codigo, label);
      });
    });

    return Array.from(byCodigo.values());
  }

  private extractFilialItems(decoded: any): Array<any> {
    if (Array.isArray(decoded)) return decoded;

    if (decoded && typeof decoded === 'object') {
      const data = decoded.data;
      if (data && typeof data === 'object' && Array.isArray(data.Empresas)) {
        return data.Empresas;
      }

      const candidates = [decoded.filiais, decoded.items, decoded.data];
      for (const c of candidates) {
        if (Array.isArray(c)) return c;
      }
    }

    return [];
  }

  private pickString(source: any, keys: string[]): string | undefined {
    if (!source || typeof source !== 'object') return undefined;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return undefined;
  }

  getProfile(grupo: string, username: string, filial: string): PoToolbarProfile {
    return (this.profile = {
      avatar: '',
      subtitle: grupo == '01' ? `Grupo: Arotubi Filial: ${filial}` : `Grupo: Eletropolar/Austral Filial: ${filial}`,
      title: 'Usuário: ' + username,
    });
  }

  /*notificationActions: Array<PoToolbarAction> = [
        {
            icon: 'po-icon-news',
            label: 'Informações',
            type: 'danger',
            action: (item: PoToolbarAction) => this.onClickNotification(item)
        },
        { icon: 'po-icon-message', label: 'Mensagens', type: 'danger', action: (item: PoToolbarAction) => this.openDialog(item) }


    ];*/

  profileActions: Array<PoToolbarAction> = [
    //  { icon: 'po-icon-user', label: 'User data',       action: (item: PoToolbarAction) => this.showAction(item) },
    //  { icon: 'po-icon-company', label: 'Company data', action: (item: PoToolbarAction) => this.showAction(item) },
    //  { icon: 'po-icon-settings', label: 'Settings',    action: (item: PoToolbarAction) => this.showAction(item) },
    {
      icon: 'po-icon-company',
      label: 'Grupo',
      type: 'Success',
      separator: true,
      action: () => this.openDialog(),
    },
    {
      icon: 'po-icon-exit',
      label: 'Sair',
      type: 'danger',
      separator: true,
      action: () => (this.loginService.logout(), this.router.navigate([`./login`])),
    },
  ];

  actions: Array<PoToolbarAction> = [
    { label: 'Start cash register', action: (item: PoToolbarAction) => this.showAction(item) },
    { label: 'Finalize cash register', action: (item: PoToolbarAction) => this.showAction(item) },
    { label: 'Cash register options', action: (item: PoToolbarAction) => this.showAction(item) },
  ];

  getFormPedido(form: NgForm) {
    this.PedidoForm = form;
  }

  /* getNotificationNumber() {
         return this.notificationActions.filter(not => not.type === 'danger').length;
     }*/

  openDialog() {
    this.loadCamposForm();
    this.formValue = { grupo_filial: OperationalContextStore.getString('grupofilial') };
    this.poModal.open();
  }

  async alterGrupo(): Promise<void> {
    const _grupo = this.PedidoForm?.form.value.grupo_filial.split('/')[0];
    const _separa = this.PedidoForm?.form.value.grupo_filial.split('/')[1];
    const _filial = _separa.split('-')[0];
    const _frlial_desc = this.getFilial(_grupo, _filial) ?? '';
    let cnpj = '';

    try {
      const response = await firstValueFrom(this.empresaService.getEmpresaData(_grupo, _filial));
      const empresa = response.data.find(
        (e: { mp_grupo: string; mp_filial: string }) => e.mp_grupo === _grupo && e.mp_filial.trim() === _filial,
      );
      cnpj = empresa?.mp_cnpj || '';
    } catch {
      cnpj = '';
    }

    await this.configuracaoSistemaService.updateOperationalContext({
      grupo: _grupo,
      filial: _filial,
      grupofilial: this.PedidoForm?.form.value.grupo_filial,
      tenantId: `${_grupo},${_filial}`,
      cnpj,
    });

    this.poNotification.success(this.PedidoForm?.form.value.grupo_filial);
    this.getProfile(_grupo, sessionStorage.getItem('user')!.toString().toUpperCase(), _frlial_desc.toString());
    this.checkSessionStorage();
    this.poModal.close();
    this.menuOpen = false;

    const currentUrl = this.router.url && this.router.url !== '/login' ? this.router.url : '/home';
    this.router.navigateByUrl('/home', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }

  showAction(item: PoToolbarAction): void {
    this.poNotification.success(`Action clicked: ${item.label}`);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  openParametros(): void {
    this.menuOpen = false;
    this.router.navigate(['/parametros']);
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate([`./login`]);
  }

  getFilial(grupoItem: string, filialItem: string): Filial | undefined {
    const enumKey = `FILIAL_${grupoItem}${filialItem}`;
    return (Filial as any)[enumKey];
  }

  getGrupo(grupoItem: string): Grupo | undefined {
    const enumKey = `GRUPO_${grupoItem}`;
    return (Grupo as any)[enumKey];
  }
}
