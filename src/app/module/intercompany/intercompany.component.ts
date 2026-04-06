import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  PoModalComponent,
  PoTableLiterals,
  PoTableColumn,
  PoStepperItem,
  PoStepperStatus,
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { ProtheusService } from '../../service/protheus.service';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-intercompany',
  templateUrl: './intercompany.component.html',
  styleUrls: ['./intercompany.component.scss'],
  providers: [ProtheusService],
})
export class IntercompanyComponent implements OnInit {
  @ViewChild(PoModalComponent, { static: true }) poModal!: PoModalComponent;
  private readonly DEFAULT_TOTAL_RECORDS = 100;
  private readonly DEFAULT_PAGE_SIZE = 12;
  constructor(
    private router: Router,
    public ProtheusService: ProtheusService,
    private changeDetector: ChangeDetectorRef,
    private datePipe: DatePipe,
  ) {}

  filial = environment.filial || '';
  private grupoFilial = environment.grupofilial || '';
  
  
  
  private tipoPedido = 'I'; // N = Normal, B=Beneficiamento, R = Retorno, I = Intercompany
  tipo = 'N'; // N = Normal, B=Beneficiamento 
  
  
  
  
  
  
  private getFilialOrigemLabel(): string {
    const value = this.grupoFilial;
    if (!value) {
      return '';
    }
    const parts = value.split('-');
    if (parts.length < 2) {
      return value.trim().toUpperCase();
    }
    return parts.slice(1).join('-').trim().toUpperCase();
  }

  private buildNotasLabel(item: any): string {
    const notas = Array.isArray(item?.notas) ? item.notas : [];
    const fromNotas = notas
      .map((nota: any) => {
        const doc = String(nota?.doc ?? '').trim();
        const serie = String(nota?.serie ?? '').trim();
        if (!doc && !serie) {
          return '';
        }
        return serie ? `${doc} / ${serie}` : doc;
      })
      .filter(Boolean);
    if (fromNotas.length) {
      return fromNotas.join(', ');
    }
    const doc = String(item?.notafiscal ?? '').trim();
    const serie = String(item?.serie ?? '').trim();
    if (!doc && !serie) {
      return '';
    }
    return serie ? `${doc} / ${serie}` : doc;
  }

  private resolveUserClass(pedido: any, notas: any[]): string {
    const fields = [
      'user_class',
      'userclass',
      'userClass',
      'classificacao',
      'classif',
      'user_classificacao',
      'user_classif',
    ];
    const fromNota = Array.isArray(notas) ? notas : [];
    for (const nota of fromNota) {
      const value = this.readField(nota, fields);
      if (value) {
        return value;
      }
    }
    return this.readField(pedido, fields);
  }

  private readField(obj: any, fields: string[]): string {
    if (!obj || !fields.length) {
      return '';
    }
    for (const field of fields) {
      const direct = String(obj?.[field] ?? '').trim();
      if (direct) {
        return direct;
      }
      const upper = field.toUpperCase();
      const fromUpper = String(obj?.[upper] ?? '').trim();
      if (fromUpper) {
        return fromUpper;
      }
    }
    const keys = Object.keys(obj || {});
    if (!keys.length) {
      return '';
    }
    const lowerMap = keys.reduce<Record<string, string>>((acc, key) => {
      acc[key.toLowerCase()] = key;
      return acc;
    }, {});
    for (const field of fields) {
      const key = lowerMap[field.toLowerCase()];
      if (key) {
        const value = String(obj?.[key] ?? '').trim();
        if (value) {
          return value;
        }
      }
    }
    return '';
  }

  columns!: Array<PoTableColumn>;
  items: any = [];
  pedido: any = [];
  action!: string;
  mensagem!: string;
  loadingState = false;
  loagingPage = true;
  statusUpdatedAt = '';
  totalRecords = 0;
  currentPage = 1;
  pageSize = this.DEFAULT_PAGE_SIZE;
  filterStart = '';
  filterEnd = '';
  currentStepFilter = '';
  customLiterals: PoTableLiterals = {
    noColumns: 'Nenhuma definição de colunas',
    noData: 'Nenhum dado encontrado',
    noVisibleColumn: 'Nenhuma coluna visível',
    //noItem: 'Nenhum item selecionado',
    // oneItem: '1 item selecionado',
    // multipleItems: 'itens selecionados',
    loadingData: 'Carregando',
    loadMoreData: 'Carregar mais resultados',
    seeCompleteSubtitle: 'Ver legenda completa',
    completeSubtitle: 'Legenda completa',
    columnsManager: 'Gerenciador de colunas',
    // bodyDelete: 'Deseja realmente excluir esse item?',
    //  cancel: 'Cancelar',
    //  delete: 'Excluir',
    // deleteSuccessful: 'Itens removidos com sucesso',
    // deleteApiError: 'Ocorreu um erro inesperado, tente novamente mais tarde!',
  };
  private readonly stepLabels: string[] = [
    'Pedido',
    'Liberação de Estoque',
    'Faturamento',
    'Transmissão',
    'Classificação',
    'Finalizado',
  ];
  stepOptions = [
    { value: '', label: 'Todos' },
    { value: '2', label: 'Bloqueio de Estoque' },
    { value: '3', label: 'Aguardando Faturamento' },
    { value: '4', label: 'Aguardando Transmissão' },
    { value: '5', label: 'Aguardando Classificação' },
    { value: '6', label: 'Pedido Finalizado' },

  ];
  stepCards = [
    { step: '2', label: 'Bloqueio de Estoque', colorClass: 'step-orange', count: 0 },
    { step: '3', label: 'Aguardando Faturamento', colorClass: 'step-blue', count: 0 },
    { step: '4', label: 'Aguardando Transmissão', colorClass: 'step-yellow', count: 0 },
    { step: '5', label: 'Aguardando Classificação', colorClass: 'step-pink', count: 0 },
    { step: '6', label: 'Pedido Finalizado', colorClass: 'step-red', count: 0 },

  ];

  getColumns(): Array<PoTableColumn> {
    return [
      { property: 'numero', label: 'Pedido' },
      { property: 'empresa', label: 'Filial (Origem)' },
      { property: 'nome', label: 'Filial (Destino)' },
      { property: 'emissao', label: 'Data (Pedido)', type: 'date' },
      {
        property: 'status',
        type: 'label',
        labels: [
          { value: '1', color: 'green', label: 'Pedido Criado' },
          { value: '2', color: 'orange', label: 'Bloqueio de Estoque' },
          { value: '3', color: 'color-01', label: 'Aguardando Faturamento' },
          { value: '4', color: 'yellow', label: 'Aguardando Transmissão' },
          { value: '5', color: 'pink', label: 'Aguardando Classificação' },
          { value: '7', color: 'danger', label: 'Pedido Finalizado' },
        ],
      },
    ];
  }
  formatarDataBrasileira(data: Date | string | null): string {
    if (!data) {
      return '';
    }
    if (data instanceof Date) {
      return this.datePipe.transform(data, 'dd/MM/yyyy') || '';
    }
    const text = String(data).trim();
    if (!text) {
      return '';
    }
    if (/^\d{8}$/.test(text)) {
      const year = text.slice(0, 4);
      const month = text.slice(4, 6);
      const day = text.slice(6, 8);
      return `${day}/${month}/${year}`;
    }
    if (text.includes('/')) {
      const parts = text.split('/');
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);
        if (day && month && year) {
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
    }
    if (text.includes('-')) {
      const parts = text.split('-');
      if (parts.length >= 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        if (day && month && year) {
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? '' : this.datePipe.transform(parsed, 'dd/MM/yyyy') || '';
  }

  ngOnInit(): void {
    this.initDateFilters();
    this.listPedidos(false, this.tipo, this.currentPage);
  }
  onExpandDetail(items: any) {
    this.changeDetector.detectChanges();
  }

  newPedido() {
    this.router.navigateByUrl('/intercompany/pedido/new');
  }

  editPedido(filial: string, numero: string, tipo: string) {
    this.router.navigateByUrl(`/intercompany/pedido/edit/${filial}/${numero}/${tipo}`);
  }

  listPedidos(action: boolean, tipo: string, page?: number) {
    this.columns = this.getColumns();
    this.loadingState = true;
    this.loagingPage = true;

    if (!this.filterStart || !this.filterEnd) {
      this.initDateFilters();
    }
    const offset = page ?? this.currentPage;
    const dateDe = this.formatFilterDate(this.filterStart);
    const dateAte = this.formatFilterDate(this.filterEnd);
    const step = this.currentStepFilter || undefined;
    this.ProtheusService
      .getPedidoEtlSimplifyA(
        this.filial,
        '',
        undefined,
        undefined,
        offset,
        this.pageSize,
        this.tipoPedido,
        dateDe,
        dateAte,
        step,
      )
      .subscribe({
        next: (data) => {
          const status = String(data?.data?.status || '').trim().toUpperCase();
          if (status && status !== 'OK') {
            this.items = { pedidos: [] };
            this.loadingState = false;
            this.loagingPage = false;
            this.changeDetector.detectChanges();
            return;
          }

          const pedidosRaw =
            data?.data?.Pedido ??
            data?.Pedido ??
            data?.data?.pedidos ??
            data?.pedidos ??
            data?.pedido ??
            data ??
            [];
          const pedidosList = Array.isArray(pedidosRaw) ? pedidosRaw : pedidosRaw ? [pedidosRaw] : [];

          const pedidos = pedidosList.map((pedido: any) => {
            const notas = Array.isArray(pedido?.Notas) ? pedido.Notas : [];
            const nota = notas.length ? notas[0] : null;
            const userClassNota = this.resolveUserClass(pedido, notas).toUpperCase();
            const dataClass = this.readField(pedido, [
              'data_class',
              'dataClass',
              'data_classificacao',
              'dataClassificacao',
              'dt_class',
              'dtclass',
              'dtClass',
            ]);

            return {
            filial: String(pedido?.Filial ?? '').trim(),
            numero: String(pedido?.Pedido ?? '').trim(),
            tipo: String(pedido?.Tipo ?? '').trim(),
            status: (() => {
              const rawStep = String(pedido?.step ?? pedido?.Step ?? pedido?.STEP ?? '').trim();
              const stepValue = this.getStepValue({ step: rawStep });
              return stepValue === 6 ? '7' : String(stepValue);
            })(),
            empresa: this.getFilialOrigemLabel(),
            nome: String(
              pedido?.NomeCliente ??
              pedido?.nomeCliente ??
              pedido?.clienteNome ??
              pedido?.ClienteNome ??
              pedido?.Cliente ??
              '',
            ).trim(),
            emissao: this.formatarDataBrasileira(String(pedido?.Emissao ?? '').trim()),
            notafiscal: String(pedido?.NotaFiscal ?? '').trim(),
            serie: String(pedido?.Serie ?? '').trim(),
            notas,
            tabela: String(pedido?.TabelaPr ?? '').trim(),
            condpag: String(pedido?.CondPag ?? '').trim(),
            data_class: dataClass,
            userclass: userClassNota,
            notasLabel: this.buildNotasLabel({
              notas,
              notafiscal: String(pedido?.NotaFiscal ?? '').trim(),
              serie: String(pedido?.Serie ?? '').trim(),
            }),
            step: String(pedido?.step ?? pedido?.Step ?? pedido?.STEP ?? '').trim(),
          };
          });

          this.updateStepCards(pedidos);

          const total =
            Number(
              data?.data?.totalRecords ??
                data?.totalRecords ??
                data?.data?.total ??
                data?.total ??
                data?.data?.Total ??
                data?.Total ??
                0,
            ) || 0;
          this.totalRecords = total > 0 ? total : this.DEFAULT_TOTAL_RECORDS;
          this.items = { pedidos };
          this.statusUpdatedAt = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm') || '';
          this.loadingState = false;
          this.loagingPage = false;
          this.changeDetector.detectChanges();
        },
        error: () => {
          this.items = { pedidos: [] };
          this.statusUpdatedAt = '';
          this.loadingState = false;
          this.loagingPage = false;
          this.changeDetector.detectChanges();
        },
      });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.listPedidos(false, this.tipo, this.currentPage);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.enforceMaxDateRange();
    this.listPedidos(false, this.tipo, this.currentPage);
  }

  clearFilters(): void {
    this.initDateFilters();
    this.currentStepFilter = '';
    this.currentPage = 1;
    this.listPedidos(false, this.tipo, this.currentPage);
  }

  filterByStep(step: string): void {
    this.currentStepFilter = String(step || '').trim();
    this.currentPage = 1;
    this.listPedidos(false, this.tipo, this.currentPage);
  }

  private updateStepCards(pedidos: any[]): void {
    const counts: Record<string, number> = {};
    pedidos.forEach((pedido) => {
      const step = String(pedido?.step ?? '').trim();
      if (!step) {
        return;
      }
      counts[step] = (counts[step] || 0) + 1;
    });
    this.stepCards = this.stepCards.map((card) => ({
      ...card,
      count: counts[card.step] || 0,
    }));
  }

  private initDateFilters(): void {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setMonth(start.getMonth() - 3);
    this.filterStart = this.formatInputDate(start);
    this.filterEnd = this.formatInputDate(end);
  }

  private formatInputDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatFilterDate(value: string): string | undefined {
    if (!value) {
      return undefined;
    }
    const parts = value.split('-');
    if (parts.length !== 3) {
      return undefined;
    }
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (!y || !m || !d) {
      return undefined;
    }
    return `${y}${m}${d}`;
  }

  private enforceMaxDateRange(): void {
    const start = this.parseInputDate(this.filterStart);
    const end = this.parseInputDate(this.filterEnd);
    if (!start || !end) {
      return;
    }
    if (end < start) {
      this.filterEnd = this.formatInputDate(start);
      return;
    }
    const maxEnd = this.addMonths(start, 6);
    if (end > maxEnd) {
      this.filterEnd = this.formatInputDate(maxEnd);
    }
  }

  private parseInputDate(value: string): Date | null {
    if (!value) {
      return null;
    }
    const parts = value.split('-');
    if (parts.length !== 3) {
      return null;
    }
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setMonth(d.getMonth() + months);
    return d;
  }

  getStepValue(rowItem: any): number {
    const totalSteps = this.stepLabels.length || 1;
    const step = Number(rowItem?.step);
    if (!Number.isFinite(step)) {
      return 1;
    }
    if (step < 1) {
      return 1;
    }
    if (step > totalSteps) {
      return totalSteps;
    }
    return step;
  }

  getStepsForRow(rowItem: any): Array<PoStepperItem> {
    const step = this.getStepValue(rowItem);
    const totalSteps = this.stepLabels.length;
    return this.stepLabels.map((label, index) => {
      const pos = index + 1;
      let status: PoStepperStatus = PoStepperStatus.Default;
      if (step >= totalSteps) {
        status = PoStepperStatus.Done;
      } else if (step > 1 && pos < step) {
        status = PoStepperStatus.Done;
      }
      return { label, status };
    });
  }


  getDataFaturadoValue(rowItem: any): string {
    const nota = Array.isArray(rowItem?.notas) && rowItem.notas.length ? rowItem.notas[0] : null;
    const dataClass = nota?.data_class ?? nota?.dataClass ?? rowItem?.data_class ?? rowItem?.dataClass ?? null;
    return dataClass ? this.formatarDataBrasileira(dataClass) : '';
  }

  viewPedido(filial: string, numero: string, tipo: string) {
    // this.loadingState = true;
    this.ProtheusService.getPedido(filial, numero, tipo).subscribe((data) => {
      this.openModal(data, 'nota');
      //this.items = data;
      //this.loadingState = false;
    });
  }

  releasePedido(filial: string, numero: string, tipo: string) {
    // this.loadingState = true;
    this.ProtheusService.getPedido(filial, numero, tipo).subscribe((data) => {
      console.log(data);
      this.openModal(data, 'liberar');
    });
  }

  invoicePedido(filial: string, numero: string, tipo: string) {
    this.router.navigateByUrl(`/intercompany/pedido/fat/${filial}/${numero}/${tipo}/S`);
  }

  classPedido(filial: string, numero: string, tipo: string) {
    this.router.navigateByUrl(`/intercompany/pedido/class/${filial}/${numero}/${tipo}/N`);
  }

  openModal(data: any, action: string) {
    if (action == 'nota') {
      this.pedido = data.pedidos;
      this.action = action;
    }
    if (action == 'liberar') {
      this.pedido = data.pedidos;
      this.mensagem = 'Para liberar estoque acesse o Protheus, e façá a liberação de estoque no modulo Faturamento.';
      this.action = action;
    }
    this.poModal.open();
  }
}
