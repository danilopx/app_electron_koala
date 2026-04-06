import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PoModalComponent, PoNotificationService, PoTableLiterals, PoTableColumn } from '@po-ui/ng-components';
import { Subject, takeUntil } from 'rxjs';
import { MinutaService } from '../../service/minuta.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { IMinuta } from 'src/app/interfaces/interface-minuta';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-minuta',
  templateUrl: './minuta.component.html',
  styleUrls: ['./minuta.component.css'],
  providers: [MinutaService],
})
export class MinutaComponent implements OnInit, OnDestroy {
  @ViewChild('pdfModal', { static: false }) pdfModal!: PoModalComponent;

  pdfSrc!: SafeResourceUrl;
  destroy$ = new Subject<void>();
  itemSelecionado: IMinuta | undefined;
  filtro = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  filtrosAplicados = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private minutaService: MinutaService,
    private poNotification: PoNotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  minuta: IMinuta[] = [];
  columns!: Array<PoTableColumn>;

  grupo = environment.grupo ?? '';
  filial = environment.filial ?? '';
  limit = 12;
  loadingState = false;

  ngOnInit(): void {
    this.listMinuta(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --------------------------------------------------
  // LISTAGEM
  // --------------------------------------------------
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

  applyFilters(): void {
    this.filtrosAplicados = true;
  }

  clearFilters(): void {
    this.filtro = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.filtrosAplicados = false;
  }

  get minutaFiltrada(): IMinuta[] {
    if (!this.filtrosAplicados) {
      return this.minuta;
    }
    return this.filterItems(this.minuta, this.filtro, this.filtroDataInicio, this.filtroDataFim);
  }

  private filterItems(items: IMinuta[], filtro: string, dataInicio?: string, dataFim?: string): IMinuta[] {
    if (!items) {
      return items;
    }

    const normalizedFiltro = (filtro ?? '').toString().trim().toLowerCase();
    const inicio = dataInicio ? this.parseDateInput(dataInicio) : undefined;
    const fim = dataFim ? this.parseDateInput(dataFim) : undefined;

    return items.filter((item: any) => {
      if (inicio || fim) {
        const emissaoDate = this.parseEmissaoDate(item);
        if (!emissaoDate) {
          return false;
        }
        if (inicio && this.getDateKey(emissaoDate) < this.getDateKey(inicio)) {
          return false;
        }
        if (fim && this.getDateKey(emissaoDate) > this.getDateKey(fim)) {
          return false;
        }
      }

      if (!normalizedFiltro) {
        return true;
      }

      for (const key in item) {
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

  private parseDateInput(value: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const [yearStr, monthStr, dayStr] = value.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) {
      return undefined;
    }
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  }

  private parseEmissaoDate(item: any): Date | undefined {
    const raw = item?.emissao ?? '';
    if (typeof raw === 'string' && raw.length >= 8) {
      const ano = raw.substring(0, 4);
      const mes = raw.substring(4, 6);
      const dia = raw.substring(6, 8);
      const parsed = new Date(Number(ano), Number(mes) - 1, Number(dia));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const formatted = item?.dataFormatada ?? '';
    if (typeof formatted === 'string' && formatted.length >= 10) {
      const [dia, mes, ano] = formatted.substring(0, 10).split('/');
      const parsed = new Date(Number(ano), Number(mes) - 1, Number(dia));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return undefined;
  }

  private getDateKey(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  getColumns(): Array<PoTableColumn> {
    return [
      { property: 'documento', label: 'Nota Fiscal' },
      { property: 'nomeCliente', label: 'Cliente' },
      { property: 'transportadora', label: 'Transportadora' },
      { property: 'placa', label: 'Placa' },
      { property: 'motorista', label: 'Motorista' },
      { property: 'cpf', label: 'CPF' },
      { property: 'conferente', label: 'Conferente' },
      { property: 'dataFormatada', label: 'Emissão' },
      {
        property: 'actions',
        label: 'Ações',
        type: 'icon',
        sortable: false,
        icons: [
          {
            action: this.gerarPdfMinuta.bind(this),
            color: 'color-01',
            icon: 'po-icon-upload',
            tooltip: 'Pedido',
            value: 'true',
          },
        ],
      },
    ];
  }

  listMinuta(action: boolean) {
    this.columns = this.getColumns();

    this.loadingState = true;

    if (action) this.limit *= 2;

    this.minutaService
      .getMinuta(this.grupo, this.filial, this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.minuta = data.map((item: any) => ({
            ...item,
            actions: 'true',
            dataFormatada: this.formatarData(item.emissao),
          }));
          this.loadingState = false;
        },
        error: (err) => {
          console.error(err);
          this.loadingState = false;
        },
      });
  }

  // --------------------------------------------------
  // GERAÇÃO DO PDF
  // --------------------------------------------------

  async gerarPdfMinuta(item: IMinuta) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margemX = 10;

    console.log('Gerando PDF para o item:', item);

    const [data, hora] = this.formatarData(item.emissao).split(' '); // separa data e hora

    // ------------------ Cabeçalho ------------------
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MINUTA DE DESPACHO', pageWidth / 2, 15, { align: 'center' });

    // Caixa de dados de emissão (data, hora, página)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const dataAtual = new Date();
    //doc.rect(pageWidth - 60, 5, 55, 20); // caixa retangular
    doc.text(`Data emissão: ${data}`, pageWidth - 58, 10);
    doc.text(`Hora emissão: ${hora}`, pageWidth - 58, 15);
    doc.text(`Página: 1 de 1`, pageWidth - 58, 20);

    let y = 40;

    // ------------------ Destinatário ------------------
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATÁRIO:', margemX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.nomeCliente, margemX + 40, y);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA:', pageWidth - 50, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dataAtual.toLocaleDateString(), pageWidth - 30, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('CIDADE:', margemX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.cidade, margemX + 40, y);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO:', pageWidth - 50, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.estado, pageWidth - 30, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR MERCADORIA:', margemX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.valor.toString(), margemX + 40, y);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTA FISCAL:', pageWidth - 50, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.documento, pageWidth - 30, y);

    // Caixa ao redor dos dados do destinatário
    //doc.rect(margemX - 2, 27, pageWidth - 2 * margemX + 4, y - 27 + 5);

    y += 10;

    // ------------------ Tabela Volumes / Espécie / Peso ------------------
    const cellWidth = (pageWidth - 2 * margemX) / 3;
    const cellHeight = 20;

    // linhas verticais
    doc.rect(margemX, y, pageWidth - 2 * margemX, cellHeight);
    doc.line(margemX + cellWidth, y, margemX + cellWidth, y + cellHeight);
    doc.line(margemX + 2 * cellWidth, y, margemX + 2 * cellWidth, y + cellHeight);

    // cabeçalhos da tabela
    doc.setFont('helvetica', 'bold');
    doc.text('Volumes', margemX + cellWidth / 2, y + 7, { align: 'center' });
    doc.text('Espécie', margemX + cellWidth + cellWidth / 2, y + 7, { align: 'center' });
    doc.text('Peso', margemX + 2 * cellWidth + cellWidth / 2, y + 7, { align: 'center' });

    // valores
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.volume), margemX + cellWidth / 2, y + 15, { align: 'center' });
    doc.text(item.especie, margemX + cellWidth + cellWidth / 2, y + 15, { align: 'center' });
    doc.text(String(item.peso), margemX + 2 * cellWidth + cellWidth / 2, y + 15, { align: 'center' });

    y += cellHeight + 10;

    // ------------------ Recebimento ------------------
    doc.text(`Recebido dia ${data} às ${hora} hrs.`, margemX, y);
    y += 40;

    // ------------------ Assinaturas ------------------
    const assinaturaWidth = 80;

    // --- Linha da assinatura do motorista (esquerda) ---
    doc.line(margemX, y, margemX + assinaturaWidth, y);

    // Assinatura do motorista acima da linha
    if (item.assinatura) {
      // separando a assinatura do motorista da do conferente
      const imgWidth = 40;
      const imgHeight = 20;
      const imgX = margemX + assinaturaWidth / 2 - imgWidth / 2; // centraliza horizontalmente
      const imgY = y - imgHeight - 2; // acima da linha
      doc.addImage(item.assinatura, 'PNG', imgX, imgY, imgWidth, imgHeight);
    }
    doc.setFontSize(8);

    // Textos abaixo da linha
    doc.text(`Nome Motorista ${item.motorista}`, margemX + assinaturaWidth / 2, y + 8, { align: 'center' });
    doc.text(`Documento do Motorista: ${item.cpf || ''}`, margemX + assinaturaWidth / 2, y + 16, { align: 'center' });
    doc.text(`Transportadora: ${item.transportadora || ''}`, margemX + assinaturaWidth / 2, y + 24, {
      align: 'center',
    });
    doc.text(`Placa Veículo: ${item.placa || ''}`, margemX + assinaturaWidth / 2, y + 32, { align: 'center' });

    // --- Linha da assinatura do conferente (direita) ---
    doc.line(pageWidth - margemX - assinaturaWidth, y, pageWidth - margemX, y);

    // Assinatura em base64 acima do nome do conferente

    // Nome do conferente acima da linha
    doc.text(item.conferente || '', pageWidth - margemX - assinaturaWidth / 2, y - 4, { align: 'center' });

    // Textos abaixo da linha
    doc.text('Conferente / Responsável pelo Embarque', pageWidth - margemX - assinaturaWidth / 2, y + 4, {
      align: 'center',
    });

    // 2 — Cria um Blob do PDF
    const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    // 4 — Abre a modal
    this.pdfModal.open();
    this.cdr.detectChanges();
    // Salvar PDF
    // const nomeArquivo = `minuta_${item.documento}.pdf`;
    // doc.save(nomeArquivo);
  }

  formatarData(dataStr: string): string {
    if (!dataStr) return '';

    const [data, hora] = dataStr.split(' ');

    const ano = data.substring(0, 4);
    const mes = data.substring(4, 6);
    const dia = data.substring(6, 8);

    return `${dia}/${mes}/${ano} ${hora}`;
  }
}
