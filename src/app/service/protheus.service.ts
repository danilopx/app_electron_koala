import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { Itabela } from '../interfaces/interface-tabela';
import { ItabelaItens } from '../interfaces/interface-tabelaItens';

@Injectable()
export class ProtheusService {
  private httpOptions: any;
  constructor(private http: HttpClient) {
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

  private updateHttpOptions(filial: string, rotina: string = ""): void {
    const setfilial = filial == '' ? environment.filial : filial;
    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        Rotina: `${rotina}`,
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Tenantid': `${environment.grupo},${setfilial}`,
        'x-erp-module': 'SIGAFAT',
      }),
    };
  }

  getProduto(filial: string, tabela: string, tipo: string): Observable<any> {
    this.updateHttpOptions(filial);
    const url = `${environment.apiRoot}TABPRODUTOS/${filial}/${tabela}/${tipo}`;
    return this.http.get<ItabelaItens>(url, this.httpOptions).pipe(retry(1), catchError(this.handleError));
  }

  /////////////////////////////////intercompany////////////////////////////////////////////////////
  getPedidos(limit: number, tipo: string, filial: string, status: string): Observable<any> {

    console.log('Status filtro:', status);

    if (status === 'TD' || status === '') {
      status =  '[A,L,B,X,F]';
    }

    const url = `${environment.apiRoot}pedicompany?offset=1&limit=${limit}&companyid=${filial}&tipo=${tipo}&items=N&status=${status}`;
    return this.http.get<any>(url).pipe(retry(1), catchError(this.handleError));
  }

  getPedido(filial: string, numero: string, tipo: string): Observable<any> {
    this.updateHttpOptions(filial);
    const url = `${environment.apiRoot}pedicompany?companyid=${filial}&tipo=${tipo}&initOrder=${numero}&finalOrder=${numero}&items=S`;
    return this.http.get<any>(url, this.httpOptions).pipe(retry(1), catchError(this.handleError));
  }

  getPedidoEtlSimplify(
    filial: string,
    pedido: string,
    cliente?: string,
    loja?: string,
  ): Observable<any> {
    this.updateHttpOptions(filial, 'uSimp03B');
    const params: string[] = [];
    if (cliente) {
      params.push(`cliente=${cliente}`);
    }
    if (loja) {
      params.push(`loja=${loja}`);
    }
    if (filial) {
      params.push(`filial=${filial}`);
    }
    if (pedido) {
      params.push(`pedido=${pedido}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    const options = {
      ...this.httpOptions,
    };
    return this.http.get<any>(url, options).pipe(retry(1), catchError(this.handleError));
  }

  getPedidoEtlSimplifyA(
    filial: string,
    pedido: string,
    cliente?: string,
    loja?: string,
    offset: number = 1,
    limit?: number,
    tipoPed?: string,
    dataDe?: string,
    dataAte?: string,
    step?: string,
  ): Observable<any> {
    this.updateHttpOptions(filial, 'uSimp03A');
    const params: string[] = [];
    if (!dataDe || !dataAte) {
      const defaults = this.getDefaultDateRange();
      dataDe = dataDe || defaults.dataDe;
      dataAte = dataAte || defaults.dataAte;
    }
    if (cliente) {
      params.push(`cliente=${cliente}`);
    }
    if (loja) {
      params.push(`loja=${loja}`);
    }
    if (filial) {
      params.push(`filial=${filial}`);
    }
    if (pedido) {
      params.push(`pedido=${pedido}`);
    }
    if (offset !== undefined && offset !== null) {
      params.push(`OFFISET=${offset}`);
    }
    if (limit !== undefined && limit !== null) {
      params.push(`LIMIT=${limit}`);
    }
    if (tipoPed) {
      params.push(`tipoPed=${tipoPed}`);
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
    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    const options = {
      ...this.httpOptions,
    };
    return this.http.get<any>(url, options).pipe(retry(1), catchError(this.handleError));
  }

  getPedidosStatusCounts(
    filial: string,
    tipoPed: string,
    dataDe?: string,
    dataAte?: string,
    cliente?: string,
    loja?: string,
  ): Observable<any> {
    this.updateHttpOptions(filial, 'uSimp3E');
    const params: string[] = [];
    if (!dataDe || !dataAte) {
      const defaults = this.getDefaultDateRange();
      dataDe = dataDe || defaults.dataDe;
      dataAte = dataAte || defaults.dataAte;
    }
    if (dataDe) {
      params.push(`dataDe=${dataDe}`);
    }
    if (dataAte) {
      params.push(`dataAte=${dataAte}`);
    }
    if (filial) {
      params.push(`filial=${filial}`);
    }
    if (cliente) {
      params.push(`cliente=${cliente}`);
    }
    if (loja) {
      params.push(`loja=${loja}`);
    }
    if (tipoPed) {
      params.push(`tipoPed=${tipoPed}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    const options = {
      ...this.httpOptions,
    };
    return this.http.get<any>(url, options).pipe(retry(1), catchError(this.handleError));
  }

  getFilialDestino(grupo: string, filial: string): Observable<any> {
    this.updateHttpOptions(filial, 'uSimp01A');
    const params: string[] = [];
    if (grupo) {
      params.push(`Empresa=${grupo}`);
    }
    if (filial) {
      params.push(`filial=${filial}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    const options = {
      ...this.httpOptions,
    };
    return this.http.get<any>(url, options).pipe(retry(1), catchError(this.handleError));
  }

  getFiliaisByTenant(tenantId: string, empresa: string, headerTenantId?: string): Observable<any> {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || '';
    const normalizedTenant =
      (headerTenantId && headerTenantId.trim()) ||
      (tenantId && tenantId.trim()) ||
      '';
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      Rotina: 'uSimp01A',
      Authorization: `Bearer ${token}`,
      tenantid: normalizedTenant,
      tenantId: normalizedTenant,
      'x-erp-module': 'SIGAFAT',
    });

    const params: string[] = [];
    if (empresa) {
      params.push(`Empresa=${encodeURIComponent(empresa)}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    return this.http.get<any>(url, { headers, observe: 'response' }).pipe(
      retry(1),
      map((response) => ({ status: response.status, body: response.body })),
      catchError((error) => of({ status: error?.status ?? 0, body: error?.error })),
    );
  }

  getTES(filial: string, operacao: string, fornecedor: string, produto: string): Observable<any> {
    this.updateHttpOptions(filial);
    const url = `${environment.apiRoot}TESPRODUTO/${filial}/${operacao}/${fornecedor}/${produto}`;
    return this.http.get<any>(url, this.httpOptions).pipe(retry(1), catchError(this.handleError));
  }

  getEST(filial: string, fornecedor: string, produto: string, quantidade: number): Observable<any> {
    this.updateHttpOptions(filial);
    const url = `${environment.apiRoot}ESTPRODUTO/${filial}/${fornecedor}/${produto}/${quantidade}`;
    return this.http.get<any>(url, this.httpOptions).pipe(retry(1), catchError(this.handleError));
  }

  getTabela(filial: string, cliente: string): Observable<any> {
    this.updateHttpOptions(filial);

    const url = `${environment.apiRoot}TABPRECOB/${filial}/${cliente}`;
    //return this.http.get<Itabela[]>(url,this.httpOptions).pipe(retry(1), catchError(this.handleError));

    return this.http.get<Itabela[]>(url, this.httpOptions);
  }

  getTabelaInter(filial: string, cliente: string, loja: string, tipoPed?: string): Observable<any> {
    this.updateHttpOptions(filial, 'uSimp03C');
    const params: string[] = [];
    if (filial) {
      params.push(`filial=${filial}`);
    }
    if (cliente) {
      params.push(`cliente=${cliente}`);
    }
    if (loja) {
      params.push(`loja=${loja}`);
    }
    if (tipoPed) {
      params.push(`tipo=${tipoPed}`);
    }
 
    const query = params.length ? `?${params.join('&')}` : '';
    const url = `${environment.apiRoot}apiSimplify${query}`;
    const options = {
      ...this.httpOptions,
    };
    return this.http.get<any>(url, options).pipe(retry(1), catchError(this.handleError));
  }

  postPedido(filial: string, body: string): Observable<any> {
    this.updateHttpOptions(filial);
    const url = `${environment.apiRoot}pedicompany/${filial}`;
    return this.http.post<any>(url, body, this.httpOptions);
  }
  putPedido(
    grupo: string,
    filial: string,
    pedido: string,
    body: string,
    invoice: string,
    faturar: string,
  ): Observable<any> {
    let url = '';

    if (invoice === 'N') {
      // Alteração de pedido
      url = `${environment.apiRoot}pedicompany/${filial}/${pedido}?invoice=N`;
    } else if (invoice === 'S' && faturar === 'S') {
      // Geração de documento de saída
      url = `${environment.apiRoot}pedicompany/${filial}/${pedido}?invoice=S&faturar=S`;
    } else if (invoice === 'S' && faturar === 'N') {
      // Classificação da NF
      url = `${environment.apiRoot}pedicompany/${filial}/${pedido}?invoice=S&faturar=N`;
    } else {
      // Fallback em caso de parâmetros inesperados
      throw new Error('Parâmetros inválidos para envio do pedido.');
    }

    return this.http
      .put<any>(url, body, {
        headers: {
          'Content-Type': 'application/json',
          origem: grupo, // ou qualquer header que esteja esperando
        },
        responseType: 'json' as const,
        observe: 'response',
      })
      .pipe(retry(1), catchError(this.handleError));
  }
  handleError(error: any) {
    // retorna o erro completo para que o subscriber possa tratar corretamente
    return throwError(() => error);
  }
}
