import { Component, Input } from '@angular/core';
import { OrdemServicoIn } from '../../../../interfaces/ordem-servico.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { PoComboOption, PoInfoOrientation } from '@po-ui/ng-components';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-row-ordem-servico',
  templateUrl: './row-ordem-servico.component.html',
  styleUrls: ['./row-ordem-servico.component.css'],
})

// Componente Filho
export class RowOrdemServicoComponent {
  /**
   * Type:
   *
   * */
  @Input() ordemServico!: OrdemServicoIn;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public datePipe: DatePipe,
  ) {}
  protected readonly PoInfoOrientation = PoInfoOrientation;
  /**
   * Direciona o usuário para a página de detalhes da O.S.
   * Utiliza o `relativeTo` para que o Angular saiba que a rota é relativa à rota atual, com a ajuda da injeção do
   *`ActivatedRoute`no construtor. Sem o `ActivatedRoute`, usar o `relativeTo` não funciona.
   *
   * Ref: https://angular.io/guide/router#specifying-a-relative-route
   * */
  verDetalhesDaOs(ordemServico: OrdemServicoIn) {
   
    // Salvar a ordem de serviço no LocalStorage
    localStorage.setItem('ordemServicoAtual', JSON.stringify(ordemServico));

    this.router
      .navigate(['detalhes-ordem-servico', ordemServico.ordem_id], { relativeTo: this.route })
      .then(() => {
        console.log('Navigation has finished');
      })
      .catch((error) => {
        console.error('Navigation failed:', error);
      });
  }

  formatarDataBrasileira(data: Date | string | null): string {
    if (!data) return ''; // Retorna uma string vazia se não houver data
    
    let dateObj: Date;
    if (typeof data === 'string' && /^\d{8}$/.test(data)) {
      // Se a data for uma string no formato 'yyyyMMdd'
      const year = parseInt(data.substring(0, 4), 10);
      const month = parseInt(data.substring(4, 6), 10) - 1; // Mês em JavaScript é 0-11
      const day = parseInt(data.substring(6, 8), 10);
      dateObj = new Date(year, month, day);
    } else if (data instanceof Date) {
      dateObj = data;
    } else {
      return ''; // Formato inválido
    }

    return this.datePipe.transform(dateObj, 'dd/MM/yyyy') || ''; // Usa transform e lida com possíveis valores nulos
  }

  listaDeStatus: Array<PoComboOption> = [
    { value: '1', label: 'Aguardando Distribuição' },
    { value: '2', label: 'Aguardando Inicio do Atendimento' },
    { value: '3', label: 'Aguardando Finalização do Atendimento' },
    { value: '4', label: 'Aguardando Validação Manutenção' },
    { value: '5', label: 'Aguardando Validação do Setor' },
    { value: '6', label: 'Aguardando o Retorno da OS no Protthues' },
    { value: '7', label: 'Ordem de Serviço Finalizado' },
  ];


  getStatusDescription(statusNumber: number): string {
    const status = this.listaDeStatus.find(item => item.value === statusNumber.toString());
    return status?.label ?? '';
  }
  getStatusDescriptionFromString(statusString: string): string {
    const statusNumber = parseInt(statusString, 10);
    return this.getStatusDescription(statusNumber);
  }

  
}
