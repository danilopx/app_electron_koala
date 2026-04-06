import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaginaDistribuicaoComponent } from './pagina-distribuicao/pagina-distribuicao.component';

const routes: Routes = [
  {
    path: '',
    component: PaginaDistribuicaoComponent,
    pathMatch: 'full',
    data: {
      breadcrumb: 'Inicio / Manutenção / Distribuição',
      pageTitle: 'Distribuição',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistribuicaoRoutingModule {}
