import { Component } from '@angular/core';

interface HelpSection {
  title: string;
  description: string;
  items: string[];
}

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent {
  readonly sections: HelpSection[] = [
    {
      title: 'Producao',
      description: 'Espaco inicial para documentar a rotina de producao, apontamentos, reimpressao e etiquetas.',
      items: [
        'Objetivo da rotina',
        'Filtros e regras de acesso',
        'Fluxo de apontamento',
        'Fluxo de reimpressao',
        'Observacoes importantes para o usuario',
      ],
    },
    {
      title: 'Operacao',
      description: 'Use esta pagina para concentrar instrucoes de uso, exemplos praticos e mensagens mais comuns.',
      items: [
        'Passo a passo da rotina',
        'Campos obrigatorios',
        'Cuidados antes de confirmar',
        'Erros frequentes e como corrigir',
      ],
    },
  ];
}
