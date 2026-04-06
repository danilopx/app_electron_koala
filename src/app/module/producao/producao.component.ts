import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PoNotificationService, PoTableColumn, PoTableLiterals } from '@po-ui/ng-components';
import { environment } from '../../../environments/environment';
import {
  OrdemIntermediaria,
  OrdemProducao,
  ProducaoService,
} from '../../service/producao.service';

@Component({
  selector: 'app-producao',
  templateUrl: './producao.component.html',
  styleUrls: ['./producao.component.scss'],
})
export class ProducaoComponent implements OnInit {
  constructor(
    private producaoService: ProducaoService,
    private poNotification: PoNotificationService,
    private router: Router,
  ) {}

  readonly customLiterals: PoTableLiterals = {
    noColumns: 'Nenhuma definição de colunas',
    noData: 'Nenhuma ordem encontrada',
    noVisibleColumn: 'Nenhuma coluna visível',
    loadingData: 'Carregando',
    loadMoreData: 'Carregar mais resultados',
    seeCompleteSubtitle: 'Ver legenda completa',
    completeSubtitle: 'Legenda completa',
    columnsManager: 'Gerenciador de colunas',
  };

  readonly columns: Array<PoTableColumn> = [
    { property: 'op_chave', label: 'OP' },
    { property: 'op_tipo_prod', label: 'Setor Produção' },
    { property: 'produto_codigo_descricao', label: 'Produto' },
    { property: 'op_emissao_formatada', label: 'Data de Emissao' },
    { property: 'op_um', label: 'UM' },
    { property: 'op_quantidade', label: 'Qtd. OP', type: 'number' },
    { property: 'op_quant_apontada', label: 'Apontado', type: 'number' },
    { property: 'op_saldo', label: 'Saldo', type: 'number' },
    {
      property: 'op_status',
      label: 'Status',
      type: 'label',
      labels: [
        { value: 'ABERTA', color: 'orange', label: 'Aberta' },
        { value: 'PARCIALMENTE_APONTADA', color: 'color-01', label: 'Parcialmente Apontada' },
        { value: 'FINALIZADA', color: 'green', label: 'Finalizada' },
      ],
    },
  ];

  readonly stepOptions = [
    { value: '', label: 'Todos' },
    { value: 'ABERTA', label: 'Abertas' },
    { value: 'PARCIALMENTE_APONTADA', label: 'Parcialmente apontadas' },
    { value: 'FINALIZADA', label: 'Finalizadas' },
  ];

  loadingState = false;
  loadingStatusCounts = false;
  currentPage = 1;
  pageSize = 25;
  totalRecords = 0;
  statusUpdatedAt = '';
  currentStepFilter = '';
  filterNumero = '';
  filterProduto = '';
  filterDataDe = '';
  filterDataAte = '';
  allOrdens: OrdemProducao[] = [];
  filteredOrdens: OrdemProducao[] = [];
  stepCards = [
    { step: 'ABERTA', label: 'Abertas', colorClass: 'step-green', count: 0 },
    { step: 'PARCIALMENTE_APONTADA', label: 'Parcialmente apontadas', colorClass: 'step-blue', count: 0 },
    { step: 'FINALIZADA', label: 'Finalizadas', colorClass: 'step-red', count: 0 },
  ];

  ngOnInit(): void {
    this.resetDateRange();
    this.loadOrdens();
  }

  loadOrdens(): void {
    this.loadingState = true;
    const filial = environment.filial || '';

    this.producaoService.listarOrdensProducao(
      filial,
      1,
      undefined,
      this.formatDateForApi(this.filterDataDe),
      this.formatDateForApi(this.filterDataAte),
      this.currentStepFilter,
      this.filterNumero,
      this.filterProduto,
      '',
    ).subscribe({
      next: (response) => {
        this.allOrdens = (response?.ordens || []).map((ordem) => this.enrichOrdem(ordem));
        this.totalRecords = response?.total_registros || this.allOrdens.length;
        this.statusUpdatedAt = new Date().toLocaleString('pt-BR');
        this.updateStatusCards(response?.total_por_status);
        this.applyLocalFilters();
        this.loadingState = false;
      },
      error: () => {
        this.allOrdens = [];
        this.totalRecords = 0;
        this.statusUpdatedAt = new Date().toLocaleString('pt-BR');
        this.updateStatusCards({});
        this.applyLocalFilters();
        this.loadingState = false;
        this.poNotification.warning('Nao foi possivel carregar os dados da rotina uSimp05B.');
      },
    });
  }

  filterByStep(step: string): void {
    this.currentStepFilter = this.currentStepFilter === step ? '' : step;
    this.loadingState = true;
    this.loadOrdens();
  }

  applyFilters(): void {
    if (!this.validateDateRange()) {
      return;
    }

    this.loadingState = true;
    this.loadOrdens();
  }

  applyLocalFilters(): void {
    const numero = this.filterNumero.trim().toLowerCase();
    const produto = this.filterProduto.trim().toLowerCase();

    this.filteredOrdens = this.allOrdens.filter((ordem) => {
      const matchesStatus = !this.currentStepFilter || ordem.op_status === this.currentStepFilter;
      const matchesNumero =
        !numero ||
        ordem.op_numero.toLowerCase().includes(numero) ||
        ordem.op_chave.toLowerCase().includes(numero);
      const matchesProduto =
        !produto ||
        ordem.produto_codigo.toLowerCase().includes(produto) ||
        ordem.produto_descricao.toLowerCase().includes(produto);

      return matchesStatus && matchesNumero && matchesProduto;
    });

    this.currentPage = 1;
  }

  clearFilters(): void {
    this.currentStepFilter = '';
    this.filterNumero = '';
    this.filterProduto = '';
    this.resetDateRange();
    this.loadingState = true;
    this.loadOrdens();
  }

  getProgress(ordem: OrdemProducao | OrdemIntermediaria): number {
    if (!ordem.op_quantidade) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((ordem.op_quant_apontada / ordem.op_quantidade) * 100)));
  }

  getGaugeBackground(ordem: OrdemProducao | OrdemIntermediaria): string {
    const progress = this.getProgress(ordem);
    return `conic-gradient(#4b5563 0 ${progress}%, #d9e1ec ${progress}% 100%)`;
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
    }
    return value;
  }

  getStatusLabel(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'ABERTA') {
      return 'Aberta';
    }
    if (normalized === 'PARCIALMENTE_APONTADA') {
      return 'Parcialmente apontada';
    }
    if (normalized === 'FINALIZADA' || normalized === 'OUTROS') {
      return 'Finalizada';
    }

    return status || 'Sem status';
  }

  private enrichOrdem(ordem: OrdemProducao): OrdemProducao {
    return {
      ...ordem,
      op_chave: String(ordem.op_chave || `${ordem.op_numero || ''}${ordem.op_item || ''}${ordem.op_sequencia || ''}`).trim(),
      produto_codigo_descricao: `${ordem.produto_codigo || ''} - ${ordem.produto_descricao || ''}`.trim().replace(/^-\s*/, ''),
      op_emissao_formatada: this.formatDate(ordem.op_emissao),
      op_intermediarias: (ordem.op_intermediarias || []).map((item) => ({
        ...item,
        op_chave: String(item.op_chave || `${item.op_numero || ''}${item.op_item || ''}${item.op_sequencia || ''}`).trim(),
        produto_codigo_descricao: `${item.produto_codigo || ''} - ${item.produto_descricao || ''}`.trim().replace(/^-\s*/, ''),
        op_emissao_formatada: this.formatDate(item.op_emissao),
      })),
    } as OrdemProducao;
  }

  getStatusDotClass(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'ABERTA') {
      return 'status-dot open';
    }
    if (normalized === 'PARCIALMENTE_APONTADA') {
      return 'status-dot analysis';
    }
    if (normalized === 'FINALIZADA' || normalized === 'OUTROS') {
      return 'status-dot delivered';
    }

    return 'status-dot sem-status';
  }

  openDetalhe(ordem: OrdemProducao): void {
    this.router.navigate([
      '/producao/detalhe',
      ordem.op_numero,
      ordem.op_item,
      ordem.op_sequencia,
    ], {
      queryParams: {
        intermediario: ordem.op_tem_intermediaria || '',
      },
    });
  }

  private resetDateRange(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 120);
    this.filterDataDe = this.formatDateInput(start);
    this.filterDataAte = this.formatDateInput(end);
  }

  private formatDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDateForApi(value: string): string {
    return String(value || '').replace(/\D/g, '');
  }

  private validateDateRange(): boolean {
    if (!this.filterDataDe || !this.filterDataAte) {
      return true;
    }

    const dataDe = new Date(`${this.filterDataDe}T00:00:00`);
    const dataAte = new Date(`${this.filterDataAte}T00:00:00`);

    if (Number.isNaN(dataDe.getTime()) || Number.isNaN(dataAte.getTime())) {
      return true;
    }

    if (dataDe > dataAte) {
      this.poNotification.warning('A data inicial nao pode ser maior que a data final.');
      return false;
    }

    const limite = new Date(dataDe);
    limite.setMonth(limite.getMonth() + 6);

    if (dataAte > limite) {
      this.poNotification.warning('O intervalo entre Data de e Data ate nao pode ser maior que 6 meses.');
      return false;
    }

    return true;
  }

  private updateStatusCards(totalPorStatus?: Record<string, number>): void {
    const totals = totalPorStatus && Object.keys(totalPorStatus).length
      ? totalPorStatus
      : this.allOrdens.reduce<Record<string, number>>((acc, ordem) => {
          const status = String(ordem.op_status || '').trim().toUpperCase();
          if (!status) {
            return acc;
          }
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

    this.stepCards = this.stepCards.map((card) => ({
      ...card,
      count: totals[card.step] || 0,
    }));
  }
}
