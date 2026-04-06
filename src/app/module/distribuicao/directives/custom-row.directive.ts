import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appCustomRow]',
})
export class CustomRowDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngAfterViewInit() {
    // Seleciona os elementos e remove o estilo 'background-color'
    const elementsToChange = this.el.nativeElement.querySelectorAll('.po-table-column, .po-table.po-table-striped');
    elementsToChange.forEach((element: HTMLElement) => {
      this.renderer.removeStyle(element, 'background-color');
    });

    // Busca todos os elementos que têm a classe 'po-table-group-row'
    const groupRows = this.el.nativeElement.querySelectorAll('.po-table-group-row');

    groupRows.forEach((groupRow: HTMLElement) => {
      // Remove qualquer estilo de borda
      this.renderer.removeStyle(groupRow, 'border');
    });

    const rows = this.el.nativeElement.querySelectorAll('.po-table-row');

    rows.forEach((row: HTMLElement) => {
      // Cria uma nova div e adiciona a classe 'simplify-row'
      const newDiv = this.renderer.createElement('tr');
      this.renderer.addClass(newDiv, 'simplify-row');
      this.renderer.addClass(newDiv, 'simplify-clickable');

      // Copia o conteúdo do 'tr' para o novo 'div'
      while (row.firstChild) {
        this.renderer.appendChild(newDiv, row.firstChild);
      }

      // Substitui o 'tr' pelo novo 'div' no DOM
      this.renderer.insertBefore(row.parentNode, newDiv, row);
      this.renderer.removeChild(row.parentNode, row);
    });
  }
}
