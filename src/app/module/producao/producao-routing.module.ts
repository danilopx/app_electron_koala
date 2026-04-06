import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProducaoComponent } from './producao.component';
import { ProducaoDetalheComponent } from './producao-detalhe.component';
import { ProducaoAutomaticoComponent } from './producao-automatico-page.component';

const routes: Routes = [
  {
    path: '',
    component: ProducaoComponent,
  },
  {
    path: 'detalhe/:numero/:item/:sequencia',
    component: ProducaoDetalheComponent,
  },
  {
    path: 'automatico',
    component: ProducaoAutomaticoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProducaoRoutingModule {}
