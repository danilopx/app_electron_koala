import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdensServicoRoutingModule } from './ordens-servico-routing.module';
import { PaginaOrdensServicoComponent } from './pagina-ordens-servico/pagina-ordens-servico.component';
import {
  PoDividerModule,
  PoButtonModule,
  PoInfoModule,
  PoPageModule,
  PoProgressModule,
  PoTagModule,
  PoWidgetModule,
  PoBadgeModule,
  PoLoadingModule,
  PoContainerModule,
  PoDynamicModule,
  PoImageModule,
  PoFieldModule,
  PoTableModule,
  PoSearchModule,
  PoModalModule,
  PoListViewModule,
  PoAvatarModule,
} from '@po-ui/ng-components';
import { RowOrdemServicoComponent } from './pagina-ordens-servico/row-ordem-servico/row-ordem-servico.component';
//import { ManutencaoModule } from '../manutencao/manutencao.module';
import { PaginaDetalhesOrdensComponent } from './pagina-detalhes-ordens/pagina-detalhes-ordens.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [PaginaOrdensServicoComponent, RowOrdemServicoComponent, PaginaDetalhesOrdensComponent],
  imports: [
    CommonModule,
    OrdensServicoRoutingModule,
    PoPageModule,
    PoWidgetModule,
    PoDividerModule,
    PoInfoModule,
    PoProgressModule,
    PoTagModule,
    PoBadgeModule,
    PoButtonModule,
    PoLoadingModule,
 //   ManutencaoModule,
    PoContainerModule,
    PoDynamicModule,
    PoImageModule,
    PoFieldModule,
    FormsModule,
    PoTableModule,
    PoSearchModule,
    PoModalModule,
    PoListViewModule,
    PoAvatarModule,

    // Módulo Compartilhado p/ usar Pipes.
    SharedModule,
  ],
  exports: [PaginaDetalhesOrdensComponent],
})

export class OrdensServicoModule {}
