import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 
import { HttpParams } from '@angular/common/http';
import { IConferenciaResponse } from 'src/app/interfaces/interface-conferencia';
 

@Injectable()
export class ConferenciaService {
  constructor(private http: HttpClient) {}
 

  getConferencia(params: {
    filial: string;
    nf?: string;
    dataDe?: string;
    dataAte?: string;
    limit?: number;
    offset?: number;
  }): Observable<IConferenciaResponse> {
    let httpParams = new HttpParams().set('filial', params.filial);
    if (params.nf) httpParams = httpParams.set('nf', params.nf);
    if (params.dataDe) httpParams = httpParams.set('dataDe', params.dataDe);
    if (params.dataAte) httpParams = httpParams.set('dataAte', params.dataAte);
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());

    return this.http.get<IConferenciaResponse>(`${environment.apiRoot}NFCONF`, {
      params: httpParams,
    });
  }


}
