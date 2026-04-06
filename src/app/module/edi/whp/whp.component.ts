import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {
  PoModalComponent,
  PoTableComponent,
  PoStepperItem,
  PoTableLiterals,
  PoStepperStatus,
  PoTableColumn,
  PoSelectOption,
  PoStepperComponent,
  PoPageAction,
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { ProtheusService } from '../../../service/protheus.service';
import { EdiService } from '../../../service/edi.service';
import { DatePipe } from '@angular/common';
import { DocumentIdi } from 'src/app/interfaces/documentEdi.interface';
import { PedidoIdi } from 'src/app/interfaces/interface-pedidoedi';
import { EmailHelperService } from 'src/app/shared/services/email-helper.service';
import { DataHelperService } from 'src/app/shared/services/data-helper.service';

@Component({
  selector: 'app-edi',
  templateUrl: './whp.component.html',
  styleUrls: ['./whp.component.scss'],
  providers: [ProtheusService, EdiService],
})
export class WhpComponent implements OnInit, OnDestroy {
  @ViewChild(PoStepperComponent) stepper!: PoStepperComponent;
  @ViewChild(PoTableComponent, { static: true }) poTable!: PoTableComponent;
  @ViewChild(PoModalComponent, { static: true }) poModal!: PoModalComponent;
  selectedItems: any[] | undefined;
  constructor(
    private router: Router,
    public ProtheusService: ProtheusService,
    public EdiService: EdiService,
    private changeDetector: ChangeDetectorRef,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private emailHelper: EmailHelperService,
    public dataFormateBr: DataHelperService,
  ) {}

  private destroy$ = new Subject<void>();

  documents: DocumentIdi[] = [];
  pedidoEdi: PedidoIdi[] = [];
  totalDocuments = 0; // variável para contar
  totalPedidoAB = 0; // variável para contar
  totalPedidoFT = 0; // variável para contar
  totalPedidoFP = 0; // variável para contar
  totalPedidoEX = 0; // variável para contar
  timenow = new Date().toTimeString().slice(0, 5);
  datenow = new Date().toLocaleDateString('pt-BR');
  filial = localStorage.getItem('filial') || '';
  grupo = localStorage.getItem('grupo') || '';
  usuario = sessionStorage.getItem('username') || '';
  documentosProcessados: any[] = [];
  documentosProcessadosSelect: any[] = [];
  loagingButton = false;
  loagingPage = true;
  loadingState = false;
  modalAction = '';
  refreshPedido = false;
  disabledButton = false;
  codCliente = '000127';

  overview: any;
  titleModal!: string;
  columns!: Array<PoTableColumn>;
  items: any = [];
  pedido: any = [];
  nota: any = [];
  action!: string;
  mensagem!: string;
  steps: Array<PoStepperItem> = [];

  limit = 12;
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
    //  { property: 'pedido_codcli', label: 'Código' },
   //   { property: 'pedido_loja', label: 'Loja' },
      { property: 'pedido_cliente', label: 'Cliente' },
      { property: 'pedido_emissao', label: 'Importação' },
      { property: 'pedido_usuario', label: 'Usuário' },
      { property: 'pedido_tipo', type: 'label',
        labels: [
          { value: 'T', color: 'green', label: 'Triangulado' },
          { value: 'N', color: 'gray', label: 'Normal' },
          { value: '', color: 'gray', label: 'Normal' },
        ], },
      {
        property: 'Status',
        type: 'label',
        labels: [
          { value: 'AB', color: 'green', label: 'Aberto' },
          { value: 'FT', color: 'red', label: 'Faturado' },
          { value: 'FP', color: 'gray', label: 'Fat. Parcial' },
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

  private getNotaInfo(rowItem: any) {
    const nota = Array.isArray(rowItem?.notas) && rowItem.notas.length ? rowItem.notas[0] : null;
    const doc = String(nota?.doc ?? nota?.nota ?? rowItem?.notafiscal ?? '').trim();
    const serie = String(nota?.serie ?? rowItem?.serie ?? '').trim();
    const hasNota = Boolean(doc || serie);

    const tabelaPedido = String(rowItem?.tabela ?? '').trim();
    const condPagPedido = String(rowItem?.condpag ?? '').trim();
    const tabelaNota = String(nota?.tabela ?? '').trim();
    const condPagNota = String(nota?.cond_pag ?? nota?.condpag ?? '').trim();
    const userClassNota = String(nota?.user_class ?? nota?.userclass ?? '').trim();

    return {
      hasNota,
      doc,
      serie,
      tabela: hasNota ? (tabelaNota || tabelaPedido) : tabelaPedido,
      condPag: hasNota ? (condPagNota || condPagPedido) : condPagPedido,
      emissao: hasNota ? (nota?.emissao ?? nota?.emissaonf ?? null) : null,
      userClass: hasNota ? userClassNota : '',
    };
  }

  getNotaFiscalValue(rowItem: any): string {
    const info = this.getNotaInfo(rowItem);
    if (!info.hasNota) {
      return '';
    }
    if (!info.doc && !info.serie) {
      return '';
    }
    return info.serie ? `${info.doc} / ${info.serie}` : info.doc;
  }

  getTabelaValue(rowItem: any): string {
    return this.getNotaInfo(rowItem).tabela;
  }

  getCondicaoPgtoValue(rowItem: any): string {
    return this.getNotaInfo(rowItem).condPag;
  }

  getDataFaturadoValue(rowItem: any): string {
    const info = this.getNotaInfo(rowItem);
    return info.hasNota ? this.formatarDataBrasileira(info.emissao) : '';
  }

  getClassificacaoValue(rowItem: any): string {
    return this.getNotaInfo(rowItem).userClass;
  }

  ngOnInit(): void {
    // Chama o serviço para obter os documentos
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
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  listPedidos(action: boolean, pedido: string, pedido_cli: string, status?: string) {
    this.columns = this.getColumns();
    this.loadingState = true;

    if (action) {
      this.limit = this.limit + this.limit;
    }

     this.EdiService.getPedido(this.grupo, this.filial, pedido || '', pedido_cli || '', status || '', 1, this.limit, this.codCliente)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pedidoEdi = data?.items ?? [];
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

  getDocumentos() {
    const cnpjDesejado = localStorage.getItem('cnpj'); //

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
          (doc) => padCNPJ(doc?.json?.cabecalho?.cnpj_filial) == padCNPJ(cnpjDesejado!) && padCNPJ(doc?.json?.cabecalho?.codigo_cliente) == padCNPJ(this.codCliente!),
        );

        this.totalDocuments = documentosFiltrados.length;
        this.documentosProcessados = documentosFiltrados;
        console.log(this.documentosProcessados);
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
  onSelectItems(selectedItems: any[]): void {
    this.selectedItems = selectedItems;
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
              console.log('>>>>>>>>>>>>>>>>Grupo:', grupo.document_Id);

              /*this.EdiService.returnDocumentos(grupo.document_Id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res) => {
                    console.log('Documento atualizado:', res);
                  },
                  error: (err) => {
                    console.error('Erro ao atualizar documento:', err);
                  },
                });*/

              this.refreshPedido = true;
            });

            if (this.refreshPedido) {
              this.getDocumentos();
              this.listPedidos(false, '', '', '');
            }

            this.openModal('log', this.formatarMensagemParaLog(res.message));
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
      if (this.documentosProcessados.length === 0) {
        this.disabledButton = true;
      }
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
          ${grupo['pedido'] ? `<strong>Pedido:</strong> ${grupo['pedido']}<br>` : `<strong>Pedido:</strong><br><br>`}
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

    viewPedido(filial: string, numero: string, tipo: string) {
      // this.loadingState = true;
      this.ProtheusService.getPedido(filial, numero, tipo).subscribe((data) => {
        this.openModal(data, 'nota');
        //this.items = data;
        //this.loadingState = false;
      });
    }

     invoicePedido(filial: string, numero: string, tipo: string) {
    this.router.navigateByUrl(`/remessa/pedido/fat/${filial}/${numero}/${tipo}/S`);
  }

   releasePedido(filial: string, numero: string, tipo: string) {
    this.ProtheusService.getPedido(filial, numero, tipo).subscribe((data) => {
      console.log(data);
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
