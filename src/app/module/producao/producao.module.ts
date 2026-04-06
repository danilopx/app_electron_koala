import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { PoModule } from '@po-ui/ng-components';

import { SharedModule } from '../../shared/shared.module';
import { ProducaoComponent } from './producao.component';
import { ProducaoDetalheComponent } from './producao-detalhe.component';
import { ProducaoAutomaticoComponent } from './producao-automatico-page.component';

@NgModule({
  declarations: [ProducaoComponent, ProducaoDetalheComponent, ProducaoAutomaticoComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PoModule,
    SharedModule,
  ],
  providers: [DatePipe],
})
export class ProducaoModule {}
