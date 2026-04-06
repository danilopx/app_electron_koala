import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { LoginService } from './login.service';
import { PoNotificationService } from '@po-ui/ng-components';
import { ConfiguracaoSistemaService } from './configuracao-sistema.service';
import { environment } from '../../environments/environment';

export const canActivate = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): UrlTree | boolean => {
  const loginService = inject(LoginService);
  const configuracaoSistemaService = inject(ConfiguracaoSistemaService);
  const router = inject(Router);
  const poNotification = inject(PoNotificationService);
  const url = state.url.split('?')[0];

  if (!configuracaoSistemaService.isConfigured()) {
    if (url === '/configuracao-inicial') {
      return true;
    }

    return router.createUrlTree(['/configuracao-inicial']);
  }

  if (!loginService.isLoggedIn()) {
    if (url === '/login') {
      return true;
    }
    return router.createUrlTree(['/login']);
  }

  if (url === '/login') {
    return router.createUrlTree(['/home']);
  }

  const isManualProducaoRoute = url.startsWith('/producao') && !url.startsWith('/producao/automatico');

  if (!environment.apManual && isManualProducaoRoute) {
    return router.createUrlTree(['/home']);
  }

  if (!environment.apAuto && url.startsWith('/producao/automatico')) {
    return router.createUrlTree(['/home']);
  }

  //let menuModulo = route.data['modulo']; // Recupera a permissão necessária para a rota
  const menuGrupo = String(route.data['empresa'] ?? '*'); // Recupera a permissão necessária para a rota
  //let menuFilial = route.data['filial']; // Recupera a permissão necessária para a rota
  //let menuPapel  = route.data['papel'];   // Recupera a permissão necessária para a rota

  if (url.split('/').length === 2) {
    //menuModulo = route.data['modulo']; // Recupera a permissão necessária para a rota
    //menuFilial = route.data['filial']; // Recupera a permissão necessária para a rota
    //menuPapel  = route.data['papel']; // Recupera a permissão necessária para a rota

    //const userGrupo   = sessionStorage.getItem('grupoAcesso')
    //const userFilial = sessionStorage.getItem('filialAcesso')
    //const userPapel = sessionStorage.getItem('papel')
    //const acesso = JSON.parse(sessionStorage.getItem('infoUser')!)
    const usergrupo = environment.grupo ?? '';

    if (menuGrupo !== '*' && !menuGrupo.includes(usergrupo)) {
      poNotification.warning('Usuário Sem Permissão !');
      return false;
    }
  }

  return true;
};

export const canActivateChild: CanActivateChildFn = (
  route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => canActivate(
  route, state);
