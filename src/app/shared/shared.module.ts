import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PoLoadingModule, PoModalModule, PoModule } from '@po-ui/ng-components';
import { TransformarDataYYYYMMDDPipe } from '../pipes/transformar-data-yyyymmdd.pipe';
import { AppTableComponent } from '../components/table/app-table.component';
import { StatusCardsComponent } from '../components/status-cards/status-cards.component';


@NgModule({
  declarations: [TransformarDataYYYYMMDDPipe, AppTableComponent, StatusCardsComponent],
  imports: [
    CommonModule,
    FormsModule,
    PoModule,
    PoModalModule,
    PoLoadingModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    PoModule,
    PoModalModule,
    PoLoadingModule,
    TransformarDataYYYYMMDDPipe,
    AppTableComponent,
    StatusCardsComponent
  ]
})
export class SharedModule { }
