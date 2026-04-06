import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { EquipamentoResponse } from '../interfaces/equipamento.interface';

import { SolicitacaoServico } from '../interfaces/solicitacao-servico.interface';

@Injectable({
  providedIn: 'root',
})
export class EquipamentoService {
  constructor(private http: HttpClient) {}



  getEquipamentos(filialCodigo: string, setorCodigo: string): Observable<EquipamentoResponse> {
    // Endpoint legado dependia de `environment.apiAppMT`, removido com módulos antigos.
    return throwError(() => new Error('Rotina de equipamentos desativada.'));
  }

  //TODO - CRIAR ESSA API DENTRO DO PROTHUS, NO PYTHON NÃO ESTÁ LEVANDO EM CONSIDERAÇÃO O GRUPO DE EMPRESAS

  getEquipamentosSS(grupoCodigo: string,  filialCodigo: string, setorCodigo: string): Observable<EquipamentoResponse> {

    const params = new HttpParams().set('grupo', grupoCodigo).set('filial', filialCodigo).set('setor', setorCodigo);    
    //const url = `${environment.apiAppMT}equipamentos_ss`;
    const url = `${environment.apiRoot}EQUIPAMENTO`;
    const TEMPO_LIMITE_MS = 80000;

    return this.http.get<EquipamentoResponse>(url,  {
      params
    }).pipe(
      timeout(TEMPO_LIMITE_MS),
      catchError((error) => {
        console.error('Erro ao obter equipamentos (S.S.):', error);
        throw new Error('Erro ao obter equipamentos (S.S.). Por favor, tente novamente mais tarde.');
      }),
    );
  }

  getImagemEquipamentos(equipamentoCodigo: string): Observable<string> {
    // Repositório de imagens dependia de `environment.apiRepositorio`, removido com módulos antigos.
    return throwError(() => new Error('Rotina de imagens desativada.'));
  }
 

  listarSolicitacoesDaFilial(grupo: string, filial: string, equipamentoId: string): Observable<SolicitacaoServico[]> {

    const filialLimpada = this.limparString(filial).trim();
    const equipamentoIdLimpado = this.limparString(equipamentoId).trim();
    const url = `${environment.apiRoot}ORDEM_SERVICO`;
    const params = new HttpParams()
    .set('FILIAL', filialLimpada)
    .set('EQUIPAMENTO', equipamentoIdLimpado)
    .set('STEPS', '1,2,3,4,5,6'); 


    return this.http
      .get<{ ordens_de_servico: SolicitacaoServico[]}>(url, {
        params
      })
      .pipe(
        timeout(30000), // Limite de tempo de 3000ms (3 segundos)
        map((response) => response.ordens_de_servico.map((solicitacao) => ({
          ...solicitacao,
          solicitacao_prioridade: solicitacao.solicitacao_prioridade === '1' ? 'alta' : 'baixa',
        }))),
        catchError((error) => {
          if (error.name === 'TimeoutError') {
            console.error('A API demorou mais de 3 segundos para responder.');
            return throwError(() => new Error('API Indisponível'));
          }
          return throwError(() => error);
       
        }),
      );
  }

  verificarSolicitacoesEquipamento(grupo: string, filial: string, equipamentoId: string): Observable<SolicitacaoServico> {
    const filialLimpada = this.limparString(filial).trim();
    const equipamentoIdLimpado = this.limparString(equipamentoId).trim();

    const params = new HttpParams()
      .set('FILIAL', filialLimpada)
      .set('EQUIPAMENTO', equipamentoIdLimpado)
      .set('STEPS', '1,2,3,4,5,6'); 

    console.log(
      'Verificando se tem S.S. aberta para o equipamento clicado:',
      '\nFilial:',
      filialLimpada,
      '\nEquipamento:',
      equipamentoIdLimpado,
    );
    const url = `${environment.apiRoot}ORDEM_SERVICO`;
    
    return this.http.get<SolicitacaoServico>(url, { 
      params
    });
  }

  private limparString(str: string): string {
    // Remove espaços em branco do início e fim da string
    str = str.trim();

    // Remover alguns caracteres não alfanuméricos:
    str = str.replace(/[^a-zA-Z0-9-_]/g, '');

    return str;
  }
}
