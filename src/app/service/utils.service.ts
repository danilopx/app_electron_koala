import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Formata a data e hora atual para o formato 'YYYYMMDD HH:mm'.
   * Importante: Não alterar o formato de data, pois o Protheus espera a data nesse formato.
   *
   * Ref: https://tdn.totvs.com/pages/releaseview.action?pageId=683181217#0--260345766
   * O campo date deverá conter um espaço entre a data e hora("date":"20220430 11:00");
   *
   * @returns {Observable<string>} - A data e hora formatadas.
   * */
  formatarDataHoraAtual(): Observable<string> {
    // Endpoint legado dependia de `environment.apiAppMT`, removido com módulos antigos.
    const agora = new Date();
    const yyyy = agora.getFullYear();
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const hh = String(agora.getHours()).padStart(2, '0');
    const min = String(agora.getMinutes()).padStart(2, '0');
    return new Observable((subscriber) => {
      subscriber.next(`${yyyy}${mm}${dd} ${hh}:${min}`);
      subscriber.complete();
    });
  }

  /**
   * Converte para `data` as strings recebidas.
   * Só vai converter com sucesso se as strings recebidas estiverem no seguinte formato:
   *
   * Data: YYYYMMDD (Ano, Mês, Dia)
   * Hora: HH:mm (Hora, Minutos)
   * */
  static converterParaData(ordem_data_abertura: string, ordem_hora_abertura: string): Date {
    const ano = parseInt(ordem_data_abertura.substring(0, 4));
    const mes = parseInt(ordem_data_abertura.substring(4, 6)) - 1; // Meses começam de 0 em JavaScript
    const dia = parseInt(ordem_data_abertura.substring(6, 8));
    const horas = parseInt(ordem_hora_abertura.substring(0, 2));
    const minutos = parseInt(ordem_hora_abertura.substring(3, 5));

    return new Date(ano, mes, dia, horas, minutos);
  }
}
