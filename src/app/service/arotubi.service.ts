import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable()
export class ArotubiService {

  constructor(private http: HttpClient) { }
  //TODO VERIFICAR O USO DESTA SERVICE
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('raul.chiarella:Jaca@6260'),
      'tenantId': '01,020101',
      'x-erp-module': 'MNT'
    }),
  };
  ////////////////////// manutenção //////////////////////////////////////

  getFamilia(id?: string, filial?: string, grupo?: string): Observable<any> {
    // Endpoint legado dependia de `environment.apiApp`, removido com módulos antigos.
    return this.http.get<any>(`${environment.apiRoot}GRUPO_FILIAL`, this.httpOptions);
  }

  getBens(id?: string): Observable<any> {
    // Endpoint legado dependia de `environment.apiApp`, removido com módulos antigos.
    return this.http.get<any>(`${environment.apiRoot}os/${id}`, this.httpOptions);
  }

  getEmpresaData(grupo?: string,filial?: string): Observable<any> {
    const url = `${environment.apiRoot}GRUPO_FILIAL?GRUPO=${grupo}&FILIALA=${filial}`;
    return this.http.get<any>(url);
  }

  getOrdemServ(id?: string): Observable<any> {
    const url = `${environment.apiRoot}os/${id}`;
    return this.http.get<any>(url, this.httpOptions);
  }

 getOrdemServe(id?: string): Observable<any> {

    return   this.http.get(
      `${environment.apiRoot}os/${id}`, this.httpOptions
    )
  }

  ////////////////////////////////////////////////////////////////////////



}
