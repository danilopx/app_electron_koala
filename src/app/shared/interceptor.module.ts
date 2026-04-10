import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, finalize, switchMap, take, filter } from 'rxjs/operators';
import { LoginService } from '../service/login.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { LicenseErrorModalService } from '../service/license-error-modal.service';

@Injectable()
export class AddTokenProtheus implements HttpInterceptor {
  private isRefreshingToken = false;
  private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private loginService: LoginService,
    private router: Router,
    private licenseErrorModalService: LicenseErrorModalService,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const refresh_token = localStorage.getItem('refresh_token');
    const dataExpire = Number(localStorage.getItem('dataExpire'));
    const dataAtual = Date.now();

    // Verifica se é login ou refresh pelo corpo da requisição (form-urlencoded)
    const normalizedRequestUrl = String(req.url || '').trim();
    const isLoginUrl = normalizedRequestUrl.endsWith('/api/oauth2/v1/token');
    const isPasswordLogin = isLoginUrl && typeof req.body === 'string' && req.body.includes('grant_type=password');
    const isTokenRefresh = isLoginUrl && typeof req.body === 'string' && req.body.includes('grant_type=refresh_token');

    // 1. Chamadas para /api-checklist/ (sem token)
    if (req.url.includes('/api-checklist/')) {
      const clonedReq = this.addChecklistHeaders(req);
      return next.handle(clonedReq).pipe(catchError(err => this.handleError(err)));
    }

    // 2. Chamadas para API principal (exceto login/refresh)
    if (req.url.startsWith(this.normalizeApiRoot(environment.apiRoot)) && !isPasswordLogin && !isTokenRefresh) {
      if (dataAtual > dataExpire && refresh_token) {
        if (!this.isRefreshingToken) {
          this.isRefreshingToken = true;
          this.tokenSubject.next(null);

          return this.loginService.refresh(refresh_token).pipe(
            switchMap((data: any) => {
              if (data && data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('dataExpire', (Date.now() + data.expires_in * 1000).toString());
                this.tokenSubject.next(data.access_token);
                const clonedReq = this.addBearerAuthHeaders(req);
                return next.handle(clonedReq);
              } else {
                this.loginService.logout();
                return throwError(() => 'Falha ao renovar token');
              }
            }),
            catchError(err => {
              this.loginService.logout();
              return throwError(() => err);
            }),
            finalize(() => {
              this.isRefreshingToken = false;
            })
          );
        } else {
          return this.tokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(() => {
              const clonedReq = this.addBearerAuthHeaders(req);
              return next.handle(clonedReq);
            })
          );
        }
      } else {
        const clonedReq = this.addBearerAuthHeaders(req);
        return next.handle(clonedReq).pipe(catchError(err => this.handleError(err)));
      }
    }

    // 3. Login e refresh devem propagar o erro bruto para a tela tratar o estado do botão e a mensagem.
    if (isLoginUrl) {
      return next.handle(req);
    }

    // 4. Demais requisições
    return next.handle(req).pipe(catchError(err => this.handleError(err)));
  }

  private addChecklistHeaders(req: HttpRequest<any>): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  private addBearerAuthHeaders(req: HttpRequest<any>): HttpRequest<any> {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || '';
    const existingTenant =
      req.headers.get('tenantId') ||
      req.headers.get('tenantid') ||
      req.headers.get('Tenantid') ||
      '';
    const tenantId =
      existingTenant ||
      environment.tenantId ||
      '';
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        tenantId,
        tenantid: tenantId,
      },
    });
  }

  private handleError(error: any): Observable<HttpEvent<any>> {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.logoutAndRedirect();
      return EMPTY;
    }

    if (this.isLicenseServerUnavailable(error)) {
      this.licenseErrorModalService.show(this.getErrorMessage(error));
      return throwError(() => error);
    }

    let cMessageCustomErro = '';
    if (error.status === 0) {
      cMessageCustomErro = 'Nosso servidor não está respondendo';
    } else if (error.status === 500) {
      cMessageCustomErro = 'Aconteceu um erro interno no servidor';
    }

    const errorMsg = cMessageCustomErro || this.getErrorMessage(error);
    return throwError(() => errorMsg);
  }

  private logoutAndRedirect(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  private getErrorMessage(error: any): string {
    if (error.error) {
      if (error.error.errorMessage) return error.error.errorMessage;
      if (error.error.message) return error.error.message;
    }
    return error.message || 'Erro desconhecido';
  }

  private isLicenseServerUnavailable(error: any): boolean {
    const status = Number(error?.status ?? 0);
    const message = String(
      error?.error?.message ||
        error?.error?.errorMessage ||
        error?.message ||
        '',
    )
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return status === 503 && message.includes('license server') && message.includes('licenca');
  }

  private normalizeApiRoot(value: string): string {
    const normalized = String(value || '').trim();
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }
}

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AddTokenProtheus,
      multi: true,
    },
  ],
})
export class InterceptorModule {}
