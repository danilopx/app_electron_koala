import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID, APP_INITIALIZER, DEFAULT_CURRENCY_CODE, Pipe, PipeTransform } from '@angular/core';
import { registerLocaleData, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
//import { GoogleMapsModule } from '@angular/google-maps';
import { PoModule } from '@po-ui/ng-components';
import { PoTemplatesModule } from '@po-ui/ng-templates';
import { SharedModule } from './shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { FormsModule } from '@angular/forms';


import {
  PoMenuModule, PoToolbarModule,
  PoAvatarModule,
  PoButtonModule,
  PoContainerModule,
  PoDividerModule,
  PoDynamicModule,
  PoImageModule,
  PoInfoModule,
  PoListViewModule,
  PoLoadingModule,
  PoModalModule,
  PoPageModule,
  PoTableModule,
  PoTabsModule,
  PoTagModule,
  PoWidgetModule,
  PoFieldModule,

} from '@po-ui/ng-components';

// #### Middlewares ####
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { DEFAULT_TIMEOUT, TimeoutInterceptor } from './middlewares/timeout.interceptor';
import { AddTokenProtheus } from './shared/interceptor.module';

// Correção de Animações
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

// Modulos
import { LoginModule } from "./module/login/login.module";
import { ParametrosModule } from "./parametros/parametros.module";
import { ProducaoModule } from "./module/producao/producao.module";

// Componentes
import { HomeComponent } from './module/home/home.component';

import { IotComponent } from './module/iot/iot.component';
import { MinutaComponent } from './module/minuta/minuta.component';
import { ConferenciaComponent } from './module/conferencia/conferencia.component';
import { AndonComponent } from './module/andon/andon.component';
import { IntercompanyComponent } from './module/intercompany/intercompany.component';
import { PedidoComponent } from './module/intercompany/pedido/pedido.component';
import { ChatComponent } from './module/chat/chat.component';

import { HelpComponent } from './module/help/help.component';

import { ChecklistComponent } from './module/checklist/checklist.compoent';
import { AplicacaoComponent } from './module/checklist/aplicacao/aplicacao.component';
import { UnidadeListarComponent } from './module/checklist/unidade/listar/unidadeListar.component';
import { UnidadeCadastrarComponent } from './module/checklist/unidade/cadastrar/unidadeCadastrar.component';
import { ConfiguracaoInicialComponent } from './configuracao-inicial/configuracao-inicial.component';


import { LoginService } from './service/login.service';
import { ProtheusService } from './service/protheus.service';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';


import ptBr from '@angular/common/locales/pt';

import { FilterPipe } from './components/filter/filter.pipe';
import { SearchFilterPipe } from './pipes/SearchFilterPipe.pipe';

import { RouterModule } from '@angular/router';



import { EquipamentoService } from './service/equipamento.service';



import { FormManutencaoComponent } from './components/form-manutencao/form-manutencao.component';

import { SolicitacaoAbertaComponent } from './components/solicitacao-aberta/solicitacao-aberta.component';

import { InformacoesEquipamentoComponent } from './components/informacoes-equipamento/informacoes-equipamento.component';
import { ConfiguracaoSistemaService } from './service/configuracao-sistema.service';


registerLocaleData(ptBr);

export function initializeSystemConfig(configuracaoSistemaService: ConfiguracaoSistemaService) {
  return () => configuracaoSistemaService.initialize();
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    FilterPipe,
    ChatComponent,
    IotComponent,
    AndonComponent,
    IntercompanyComponent,
    PedidoComponent,
    //FormManutencaoComponent,
    HelpComponent,
    FormManutencaoComponent,
    SolicitacaoAbertaComponent,
    InformacoesEquipamentoComponent,
    SearchFilterPipe,
    ChecklistComponent,
    AplicacaoComponent,
    UnidadeListarComponent,
    UnidadeCadastrarComponent,
    ConfiguracaoInicialComponent,
    MinutaComponent,
    ConferenciaComponent,
    

  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    PoModule,
    HttpClientModule,
    PoTemplatesModule,
    SharedModule,
   // GoogleMapsModule,
    RouterModule,
    ReactiveFormsModule,
    PdfViewerModule,
    NgxExtendedPdfViewerModule,
    FormsModule,


    BrowserAnimationsModule,

    // Importacao de Modulos
    LoginModule,
    ParametrosModule,
    ProducaoModule,

    // PO Modules
    PoMenuModule,
    PoToolbarModule,


    PoButtonModule,
    PoTableModule,
    PoTabsModule,
    PoContainerModule,
    PoLoadingModule,
    PoWidgetModule,
    PoAvatarModule,
    PoInfoModule,
    PoTagModule,
    PoModalModule,
    PoDynamicModule,
    PoFieldModule,
    PoListViewModule,
    PoDividerModule,
    PoImageModule,
    



  ],
  providers: [
    LoginService,
    ProtheusService,
    EquipamentoService,
    ConfiguracaoSistemaService,
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSystemConfig,
      deps: [ConfiguracaoSistemaService],
      multi: true,
    },
    { provide: HTTP_INTERCEPTORS, useClass: TimeoutInterceptor, multi: true },
    { provide: DEFAULT_TIMEOUT, useValue: 15000 }, // 15 segundos
    { provide: HTTP_INTERCEPTORS, useClass: AddTokenProtheus, multi: true }
    //  { provide: HTTP_INTERCEPTORS, useClass: HttpsRequestInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }



