import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface OrdemIntermediaria {
  op_filial: string;
  op_numero: string;
  op_item: string;
  op_sequencia: string;
  op_chave: string;
  op_tipo: string;
  op_produto: string;
  op_quantidade: number;
  op_quant_apontada: number;
  op_saldo: number;
  op_um: string;
  op_local: string;
  op_emissao: string;
  op_data_fim_real: string;
  op_data_prev_ini: string;
  op_data_prev_fim: string;
  op_observacao: string;
  op_cliente?: string;
  op_tipo_prod?: string;
  produto_quant_multipla?: number | string;
  produto_altura?: number | string;
  produto_comprimento?: number | string;
  produto_largura?: number | string;
  op_status: string;
  produto_codigo: string;
  produto_descricao: string;
  produto_descricao_ing?: string;
  produto_tipo: string;
  produto_um: string;
  produto_grupo: string;
  produto_posipi: string;
  produto_locpad: string;
  apontamentos?: ApontamentoProducaoInfo[];
  reimpressoes?: ApontamentoProducaoInfo[];
}

export interface OrdemProducao extends OrdemIntermediaria {
  op_tem_intermediaria: string;
  op_qtd_intermediaria: number;
  op_intermediarias: OrdemIntermediaria[];
}

export interface OrdensProducaoResponse {
  status: string;
  msg: string;
  total_registros: number;
  total_por_status: Record<string, number>;
  ordens: OrdemProducao[];
}

export interface ApontamentoProducaoInfo {
  seq?: string;
  recurso?: string;
  um?: string;
  armazem?: string;
  numseq?: string;
  aprovador?: string;
  motivo?: string;
  operador: string;
  data_hora: string;
  quantidade: number;
  status: string;
  observacao: string;
}

export interface OrdemIntermediariaDetalhe {
  ordem: OrdemIntermediaria;
  apontamentos: ApontamentoProducaoInfo[];
  reimpressoes: ApontamentoProducaoInfo[];
}

export interface OrdemProducaoDetalhe {
  ordem: OrdemProducao;
  apontamentos: ApontamentoProducaoInfo[];
  reimpressoes: ApontamentoProducaoInfo[];
  intermediarias: OrdemIntermediariaDetalhe[];
}

export interface ApontamentoProducaoPayload {
  empresa: string;
  filial: string;
  ordem: string;
  produto: string;
  conta: string;
  parctot: string;
  perda: number;
  quantidade: number;
  um: string;
  ccusto: string;
  controle: string;
  obs: string;
}

export interface ApontamentoProducaoResponse {
  status: string;
  msg: string;
  backendMsg?: string;
  etiquetaId?: string;
  seq?: string;
  numseq?: string;
}

export interface ReimpressaoEtiquetaPayload {
  empresa: string;
  filial: string;
  produto: string;
  local: string;
  numseq: string;
  usuario: string;
  seq: string;
  ordem: string;
  motivo: string;
}

export interface ReimpressaoEtiquetaResponse {
  status: string;
  msg: string;
  backendMsg?: string;
  papel?: string;
  user_codigo?: string;
  user_nome?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProducaoService {
  private httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders(),
  };

  constructor(private httpClient: HttpClient) {
    this.updateHttpOptions('');
  }

  private updateHttpOptions(filial: string): void {
    const filialAtual = filial || environment.filial || '';
    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        Rotina: 'uSimp05B',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        Tenantid: `${environment.grupo},${filialAtual}`,
        'x-erp-module': 'SIGAPCP',
      }),
    };
  }

  private limparString(str: string): string {
    return String(str || '').trim().replace(/[^a-zA-Z0-9-_,]/g, '');
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

  private normalizeStatus(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();
    return normalized === 'OUTROS' ? 'FINALIZADA' : normalized;
  }

  private getTipoProdutoPorPapelCodigo(): string {
    const papelCodigo = String(sessionStorage.getItem('papel_codigo') || '').trim();

    if (papelCodigo === '04') {
      return '1';
    }

    if (papelCodigo === '05') {
      return '2,5';
    }

    return '';
  }

  private resolveTipoProduto(tipoProduto: string): string {
    const tipoProdutoAtual = this.limparString(tipoProduto || '');
    if (tipoProdutoAtual) {
      return tipoProdutoAtual;
    }

    return this.getTipoProdutoPorPapelCodigo();
  }

  private normalizeText(value: unknown): string {
    return String(value || '')
      .replace(/Â/g, '')
      .replace(/â€“|â€”/g, '-')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã£/g, 'ã')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ã´/g, 'ô')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã/g, 'à');
  }

  private deduplicateByNumseq(items: ApontamentoProducaoInfo[]): ApontamentoProducaoInfo[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      const numseq = String(item?.numseq || '').trim();
      if (!numseq) {
        return true;
      }
      if (seen.has(numseq)) {
        return false;
      }
      seen.add(numseq);
      return true;
    });
  }

  private normalizeOrdem<T extends OrdemIntermediaria>(ordem: T): T {
    const ordemComIntermediarias = ordem as T & { op_intermediarias?: OrdemIntermediaria[] };

    return {
      ...ordem,
      op_status: this.normalizeStatus(ordem.op_status),
      op_observacao: this.normalizeText(ordem.op_observacao),
      op_cliente: this.normalizeText(ordem.op_cliente),
      produto_descricao: this.normalizeText(ordem.produto_descricao),
      produto_descricao_ing: this.normalizeText(ordem.produto_descricao_ing),
      op_intermediarias: Array.isArray(ordemComIntermediarias.op_intermediarias)
        ? ordemComIntermediarias.op_intermediarias.map((item) => this.normalizeOrdem(item))
        : undefined,
    } as T;
  }

  listarOrdensProducao(
    filial: string,
    offset: number = 1,
    limit?: number,
    dataDe?: string,
    dataAte?: string,
    step?: string,
    ordem?: string,
    produto?: string,
    tipoProduto: string = '',
  ): Observable<OrdensProducaoResponse> {
    this.updateHttpOptions(filial);

    const params: string[] = [];
    const filialAtual = this.limparString(filial || environment.filial || '');
    const ordemAtual = this.limparString(ordem || '');
    const produtoAtual = this.limparString(produto || '');
    const tipoProdutoAtual = this.resolveTipoProduto(tipoProduto);
    const stepAtual = this.limparString(step || '');

    if (!dataDe || !dataAte) {
      const defaults = this.getDefaultDateRange();
      dataDe = dataDe || defaults.dataDe;
      dataAte = dataAte || defaults.dataAte;
    }

    if (filialAtual) {
      params.push(`filial=${encodeURIComponent(filialAtual)}`);
    }
    if (offset !== undefined && offset !== null) {
      params.push(`offset=${offset}`);
    }
    if (limit !== undefined && limit !== null) {
      params.push(`limit=${limit}`);
    }
    if (dataDe) {
      params.push(`dataDe=${encodeURIComponent(dataDe)}`);
    }
    if (dataAte) {
      params.push(`dataAte=${encodeURIComponent(dataAte)}`);
    }
    if (stepAtual) {
      params.push(`step=${encodeURIComponent(stepAtual)}`);
    }
    if (ordemAtual) {
      params.push(`ordem=${encodeURIComponent(ordemAtual)}`);
    }
    if (produtoAtual) {
      params.push(`produto=${encodeURIComponent(produtoAtual)}`);
    }
    params.push(`tipoProduto=${encodeURIComponent(tipoProdutoAtual)}`);

    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;

    return this.httpClient.get<any>(url, this.httpOptions).pipe(
      retry(1),
      map((response) => this.normalizeResponse(response)),
      catchError((error) => throwError(() => error)),
    );
  }

  getDetalheOrdemProducao(
    filial: string,
    numero: string,
    item: string,
    sequencia: string,
    intermediario?: string,
    tipoProduto: string = '',
  ): Observable<OrdemProducaoDetalhe> {
    this.updateHttpOptions(filial);

    const params: string[] = [];
    const filialAtual = this.limparString(filial || environment.filial || '');
    const numeroAtual = this.limparString(numero || '');
    const itemAtual = this.limparString(item || '');
    const sequenciaAtual = this.limparString(sequencia || '');
    const intermediarioAtual = this.limparString(intermediario || '');
    const tipoProdutoAtual = this.resolveTipoProduto(tipoProduto);
    const url = `${environment.apiRoot}apiSimplify`;
    const headers = this.httpOptions.headers.set('Rotina', 'uSimp05C');

    if (filialAtual) {
      params.push(`filial=${encodeURIComponent(filialAtual)}`);
    }
    if (numeroAtual) {
      params.push(`ordem=${encodeURIComponent(numeroAtual)}`);
    }
    if (itemAtual) {
      params.push(`item=${encodeURIComponent(itemAtual)}`);
    }
    if (sequenciaAtual) {
      params.push(`sequencia=${encodeURIComponent(sequenciaAtual)}`);
    }
    if (intermediarioAtual) {
      params.push(`intermediario=${encodeURIComponent(intermediarioAtual)}`);
    }
    params.push(`tipoProduto=${encodeURIComponent(tipoProdutoAtual)}`);

    const query = params.length ? `?${params.join('&')}` : '';

    return this.httpClient.get<any>(`${url}${query}`, { headers }).pipe(
      retry(1),
      map((response) => this.normalizeDetalheResponse(response, numeroAtual, itemAtual, sequenciaAtual)),
      catchError((error) => throwError(() => error)),
    );
  }

  apontarProducao(payload: Partial<ApontamentoProducaoPayload>): Observable<ApontamentoProducaoResponse> {
    const filialAtual = this.limparString(payload.filial || environment.filial || '');
    const empresaAtual = this.limparString(payload.empresa || environment.grupo || '');
    const headers = this.httpOptions.headers
      .set('Rotina', 'uSimp05D')
      .set('Tenantid', `${empresaAtual},${filialAtual}`);
    const body: ApontamentoProducaoPayload = {
      empresa: empresaAtual,
      filial: filialAtual,
      ordem: this.limparString(payload.ordem || ''),
      produto: this.limparString(payload.produto || ''),
      conta: this.limparString(payload.conta || ''),
      parctot: this.limparString(payload.parctot || ''),
      perda: Number(payload.perda || 0),
      quantidade: Number(payload.quantidade || 0),
      um: this.limparString(payload.um || ''),
      ccusto: this.limparString(payload.ccusto || ''),
      controle: this.limparString(payload.controle || ''),
      obs: String(payload.obs || '').trim(),
    };

    return this.httpClient.post<any>(`${environment.apiRoot}apiSimplify`, body, { headers }).pipe(
      map((response) => this.normalizeApontamentoResponse(response)),
      catchError((error) => throwError(() => error)),
    );
  }

  reimprimirEtiqueta(
    payload: Partial<ReimpressaoEtiquetaPayload>,
    user: string,
    pass: string,
    motivo: string,
  ): Observable<ReimpressaoEtiquetaResponse> {
    const filialAtual = this.limparString(payload.filial || environment.filial || '');
    const empresaAtual = this.limparString(payload.empresa || environment.grupo || '');
    const userAtual = String(user || '').trim();
    const passAtual = String(pass || '').trim();
    const motivoAtual = String(motivo || '').trim();
    const headers = this.httpOptions.headers
      .set('Rotina', 'uSimp02C')
      .set('Tenantid', `${empresaAtual},${filialAtual}`);
    const body: ReimpressaoEtiquetaPayload = {
      empresa: empresaAtual,
      filial: filialAtual,
      produto: this.limparString(payload.produto || ''),
      local: this.limparString(payload.local || ''),
      numseq: this.limparString(payload.numseq || ''),
      usuario: String(payload.usuario || '').trim(),
      seq: this.limparString(payload.seq || ''),
      ordem: this.limparString(payload.ordem || ''),
      motivo: motivoAtual,
    };
    const query = `?user=${encodeURIComponent(userAtual)}&pass=${encodeURIComponent(passAtual)}&motivo=${encodeURIComponent(motivoAtual)}&MOTIVO=${encodeURIComponent(motivoAtual)}`;

    return this.httpClient.post<any>(`${environment.apiRoot}apiSimplify${query}`, body, { headers }).pipe(
      map((response) => this.normalizeReimpressaoResponse(response)),
      catchError((error) => throwError(() => error)),
    );
  }

  getDetalheOrdemProducaoMock(
    numero: string,
    item: string,
    sequencia: string,
  ): Observable<OrdemProducaoDetalhe> {
    const numeroBase = numero || '054608';
    const itemBase = item || '01';
    const sequenciaBase = sequencia || '001';

    const ordemPrincipal: OrdemProducao = {
      op_filial: environment.filial || '020101',
      op_numero: numeroBase,
      op_item: itemBase,
      op_sequencia: sequenciaBase,
      op_chave: `${numeroBase}${itemBase}${sequenciaBase}`,
      op_tipo: 'PRINCIPAL',
      op_produto: 'NFBMF0678A',
      op_quantidade: 192,
      op_quant_apontada: 68,
      op_saldo: 124,
      op_um: 'PC',
      op_local: '01',
      op_emissao: '20260109',
      op_data_fim_real: '',
      op_data_prev_ini: '20260109',
      op_data_prev_fim: '20260112',
      op_observacao: 'OP principal mockada para detalhamento da rotina de producao.',
      op_tipo_prod: 'Serraria',
      op_status: 'ABERTA',
      produto_codigo: 'NFBMF0678A',
      produto_descricao: '020239C261 NF 220V MF REV 03',
      produto_descricao_ing: '020239C261 NF 220V MF REV 03',
      produto_tipo: 'PA',
      produto_um: 'PC',
      produto_grupo: '001',
      produto_posipi: '8516.79.00',
      produto_locpad: '01',
      op_tem_intermediaria: 'S',
      op_qtd_intermediaria: 2,
      op_intermediarias: [
        {
          op_filial: environment.filial || '020101',
          op_numero: numeroBase,
          op_item: itemBase,
          op_sequencia: '002',
          op_chave: `${numeroBase}${itemBase}002`,
          op_tipo: 'INTERMEDIARIA',
          op_produto: '9062.0022',
          op_quantidade: 58,
          op_quant_apontada: 58,
          op_saldo: 0,
          op_um: 'PC',
          op_local: '01',
          op_emissao: '20260109',
          op_data_fim_real: '20260109',
          op_data_prev_ini: '20260109',
          op_data_prev_fim: '20260109',
          op_observacao: 'Conjunto preparado para linha EV.',
          op_tipo_prod: 'Classificacao',
          op_status: 'FINALIZADA',
          produto_codigo: '9062.0022',
          produto_descricao: 'SERP PREPARADA EV NF MF E034',
          produto_descricao_ing: 'SERP PREPARED EV NF MF E034',
          produto_tipo: 'PI',
          produto_um: 'PC',
          produto_grupo: '002',
          produto_posipi: '0000.00.00',
          produto_locpad: '01',
        },
        {
          op_filial: environment.filial || '020101',
          op_numero: numeroBase,
          op_item: itemBase,
          op_sequencia: '003',
          op_chave: `${numeroBase}${itemBase}003`,
          op_tipo: 'INTERMEDIARIA',
          op_produto: 'REBMF0033A',
          op_quantidade: 192,
          op_quant_apontada: 0,
          op_saldo: 192,
          op_um: 'PC',
          op_local: '01',
          op_emissao: '20260109',
          op_data_fim_real: '',
          op_data_prev_ini: '20260109',
          op_data_prev_fim: '20260109',
          op_observacao: 'Montagem inicial da base do produto final.',
          op_tipo_prod: 'Remanofatura',
          op_status: 'ABERTA',
          produto_codigo: 'REBMF0033A',
          produto_descricao: '020204R613 RES 220V VN12',
          produto_descricao_ing: '020204R613 RES 220V VN12',
          produto_tipo: 'PI',
          produto_um: 'PC',
          produto_grupo: '002',
          produto_posipi: '0000.00.00',
          produto_locpad: '01',
        },
      ],
    };

    const apontamentos: ApontamentoProducaoInfo[] = [
      {
        um: 'PC',
        recurso: 'LINHA-01',
        operador: 'Carlos Henrique',
        data_hora: '09/01/2026 08:10',
        quantidade: 24,
        status: 'Concluido',
        observacao: 'Inicio da producao com setup validado.',
      },
      {
        um: 'PC',
        recurso: 'LINHA-01',
        operador: 'Mariana Souza',
        data_hora: '09/01/2026 13:45',
        quantidade: 44,
        status: 'Concluido',
        observacao: 'Lote liberado apos inspeção da qualidade.',
      },
    ];

    const reimpressoes: ApontamentoProducaoInfo[] = [
      {
        um: 'PC',
        operador: 'Supervisor PCP',
        data_hora: '09/01/2026 15:02',
        quantidade: 44,
        status: 'REIMPRESSAO',
        observacao: 'Etiqueta reimpressa para nova colagem.',
        armazem: '01',
        numseq: '000123456',
        aprovador: 'Carlos Gestor',
        motivo: 'Etiqueta danificada na aplicacao.',
      },
    ];

    const intermediarias: OrdemIntermediariaDetalhe[] = ordemPrincipal.op_intermediarias.map((ordem, index) => ({
      ordem,
      apontamentos: [
        {
          um: 'PC',
          recurso: `POSTO-0${index + 1}`,
          operador: index === 0 ? 'Felipe Rocha' : 'Camila Prado',
          data_hora: '09/01/2026 09:20',
          quantidade: index === 0 ? 58 : 36,
          status: index === 0 ? 'Concluido' : 'Parcial',
          observacao: index === 0 ? 'Intermediaria finalizada sem perdas.' : 'Aguardando liberacao de componente.',
        },
        {
          um: 'PC',
          recurso: `POSTO-0${index + 1}`,
          operador: index === 0 ? 'Felipe Rocha' : 'Camila Prado',
          data_hora: '09/01/2026 14:05',
          quantidade: index === 0 ? 0 : 0,
          status: index === 0 ? 'Fechado' : 'Pendente',
          observacao: index === 0 ? 'OP encerrada.' : 'Sem novo apontamento ate o momento.',
        },
      ],
      reimpressoes: index === 0
        ? [{
            um: 'PC',
            operador: 'Supervisor PCP',
            data_hora: '09/01/2026 14:40',
            quantidade: 58,
            status: 'REIMPRESSAO',
            observacao: 'Etiqueta reimpressa para conferencia final.',
            armazem: '01',
            numseq: '000654321',
            aprovador: 'Marcos Lider',
            motivo: 'Falha na impressao original.',
          }]
        : [],
    }));

    return of({
      ordem: ordemPrincipal,
      apontamentos,
      reimpressoes,
      intermediarias,
    });
  }

  private normalizeResponse(response: any): OrdensProducaoResponse {
    const source = response?.data && !Array.isArray(response?.data) ? response.data : response;
    const ordens = Array.isArray(source?.ordens)
      ? source.ordens
      : Array.isArray(source?.ordens_producao)
        ? source.ordens_producao
        : Array.isArray(source?.producao)
          ? source.producao
      : Array.isArray(response?.ordens)
        ? response.ordens
        : Array.isArray(response?.ordens_producao)
          ? response.ordens_producao
          : Array.isArray(response?.producao)
            ? response.producao
        : [];

    const totalPorStatusRaw =
      source?.total_por_status ??
      response?.total_por_status ??
      {};

    const totalPorStatus = Object.entries(totalPorStatusRaw as Record<string, unknown>).reduce<Record<string, number>>(
      (acc, [status, total]) => {
        const value = Number(total);
        const normalizedStatus = this.normalizeStatus(String(status));
        acc[normalizedStatus] = (acc[normalizedStatus] || 0) + (Number.isNaN(value) ? 0 : value);
        return acc;
      },
      {},
    );

    return {
      status: String(source?.status ?? response?.status ?? '').trim().toUpperCase(),
      msg: String(source?.msg ?? response?.msg ?? '').trim(),
      total_registros: Number(source?.total_registros ?? response?.total_registros ?? ordens.length ?? 0),
      total_por_status: totalPorStatus,
      ordens: (ordens as OrdemProducao[]).map((ordem) => this.normalizeOrdem(ordem)),
    };
  }

  private normalizeDetalheResponse(
    response: any,
    numero: string,
    item: string,
    sequencia: string,
  ): OrdemProducaoDetalhe {
    const normalized = this.normalizeResponse(response);
    const ordem =
      normalized.ordens.find(
        (current) =>
          (!numero || current.op_numero === numero) &&
          (!item || current.op_item === item) &&
          (!sequencia || current.op_sequencia === sequencia),
      ) ||
      normalized.ordens[0];

    if (!ordem) {
      throw new Error('Ordem de producao nao encontrada.');
    }

    const apontamentosPrincipal = Array.isArray(ordem.apontamentos)
      ? this.deduplicateByNumseq(
          ordem.apontamentos.filter((item) => String(item?.status || '').trim().toUpperCase() !== 'REIMPRESSAO'),
        )
      : [];
    const reimpressoesPrincipal = Array.isArray(ordem.reimpressoes)
      ? ordem.reimpressoes
      : Array.isArray(ordem.apontamentos)
        ? ordem.apontamentos.filter((item) => String(item?.status || '').trim().toUpperCase() === 'REIMPRESSAO')
        : [];
    const intermediarias: OrdemIntermediariaDetalhe[] = (ordem.op_intermediarias || []).map((ordemIntermediaria) => ({
      ordem: {
        ...ordemIntermediaria,
        apontamentos: Array.isArray(ordemIntermediaria.apontamentos)
          ? this.deduplicateByNumseq(
              ordemIntermediaria.apontamentos.filter(
                (item) => String(item?.status || '').trim().toUpperCase() !== 'REIMPRESSAO',
              ),
            )
          : [],
        reimpressoes: Array.isArray(ordemIntermediaria.reimpressoes)
          ? ordemIntermediaria.reimpressoes
          : [],
      },
      apontamentos: Array.isArray(ordemIntermediaria.apontamentos)
        ? this.deduplicateByNumseq(
            ordemIntermediaria.apontamentos.filter(
              (item) => String(item?.status || '').trim().toUpperCase() !== 'REIMPRESSAO',
            ),
          )
        : [],
      reimpressoes: Array.isArray(ordemIntermediaria.reimpressoes)
        ? ordemIntermediaria.reimpressoes
        : Array.isArray(ordemIntermediaria.apontamentos)
          ? ordemIntermediaria.apontamentos.filter(
              (item) => String(item?.status || '').trim().toUpperCase() === 'REIMPRESSAO',
            )
          : [],
    }));

    return {
      ordem: {
        ...ordem,
        apontamentos: apontamentosPrincipal,
        reimpressoes: reimpressoesPrincipal,
      },
      apontamentos: apontamentosPrincipal,
      reimpressoes: reimpressoesPrincipal,
      intermediarias,
    };
  }

  private normalizeApontamentoResponse(response: any): ApontamentoProducaoResponse {
    const source = response?.data && !Array.isArray(response?.data) ? response.data : response;
    const innerData = response?.data && !Array.isArray(response?.data) ? response.data : undefined;

    return {
      status: String(source?.status ?? response?.status ?? '').trim(),
      msg: String(source?.msg ?? response?.msg ?? '').trim(),
      backendMsg: String(response?.msg ?? '').trim(),
      etiquetaId: String(innerData?.msg ?? '').trim(),
      seq: String(innerData?.seq ?? response?.seq ?? '').trim(),
      numseq: String(innerData?.numseq ?? response?.numseq ?? '').trim(),
    };
  }

  private normalizeReimpressaoResponse(response: any): ReimpressaoEtiquetaResponse {
    const source = response?.data && !Array.isArray(response?.data) ? response.data : response;

    return {
      status: String(source?.status ?? response?.status ?? '').trim(),
      msg: String(source?.msg ?? response?.msg ?? '').trim(),
      backendMsg: String(response?.msg ?? source?.msg ?? '').trim(),
      papel: String(source?.papel ?? response?.papel ?? '').trim(),
      user_codigo: String(source?.user_codigo ?? response?.user_codigo ?? '').trim(),
      user_nome: String(source?.user_nome ?? response?.user_nome ?? '').trim(),
    };
  }
}
