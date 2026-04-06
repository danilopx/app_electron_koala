import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Equipamento } from '../../interfaces/equipamento.interface';

// Importar Logica do Componente p/ Tab.
import { PoTabComponent } from '@po-ui/ng-components';

@Component({
  selector: 'app-informacoes-equipamento',
  templateUrl: './informacoes-equipamento.component.html',
  styleUrls: ['./informacoes-equipamento.component.css'],
})
export class InformacoesEquipamentoComponent implements OnChanges {
  // Removido o `Alias` para evitar o erro:
  // Message Input bindings should not be aliased (https://angular.io/guide/styleguide#style-05-13)
  @Input()
  equipamento!: Equipamento;

  @ViewChild(PoTabComponent) dadosMaquinaTab!: PoTabComponent;

  // ##### Definição dos Dados #####
  maqimg = 'https://cdn.ready-market.com/101/c013d4a4//Templates/pic/CNC-25-1000.jpg?v=de1a9a81';

  // Variáveis de Controle
  loadingModal!: boolean;
  abaFotoEquipamentoClicada!: boolean;
  typeModal = 'info';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipamento']) {
      if (this.equipamento) {
        // Se 'equipamento' não é nulo ou indefinido, significa que estamos recebendo dados
        this.loadingModal = true;
      } else {
        // Quando 'equipamento' é nulo ou indefinido, significa que os dados foram removidos ou a modal foi fechada
        this.loadingModal = false;

        // Limpar a URL da imagem quando não houver equipamento
        this.maqimg = '';
      }
    }
  }

  // Usar a Interface que define o po-tab para debugar.
  debugTab(event: Event): void {
    console.log('Evento da Aba:', event);
  }

  // Redefinir a Tab Ativa (Dados da Maquina)
  resetarAbaAtiva(): void {
    if (this.dadosMaquinaTab) {
      this.dadosMaquinaTab.active = true;
    }
  }
}
