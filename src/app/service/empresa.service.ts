import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Observable para o Angular lidar com requisições assíncronas, usando o método "Change Detection".
import { Observable, throwError } from 'rxjs';
import { FilialResponse } from '../interfaces/filial.interface';
import { SetorApiResponse, SetorResponse } from '../interfaces/setor.interface';
import { Iempresa } from '../interfaces/interface-empresa';
import { catchError, map, tap, timeout } from 'rxjs/operators';

interface EmpresaApiResponse {
  data: Iempresa[];
}

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  private readonly REQUEST_TIMEOUT_MS = 10000;

  constructor(private http: HttpClient) {}

  getFiliais(): Observable<FilialResponse> {
    // Endpoint legado dependia de `environment.apiAppMT`, removido com módulos antigos.
    return throwError(() => new Error('Rotina de filiais desativada.'));
  }

  getEmpresaData(grupo?: string, filial?: string): Observable<EmpresaApiResponse> {
    const url = `${environment.apiRoot}GRUPO_FILIAL`;
    let params = new HttpParams();

    const grupoParam = grupo || environment.grupo || '';
    const filialParam = filial || environment.filial || '';

    if (grupoParam) {
      params = params.set('GRUPO', grupoParam);
    } else if (grupo) {
      params = params.set('GRUPO', grupo);
    }

    if (filialParam) {
      params = params.set('FILIALA', filialParam);
    } else if (filial) {
      params = params.set('FILIALA', filial);
    }

    return this.http.get<EmpresaApiResponse>(url, { params }).pipe(
      timeout(this.REQUEST_TIMEOUT_MS),
      catchError((error) => {
        console.error('Erro ao obter empresas:', error);
        return throwError(() => new Error('Erro ao obter empresas. Por favor, tente novamente mais tarde.'));
      }),
    );
  }

  carregarSetoresDaFilial(filialId: string, grupo: string): Observable<SetorResponse> {
    const filialIdLimpo = filialId.trim();
    const grupoLimpo = grupo.trim();

    // Endpoint legado dependia de `environment.apiAppMT`, removido com módulos antigos.
    return throwError(() => new Error('Rotina de setores desativada.'));
  }
}
