import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManutencaoComponent } from './manutencao.component';

const routes: Routes = [
  {
    path: '',
    component: ManutencaoComponent,
    children: [
      { path: '', redirectTo: 'distribuicao', pathMatch: 'full' },
      {
        path: 'distribuicao',
        loadChildren: () => import('../distribuicao/distribuicao.module').then((m) => m.DistribuicaoModule),
      },
      { path: 'ordens', redirectTo: 'distribuicao', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManutencaoRoutingModule {}
