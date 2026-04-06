import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaginaOrdensServicoComponent } from './pagina-ordens-servico/pagina-ordens-servico.component';
import { PaginaDetalhesOrdensComponent } from './pagina-detalhes-ordens/pagina-detalhes-ordens.component';

const routes: Routes = [
  {
    path: '',
    component: PaginaOrdensServicoComponent,
    pathMatch: 'full',
    data: {
      breadcrumb: 'Inicio / Manutenção / Ordens de Serviço',
      pageTitle: 'Ordens de Serviço',
    },
  },
  {
    path: 'detalhes-ordem-servico/:id',
    component: PaginaDetalhesOrdensComponent,
    data: {
      breadcrumb: 'Inicio / Manutenção / Ordens de Serviço / Detalhes',
      pageTitle: 'Detalhes da Ordem de Serviço',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdensServicoRoutingModule {}
