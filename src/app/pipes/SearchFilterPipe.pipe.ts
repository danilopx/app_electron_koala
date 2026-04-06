import { Pipe, PipeTransform } from '@angular/core';

type SearchableItem = { [key: string]: unknown };

@Pipe({
  name: 'searchFilter',
})

export class SearchFilterPipe implements PipeTransform {
  transform(items: SearchableItem[], searchTerm: string): SearchableItem[] {
    if (!items || !searchTerm) {
      return items;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase();

    return items.filter(item =>
      this.isItemMatchingSearchTerm(item, normalizedSearchTerm)
    );
  }

  private isItemMatchingSearchTerm(item: SearchableItem, searchTerm: string): boolean {
    return Object.values(item).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(searchTerm)
    );
  }

}
