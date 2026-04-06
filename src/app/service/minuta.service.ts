import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import {   map,   Observable  } from 'rxjs';
 
import {IMinuta} from 'src/app/interfaces/interface-minuta';
 

@Injectable()
export class MinutaService {
  constructor(private http: HttpClient) {}
 

  getMinuta(
    grupo: string,
    filial: string,
    limit: number,
   
  ): Observable<IMinuta[]> {
    return this.http
      .get<{
        minuta: IMinuta[];
      }>(
        `${environment.apiRoot}GET_MINUTA_ALL?GRUPO=${grupo}&FILIAL=${filial}&OFFISET=1&LIMIT=${limit}`,
      )
      .pipe(map((response) => response.minuta));
  }


}
