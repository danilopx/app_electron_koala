import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, tap, timeout } from 'rxjs/operators';
import { SolicitacaoServico } from '../../../interfaces/solicitacao-servico.interface';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class SolicitacoesService {
  private httpOptions: any;
  private totalPorStep: Record<string, number> = {};

  constructor(private httpClient: HttpClient) {
    this.updateHttpOptions('', '');
  }

  private formatDateParam(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private getDefaultDateRange(): { dataDe: string; dataAte: string } {
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 3);
    return {
      dataDe: this.formatDateParam(start),
      dataAte: this.formatDateParam(end),
    };
  }

  private updateHttpOptions(filial: string, rotina: string): void {
    const setFilial = filial === '' ? environment.filial : filial;
    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        Rotina: `${rotina}`,
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        Tenantid: `${environment.grupo},${setFilial}`,
        'x-erp-module': 'SIGAMNT',
      }),
    };
  }

  private limparString(str: string): string {
    return str.trim().replace(/[^a-zA-Z0-9-_]/g, '');
  }

  private extrairSolicitacoesDaResposta(response: any): SolicitacaoServico[] {
    if (!response) return [];

    if (Array.isArray(response?.solicitacao)) {
      return response.solicitacao as SolicitacaoServico[];
    }

    if (Array.isArray(response?.ordens_de_servico)) {
      return response.ordens_de_servico as SolicitacaoServico[];
    }

    if (Array.isArray(response?.ordens)) {
      return response.ordens as SolicitacaoServico[];
    }

    if (Array.isArray(response?.data?.ordens_de_servico)) {
      return response.data.ordens_de_servico as SolicitacaoServico[];
    }

    if (Array.isArray(response?.data?.ordens)) {
      return response.data.ordens as SolicitacaoServico[];
    }

    if (Array.isArray(response?.data?.solicitacao)) {
      return response.data.solicitacao as SolicitacaoServico[];
    }

    if (Array.isArray(response?.items)) {
      return response.items as SolicitacaoServico[];
    }

    return [];
  }

  private normalizarTotalPorStep(rawTotalPorStep: unknown): Record<string, number> {
    if (!rawTotalPorStep) return {};

    let totalPorStepObj: unknown = rawTotalPorStep;
    if (typeof rawTotalPorStep === 'string') {
      try {
        totalPorStepObj = JSON.parse(rawTotalPorStep);
      } catch {
        return {};
      }
    }

    if (typeof totalPorStepObj !== 'object' || totalPorStepObj === null) {
      return {};
    }

    const resultado: Record<string, number> = {};
    Object.entries(totalPorStepObj as Record<string, unknown>).forEach(([step, valor]) => {
      const numero = Number(valor);
      if (!Number.isNaN(numero)) {
        resultado[String(step).trim()] = numero;
      }
    });
    return resultado;
  }

  private atualizarTotalPorStep(response: any): void {
    const rawTotalPorStep =
      response?.total_por_step ??
      response?.data?.total_por_step ??
      response?.totais?.total_por_step;

    this.totalPorStep = this.normalizarTotalPorStep(rawTotalPorStep);
  }

  getTotalPorStep(): Record<string, number> {
    return { ...this.totalPorStep };
  }

  private normalizarPrioridade(prioridade: string | undefined): string {
    const valor = `${prioridade ?? ''}`.trim().toLowerCase();
    if (valor === '1' || valor === 'alta') return 'alta';
    return 'baixa';
  }

  getSolicitacoesSimplifyA(
    filial: string,
    pedido: string,
    offset: number = 1,
    limit?: number,
    solicitacao?: string,
    dataDe?: string,
    dataAte?: string,
    step?: string,
    executor?: string,
    equipamento?: string,
    ordem?: string,
  ): Observable<SolicitacaoServico[]> {
    this.updateHttpOptions(filial, 'uSimp05A');

    const params: string[] = [];
    if (!dataDe || !dataAte) {
      const defaults = this.getDefaultDateRange();
      dataDe = dataDe || defaults.dataDe;
      dataAte = dataAte || defaults.dataAte;
    }

    const filialLimpada = this.limparString(filial).trim();
    const pedidoLimpo = this.limparString(pedido).trim();
    const solicitacaoLimpa = this.limparString(solicitacao || '').trim();
    const executorLimpo = this.limparString(executor || '').trim();
    const equipamentoLimpo = this.limparString(equipamento || '').trim();
    const ordemLimpa = this.limparString(ordem || '').trim();

    if (filialLimpada) params.push(`filial=${filialLimpada}`);
    if (pedidoLimpo) params.push(`pedido=${pedidoLimpo}`);
    if (offset !== undefined && offset !== null) params.push(`offset=${offset}`);
    if (limit !== undefined && limit !== null) params.push(`limit=${limit}`);
    if (solicitacaoLimpa) params.push(`solicitacao=${solicitacaoLimpa}`);
    if (dataDe) params.push(`dataDe=${dataDe}`);
    if (dataAte) params.push(`dataAte=${dataAte}`);
    if (step) params.push(`step=${step}`);
    if (executorLimpo) params.push(`executor=${executorLimpo}`);
    if (equipamentoLimpo) params.push(`equipamento=${equipamentoLimpo}`);
    if (ordemLimpa) params.push(`ordem=${ordemLimpa}`);

    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;

    return this.httpClient.get<any>(url, this.httpOptions).pipe(
      retry(1),
      tap((response) => this.atualizarTotalPorStep(response)),
      map((response) => this.extrairSolicitacoesDaResposta(response)),
      map((solicitacoes) =>
        solicitacoes.map((solicitacao) => ({
          ...solicitacao,
          solicitacao_prioridade: this.normalizarPrioridade(solicitacao.solicitacao_prioridade),
        })),
      ),
      catchError((error) => throwError(() => error)),
    );
  }

  /**
   * Lista as S.S. das Filiais do usuário logado.
   * Foi utilizado o Overload #14 do HttpClient: https://angular.io/api/common/http/HttpClient#get
   * */
  listarSolicitacoesDaFilial(
    step?: string,
    dataDe?: string,
    dataAte?: string,
  ): Observable<SolicitacaoServico[]> {
    const filiaisParam = environment.filial ?? '';

    return this.getSolicitacoesSimplifyA(filiaisParam, '', 1, undefined, undefined, dataDe, dataAte, step).pipe(
        timeout(30000), // Limite de tempo de 3000ms (3 segundos)
        catchError((error) => {
          if (error.name === 'TimeoutError') {
            console.error('A API demorou mais de 3 segundos para responder.');
            return throwError(() => new Error('API Indisponível'));
          }
          return throwError(() => error);
        }),
      );
  }

  // API da TOTVS do SIGAMNT p/ Distribuir Solicitação de Serviço.
  // URL: https://tdn.totvs.com/pages/releaseview.action?pageId=683181217

  distribuirSolicitacao(
    solicitacaoId: string,
    solicitacaoTipo: string,
    executor: string,
    idFilial: string,
  ): Observable<object> {
 


    // Usar os Argumentos Recebidos para fazer a requisição
    const url = `${environment.apiRoot}MNTSRWS/api/v1/request/${solicitacaoId}/distribute`;
    const body = {
      executor: `${executor}`,
      serviceType: `${solicitacaoTipo}`,
    };

    console.log(
      '##### Service de Distribuição da S.S. #####',
      `\nS.S. ID: ${solicitacaoId}, \nExecutor: ${executor}`,
      `Fazendo REQUEST na API Protheus: ${url}, \nBody:`,
      body,
    );

    // ##### Requisição PUT #####
    // Atenção: Aqui o método vai retornar apenas o Observable e não vai fazer o REQUEST em si.
    // Para efetivar o REQUEST usando o Observable, você precisa chamar o método subscribe() no componente.

    return this.httpClient.put(url, body).pipe(
      // Tap: Modificador da resposta que vai aparecer após o subscribe ser invocado.
      tap((response) => {
        console.log('Service Solicitacoes - Resposta da distribuição:', response);
        console.log('Dados enviados na distribuição da solicitação:', { url, body });
      }),
      catchError((error) => {
        console.error('Erro na distribuição:', error);
        console.log('Service Solicitacoes - Dados enviados na Distribuicao `distribuirSolicitacao`: ', {
          url,
          body

        });

        // Usar o throwError para retornar o erro para o componente que chamou o método.
        // Esse método não está depreciado.
        // Essa Sintaxe: return throwError(error); está depreciada.

        return throwError(() => error);
      }),
    );
  }
}
