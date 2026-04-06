import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProdutosPadraoAPITotvs } from '../interfaces/produto.interface';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  constructor(private httpClient: HttpClient) {

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
        'tenantId': `${environment.grupo},${setfilial}`,
        'x-erp-module': 'SIGAFAT'
      })
    };
  }

  listarProdutos(filial : string,tiposDeProduto: string, pagina = 1, itensPorPagina = 5000): Observable<ProdutosPadraoAPITotvs> {

    const url  = `${environment.apiRoot}INSUMO?TIPO_PRODUTO=MM,MC&ARMAZEM=85`;

    this.updateHttpOptions(filial);


    return this.httpClient.get<ProdutosPadraoAPITotvs>(url, {
      headers: this.httpOptions.headers
    });

  }
}
