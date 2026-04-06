import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DistribuicaoRoutingModule } from './distribuicao-routing.module';
import { SolicitacoesService } from './services/solicitacoes.service';
import { PaginaDistribuicaoComponent } from './pagina-distribuicao/pagina-distribuicao.component';

import {
  PoAccordionModule,
  PoButtonModule,
  PoContainerModule,
  PoDisclaimerGroupModule,
  PoCheckboxGroupModule,
  PoDividerModule,
  PoDynamicModule,
  PoFieldModule,
  PoInfoModule,
  PoListViewModule,
  PoLoadingModule,
  PoPageModule,
  PoProgressModule,
  PoSearchModule,
  PoStepperModule,
  PoTableModule,
  PoWidgetModule,
  PoModalModule,

} from '@po-ui/ng-components';

import { PoPageDynamicSearchModule } from '@po-ui/ng-templates';

// Minhas Customizações.
import { CustomRowDirective } from './directives/custom-row.directive';
import { CustomStepDirective } from './directives/custom-step.directive';

import { PaiComponent } from './exemplos/pai/pai.component';
import { FilhoComponent } from './exemplos/pai/filho/filho.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  // Declar Module Components under Declarations
  declarations: [
    PaginaDistribuicaoComponent,

    // Directives
    CustomRowDirective,
    CustomStepDirective,

    PaiComponent,
    FilhoComponent,
  ],

  imports: [
    CommonModule,
    DistribuicaoRoutingModule,

    // Forms Necessários p/ alguns componentes do PO.
    FormsModule,
    ReactiveFormsModule,

    PoPageModule,
    PoLoadingModule,
    PoDynamicModule,
    PoDividerModule,
    PoPageDynamicSearchModule,
    PoContainerModule,
    PoAccordionModule,
    PoFieldModule,
    PoTableModule,
    PoListViewModule,
    PoInfoModule,
    FormsModule,
    PoWidgetModule,
    PoStepperModule,
    PoButtonModule,
    PoSearchModule,
    PoDisclaimerGroupModule,
    PoProgressModule,
    PoCheckboxGroupModule,
    PoModalModule,

    SharedModule,
  ],

  // Services do Módulo de Distribuição.
  providers: [SolicitacoesService],
})
export class DistribuicaoModule {}
