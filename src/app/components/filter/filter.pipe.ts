import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], filtro: string): any[] {
    if (!items) {
      return items;
    }

    const normalizedFiltro = (filtro ?? '').toString().trim().toLowerCase();
    if (!normalizedFiltro) {
      return items;
    }

    return items.filter(item => {
      for (const key in item) {
        // Usando Object.prototype.hasOwnProperty.call
        if (!Object.prototype.hasOwnProperty.call(item, key)) {
          continue;
        }

        const value = item[key];
        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          if (String(value).toLowerCase().includes(normalizedFiltro)) {
            return true;
          }
        }

        if (value instanceof Date) {
          if (value.toISOString().toLowerCase().includes(normalizedFiltro)) {
            return true;
          }
        }
      }
      return false;
    });
  }
}
