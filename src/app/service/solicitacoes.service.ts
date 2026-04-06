import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, of, retry, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, tap, timeout } from 'rxjs/operators';
import { PoNotificationService } from '@po-ui/ng-components';
import { SolicitacaoAbertaResponse, SolicitacaoProtheus, SolicitacaoProtheusOS } from '../interfaces/solicitacao.interface';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class SolicitacoesService {
  // ##### Abertura da SS pela API /mntsrws/api/v1/request #####
  // Documentação: https://tdn.totvs.com/pages/releaseview.action?pageId=683181217
  // Fluxo:
  // 1. Abrir S.S.
  // 2. Distribuir a S.S.
  // 3. Abrir a O.S.

  private readonly REQUEST_TIMEOUT = 40000; // 10 segundos para timeout

  constructor(
    private http: HttpClient,
    private poNotification: PoNotificationService,
    private utilsService: UtilsService,
  ) {
    this.updateHttpOptions('');
  }
  private httpOptions: any;

  private updateHttpOptions(filial: string): void {

    const setfilial = filial == '' ? environment.filial : filial;
    this.httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'tenantId': `${environment.grupo}, ${setfilial}`,
        'x-erp-module': 'MNT'
      })
    };
  }

  // Passo 1 - Abertura da S.S.
  abrirSolicitacao(
    usuario: string,
    grupoFilial: string,
    idFilial: string,
    dadosSolicitacao: SolicitacaoProtheus,
  ): Observable<SolicitacaoAbertaResponse | unknown> {

    // Verificar se o campo `description` está vazio, se sim, mapear com um texto padrão.
    if (dadosSolicitacao.description === '') {
      dadosSolicitacao.description = 'Solicitacao aberta sem descricao, pelo APP.';
    }

    // Adiciona o campo dateTime ao objeto dadosSolicitacao
    this.utilsService.formatarDataHoraAtual().subscribe((dateTime) => {
      dadosSolicitacao.dateTime = dateTime;
    });

    // Configuração dos cabeçalhos.
    // Importante: O campo TenantID é separado por vírgula.

    const headersConfig = {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      tenantId: `${grupoFilial},${idFilial}`,
      'x-erp-module': 'MNT'

    };

    // Criando os cabeçalhos para a requisição
    const headers = new HttpHeaders(headersConfig);
    // Especificar o tipo de retorno esperado na solicitação HTTP
    return this.http
      .post<SolicitacaoAbertaResponse>(`${environment.apiRoot}MNTSRWS/api/v1/request`, dadosSolicitacao, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        retry(2),
        tap((response) => {
          this.poNotification.success('Solicitação aberta com sucesso!');

          // Subscreve ao Observable retornado por usuarioSolicitacao
          this.usuarioSolicitacao(idFilial, response.serviceRequest, dadosSolicitacao.solicitante ?? '')
            .subscribe(
              (res) => {
                console.log('Resposta da chamada usuarioSolicitacao:', res);
              },
              (err) => {
                console.error('Erro na chamada usuarioSolicitacao:', err);
              }
            );

        }),
        catchError((error) => {
          let errorMessage = 'Erro ao abrir solicitação.';
          if (error.error && error.error.errorMessage) {
            errorMessage = error.error.errorMessage;
          }
          this.poNotification.error(errorMessage);
          console.error('Erro na solicitação:', error);
          return of({}); // Em vez de propagar o erro, retorna um Observable vazio
        }),
      );
  }

  usuarioSolicitacao(filial: string, solicitacao: string, solicitante: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_SOLIC`;
    const params = new HttpParams()
      .set('FILIAL', filial)
      .set('SOLICITACAO', solicitacao)
      .set('SOLICITANTE', solicitante)

    return this.http.post(url, null, {
      params: params,
      observe: 'response'
    });

  }

  avalialcaoSolicitacao(filial: string, solicitacao: string, qualidadeServico: string, satisfacaoAtendimento: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_AVALIC`;
    const params = new HttpParams()
      .set('FILIAL', filial)
      .set('SOLICITACAO', solicitacao)
      .set('QUALIDADE', qualidadeServico)
      .set('SATISFACAO', satisfacaoAtendimento)
    return this.http.post(url, null, {
      params: params,
      observe: 'response'
    });

  }

  // ABRE NOVA ORDEM DE SERVIÇO PARA A SOLICITAÇÃO
  reabrirSolicitacao(filial: string, solicitacao: string, dadosSolicitacao: SolicitacaoProtheusOS, incidente: string): Observable<HttpResponse<object>> {

    const url = `${environment.apiRoot}MNTSRWS/api/v1/request/${solicitacao}/order`;
  
    return this.http
      .put(url, dadosSolicitacao, {
        observe: 'response',
      })
      .pipe(
        tap((response: HttpResponse<object>) => {
          console.log(
            '##### Service de Gerar a O.S. #####',
            '\nStatus da resposta HTTP:',
            response.status,
            '\nCorpo da resposta HTTP:',
            response.body,
            '\nCabeçalhos da resposta HTTP:',
            response.headers,
          );
        }),
        /** Trata a resposta da TOTSV que retorna só o número da O.S., e mais nada. (Se não tratado, gera erro.) */
        catchError((error) => {
          const numeroOsRegex = /^\d{6}$/;
          if (error.error.text && numeroOsRegex.test(error.error.text)) {
            // Objeto do tipo `HttpResponse` evita o erro: Not assignable to type Observable<HttpResponse<object>>
            const sucessoResponse = new HttpResponse({ body: { numero_os: error.error.text } });
            console.log("Número da OS recebido como 'erro', tratado como sucesso:", sucessoResponse);
                     
            return of(error.error.text);

          } else {
            console.error('Erro ao gerar a O.S.:', error);
            console.log('Service Ordens - Dados enviados ao Gerar a Ordem de Serviço `gerarOs`: ', {
              url,
              dadosSolicitacao,
              headers: this.httpOptions.headers,
            });
            return throwError(() => error);
          }
        }),
      );
  }


  addIncidenteOs(filial: string, ordem: string, incidente: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_ADDINCIDENTEOS`;
    const params = new HttpParams()
      .set('FILIAL', filial)
      .set('ORDEM', ordem)
      .set('INCIDENTE', incidente)

    return this.http.post(url, null, {
      params: params
    });

  }



}

