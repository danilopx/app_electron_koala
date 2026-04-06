import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { catchError, map, retry, tap } from 'rxjs/operators';
import {
  OrdemServico,
  OrdemServicoApiResponseIn,
  OrdemServicoComentarios,
  OrdemServicoImagens,
  OrdemServicoIn,
} from '../interfaces/ordem-servico.interface';
import { InsumoOrdemView, RequisicaoOrdemView } from '../interfaces/insumo-servico.interface';
import { SolicitacaoServico, ApiResponse } from '../interfaces/solicitacao-servico.interface';

@Injectable({
  providedIn: 'root',
})
export class OrdensService {
  private httpOptions: any;
  /**
   * Método para gerar uma Ordem de Serviço (OS).
   *
   * @const origin          String - Origem de Registro. Exemplo: "TQB_ORIGEM"
   * @const costCenter      String - Centro de Custo. Exemplo: "Código do Centro de Custo"
   * @const startDate       String - Data e Hora da abertura O.S. Formato: YYYYMMDD HH:mm. Exemplo: "20220419 13:00"
   * @const situation       String - Situação da O.S. (P = Pendente / L = Liberada). Exemplo: "P"
   *
   * @param equipment       String - Código do Bem/Localização. Exemplo: "Código do Equipamento"
   * @param service         String - Código do serviço da O.S. Exemplo: "Código do Serviço"
   * @param idFilial        String - Código da Filial. Exemplo: "Código da Filial"
   * @param solicitacaoId   String - Código da Solicitação. Exemplo: "Código da Solicitação"
   * @param executorMatric  String - Código de Matrícula do Executor.
   *
   * @param solicitacaoServico
   * @returns {Observable<HttpResponse<object>>} Um observable com a resposta do servidor.
   */

  constructor(private httpClient: HttpClient) {
    this.updateHttpOptions('');
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

  private updateHttpOptions(filial: string, rotina: string = ''): void {
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

  gerarOs(
    equipment: string,
    service: string,
    idFilial: string,
    solicitacaoId: string,
    executorMatric?: string,
    solicitacaoServico?: SolicitacaoServico,
  ): Observable<HttpResponse<object>> {
    // ##### Definição de Variáveis #####
    let startDate: string | undefined;

    if (
      solicitacaoServico &&
      solicitacaoServico.solicitacao_databer &&
      solicitacaoServico.solicitacao_horaber &&
      executorMatric
    ) {
      const data = solicitacaoServico.solicitacao_databer;
      const hora = solicitacaoServico.solicitacao_horaber;

      // ##### Insumo Inicial, Obrigatório: Executor da O.S. #####

      startDate = `${data} ${hora}`;

      // Assuming `startDate` is constructed correctly above.
      console.log('Criando `startDate` usando a `rowSolicitacao` recebida em `gerarOs`...');
      console.log('Start Date: ', startDate);

      // Since 'startDate' is already in the "YYYYMMDD HH:mm" format, use it directly
      const inputs = [
        {
          operation: 'C',
          task: '0',
          type: 'M', // M = Mão de Obra.
          code: executorMatric,
          unity: 'H',
          amount: 1,
          isDone: false,
          date: startDate, // Directly using 'startDate' here
        },
      ];

      console.log('Insumo Inicial, Obrigatório: Executor da O.S.', inputs);

      // Defaults de manutenção via environment foram removidos com módulos antigos.
      const origin = '';
      const costCenter = '';
      const situation = '';
      const url_geraros = `${environment.apiRoot}MNTSRWS/api/v1/request/${solicitacaoId}/order`;

      /**
       * Construir o `body` da requisição, para gerar a O.S.
       * Ref: https://tdn.totvs.com/pages/releaseview.action?pageId=683181217#0-1
       * */
      const body_geraros: OrdemServico = {
        origin: `${origin}`,
        equipment: `${equipment}`,
        costCenter: `${costCenter}`,
        startDate: `${startDate}`,
        service: `${service}`,
        situation: `${situation}`,

        // Spread + Short-circuit evaluation - Inclui o campo `insumos` no body, somente se houver insumos.
        ...(inputs && { inputs }),
      };

      return this.httpClient
        .put(url_geraros, body_geraros, {
          observe: 'response',
          responseType: 'text', // <- isso aqui é crucial
        })
        .pipe(
          map((response: HttpResponse<string>) => {
            const numeroOsRegex = /^\d{6}$/;
            if (numeroOsRegex.test(response.body ?? '')) {
              return new HttpResponse({ body: { numero_os: response.body } });
            } else {
              throw new Error('Resposta inesperada do servidor');
            }
          }),
          catchError((error) => {
            console.error('Erro ao gerar a O.S.:', error);
            return throwError(() => error);
          }),
        );
    } else {
      // Fix: The `return` below, fixes error on Observable<HttpResponse<objec>>.
      return throwError(
        () => new Error('Solicitação de serviço não fornecida ou dados insuficientes para gerar startDate.'),
      );
    }
  }

  listarOrdensServico(grupo: string, filial: string, equipamentoId: string): Observable<OrdemServicoIn[]> {
    return this.getOrdemServicoSimplifyA(filial, '', 1, undefined, undefined, undefined, undefined, '1,2,3,4,5,6', undefined, equipamentoId, undefined);
  }

  getOrdemServicoSimplifyA(
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
  ): Observable<OrdemServicoIn[]> {
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

    if (filialLimpada) {
      params.push(`filial=${filialLimpada}`);
    }
    if (pedidoLimpo) {
      params.push(`pedido=${pedidoLimpo}`);
    }
    if (offset !== undefined && offset !== null) {
      params.push(`offset=${offset}`);
    }
    if (limit !== undefined && limit !== null) {
      params.push(`limit=${limit}`);
    }
    if (solicitacaoLimpa) {
      params.push(`solicitacao=${solicitacaoLimpa}`);
    }
    if (dataDe) {
      params.push(`dataDe=${dataDe}`);
    }
    if (dataAte) {
      params.push(`dataAte=${dataAte}`);
    }
    if (step) {
      params.push(`step=${step}`);
    }
    if (executorLimpo) {
      params.push(`executor=${executorLimpo}`);
    }
    if (equipamentoLimpo) {
      params.push(`equipamento=${equipamentoLimpo}`);
    }
    if (ordemLimpa) {
      params.push(`ordem=${ordemLimpa}`);
    }

    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    const options = {
      ...this.httpOptions,
    };

    return this.httpClient.get<any>(url, options).pipe(
      retry(1),
      map((response) => this.extrairOrdensServicoDaResposta(response)),
      map((ordens) =>
        ordens.filter(
          (ordemServico) =>
            ordemServico.ordem_id !== null && ordemServico.ordem_id !== undefined && ordemServico.ordem_id !== '',
        ),
      ),
      catchError((error) => {
        console.error('Erro ao listar ordens via rotina uSimp05A:', error);
        return throwError(() => error);
      }),
    );
  }

  private extrairOrdensServicoDaResposta(response: any): OrdemServicoIn[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response?.solicitacao)) {
      return response.solicitacao as OrdemServicoIn[];
    }

    if (Array.isArray(response?.ordens_de_servico)) {
      return response.ordens_de_servico as OrdemServicoIn[];
    }

    if (Array.isArray(response?.ordens)) {
      return response.ordens as OrdemServicoIn[];
    }

    if (Array.isArray(response?.data?.ordens_de_servico)) {
      return response.data.ordens_de_servico as OrdemServicoIn[];
    }

    if (Array.isArray(response?.data?.ordens)) {
      return response.data.ordens as OrdemServicoIn[];
    }

    if (Array.isArray(response?.data?.solicitacao)) {
      return response.data.solicitacao as OrdemServicoIn[];
    }

    if (Array.isArray(response?.items)) {
      return response.items as OrdemServicoIn[];
    }

    return [];
  }

  private limparString(str: string): string {
    // Remove espaços em branco do início e fim da string
    str = str.trim();

    // Remover alguns caracteres não alfanuméricos:
    str = str.replace(/[^a-zA-Z0-9-_]/g, '');

    return str;
  }

  /** Com esse método, verificamos mudanças significativas nas O.S. recebidas e a partir disso, decidimos se
   * a lista de Ordens de Serviço deve ser atualizada ou não, de acordo com as regras de negócio definidas.
   *
   * Tenta implementar `Guard Causes` para evitar `Nested Ifs`.
   * Ref: https://refactoring.guru/replace-nested-conditional-with-guard-clauses
   * */
  verSeAlteraOrdensServico(ordensServicoAtual: OrdemServicoIn[], ordensServicoNova: OrdemServicoIn[]): boolean {
    // 1. Carga Inicial - Se for `False` não avança para o `Tap`.
    console.log(
      'Ver se altera a O.S.. 1. Carga Inicial: ',
      ordensServicoAtual.length == 0 && ordensServicoNova.length == 0,
    );
    if (ordensServicoAtual.length == 0 && ordensServicoNova.length == 0) return true;

    // 2. Verifica se existem novas O.S. na lista.
    console.log(
      'Ver se altera a O.S.. 2. Verifica se existem novas O.S. na lista: ',
      ordensServicoAtual.length !== ordensServicoNova.length,
    );
    return ordensServicoAtual.length !== ordensServicoNova.length;
  }

  /** Filtra os Insumos para remover a chave principal chamada `detalhes_os` e transformar os insumos em uma lista
   * do tipo da Interface InsumoOrdemView. */
  listarInsumosDaOS(ordemServicoId: OrdemServicoIn): Observable<InsumoOrdemView[]> {
    //const url = `${environment.apiAppMT}ordens_servico/${ordemServicoId.ordem_id}/insumos?ordem_filial=${ordemServicoId.ordem_filial}`;

    const url = `${environment.apiRoot}ORDEM_SERVICO_INSUMO`;
    const params = new HttpParams().set('FILIAL', ordemServicoId.ordem_filial).set('ORDEM', ordemServicoId.ordem_id);

    return this.httpClient
      .post<{ insumos: { detalhes_insumo: InsumoOrdemView }[] }>(url, null, {
        params: params,
      })
      .pipe(map((response) => response.insumos.map((item) => item.detalhes_insumo)));
  }

  /** Ele pega a ID da Ordem de Servico atual, e o JSON do Insumo pra incluir o Insumo na O.S.
   *
   * JSON:
   *
   * {
   *   "insumo_codigo": "string",
   *   "insumo_quantidade": "string",
   *   "insumo_tipo": "string",
   *   "insumo_unidade": "string",
   *   "ordem_filial": "string"
   * }
   *
   * De acordo com a Interface `InsumoOrdemView`.
   * A ID da Ordem de Serviço deve ser enviada no `Path`.
   *
   * */
  incluirInsumoNaOS(
    filial: string,
    ordemServicoId: OrdemServicoIn,
    insumo: InsumoOrdemView,
  ): Observable<HttpResponse<object>> {
    console.log(`Incluindo Insumo com as seguintes informações:`, insumo);
    const url = `${environment.apiRoot}INSUMO_INCLUIR?ORDEM_SERV=${ordemServicoId.ordem_id}&FILIAL_SERV=${filial}`;
    return this.httpClient.put(url, insumo, { observe: 'response' });
  }

  adicionarRequisicaoAlmox(filial: string, ordem: string, requisicao: RequisicaoOrdemView): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_SOLIC_AMZ?FILIAL=${filial}&ORDEM=${ordem}&ACTION=incluir`;
    const body = {
      requisicao,
    };

    const tenantid = String(environment.tenantId || '');

    const headersConfig = {
      Accept: 'application/json; text/plain',
      'Content-type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
      tenantId: tenantid,
      'x-erp-module': 'MNT',
      timeout: '40000',
    };

    const headers = new HttpHeaders(headersConfig);

    return this.httpClient.post(url, body, {
      headers,
      observe: 'response',
    });
  }

  iniciarOrdemServico(filial: string, ordem: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_START`;

    const params = new HttpParams().set('FILIAL', filial).set('ORDEM', ordem);

    return this.httpClient.post(url, null, {
      params: params,
      observe: 'response',
    });
  }

  excluirExecutor(filial: string, ordem: string, executor: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_INSUMO_EXCLUIR`;

    const params = new HttpParams().set('FILIAL', filial).set('ORDEM', ordem).set('CODIGO', executor);

    return this.httpClient.post(url, null, {
      params: params,
      observe: 'response',
    });
  }

  finalizarOrdemServico(
    filial: string,
    ordem: string,
    probelma: string,
    causa: string,
    solucao: string,
  ): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_END`;
    const params = new HttpParams()
      .set('FILIAL', filial)
      .set('ORDEM', ordem)
      .set('PROBLEMA', probelma)
      .set('CAUSA', causa)
      .set('SOLUCAO', solucao);

    return this.httpClient.post(url, null, {
      params: params,
      observe: 'response',
    });
  }

  aprovaOrdemServico(filial: string, ordem: string, aprovacao: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_APROV`;

    const params = new HttpParams().set('FILIAL', filial).set('ORDEM', ordem).set('APROVACAO', aprovacao);

    return this.httpClient.post(url, null, {
      params: params,
      observe: 'response',
    });
  }

  tipoOrdemServico(filial: string, ordem: string, tipo: string): Observable<object> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_TIPO_ALTERAR`;

    const params = new HttpParams().set('FILIAL', filial).set('ORDEM', ordem).set('TIPO', tipo);

    return this.httpClient.put(url, null, {
      params: params,
      observe: 'response',
    });
  }

  baixaReqOrdemServico(filial: string, ordem: string): Observable<HttpResponse<ApiResponse>> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_BAIXA_REQ`;
    const params = new HttpParams().set('FILIAL', filial).set('REQUISICAO', ordem);

    return this.httpClient.post<ApiResponse>(url, null, {
      params: params,
      observe: 'response',
    });
  }

  adicionarComentarioNaOs(ordemId: string, filial: string, textoComentario: string, usuario: string): Observable<any> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_COMENTARIO_INCLUIR?FILIAL=${filial}&ORDEM=${ordemId}&TEXTO=${textoComentario}&USUARIO=${usuario}`;

    return this.httpClient.put(url, null);
  }

  listarComentariosDaOs(ordemId: string, filial: string): Observable<OrdemServicoComentarios> {
    const url = `${environment.apiRoot}ORDEM_SERVICO_COMENTARIO?ORDEM=${ordemId}`;

    return this.httpClient.get<OrdemServicoComentarios>(url);
  }

  listarImagensOs(ordemId: string, grupo: string, filial: string): Observable<OrdemServicoImagens> {
    // Repositório de imagens dependia de `environment.apiRepositorio`, removido com módulos antigos.
    return throwError(() => new Error('Rotina de imagens da O.S. desativada.'));
  }

  verificarPrioridade(prioridade: string | undefined): string {
    switch (prioridade) {
      case '1':
        return 'ALTA';
      case '2':
        return 'MÉDIA';
      case '3':
        return 'BAIXA';
      default:
        return 'NÃO DEFINIDA'; // Para casos em que a prioridade não é 1, 2 ou 3
    }
  }
}
