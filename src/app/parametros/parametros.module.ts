import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoModule } from '@po-ui/ng-components';
import { ParametrosListComponent } from './parametros-list/parametros-list.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ParametrosListComponent],
  imports: [
    CommonModule,
    FormsModule,
    PoModule,
    SharedModule,
  ],
  exports: [ParametrosListComponent]
})
export class ParametrosModule { }
