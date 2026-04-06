import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transformarDataYYYYMMDD',
})

/** Transforma strings de data no formato YYYYMMDD para DD/MM/YYYY */
export class TransformarDataYYYYMMDDPipe implements PipeTransform {
  transform(data: string): string {
    if (!data) return '';
    if (data.length !== 8) return data;

    // Extração da Data.
    const ano = data.substring(0, 4);
    const mes = data.substring(4, 6);
    const dia = data.substring(6, 8);

    return `${dia}/${mes}/${ano}`;
  }
}
