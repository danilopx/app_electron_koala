import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map, retry, tap } from 'rxjs/operators';
import { PoDialogService } from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { SessionStorageService } from '../components/header/service/session-storage.service';
import { ConfiguracaoSistemaService } from './configuracao-sistema.service';
import { LoginResponse, PasswordChangeRequest, PasswordChangeRequiredError } from '../interfaces/login.interface';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private httpOptions: any;
  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private poDialog: PoDialogService,
    private sessionStorageService: SessionStorageService,
    private configuracaoSistemaService: ConfiguracaoSistemaService,
  ) {}

  private updateHttpOptions(filial: string, rotina: string = ''): void {
    const setfilial = filial == '' ? environment.filial : filial;
    const setGrupo = environment.grupo;

    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        Rotina: `${rotina}`,
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        tenantId: `${setGrupo},${setfilial}`,
        'x-erp-module': 'SIGAPCP',
      }),
    };
  }

  login(username: string, password: string, anomimo: boolean): Observable<LoginResponse> {
    const urlAPI = `${this.normalizeApiRoot(environment.apiRoot)}api/oauth2/v1/token`;
    //const urlAuth = `${urlAPI}&password=${password}&username=${username}`;
    const body = new HttpParams().set('grant_type', 'password').set('username', username).set('password', password);

    return this.httpClient
      .post<LoginResponse>(urlAPI, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-PO-No-Error': 'true',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type',
          'Referrer-Policy': 'no-referrer-when-downgrade',
        },
        observe: 'response' as const,
      })
      .pipe(
        map((response: HttpResponse<LoginResponse>) => {
          const resp = response.body ?? {};
          const redirectedLocation = this.extractRedirectLocation(response);

          if (this.isPasswordChangeRedirect(redirectedLocation)) {
            throw this.buildPasswordChangeRequiredError(username, password, response.status, redirectedLocation);
          }

          if (resp.access_token) {
            const dataLogin = Date.now();
            const dataLoginStr = new Date(dataLogin).toLocaleString();
            const dataExpire = dataLogin + (resp.expires_in ?? 0) * 1000;
            const dataExpireStr = new Date(dataExpire).toLocaleString();
            sessionStorage.setItem('access_token', resp.access_token);
            localStorage.setItem('access_token', resp.access_token);
            localStorage.setItem('refresh_token', resp.refresh_token ?? '');
            localStorage.setItem('dataLogin', dataLogin.toString());
            localStorage.setItem('dataLoginStr', dataLoginStr);
            localStorage.setItem('dataExpire', dataExpire.toString());
            localStorage.setItem('dataExpireStr', dataExpireStr);
            void this.configuracaoSistemaService.updateOperationalContext({
              grupo: environment.grupo,
              filial: environment.filial,
              tenantId: environment.tenantId,
              grupofilial: environment.grupofilial,
              cnpj: environment.cnpj,
            });

            this.getUser(username).subscribe((data) => {
              const userData = data?.data ?? data;
              sessionStorage.setItem('infoUser', JSON.stringify(userData));
              sessionStorage.setItem('username', userData.nome);
              sessionStorage.setItem('user', username == undefined ? userData.nome : username);
              sessionStorage.setItem('userId', userData.userid);
              sessionStorage.setItem('adm', userData.adm);
              sessionStorage.setItem('papel', userData.papel);
              sessionStorage.setItem('papel_codigo', userData.papel_codigo ?? '');
              sessionStorage.setItem('anonimo', anomimo.toString());
              const allowedTenants = this.extractAllowedTenantsFromInfoUser(userData);
              sessionStorage.setItem('allowedTenants', JSON.stringify(allowedTenants));
              const groupuser: any = [];
              const filialuser: any = [];

              userData.acesso.forEach((acesso: any) => {
                if (!groupuser.includes(acesso.grupo)) {
                  groupuser.push(acesso.grupo);
                  sessionStorage.setItem('grupoAcesso', groupuser);
                }

                if (!filialuser.includes(acesso.filial)) {
                  filialuser.push(acesso.filial);
                  sessionStorage.setItem('filialAcesso', filialuser);
                }
              });

              this.sessionStorageService.markReady();
            });
            return resp;
          }

          this.logout();
          throw new Error('Resposta de login sem token de acesso.');
        }),
        catchError((error) => {
          const location = this.extractErrorLocation(error);
          if (this.isPasswordChangeRedirect(location) || Number(error?.status ?? 0) === 302) {
            return throwError(() =>
              this.buildPasswordChangeRequiredError(username, password, error?.status, location),
            );
          }
          return throwError(() => error);
        }),
      );
  }

  refresh(refresh_token: string | null): Observable<any> {
    const urlRef = `${environment.apiRoot}api/oauth2/v1/token?grant_type=refresh_token&refresh_token=${refresh_token}`;
    return this.httpClient
      .post<any>(urlRef, null, {
        headers: {
          'X-PO-No-Error': 'false',
        },
      })
      .pipe(
        tap((resp) => {
          if (resp.access_token) {
            const dataLogin = Date.now();

            const dataExpire = dataLogin + resp.expires_in * 1000;
            sessionStorage.setItem('access_token', resp.access_token);
            localStorage.setItem('access_token', resp.access_token);
            localStorage.setItem('refresh_token', resp.refresh_token);
            localStorage.setItem('dataLogin', dataLogin.toString());
            localStorage.setItem('dataExpire', dataExpire.toString());
          } else {
            this.logout();
          }
      }),
      );
  }

  changeExpiredPassword(payload: PasswordChangeRequest): Observable<any> {
    const url = `${this.normalizeApiRoot(environment.apiRoot)}api/framework/v1/changepassworduserservice`;
    return this.httpClient
      .post<any>(url, payload, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8',
          'X-PO-No-Error': 'true',
        },
        observe: 'response' as const,
      })
      .pipe(
        map((response) => response.body ?? { status: response.status }),
        catchError((error) => throwError(() => error)),
      );
  }

  getUser(codigo_user: string): Observable<any> {
    const safeUser = encodeURIComponent(codigo_user || '');
    this.updateHttpOptions(environment.filial, 'uSimp02B');
    const url = `${environment.apiRoot}apiSimplify?codigo_user=${safeUser}`;
    const options = { ...this.httpOptions };

    return this.httpClient.get<any>(url, options).pipe(
      retry(1),
      catchError((error) => {
        if (error?.status === 401) {
          this.logout();
          this.router.navigate(['/login']);
          return throwError(() => new Error('Token expirado'));
        }
        return throwError(() => new Error('Falha ao carregar dados do usuario'));
      }),
    );
  }

  private extractAllowedTenantsFromInfoUser(decoded: any): string[] {
    if (!decoded || typeof decoded !== 'object') return [];
    const root = decoded as Record<string, any>;

    const result: string[] = [];
    const seen = new Set<string>();

    const normalizeTenantId = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (trimmed.includes(',')) return trimmed;
      const dashIndex = trimmed.indexOf('-');
      if (dashIndex > 0) {
        const left = trimmed.substring(0, dashIndex).trim();
        const right = trimmed.substring(dashIndex + 1).trim();
        if (left && right) return `${left},${right}`;
      }
      return trimmed;
    };

    const addTenant = (raw?: string) => {
      const value = (raw ?? '').trim();
      if (!value) return;
      const normalized = normalizeTenantId(value);
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

  logout() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('expires_date');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('grupo');
    sessionStorage.removeItem('filial');
    sessionStorage.removeItem('encodedCredentials');
    sessionStorage.removeItem('infoUser');
    sessionStorage.removeItem('grupoAcesso');
    sessionStorage.removeItem('filialAcesso');
    sessionStorage.removeItem('refreshtoken');
    sessionStorage.removeItem('anonimo');
    sessionStorage.removeItem('adm');
    sessionStorage.removeItem('papel');
    sessionStorage.removeItem('papel_codigo');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('allowedTenants');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('dataLogin');
    localStorage.removeItem('dataLoginStr');
    localStorage.removeItem('dataExpire');
    localStorage.removeItem('dataExpireStr');
  }
  public isLoggedIn() {
    return !!sessionStorage.getItem('access_token');
  }

  private normalizeApiRoot(value: string): string {
    const normalized = String(value || '').trim();
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }

  private extractRedirectLocation(response: HttpResponse<LoginResponse>): string {
    const headerLocation =
      response.headers.get('Location') ||
      response.headers.get('location') ||
      response.headers.get('Redirect-Location') ||
      '';
    const responseUrl = response.url || '';
    return `${headerLocation} ${responseUrl}`.trim();
  }

  private extractErrorLocation(error: any): string {
    const headerLocation =
      error?.headers?.get?.('Location') ||
      error?.headers?.get?.('location') ||
      error?.error?.headers?.get?.('Location') ||
      error?.error?.headers?.get?.('location') ||
      '';
    const responseUrl = error?.url || error?.error?.url || '';
    const messageLocation = typeof error?.message === 'string' ? error.message : '';
    return `${headerLocation} ${responseUrl} ${messageLocation}`.trim();
  }

  private isPasswordChangeRedirect(location: string): boolean {
    const normalized = String(location || '').toLowerCase();
    return normalized.includes('/api/framework/v1/changepassworduserservice');
  }

  private isPasswordChangeRequiredError(error: any): error is PasswordChangeRequiredError {
    return !!error && error.code === 'PASSWORD_CHANGE_REQUIRED';
  }

  private buildPasswordChangeRequiredError(
    user: string,
    oldPassword: string,
    status?: number,
    location?: string,
  ): PasswordChangeRequiredError {
    return {
      code: 'PASSWORD_CHANGE_REQUIRED',
      message: 'Sua senha expirou. Faça a troca para continuar.',
      user,
      oldPassword,
      status,
      location,
    };
  }
}
