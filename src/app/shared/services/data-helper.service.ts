import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataHelperService {
  formateDataBr(data: string): string {
    if (!data || data.length !== 8) return data;
    const ano = data.substring(0, 4);
    const mes = data.substring(4, 6);
    const dia = data.substring(6, 8);
    return `${dia}/${mes}/${ano}`;
  }
}
