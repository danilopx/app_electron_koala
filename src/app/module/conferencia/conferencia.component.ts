import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PoModalComponent, PoTableColumn, PoTableLiterals } from '@po-ui/ng-components';
import { Subject, takeUntil } from 'rxjs';
import { ConferenciaService } from '../../service/conferencia.service';
import { IConferenciaItem, IConferenciaNota } from 'src/app/interfaces/interface-conferencia';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-conferencia',
  templateUrl: './conferencia.component.html',
  styleUrls: ['./conferencia.component.css'],
  providers: [ConferenciaService],
})
export class ConferenciaComponent implements OnInit, OnDestroy {
  @ViewChild('itensModal', { static: false }) itensModal!: PoModalComponent;

  destroy$ = new Subject<void>();
  loadingState = false;
  hasNext = true;
  limit = 12;
  offset = 1;

  grupo = environment.grupo ?? '';
  filial = environment.filial ?? '';

  filtroNf = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  notas: IConferenciaNota[] = [];
  selectedItens: IConferenciaItem[] = [];
  selectedNota: IConferenciaNota | null = null;

  columns: Array<PoTableColumn> = [];
  itemColumns: Array<PoTableColumn> = [
    { property: 'item', label: 'Item' },
    { property: 'produto', label: 'Produto' },
    { property: 'quantidade', label: 'Quantidade' },
    { property: 'lote', label: 'Lote' },
    { property: 'pedido', label: 'Pedido' },
  ];

  customLiterals: PoTableLiterals = {
    noColumns: 'Nenhuma definição de colunas',
    noData: 'Nenhum dado encontrado',
    noVisibleColumn: 'Nenhuma coluna visível',
    loadingData: 'Carregando',
    loadMoreData: 'Carregar mais resultados',
    seeCompleteSubtitle: 'Ver legenda completa',
    completeSubtitle: 'Legenda completa',
    columnsManager: 'Gerenciador de colunas',
  };

  constructor(private conferenciaService: ConferenciaService) {}

  ngOnInit(): void {
    this.columns = this.getColumns();
    this.listConferencia(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    this.offset = 1;
    this.notas = [];
    this.hasNext = true;
    this.listConferencia(false);
  }

  clearFilters(): void {
    this.filtroNf = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.applyFilters();
  }

  listConferencia(loadMore: boolean): void {
    if (loadMore && !this.hasNext) {
      return;
    }

    if (loadMore) {
      this.offset += 1;
    } else {
      this.offset = 1;
    }

    this.loadingState = true;
    const dataDe = this.formatDateParam(this.filtroDataInicio);
    const dataAte = this.formatDateParam(this.filtroDataFim);
    const nf = this.filtroNf.trim();

    this.conferenciaService
      .getConferencia({
        filial: this.filial,
        nf: nf || undefined,
        dataDe: dataDe || undefined,
        dataAte: dataAte || undefined,
        limit: this.limit,
        offset: this.offset,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const mapped = response.notas.map((nota) => ({
            ...nota,
            dataConfFormatada: this.formatarDataHora(nota.dataConf, nota.horaConf),
            horaConfFormatada: this.formatarHora(nota.horaConf ?? ''),
            statusLabel: 'Realizado',
            actions: 'true',
          }));
          this.notas = loadMore ? [...this.notas, ...mapped] : mapped;
          this.hasNext = response.hasNext;
          this.loadingState = false;
        },
        error: () => {
          this.loadingState = false;
        },
      });
  }

  openItens(nota: IConferenciaNota): void {
    this.selectedNota = nota ?? null;
    const itens = Array.isArray(nota.itens) ? nota.itens : [];
    const seen = new Set<string>();
    this.selectedItens = itens.filter((item) => {
      const key = [item?.item ?? '', item?.produto ?? '', item?.quantidade ?? '', item?.lote ?? '', item?.pedido ?? '']
        .map((value) => String(value).trim())
        .join('|');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    this.itensModal.open();
  }

  getColumns(): Array<PoTableColumn> {
    return [
      { property: 'nota', label: 'NF' },
      { property: 'cliente', label: 'Cliente' },
      { property: 'conferente', label: 'Conferente' },
      { property: 'dataConfFormatada', label: 'Data Conferência' },
      {
        property: 'statusLabel',
        label: 'Status',
        type: 'label',
        labels: [{ value: 'Realizado', color: 'green', label: 'Realizado' }],
      },
      {
        property: 'actions',
        label: 'Ações',
        type: 'icon',
        sortable: false,
        icons: [
          {
            action: this.openItens.bind(this),
            color: 'color-01',
            icon: 'po-icon-search',
            tooltip: 'Ver itens',
            value: 'true',
          },
        ],
      },
    ];
  }

  private formatDateParam(value: string): string {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return '';
    return `${year}${month}${day}`;
  }

  private formatarData(dataStr: string): string {
    if (!dataStr || dataStr.length < 8) return '';
    const ano = dataStr.substring(0, 4);
    const mes = dataStr.substring(4, 6);
    const dia = dataStr.substring(6, 8);
    return `${dia}/${mes}/${ano}`;
  }

  private formatarHora(dataStr: string): string {
    const digits = (dataStr || '').replace(/\D/g, '');
    if (digits.length < 2) return '';
    const hora = digits.substring(0, 2);
    const minuto = digits.length >= 4 ? digits.substring(2, 4) : '00';
    const segundo = digits.length >= 6 ? digits.substring(4, 6) : '';
    return segundo ? `${hora}:${minuto}:${segundo}` : `${hora}:${minuto}`;
  }

  private formatarDataHora(dataStr: string, horaStr?: string): string {
    const data = this.formatarData(dataStr);
    const hora = this.formatarHora(horaStr ?? '');
    if (!data) return hora;
    if (!hora) return data;
    return `${data} ${hora}`;
  }

  get filialLabel(): string {
    if (!this.selectedNota?.filial) {
      return '';
    }
    const nome = this.getFilialNome();
    return nome ? `${this.selectedNota.filial} - ${nome}` : this.selectedNota.filial;
  }

  private getFilialNome(): string {
    const raw = String(environment.grupofilial || '').trim();
    if (!raw) return '';
    const afterSlash = raw.includes('/') ? raw.split('/')[1] ?? '' : raw;
    const parts = afterSlash.split('-');
    if (parts.length < 2) return '';
    return parts.slice(1).join('-').trim().toUpperCase();
  }
}
