import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { PoTableColumn } from '@po-ui/ng-components';
import { SolicitacaoServico } from '../../interfaces/solicitacao-servico.interface';

@Component({
  selector: 'app-solicitacao-aberta',
  templateUrl: './solicitacao-aberta.component.html',
  styleUrls: ['./solicitacao-aberta.component.css'],
})
export class SolicitacaoAbertaComponent implements OnChanges {
  // Lista de Solicitações do Componente Pai.
  @Input() solicitacoesAbertas!: SolicitacaoServico[];

  public readonly columns: PoTableColumn[] = [
    { property: 'ordem_filial', label: 'Solicitação ID' },
    { property: 'solicitacao_equipamento', label: 'Equipamento' },
    { property: 'solicitacao_filial', label: 'Filial' },
    {
      property: 'solicitacao_status',
      label: 'Status',

      // A Coluna será utilizada como template, com o PoTableColumnTemplate
      type: 'columnTemplate',

      // Labels Implementa a interfaces PoTableColumnLabel (Comentado porquê não funciona com o PoTableColumnTemplate)
      // labels: [
      //   { value: 'A', label: 'Aguardando Atendimento' },
      //   { value: 'D', label: 'Em Atendimento' }
      // ]
    },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['solicitacoesAbertas'] && this.solicitacoesAbertas) {
      console.log('Dados das Solicitações recebidas do Componente Pai:', this.solicitacoesAbertas);
    }
  }

  // Implementação do Pipe, sem usar o decorador @Pipe (Que é separado do Componente).
  // Ref. https://angular.io/guide/pipes#custom-pipes
  getStatusLabel(status: string): string {
    // Declaração Explicita: Assinatura de índice que informa ao TypeScript que o `index` pode ser `string`.
    const statusMap: { [key: string]: string } = {
      A: 'Aguardando',
      D: 'Em Atendimento',
    };

    return statusMap[status] || 'Desconhecido';
  }
}
