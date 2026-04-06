import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './module/home/home.component';
import { ChatComponent } from './module/chat/chat.component';
import { IotComponent } from './module/iot/iot.component';
import { MinutaComponent } from './module/minuta/minuta.component';
import { ConferenciaComponent } from './module/conferencia/conferencia.component';
import { AndonComponent } from './module/andon/andon.component';
import { IntercompanyComponent } from './module/intercompany/intercompany.component';
import { PedidoComponent } from './module/intercompany/pedido/pedido.component';
import { HelpComponent } from './module/help/help.component';
import { ChecklistComponent } from './module/checklist/checklist.compoent'; // Corrigido o nome do arquivo
import { AplicacaoComponent } from './module/checklist/aplicacao/aplicacao.component';
import { UnidadeListarComponent } from './module/checklist/unidade/listar/unidadeListar.component';
import { UnidadeCadastrarComponent } from './module/checklist/unidade/cadastrar/unidadeCadastrar.component';
import { ConfiguracaoInicialComponent } from './configuracao-inicial/configuracao-inicial.component';
import { ProducaoComponent } from './module/producao/producao.component';
import { ProducaoDetalheComponent } from './module/producao/producao-detalhe.component';
import { ProducaoAutomaticoComponent } from './module/producao/producao-automatico-page.component';

import { ParametrosListComponent } from './parametros/parametros-list/parametros-list.component';

import { canActivate } from './service/auth.guard';

const defaultData = {
  modulo: '*',
  empresa: '*',
  filial: '*',
  papel: '*',
};

const dataWithBreadcrumb = (breadcrumb: string, pageTitle: string, data = defaultData) => ({
  ...data,
  breadcrumb,
  pageTitle,
});

const routes: Routes = [
  // Root redirecionando para home
  // { path: '', redirectTo: 'home', pathMatch: 'full' }, // Ative se quiser
  { path: '', redirectTo: 'home', pathMatch: 'full' }, // redireciona raiz para home
  { path: 'configuracao-inicial', component: ConfiguracaoInicialComponent, data: dataWithBreadcrumb('Inicio / Configuracao', 'Configuracao Inicial') },
  { path: 'home', component: HomeComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Home', 'Home') },
  { path: 'help', component: HelpComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Help', 'Help') },
  { path: 'parametros', component: ParametrosListComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Parametros', 'Parametros') },

  {
    path: 'estoque',
    loadChildren: () => import('./module/estoque/nfe.module').then((m) => m.NfeModule),
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Estoque', 'Estoque'),
  },

  { path: 'producao', component: ProducaoComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Producao', 'Producao') },
  {
    path: 'producao/detalhe/:numero/:item/:sequencia',
    component: ProducaoDetalheComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Producao / Detalhe', 'Detalhe da OP'),
  },
  {
    path: 'producao/automatico',
    component: ProducaoAutomaticoComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Producao / Automatico', 'Producao Automatica'),
  },

  { path: 'iot', component: IotComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / IOT', 'IOT') },
  { path: 'minuta', component: MinutaComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Minuta', 'Minuta') },
  { path: 'conferencia', component: ConferenciaComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Conferencia', 'Conferencia') },

  {
    path: 'checklist',
    component: ChecklistComponent,
    canActivate: [canActivate],
    data: {
      modulo: '',
      empresa: '01',
      filial: '*',
      papel: '*',
      breadcrumb: 'Inicio / Checklist',
      pageTitle: 'Checklist',
    },
  },
  {
    path: 'checklist/aplicacao',
    component: AplicacaoComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Checklist / Aplicacao', 'Checklist - Aplicacao'),
  },
  {
    path: 'checklist/unidade/listar',
    component: UnidadeListarComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Checklist / Unidades', 'Checklist - Unidades'),
  },
  {
    path: 'checklist/unidade/cadastrar',
    component: UnidadeCadastrarComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Checklist / Nova Unidade', 'Checklist - Nova Unidade'),
  },
  {
    path: 'checklist/unidade/editar/:id',
    component: UnidadeCadastrarComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Checklist / Editar Unidade', 'Checklist - Editar Unidade'),
  },

  { path: 'andon', component: AndonComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Andon', 'Andon') },
  { path: 'chat', component: ChatComponent, canActivate: [canActivate], data: dataWithBreadcrumb('Inicio / Chat', 'Chat') },

  {
    path: 'intercompany',
    component: IntercompanyComponent,
    canActivate: [canActivate],
    data: {
      modulo: 'SIGAFAT',
      empresa: '01',
      filial: '*',
      papel: '*',
      breadcrumb: 'Inicio / Intercompany',
      pageTitle: 'Intercompany',
    },
  },
  {
    path: 'intercompany/pedido/new',
    component: PedidoComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Intercompany / Novo Pedido', 'Novo Pedido'),
  },
  {
    path: 'intercompany/pedido/edit/:filial/:id/:tipo',
    component: PedidoComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Intercompany / Editar Pedido', 'Editar Pedido'),
  },
  {
    path: 'intercompany/pedido/fat/:filial/:id/:tipo/:fat',
    component: PedidoComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Intercompany / Faturar Pedido', 'Faturar Pedido'),
  },
  {
    path: 'intercompany/pedido/class/:filial/:id/:tipo/:fat',
    component: PedidoComponent,
    canActivate: [canActivate],
    data: dataWithBreadcrumb('Inicio / Intercompany / Classificar Pedido', 'Classificar Pedido'),
  },

  { path: 'sigamnt', redirectTo: 'home', pathMatch: 'full' },
  { path: 'remessa', redirectTo: 'home', pathMatch: 'full' },
  { path: 'remessa/pedido/new', redirectTo: 'home', pathMatch: 'full' },
  { path: 'remessa/pedido/edit/:filial/:id/:tipo', redirectTo: 'home', pathMatch: 'full' },
  { path: 'remessa/pedido/fat/:filial/:id/:tipo/:fat', redirectTo: 'home', pathMatch: 'full' },
  { path: 'remessa/pedido/class/:filial/:id/:tipo/:fat', redirectTo: 'home', pathMatch: 'full' },
  { path: 'retorno', redirectTo: 'home', pathMatch: 'full' },
  { path: 'retorno/pedido/new', redirectTo: 'home', pathMatch: 'full' },
  { path: 'retorno/pedido/edit/:filial/:id/:tipo', redirectTo: 'home', pathMatch: 'full' },
  { path: 'retorno/pedido/fat/:filial/:id/:tipo/:fat', redirectTo: 'home', pathMatch: 'full' },
  { path: 'retorno/pedido/class/:filial/:id/:tipo/:fat', redirectTo: 'home', pathMatch: 'full' },
  { path: 'retorno/pedido/:id', redirectTo: 'home', pathMatch: 'full' },
  { path: 'ordens-servico', redirectTo: 'home', pathMatch: 'full' },
  { path: 'ordens-servico/detalhes-ordem-servico/:id', redirectTo: 'home', pathMatch: 'full' },
  { path: 'edi/etl', redirectTo: 'home', pathMatch: 'full' },
  { path: 'edi/etl/pedido/:id', redirectTo: 'home', pathMatch: 'full' },
  { path: 'edi/whp', redirectTo: 'home', pathMatch: 'full' },
  { path: 'edi/whp/pedido/edit/:filial/:id/:tipo', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'manutencao-unificada',
    canActivate: [canActivate],
    loadChildren: () => import('./module/manutencao/manutencao.module').then((m) => m.ManutencaoModule),
    data: {
      modulo: 'SIGAMNT',
      empresa: '01',
      filial: '*',
      papel: '*',
      breadcrumb: 'Inicio / Manutenção / Rotina Unificada',
      pageTitle: 'Manutenção - Rotina Unificada',
    },
  },
  {
    path: 'pagina-distribuicao',
    canActivate: [canActivate],
    loadChildren: () => import('./module/distribuicao/distribuicao.module').then((m) => m.DistribuicaoModule),
    data: {
      modulo: 'SIGAMNT',
      empresa: '01',
      filial: '*',
      papel: '*',
      breadcrumb: 'Inicio / Manutenção / Distribuição',
      pageTitle: 'Distribuição',
    },
  },
  {
    path: 'login',
    loadChildren: () => import('./module/login/login.module').then((m) => m.LoginModule),
    canActivate: [canActivate],
    data: defaultData,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
