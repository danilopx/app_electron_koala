import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LoginRoutingModule } from './login-routing.module';
import { PaginaLoginComponent } from './pagina-login/pagina-login.component';
import { PoPageLoginModule } from '@po-ui/ng-templates';
import { LoginAnonimoComponent } from './login-anonimo/login-anonimo.component';
import { PoButtonModule, PoFieldModule, PoModalModule } from '@po-ui/ng-components';

@NgModule({
  declarations: [
    PaginaLoginComponent,
    LoginAnonimoComponent,

  
  ],
  exports: [
    PaginaLoginComponent,
    LoginAnonimoComponent,
 

  ],
  imports: [
    CommonModule,
    FormsModule,
    LoginRoutingModule,
    PoPageLoginModule,
    PoButtonModule,
    PoFieldModule,
    PoModalModule

  ]
})
export class LoginModule { }
