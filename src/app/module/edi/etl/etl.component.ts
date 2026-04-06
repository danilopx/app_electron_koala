import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  PoModalComponent,
  PoTableLiterals,
  PoTableColumn,
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { ProtheusService } from '../../../service/protheus.service';
import { EdiService } from '../../../service/edi.service';
import { DocumentIdi } from 'src/app/interfaces/documentEdi.interface';
import { PedidoIdi } from 'src/app/interfaces/interface-pedidoedi';
import { EmailHelperService } from 'src/app/shared/services/email-helper.service';
import { DataHelperService } from 'src/app/shared/services/data-helper.service';

@Component({
  selector: 'app-etl',
  templateUrl: './etl.component.html',
  styleUrls: ['./etl.component.scss'],
  providers: [ProtheusService, EdiService],
})
export class EtlComponent implements OnInit, OnDestroy {
  @ViewChild(PoModalComponent, { static: true }) poModal!: PoModalComponent;

  private readonly DEFAULT_TOTAL_RECORDS = 100;
  private readonly DEFAULT_PAGE_SIZE = 12;

  selectedItems?: Array<Record<string, any>>;
  constructor(
    private router: Router,
    public ProtheusService: ProtheusService,
    public EdiService: EdiService,
    private cdr: ChangeDetectorRef,
    private emailHelper: EmailHelperService,
    public dataFormateBr: DataHelperService,
  ) {}

  private destroy$ = new Subject<void>();

  documents: DocumentIdi[] = [];
  pedidoEdi: PedidoIdi[] = [];
  filteredPedidoEdi: PedidoIdi[] = [];
  totalRecords = 0;
  totalDocuments = 0;
  totalPedidoAB = 0;
  totalPedidoFT = 0;
  totalPedidoFP = 0;
  private manualTotalRecords?: number;
  timenow = new Date().toTimeString().slice(0, 5);
  datenow = new Date().toLocaleDateString('pt-BR');
  filial = localStorage.getItem('filial') || '';
  grupo = localStorage.getItem('grupo') || '';
  usuario = sessionStorage.getItem('username') || '';
  documentosProcessados: Array<Record<string, any>> = [];
  documentosProcessadosSelect: Array<Record<string, any>> = [];
  loagingButton = false;
  loagingPage = true;
  loadingState = false;
  modalAction = '';
  refreshPedido = false;
  disabledButton = false;
  codCliente = '000025';
  filterStart = '';
  filterEnd = '';
  currentStatusFilter = '';

  titleModal!: string;
  columns!: Array<PoTableColumn>;
  pedido: Array<Record<string, any>> = [];
  action!: string;
  mensagem!: string;

  limit = this.DEFAULT_PAGE_SIZE;
  currentPage = 1;
  pageSize = this.DEFAULT_PAGE_SIZE;
  tipo = ''; // N = Normal, B=Beneficiamento, R = Retorno
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

  getColumns(): Array<PoTableColumn> {
    return [
      { property: 'pedido_id', label: 'Pedido' },
      { property: 'pedido_idcli', label: 'Ped. Cliente' },
      // { property: 'pedido_codcli', label: 'Código' },
      //   { property: 'pedido_loja', label: 'Loja' },
      { property: 'pedido_cliente', label: 'Cliente' },
      { property: 'pedido_emissao', label: 'Importação' },
      { property: 'pedido_usuario', label: 'Usuário' },
      {
        property: 'pedido_tipo',
        label: 'Tipo',
        type: 'label',
        labels: [
          { value: 'T', color: 'green', label: 'Triangulado' },
          { value: 'N', color: 'gray', label: 'Normal' },
          { value: '', color: 'gray', label: 'Normal' },
        ],
      },
      {
        property: 'Status',
        type: 'label',
        labels: [
          { value: 'AB', color: 'green', label: 'Aberto' },
          { value: 'FT', color: 'red', label: 'Faturado' },
          { value: 'FP', color: 'gray', label: 'Fat. Parcial' },
        ],
      },
      {
        property: 'actions',
        label: 'Ações',
        type: 'icon',
        sortable: false,
        icons: [
          {
            action: this.invoicePedido.bind(this),
            color: 'color-01',
            icon: 'po-icon-upload',
            tooltip: 'Pedido',
            value: 'true',
          },
        ],
      },
    ];
  }

  ngOnInit(): void {
    this.columns = this.getColumns();
    this.EdiServiceDocuments();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  EdiServiceDocuments() {
    this.EdiService.getDocuments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DocumentIdi[]) => {
          this.documents = data;
        },
        error: (error: any) => {
          console.error('Erro ao obter documentos', error);
        },
        complete: () => {
          this.getDocumentos();
          this.listPedidos(false, '', '', '');
          this.getPedidosTotais();
        },
      });
  }

  

  listPedidos(action: boolean, pedido: string, pedido_cli: string, status?: string, page?: number) {
    this.loadingState = true;

    if (action) {
      this.limit = this.limit + this.limit;
    }

    const offset = page ?? this.currentPage;
    if (status !== undefined) {
      this.currentStatusFilter = status;
    }
    if (!status) {
      this.manualTotalRecords = undefined;
    }

    this.EdiService.getPedido(
      this.grupo,
      this.filial,
      pedido || '',
      pedido_cli || '',
      status || '',
      offset,
      this.pageSize,
      this.codCliente,
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const items = data?.items ?? [];
          this.totalRecords =
            this.manualTotalRecords ?? data?.total ?? this.DEFAULT_TOTAL_RECORDS;
          this.pedidoEdi = items.map((item: PedidoIdi) => ({
            ...item,
            actions: 'true',
          }));
          this.applyDateFilter(false);
        },
        error: (err) => {
          console.error('Erro ao buscar pedidos:', err);
          this.loadingState = false;
        },
        complete: () => {
          this.loadingState = false;
          this.loagingPage = false;
        },
      });
  }

  onKpiClick(status: string, total: number): void {
    this.currentPage = 1;
    this.pageSize = this.DEFAULT_PAGE_SIZE;
    this.manualTotalRecords = Math.max(0, Number(total) || 0);
    this.listPedidos(false, '', '', status, this.currentPage);
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.listPedidos(false, '', '', this.currentStatusFilter, this.currentPage);
  }

  applyDateFilter(resetPage: boolean = true): void {
    if (resetPage) {
      this.currentPage = 1;
    }
    const start = this.parseInputDate(this.filterStart);
    const end = this.parseInputDate(this.filterEnd);
    const startKey = start ? this.dateKey(start) : undefined;
    const endKey = end ? this.dateKey(end) : undefined;

    this.filteredPedidoEdi = (this.pedidoEdi || []).filter(item => {
      const emissao = this.parseEmissaoDate(item?.pedido_emissao);
      if (!emissao) {
        return !startKey && !endKey;
      }
      const key = this.dateKey(emissao);
      if (startKey && key < startKey) {
        return false;
      }
      if (endKey && key > endKey) {
        return false;
      }
      return true;
    });
  }

  clearDateFilter(): void {
    this.filterStart = '';
    this.filterEnd = '';
    this.currentPage = 1;
    this.applyDateFilter(false);
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

  private parseEmissaoDate(value: any): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    const text = String(value).trim();
    if (!text) {
      return null;
    }
    if (text.includes('/')) {
      const parts = text.split('/');
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);
        if (day && month && year) {
          return new Date(year, month - 1, day);
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
          return new Date(year, month - 1, day);
        }
      }
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private dateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getDocumentos() {
    const cnpjDesejado = localStorage.getItem('cnpj');

    if (!this.documents || this.documents.length === 0) {
      console.warn('Nenhum documento encontrado para processar.');
      return;
    }

    this.EdiService.downloadDocuments(this.documents)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.documentosProcessados = data;

        const padCNPJ = (cnpj: string | number): string => {
          return String(cnpj).padStart(14, '0');
        };

        const documentosFiltrados = this.documentosProcessados.filter(
          (doc) =>
            padCNPJ(doc?.['json']?.cabecalho?.cnpj_filial) === padCNPJ(cnpjDesejado!) &&
            padCNPJ(doc?.['json']?.cabecalho?.codigo_cliente) === padCNPJ(this.codCliente),
        );

        this.totalDocuments = documentosFiltrados.length;
        this.documentosProcessados = documentosFiltrados;
        this.cdr.detectChanges();
      });
  }

  getPedidosTotais() {
    this.EdiService.getPadidoTotais(this.grupo, this.filial).subscribe((data) => {
      const pedidoTotais = data;
      this.totalPedidoAB = pedidoTotais.pedido_total_aberto;
      this.totalPedidoFP = pedidoTotais.pedido_total_parcial;
      this.totalPedidoFT = pedidoTotais.pedido_total_finalizado;
      this.cdr.detectChanges();
    });
  }

  
  onSelectItems(selectedItems?: Array<Record<string, any>> | Event): void {
    let items: Array<Record<string, any>> = [];

    if (Array.isArray(selectedItems)) {
      items = selectedItems;
    } else {
      items = (this.documentosProcessados || []).filter((candidate) => candidate['$selected']);
    }

    this.selectedItems = items;
  }

  get isImportDisabled(): boolean {
    return !(this.documentosProcessados || []).some((item) => item['$selected']);
  }


  setDocumentos() {
    this.documentosProcessados.forEach((candidate) => {
      if (candidate['$selected']) {
        this.documentosProcessadosSelect.push(candidate);
      }
    });

    this.loagingPage = true;
    this.poModal.close();
    this.EdiService.setPedido(this.documentosProcessadosSelect, this.grupo, this.filial, this.usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loagingPage = false;

          // Verifique a estrutura correta
          if (res?.message) {
            const mensagens = this.converterParaArrayDeObjetos(res.message);

            // Verifica se existe algum grupo com status "error"
            const sucessos = mensagens.filter((grupo) => grupo.status === 'success');
            sucessos.forEach((grupo) => {
              this.EdiService.returnDocumentos(grupo.document_Id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res) => {
                    
                     this.EdiServiceDocuments();
                  },
                  error: (err) => {
                   
                     this.EdiServiceDocuments();
                  },
                });

              this.refreshPedido = true;
            });

            if (this.refreshPedido) {
              this.getDocumentos();
              this.listPedidos(false, '', '', '');
            }

            this.openModal('log', this.formatarMensagemParaLog(res.message));
            this.EdiServiceDocuments();
          } else {
            console.error("Resposta não contém a chave 'message'.", res);
          }
        },
        error: (err) => {
          this.loagingPage = false;
          console.error('Erro ao enviar documentos:', err);
        },
      });

    this.documentosProcessadosSelect = [];
  }

  formatTitle(item: any) {
    return `Cliente:  ${item?.json.cabecalho.codigo_cliente}/${item?.json.cabecalho.loja_cliente} - ${item?.json.cabecalho.nome_cliente}`;
  }

  openModal(action: string, data: any) {
    if (action == 'import') {
      this.pedido = this.documentosProcessados;
      this.titleModal = 'EDI - Importar Pedido Para o Protheus';
      this.action = action;
      this.selectedItems = [];
    }
    if (action == 'log') {
      this.titleModal = 'Log de Importação';
      this.pedido = this.documentosProcessados;
      this.mensagem = data;
      this.action = action;
    }
    this.poModal.open();
  }

  converterParaArrayDeObjetos(data: any[][]): any[] {
    const resultado: any[] = [];
    let objAtual: any = {};

    data.forEach(([key, value]) => {
      if (key === 'status' && Object.keys(objAtual).length > 0) {
        resultado.push(objAtual);
        objAtual = {};
      }
      objAtual[key] = value;
    });

    if (Object.keys(objAtual).length > 0) {
      resultado.push(objAtual);
    }

    return resultado;
  }

  converterMensagemParaGrupos(mensagem: [string, string][]): { [key: string]: string }[] {
    const grupos: { [key: string]: string }[] = [];
    let grupoAtual: { [key: string]: string } = {};

    for (const [chave, valor] of mensagem) {
      if (chave === 'status' && Object.keys(grupoAtual).length > 0) {
        grupos.push(grupoAtual);
        grupoAtual = {};
      }
      grupoAtual[chave] = valor;
    }

    if (Object.keys(grupoAtual).length > 0) {
      grupos.push(grupoAtual);
    }

    return grupos;
  }

  formatarGruposHTML(grupos: { [key: string]: string }[]): string {
    let html = '';
    let ultimoDocumentoId: string | null = null;

    for (const grupo of grupos) {
      const atualDocumentoId = grupo['document_Id'];
      const status = grupo['status']?.toLowerCase();

      let corMensagem = 'black'; // valor padrão
      if (status === 'error') {
        corMensagem = 'po-alert-error';
      } else {
        corMensagem = 'po-alert-success';
      }

      // Se mudou o document_Id, coloca <hr> e os dados principais
      if (atualDocumentoId !== ultimoDocumentoId) {
        if (ultimoDocumentoId !== null) {
          html += '<br><hr><br>';
        }

        html += `
        <div>
          ${grupo['status'] ? `<strong>Status:</strong>  <span   class="${corMensagem}" >  ${grupo['status'] == 'error' ? 'Pedido não Importado' : 'Pedido Importado'}</span><br>` : ''}
          ${grupo['document_Id'] ? `<strong>Documento ID:</strong> ${grupo['document_Id']}<br>` : ''}
          ${grupo['pedido_Cliente'] ? `<strong>Pedido Cliente:</strong> ${grupo['pedido_Cliente']}<br>` : ''}
          ${grupo['pedido'] ? `<strong>Pedido:</strong> ${grupo['pedido']}<br>` : `<strong>Pedido:</strong><br>`}
          ${grupo['dt_importacao'] ? `<strong>Data Importação:</strong> ${this.dataFormateBr.formateDataBr(grupo['dt_importacao'])}<br>` : `<strong>Data Importação:</strong><br>`}
          ${grupo['usuario'] ? `<strong>Usuário:</strong> ${grupo['usuario']}<br>` : `<strong>Usuário:</strong><br>`}
        </div>
      `;
      }

      html += `
  <div>
    ${
      grupo['mensagem']
        ? `<strong>Mensagem:</strong> <span >${grupo['mensagem']}</span><br>`
        : `<strong>Mensagem:</strong> <span >${grupo['error'] || ''}</span><br>`
    }
  </div>
`;

      ultimoDocumentoId = atualDocumentoId;
    }

    return html;
  }
  formatarMensagemParaLog(mensagem: [string, string][]): string {
    const grupos = this.converterMensagemParaGrupos(mensagem);
    return this.formatarGruposHTML(grupos);
  }
  enviarLog(log: string) {
    this.emailHelper.enviarLog(log, '');
  }

  invoicePedido(row: any) {
    const filial = row.pedido_filial; // se sua API retorna esse campo
    const numero = row.pedido_id; // ou o campo correto
    const tipo = row.pedido_tipo;
    const cliente = row.pedido_codcli || '';
    const loja = row.pedido_loja || '';

    this.router.navigateByUrl(
      `/edi/etl/pedido/${numero}?filial=${filial}&tipo=${tipo}&cliente=${cliente}&loja=${loja}`,
    );
  }

  releasePedido(filial: string, numero: string, tipo: string) {
    this.ProtheusService.getPedido(filial, numero, tipo).subscribe((data) => {
          this.openModal(data, 'liberar');
    });
  }

  editPedido(filial: string, numero: string, tipo: string) {
    this.router.navigateByUrl(`/remessa/pedido/edit/${filial}/${numero}/${tipo}`);
  }

  classPedido(filial: string, numero: string, tipo: string) {
    this.router.navigateByUrl(`/remessa/pedido/class/${filial}/${numero}/${tipo}/N`);
  }
}
