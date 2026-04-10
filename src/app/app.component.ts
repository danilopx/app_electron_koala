import { Component, OnInit } from '@angular/core';
import { LoginService } from './service/login.service';
import { NavigationEnd, Router } from '@angular/router';
import { PoMenuItem, PoNotificationService } from '@po-ui/ng-components';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';
import { SupportModalService } from './service/support-modal.service';
import { environment } from '../environments/environment';
import { ConfiguracaoSistemaService } from './service/configuracao-sistema.service';
import packageJson from '../../package.json';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  menus!: Array<PoMenuItem>;
  menu = false;
  readonly currentYear = new Date().getFullYear();
  readonly supportEmail = 'suporte@simplifysolucoes.com.br';
  readonly appVersion = packageJson.version;
  desktopVersion = '';
  showSupportModal = false;
  showBack = false;
  hideNavigation = false;
  hidePageHeader = false;
  breadcrumb = '';
  pageTitle = '';
  supportForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  constructor(
    public loginService: LoginService,
    private router: Router,
    private location: Location,
    private supportModalService: SupportModalService,
    private configuracaoSistemaService: ConfiguracaoSistemaService,
    private poNotification: PoNotificationService,
  ) {
    this.updateBackVisibility(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateBackVisibility(event.urlAfterRedirects);
        this.updateBreadcrumb();
      });

    this.supportModalService.open$.subscribe((payload) => {
      this.supportForm.subject = payload.subject;
      this.supportForm.message = payload.message;
      this.showSupportModal = true;
    });

    this.configuracaoSistemaService.runtimeChanges$.subscribe(() => {
      if (!this.loginService.isLoggedIn()) {
        return;
      }

      const isAnonymous = sessionStorage.getItem('anonimo') === 'true';
      this.menus = this.buildMenus(isAnonymous);
      this.handleRuntimeRouteAccess();
    });
  }

  ngOnInit(): void {
    void this.loadDesktopVersion();

    // Workaround Po-UI bug eventdata may call focusFunction with undefined elements
    document.addEventListener('focusin', (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const poComponent = (target as any).componentInstance;
      if (poComponent && typeof poComponent.focusFunction === 'function') {
        try {
          poComponent.focusFunction(event);
        } catch (err) {
          console.warn('Po UI foco ignorado por erro de nativeElement indefinido', err);
        }
      }
    }, true);
  }

  public get isLogged(): boolean {
    if (!!this.loginService.isLoggedIn() && this.menu == false) {
      if (sessionStorage.getItem('anonimo') === 'true') {
        this.menus = this.buildMenus(true);
        this.menu = true;
      }
      if (sessionStorage.getItem('anonimo') === 'false') {
        console.log('não anonino');
        this.menus = this.buildMenus(false);
        this.menu = true;
      }
    }

    if (!!this.loginService.isLoggedIn() == false) {
      this.menu = false;
      this.menus = [];
    }

    return !!this.loginService.isLoggedIn();
  }

  openSupportModal(): void {
    this.showSupportModal = true;
  }

  closeSupportModal(): void {
    this.showSupportModal = false;
  }

  submitSupport(): void {
    const subject = this.supportForm.subject || 'Suporte Koala System';
    const lines = [
      `Nome: ${this.supportForm.name}`,
      `Email: ${this.supportForm.email}`,
      '',
      this.supportForm.message
    ];
    const body = lines.join('\n').trim();
    const mailto = `mailto:${this.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    this.closeSupportModal();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  private updateBackVisibility(url: string): void {
    const semQuery = url.split('?')[0] || '';
    const cleanUrl = semQuery.includes('#') ? semQuery.substring(semQuery.indexOf('#') + 1) || '/' : semQuery;
    const automaticoRoute = cleanUrl === '/producao/automatico';
    this.hideNavigation = automaticoRoute;
    this.hidePageHeader = automaticoRoute;
    this.showBack = !!this.loginService.isLoggedIn() && cleanUrl !== '/home' && cleanUrl !== '/login';
  }

  private updateBreadcrumb(): void {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.breadcrumb = route.snapshot.data?.['breadcrumb'] ?? '';
    this.pageTitle = route.snapshot.data?.['pageTitle'] ?? '';
  }

  goBack(): void {
    this.location.back();
  }

  get versionLabel(): string {
    return this.desktopVersion
      ? `Web: ${this.appVersion} | Desktop: ${this.desktopVersion}`
      : `Web: ${this.appVersion}`;
  }

  private async loadDesktopVersion(): Promise<void> {
    if (!window.electronAPI?.getAppInfo) {
      return;
    }

    try {
      const info = await window.electronAPI.getAppInfo();
      this.desktopVersion = info?.version || '';
    } catch (error) {
      this.desktopVersion = '';
    }
  }

  private buildMenus(isAnonymous: boolean): Array<PoMenuItem> {
    const menus: Array<PoMenuItem> = [
      { label: 'Home', link: '/home', shortLabel: 'Home', icon: 'po-icon po-icon-home' },
    ];

    if (environment.apManual) {
      menus.push({
        label: 'Producao',
        link: '/producao',
        shortLabel: 'Producao',
        icon: 'po-icon po-icon-manufacture',
      });
    }

    if (environment.apAuto && environment.apAutoMenu) {
      menus.push({
        label: 'Producao Auto',
        link: '/producao/automatico',
        shortLabel: 'Auto',
        icon: 'po-icon po-icon-barcode',
      });
    }

    menus.push(
      { label: 'Help', link: '/help', shortLabel: 'Help', icon: 'po-icon po-icon-info' },
      {
        label: 'Sair',
        icon: 'po-icon-exit',
        shortLabel: 'Sair',
        action: () => this.loginService.logout(),
      }
    );

    return menus;
  }

  private handleRuntimeRouteAccess(): void {
    const currentUrl = (this.router.url || '').split('?')[0];

    if (!environment.apManual && currentUrl.startsWith('/producao') && !currentUrl.startsWith('/producao/automatico')) {
      this.poNotification.warning('A rotina de apontamento manual está desabilitada.');
      this.router.navigate(['/home']);
      return;
    }

    if (!environment.apAuto && currentUrl.startsWith('/producao/automatico')) {
      this.poNotification.warning('A rotina de apontamento automático está desabilitada.');
      this.router.navigate(['/home']);
    }
  }
}
