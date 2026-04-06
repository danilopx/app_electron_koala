import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManutencaoRoutingModule } from './manutencao-routing.module';
import { ManutencaoComponent } from './manutencao.component';

@NgModule({
  declarations: [ManutencaoComponent],
  imports: [CommonModule, ManutencaoRoutingModule],
})
export class ManutencaoModule {}
