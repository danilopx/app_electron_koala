import { ChangeDetectorRef, Component, ViewChild, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription, finalize, map, take } from 'rxjs';
import {
  ForceOptionComponentEnum,
  PoDynamicFormField,
  PoModalComponent,
  PoTableColumn,
  PoDynamicFormFieldChanged,
  PoDynamicFormValidation,
  PoNotificationService,
  PoListViewAction,
  PoDynamicFormLoad,
} from '@po-ui/ng-components';

import { ActivatedRoute, Router } from '@angular/router';
import { ProtheusService } from '../../../../service/protheus.service';
import { formatDate } from '@angular/common';
import { Ipedido, Inota } from '../../../../interfaces/interface-pedido';
import { HttpErrorResponse } from '@angular/common/http';
import { Filial, Grupo } from '../../../../components/header/enums/filiais';
import { SupportModalService } from '../../../../service/support-modal.service';
import { AppTableComponent } from 'src/app/components/table/app-table.component';

const actionInsert = 'insert';
const actionUpdate = 'update';
const actionFaturar = 'faturar';
const actionClassif = 'classificar';

interface PedidoItemDetalhe {
  codigoProduto: string;
  descricaoItem: string;
  codigoCliente: string;
  unidade: string;
  quantidade: number;
  quantidadeEntregue: number;
  entregueFlag: string;
  dataFaturamento: string;
  precoUnitario: number;
  valorDesconto: number;
  armazem: string;
  tes: string;
  operacao: string;
  cfop: string;
  numpcom: string;
  itemcp: string;
}

interface PedidoDetalhe {
  origem: string;
  numero: string;
  pedidoCliente: string;
  cliente: string;
  loja: string;
  filial: string;
  emissao: string;
  status: string;
  statusDesc: string;
  observacao?: string;
  notas: Array<{ doc: string; serie: string }>;
  items: PedidoItemDetalhe[];
}

interface NotaItemDetalhe {
  itemPedido: string;
  produto: string;
  quantidade: number;
  total: number;
}

interface NotaDetalhe {
  doc: string;
  serie: string;
  emissao: string;
  cliente: string;
  loja: string;
  chave: string;
  items: NotaItemDetalhe[];
}

@Component({
  selector: 'app-grid-form',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css'],
  providers: [ProtheusService],
})
export class PedidoETLComponent implements OnInit {
  constructor(
    public ProtheusService: ProtheusService,
    private poNotification: PoNotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
    private supportModalService: SupportModalService,
  ) {}

  @ViewChild(PoModalComponent, { static: false }) poModal!: PoModalComponent;
  @ViewChild(AppTableComponent, { static: false }) poTable!: AppTableComponent;
  @ViewChild('notaModal', { static: false }) notaModal!: PoModalComponent;

  private paramsSub!: Subscription;
  action: string = actionInsert;

  title = '';
  loading = false;
  error = '';
  pedidoDetalhe: PedidoDetalhe | null = null;
  notaDetalhes: NotaDetalhe[] = [];
  selectedNota: NotaDetalhe | null = null;

  titleDetailsModal!: string; //
  loadingModal = false; // modal
  typeModal!: string; //
  modalAction!: string; //
  validateFields: Array<string> = ['quant'];
  typoAction = 'add';
  nitem = 1;
  itemsForm?: NgForm;
  PedidoForm?: NgForm;
  columns!: Array<PoTableColumn>; //table pedido
  items!: Array<any>; //
  columnsProduto!: Array<PoTableColumn>; //table modal
  items_ped: any = [];
  items_ped_view: any = []; //
  formValue = {};
  formValueItems = {};
  codtab = ''; //
  codpgto = ''; // utilizado para gravar informações paa busca de tabela
  origem!: string; //
  destino!: string; //
  _origem!: string; //
  _destino!: string; //
  produtoTabela: any = []; // retorno dos produtos com tabela
  ItemPedido: any = []; // retorno dos produtos com tabela
  buttonPR: boolean = true;
  buttonPRS: boolean = true;
  buttonPRG: boolean = false;
  buttonCan: boolean = false;
  date_now: Date = new Date();
  camposPredefinidosProduto = {};
  IPedido!: Ipedido;
  pedidoNum!: string;
  faturar: string = 'N';
  invoice: string = 'N';
  salvarDBT: boolean = false;
  notaFiscal: string = ' ';
  tipoPedid: string = ''; // N = Normal, B=Beneficiamento
  xtipoPedid: string = ''; // N = Normal, B=Beneficiamento, R = Retorno
  filial: string = '';
  tipo: string = '';
  clienteParam: string = '';
  lojaParam: string = '';
  fields!: Array<PoDynamicFormField>;

  //////////////////////////////////////// Ação da List View Produos //////////////////////////
  actions: Array<PoListViewAction> = [];
  /////////////////////////////////////////////// Form principal /////////////////////////////

  /////////////////////////////////////////////// Form modal /////////////////////////////////
  fields_prod: PoDynamicFormField[] = [
    {
      label: 'Item',
      property: 'nitem',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
      disabled: true,
    },
    {
      label: 'Produto',
      property: 'codigo',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
    },
    {
      label: 'Descrição',
      property: 'desc',
      gridColumns: 5,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
    },
    {
      label: 'UM',
      property: 'um',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
    },
    {
      label: 'TES',
      property: 'tes',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
    },
    {
      label: 'AMZ',
      property: 'amz',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
    },
    {
      label: 'Quantidade',
      property: 'quant',
      required: true,
      type: 'number',
      minValue: 1,
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: false,
      placeholder: 'Quantidade',
    },
    {
      label: 'Preço Unit.',
      type: 'currency',
      placeholder: 'Valor',
      decimalsLength: 2,
      required: true,
      thousandMaxlength: 8,
      property: 'prunit',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: false,
    },
    {
      label: 'Preço Total',
      type: 'currency',
      decimalsLength: 2,
      thousandMaxlength: 7,
      property: 'ptotal',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
    },
    {
      property: 'dtentreg',
      label: 'Data de Entrega',
      type: 'date',
      format: 'dd/mm/yyyy',
      gridColumns: 3,
      gridSmColumns: 12,
      readonly: false,
      required: true,
    },
  ];

  ////////////////////////////////////////Funções NG /////////////////////////////////////////
  ngOnInit(): void {
    this.fields = this.getCamposForm();

    let _nItemPai = '';
    let ncount = 1;
    let itemsPR;

    //this.loadingState = true;
    this.paramsSub = this.route.params.subscribe((params) => {
      this.pedidoNum = params['id'];
      this.filial = this.route.snapshot.queryParamMap.get('filial') || localStorage.getItem('filial') || '';
      this.tipo = this.route.snapshot.queryParamMap.get('tipo') || '';
      this.clienteParam = this.route.snapshot.queryParamMap.get('cliente') || '';
      this.lojaParam = this.route.snapshot.queryParamMap.get('loja') || '';

      if (this.pedidoNum) {
        this.loading = true;
        this.ProtheusService.getPedidoEtlSimplify(
          this.filial,
          params['id'],
          this.clienteParam || undefined,
          this.lojaParam || undefined,
        )
          .pipe(map((data) => data))
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (data) => {
            const apiPayloadStatus = String(data?.data?.status || '').trim().toUpperCase();
            const apiWrapperStatus = String(data?.status || '').trim().toUpperCase();
            if (apiWrapperStatus === 'ERROR' || apiPayloadStatus === 'ERRO') {
              const apiMsgRaw = String(data?.data?.msg || data?.msg || 'Pedido nao encontrado.');
              if (apiMsgRaw.includes('THREAD ERROR')) {
                this.supportModalService.openWithMessage('Erro na API Simplify :', apiMsgRaw);
              }
              const apiMsg = apiMsgRaw.trim();
              this.error = apiMsg;
              this.pedidoDetalhe = null;
              this.changeDetector.detectChanges();
              return;
            }

            const pedidoData =
              data?.data?.Pedido ??
              data?.Pedido ??
              data?.pedido?.[0] ??
              data?.pedidos?.[0] ??
              data?.[0] ??
              data;

            if (!pedidoData) {
              this.poNotification.warning('Pedido não encontrado.');
              this.error = 'Pedido não encontrado.';
              return;
            }

            this.IPedido = this.mapPedidoSimplify(pedidoData);
            this.pedidoDetalhe = this.mapPedidoDetalhe(this.IPedido);
            this.notaDetalhes = this.buildNotaDetalhes(this.IPedido.notas || []);

            console.log(this.IPedido);

            this.title = `EDI - ${this.IPedido?.nome ?? ''}: ${params['id']}`;

            this._origem = this.IPedido.filial;
            this.codtab = this.IPedido.tabela ? '' : '000';

            this.formValue = {
              origem:   this.IPedido.empresa,
              destino:  this.IPedido.nome,
              emissao:  this.IPedido.emissao,
              operacao: this.IPedido.operacao,
              natureza: '10001 - Venda Nacional',
              tabela:   this.IPedido.tabela,
              condicao: this.IPedido.condpag,
              pedcliente: this.IPedido.pedcliente,
            };

            this.IPedido.items?.forEach((_items) => {
              this.nitem = parseInt(_items.item) + 1;

              if (ncount == 1) {
                _nItemPai = _items.item;
              }

              itemsPR = {
                nitem: parseInt(_items.item),
                codigo: _items.produto,
                desc: _items.descricao,
                quant: _items.quantidade,
                um: _items.unidade,
                prunit: _items.preco,
                ptotal: (_items.quantidade * parseFloat(_items.preco)).toFixed(2),
                tes: _items.tes,
                amz: _items.local,
                tab: this.IPedido.tabela,
                dtentreg: _items.entrega,
                tipo: 'A',
                notaorig: _items.nota,
                serirorig: _items.serie,
                itemorig: '',
                ident: _items.ident,
                produto: _nItemPai,
              };

              this.items_ped.push(itemsPR);
              this.items_ped_view.push(itemsPR);

              ncount = ncount + 1;
            });

            console.log(this.IPedido.notas);

            this.IPedido.notas?.forEach((_notas) => {
              this.notaFiscal = _notas.nota + '/' + _notas.serie;
            });
          },
            error: (error: HttpErrorResponse) => {
              const apiMsgRaw = String(
                error?.error?.msg ||
                  error?.error?.message ||
                  error?.message ||
                  'Erro ao carregar pedido.',
              );
              if (apiMsgRaw.includes('THREAD ERROR')) {
                this.supportModalService.openWithMessage('Erro na API Simplify :', apiMsgRaw);
              }
              const apiMsg = apiMsgRaw.trim();
              this.error = apiMsg;
              this.pedidoDetalhe = null;
              this.changeDetector.detectChanges();
            },
          });
      }
    });
  }
  OnDestroy(): void {
    this.produtoTabela.unsubscribe();
  }
  /////////////////////////////////////////////////////////////////////////////////////////

  formatTitle(item: any) {
    return `${item.nitem} - ${item.codigo}`;
  }

  get orderTotal(): number {
    if (!this.pedidoDetalhe) {
      return 0;
    }
    return this.pedidoDetalhe.items.reduce((acc, item) => acc + this.itemTotal(item), 0);
  }

  private resolveGrupoFilial(): { grupo: string; filial: string; displayName?: string; groupName?: string } {
    const filial = (this.pedidoDetalhe?.filial || '').trim();
    const grupoStorage = (localStorage.getItem('grupo') || '').trim();
    if (grupoStorage && filial) {
      return { grupo: grupoStorage, filial, groupName: (Grupo as Record<string, string>)[`GRUPO_${grupoStorage}`] };
    }

    const tenantId = (localStorage.getItem('tenantId') || '').trim();
    if (tenantId && tenantId.includes(',')) {
      const [grupoTenant, filialTenant] = tenantId.split(',');
      const grupo = (grupoTenant || '').trim();
      return {
        grupo,
        filial: (filialTenant || filial).trim(),
        groupName: (Grupo as Record<string, string>)[`GRUPO_${grupo}`],
      };
    }

    const grupoFilial = (localStorage.getItem('grupofilial') || '').trim();
    if (grupoFilial && grupoFilial.includes('/')) {
      const [grupoRaw, filialRaw] = grupoFilial.split('/');
      const filialCode = (filialRaw || '').split('-')[0].trim();
      const displayName = (filialRaw || '').split('-').slice(1).join('-').trim();
      const grupo = (grupoRaw || '').trim();
      return {
        grupo,
        filial: filialCode || filial,
        displayName,
        groupName: (Grupo as Record<string, string>)[`GRUPO_${grupo}`],
      };
    }

    return { grupo: grupoStorage, filial, groupName: (Grupo as Record<string, string>)[`GRUPO_${grupoStorage}`] };
  }

  displayFilial(): string {
    const { grupo, filial, displayName, groupName } = this.resolveGrupoFilial();
    if (displayName) {
      if (groupName && !displayName.toLowerCase().includes(groupName.toLowerCase())) {
        return `${groupName} ${displayName}`;
      }
      return displayName;
    }
    const key = `FILIAL_${grupo}${filial}`;
    const filialName = (Filial as Record<string, string>)[key];
    if (filialName) {
      if (groupName && !filialName.toLowerCase().includes(groupName.toLowerCase())) {
        return `${groupName} ${filialName}`;
      }
      return filialName;
    }
    return this.pedidoDetalhe?.origem || filial || '-';
  }

  displayOrderNumber(): string {
    if (!this.pedidoDetalhe?.numero) {
      return this.pedidoNum || '-';
    }
    return this.pedidoDetalhe.numero;
  }

  displayStatus(): string {
    const raw = (this.pedidoDetalhe?.statusDesc || this.pedidoDetalhe?.status || '').trim();
    return raw || 'Sem status';
  }

  statusTagClass(): string {
    const normalized = this.displayStatus().toLowerCase();
    if (normalized.includes('nao aceito')) {
      return 'tag-rejected';
    }
    if (normalized.includes('analise')) {
      return 'tag-analysis';
    }
    if (normalized.includes('entregue totalmente')) {
      return 'tag-delivered';
    }
    if (normalized.includes('entregue parcialmente')) {
      return 'tag-partial';
    }
    if (normalized.includes('aberto')) {
      return 'tag-open';
    }
    return 'tag-other';
  }

  uniqueNotas(): Array<{ doc: string; serie: string }> {
    if (!this.pedidoDetalhe?.notas?.length) {
      return [];
    }
    const seen = new Set<string>();
    const deduped: Array<{ doc: string; serie: string }> = [];

    this.pedidoDetalhe.notas.forEach((nota) => {
      const doc = (nota.doc || '').trim();
      const serie = (nota.serie || '').trim();
      const key = `${doc}::${serie}`;
      if (!doc || seen.has(key)) {
        return;
      }
      seen.add(key);
      deduped.push({ doc, serie });
    });

    return deduped;
  }

  openNota(nota: NotaDetalhe): void {
    this.selectedNota = nota;
    this.notaModal?.open();
  }

  private buildNotaDetalhes(notas: Array<Inota>): NotaDetalhe[] {
    const mapNotas = new Map<string, NotaDetalhe>();

    notas.forEach((nota) => {
      const doc = String(nota.doc || nota.nota || '').trim();
      const serie = String(nota.serie || '').trim();
      if (!doc) {
        return;
      }
      const key = `${doc}::${serie}`;
      let current = mapNotas.get(key);
      if (!current) {
        current = {
          doc,
          serie,
          emissao: String(nota.emissaonf || '').trim(),
          cliente: String(nota.cliente || '').trim(),
          loja: String(nota.loja || '').trim(),
          chave: String(nota.chave_nfe || nota.chave_nf || '').trim(),
          items: [],
        };
        mapNotas.set(key, current);
      }

      const itemPedido = String(nota.item_pedido || nota.item || '').trim();
      const produto = String(nota.produto || '').trim();
      if (itemPedido || produto) {
        current.items.push({
          itemPedido,
          produto,
          quantidade: Number(nota.quantidade ?? nota.quant ?? 0),
          total: Number(nota.total_item ?? 0),
        });
      }
    });

    return Array.from(mapNotas.values());
  }

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }
    if (date.includes('/')) {
      return date;
    }
    if (date.length !== 8) {
      return date;
    }
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${day}/${month}/${year}`;
  }

  formatApiDate(date: string): string {
    return this.formatDate(date);
  }

  itemTotal(item: PedidoItemDetalhe): number {
    return (item.quantidade || 0) * (item.precoUnitario || 0) - (item.valorDesconto || 0);
  }

  goTo(link: string): void {
    this.router.navigateByUrl(link);
  }

  generatePdf(): void {
    if (!this.pedidoDetalhe) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      return;
    }

    const notasTexto = (this.notaDetalhes || [])
      .map((nota) => `${nota.doc}${nota.serie ? `/${nota.serie}` : ''}`)
      .join(', ');

    const rows = (this.pedidoDetalhe.items || [])
      .map((item) => `
        <tr>
          <td>${item.codigoProduto || '-'}</td>
          <td>${(item.descricaoItem || '-').trim()}</td>
          <td>${item.unidade || '-'}</td>
          <td>${item.quantidade ?? 0}</td>
          <td>${this.formatApiDate(item.entregueFlag || '')}</td>
          <td>${this.formatApiDate(item.dataFaturamento || '')}</td>
          <td>${item.tes || '-'}</td>
          <td>${item.cfop || '-'}</td>
          <td>R$ ${(item.precoUnitario || 0).toFixed(2)}</td>
          <td>R$ ${this.itemTotal(item).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const styles = `
      <style>
        body { font-family: "Manrope", Arial, sans-serif; margin: 28px; color: #111827; }
        h1 { font-size: 20px; margin: 0 0 6px; }
        h2 { font-size: 14px; margin: 18px 0 10px; }
        .subtitle { color: #6b7280; font-size: 12px; margin: 0 0 18px; }
        .meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
        .box { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
        .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; display: block; }
        .value { font-size: 12px; font-weight: 600; color: #111827; }
        .nota-list { font-size: 12px; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 11px; }
        th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.03em; color: #6b7280; }
        tfoot td { font-weight: 700; }
        .muted { color: #6b7280; }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head><title>Pedido ${this.pedidoDetalhe.numero || ''}</title>${styles}</head>
        <body>
          <h1>N° Pedido Fornecedor: ${this.displayOrderNumber()}</h1>
          <div class="subtitle">N° Pedido Cliente: ${this.pedidoDetalhe.pedidoCliente || 'N/A'}</div>

          <div class="meta">
            <div class="box">
              <span class="label">Fornecedor</span>
              <div class="value">${this.displayFilial()}</div>
            </div>
            <div class="box">
              <span class="label">Cliente</span>
              <div class="value">${this.pedidoDetalhe.cliente || '-'}</div>
            </div>
            <div class="box">
              <span class="label">Data Emissão</span>
              <div class="value">${this.formatDate(this.pedidoDetalhe.emissao)}</div>
            </div>
            <div class="box">
              <span class="label">Status</span>
              <div class="value">${this.displayStatus()}</div>
            </div>
          </div>

          <div class="box" style="margin-bottom: 14px;">
            <span class="label">Notas fiscais</span>
            <div class="nota-list">${notasTexto || '-'}</div>
          </div>

          <h2>Itens</h2>
          <table>
            <thead>
              <tr>
                <th>Codigo produto</th>
                <th>Descricao</th>
                <th>UM</th>
                <th>Qtd</th>
                <th>Entrega</th>
                <th>Fatur.</th>
                <th>TES</th>
                <th>CFOP</th>
                <th>Valor unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="10" class="muted">Sem itens</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="9">Total do pedido</td>
                <td>R$ ${this.orderTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private mapPedidoSimplify(pedidoRaw: any): Ipedido {
    const grupo = localStorage.getItem('grupo') || '';
    const filial = String(pedidoRaw?.Filial ?? '').trim();
    const pedidoNumero = String(pedidoRaw?.Pedido ?? '').trim();
    const cliente = String(pedidoRaw?.Cliente ?? '').trim();
    const clienteNome = String(pedidoRaw?.clienteNome ?? '').trim();
    const loja = String(pedidoRaw?.Loja ?? '').trim();
    const pedcliente = String(pedidoRaw?.PedidoCliente ?? '').trim();

    const formatDate = (value: any): string => {
      const text = String(value ?? '').trim();
      if (text.length === 8 && /^\d+$/.test(text)) {
        return `${text.slice(6, 8)}/${text.slice(4, 6)}/${text.slice(0, 4)}`;
      }
      return text;
    };

    const items = (pedidoRaw?.Itens ?? []).map((item: any) => {
      const quantidade = Number(item?.quantidade ?? 0);
      const preco = Number(item?.preco_unitario ?? 0);
      return {
        nota: item?.nota ?? '',
        item: String(item?.item ?? '').trim(),
        produto: String(item?.codigo_produto ?? '').trim(),
        descricao: String(item?.descricao_item ?? '').trim(),
        codcli: String(item?.codcli_a7 ?? '').trim(),
        unidade: String(item?.um ?? '').trim(),
        quantidade,
        saldo: String(item?.qtd_entregue ?? ''),
        preco: String(preco),
        total: String(quantidade * preco),
        entrega: formatDate(item?.entregue_flag ?? ''),
        dataFaturamento: formatDate(item?.data_faturamento ?? ''),
        operacao: String(item?.oper ?? item?.Oper ?? '').trim(),
        tes: String(item?.tes ?? item?.Tes ?? '').trim(),
        cfop: String(item?.cfop ?? item?.Cfop ?? '').trim(),
        numpcom: String(item?.numpcom ?? item?.num_pcom ?? item?.pedido_cliente ?? '').trim(),
        itemcp: String(item?.itempcom ?? item?.item_pcom ?? item?.item_cliente ?? '').trim(),
        local: String(item?.armazem ?? '').trim(),
        serie: String(item?.serie ?? '').trim(),
        ident: String(item?.ident ?? '').trim(),
        codpai: String(item?.codpai ?? '').trim(),
      };
    });

    const notas = (pedidoRaw?.Notas ?? []).map((nota: any) => ({
      nota: String(nota?.nota ?? nota?.doc ?? '').trim(),
      serie: String(nota?.serie ?? '').trim(),
      emissaonf: String(nota?.emissaonf ?? nota?.emissao ?? '').trim(),
      item: String(nota?.item ?? nota?.item_pedido ?? '').trim(),
      produto: String(nota?.produto ?? '').trim(),
      lote: String(nota?.lote ?? '').trim(),
      quant: String(nota?.quant ?? nota?.quantidade ?? '').trim(),
      tes: String(nota?.tes ?? '').trim(),
      um: String(nota?.um ?? '').trim(),
      retsefaz: String(nota?.retsefaz ?? '').trim(),
      descretsefaz: String(nota?.descretsefaz ?? '').trim(),
      statusnfe: String(nota?.statusnfe ?? '').trim(),
      filial_nf: String(nota?.filial_nf ?? '').trim(),
      doc: String(nota?.doc ?? '').trim(),
      cliente: String(nota?.cliente ?? '').trim(),
      loja: String(nota?.loja ?? '').trim(),
      chave_nfe: String(nota?.chave_nfe ?? '').trim(),
      chave_nf: String(nota?.chave_nf ?? '').trim(),
      item_pedido: String(nota?.item_pedido ?? '').trim(),
      quantidade: Number(nota?.quantidade ?? nota?.quant ?? 0),
      total_item: Number(nota?.total_item ?? 0),
    }));

    return {
      grupo,
      filial,
      empresa: filial,
      status: String(pedidoRaw?.StatusDesc ?? pedidoRaw?.StatusCod ?? '').trim(),
      numero: pedidoNumero,
      filial_destino: '',
      cliente: clienteNome || cliente,
      loja,
      nome: clienteNome || cliente,
      clientrega: clienteNome || cliente,
      lojaentrega: loja,
      transportadora: '',
      tipo: String(pedidoRaw?.Tipo ?? '').trim(),
      condpag: '',
      tabela: '',
      natureza: '',
      emissao: formatDate(pedidoRaw?.Emissao ?? ''),
      operacao: '',
      frete: '',
      mensagem: '',
      saldo: String(pedidoRaw?.QtdPedida ?? ''),
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      pedcliente,
      notas,
      items,
    };
  }

  private mapPedidoDetalhe(pedido: Ipedido): PedidoDetalhe {
    return {
      origem: pedido.empresa || pedido.filial || '',
      numero: pedido.numero,
      pedidoCliente: pedido.pedcliente || '',
      cliente: pedido.cliente || '',
      loja: pedido.loja || '',
      filial: pedido.filial || '',
      emissao: pedido.emissao || '',
      status: pedido.status || '',
      statusDesc: pedido.status || '',
      observacao: pedido.mensagem || '',
      notas: (pedido.notas || []).map((nota) => ({
        doc: nota?.nota || '',
        serie: nota?.serie || '',
      })),
      items: (pedido.items || []).map((item: any) => ({
        codigoProduto: item.produto || '',
        descricaoItem: item.descricao || '',
        codigoCliente: item.codcli || '',
        unidade: item.unidade || '',
        quantidade: Number(item.quantidade || 0),
        quantidadeEntregue: Number(item.saldo || 0),
        entregueFlag: item.entrega || '',
        dataFaturamento: item.dataFaturamento || '',
        precoUnitario: Number(item.preco || 0),
        valorDesconto: 0,
        armazem: item.local || '',
        tes: item.tes || '',
        operacao: item.operacao || '',
        cfop: item.cfop || '',
        numpcom: item.numpcom || '',
        itemcp: item.itemcp || '',
      })),
    };
  }

  ////////////////////////////////////// Inicia Form principal /////////////////////////////
  getFormPedido(form: NgForm) {
    this.PedidoForm = form;
  }
  //////////////////////////////////////// Inicia Form modal /////////////////////////////////
  getFormItens(form: NgForm) {
    this.itemsForm = form;
  }
  ////////////////////////////////////////Carrega cabeçario tabela modal /////////////////////
  getColumnsProduto(): Array<PoTableColumn> {
    return [
      { property: 'B1_COD', label: 'Produto' },
      { property: 'B1_DESC', label: 'Descrição' },
      { property: 'B1_UM', label: 'UM' },
      { property: 'DA1_PRCVEN', label: 'Preço' },
      { property: 'B1_TES', label: 'TES' },
      { property: 'DA0_CONDPG', label: 'Cond. Pag.' },
      { property: 'B1_LOCPAD', label: 'AMZ' },
    ];
  }

  getCamposForm(): Array<PoDynamicFormField> {
    return [
      {
        property: 'origem',
        label: 'Fornecedor',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      },

      {
        property: 'destino',
        label: 'Cliente',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      },
      {
        property: 'pedcliente',
        label: 'N° Pedido Cliente',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      },

      {
        property: 'emissao',
        label: '* Data de Emissão',
        type: 'date',
        format: 'dd/mm/yyyy',
        gridColumns: 3,
        gridSmColumns: 12,
        readonly: true,
        required: true,
      },
      {
        label: 'Tabela de Preço',
        property: 'tabela',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      },
      {
        label: 'Condição de Pgto',
        property: 'condicao',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      },
      /*  {
            label: 'Transportadora',
            property: 'trans',
            gridColumns: 3,
            gridSmColumns: 12,
            optionsService: 'http://172.16.107.13:8098/wsarotubi/transp?offset=1&limit=500',
            fieldLabel: 'nome',
            fieldValue: 'codigo',
            optional: true
          },
          {
            label: 'Tipo de Frete',
            property: 'frete',
            gridColumns: 3,
            fieldLabel: 'desc',
            fieldValue: 'code',
            optional: false,
            options:  [
              { descricao: 'CIF', code: 'CIF' },
              { descricao: 'FOB', code: 'FOB' }
            ]
          },*/

      {
        label: 'Natureza',
        property: 'natureza',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      },
      {
        label: 'Tipo de Operação ',
        property: 'operacao',
        gridColumns: 3,
        gridSmColumns: 12,
        optionsService: '',
        optional: false,
        readonly: true,
        required: true,
      }
    ];
  }

  onLoadFields(): PoDynamicFormLoad {
    if (this.action == actionUpdate) {
      return {
        value: {},

        fields: [
          { property: 'origem', readonly: true },
          { property: 'destino', readonly: true },
          { property: 'emissao', readonly: true },
        ],
        focus: 'obs',
      };
    }

    if (this.action == actionFaturar || this.action == actionClassif) {
      return {
        value: {},

        fields: [
          { property: 'origem', readonly: true },
          { property: 'destino', readonly: true },
          { property: 'emissao', readonly: true },
          { property: 'obs', readonly: true },
        ],
      };
    }

    return {};
  }

  onLoadFieldsPR(): PoDynamicFormLoad {
    return {
      value: {},

      fields: [],
      focus: 'quant',
    };
  }

  /////////////////////////////////////////// Oncharge Form Principal //////////////////////
  onChangeFields(changeValue: PoDynamicFormFieldChanged): PoDynamicFormValidation {
    if (localStorage.getItem('grupo')!.toString() == '01') {
      if (this.action != actionUpdate) {
        if (this.items_ped_view.length == 0) {
          if (changeValue.property === 'origem') {
            this.origem = changeValue.value.origem;

            if (this.destino != undefined) {
              if (this.origem == this.destino) {
                this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');
              }
            }
          }

          if (changeValue.property === 'destino') {
            let _destino = changeValue.value.destino.split('/');
            let _origem_ = changeValue.value.origem.split('/');
            this.destino = _destino[0];
            this.origem = _origem_[1];
            this.items = [];
            this.buttonPR = true;
            this.codtab = '';
            this.codpgto = '';

            if (this.origem == this.destino) {
              this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');
            } else {
              this.ProtheusService.getTabela(this.origem, _destino[1])
                .pipe(take(1))
                .subscribe((data) => {
                  if (data.length > 0) {
                    this.codtab = data[0].codigo;
                    this.codpgto = data[0].condpagamento;
                  } else {
                    this.poNotification.error('Cliente sem tabela e Preço e/ou Tabela de Preço vencida !');
                  }

                  this.buttonPR = false;
                  this._origem = this.origem;
                  this._destino = changeValue.value.destino;
                });
            }
          }
        }

        if (this.items_ped_view.length > 0) {
          this.poNotification.warning('Remova o(s) Produto(s), para alterar a tabela de Preço !');

          return {
            value: { origem: this._origem, destino: this._destino, tabela: this.codtab, condicao: this.codpgto },
          };
        }

        return {
          value: { tabela: this.codtab, condicao: this.codpgto },
        };
      }
    } else {
      if (this.action != actionUpdate) {
        if (this.items_ped_view.length == 0) {
          if (changeValue.property === 'destino') {
            let _destino = changeValue.value.destino.split('/');
            let _origem_ = changeValue.value.origem.split('/');
            this.destino = _destino[0];
            this.origem = _origem_[1];
            this.items = [];
            this.buttonPR = true;
            this.codtab = '';
            this.codpgto = '';

            this.ProtheusService.getTabela(this.origem, _destino[1])
              .pipe(take(1))
              .subscribe((data) => {
                if (data.length > 0) {
                  this.codtab = data[0].codigo;
                  this.codpgto = data[0].condpagamento;
                } else {
                  this.codtab = '000';
                }

                this.buttonPR = false;
                //this._origem = this.origem;
                //this._destino = changeValue.value.destino;
              });
          }
        }

        /* if (this.items_ped_view.length > 0) {

          this.poNotification.warning('Remova o(s) Produto(s), para alterar a tabela de Preço !');

          return {
            value: { origem: this._origem, destino: this._destino, tabela: this.codtab, condicao: this.codpgto },
          };
        }*/

        return {
          value: { tabela: this.codtab, condicao: this.codpgto },
        };
      }
    }

    /*if (this.items_ped_view.length > 0) {

      this.poNotification.warning('Remova o(s) Produto(s), para alterar a tabela de Preço !');

      return {
        value: { origem: this._origem, destino: this._destino, tabela: this.codtab, condicao: this.codpgto },
      };
    }*/

    return {
      value: { tabela: this.codtab, condicao: this.codpgto },
    };

    return {};
  }

  /////////////////////////////////////////// Oncharge Form Modal ////////////////////////////
  onChangeFieldsPR(changeValue: PoDynamicFormFieldChanged): PoDynamicFormValidation {
    let calculo = 0;

    if (changeValue.value.quant > 0 && changeValue.value.prunit > 0) {
      calculo = changeValue.value.quant * changeValue.value.prunit;
      this.buttonPRS = false;
    } else {
      this.buttonPRS = true;
    }

    return {
      value: { ptotal: calculo },
    };
  }
  /////////////////////////////////////////// Carrega Modal //////////////////////////////////
  openModalProduto() {
    this.titleDetailsModal = 'Lista de Produtos: ' + this.codtab;
    this.poModal.open();
    this.loadingModal = true;
    this.columnsProduto = this.getColumnsProduto();
    this.modalAction = 'select';
    this.typoAction = 'add';

    if (this.items === undefined || this.items.length == 0) {
      this.ProtheusService.getProduto(this.origem, this.codtab, this.xtipoPedid).subscribe((data) => {
        this.produtoTabela = data;
        this.items = this.produtoTabela.items;
        this.loadingModal = false;
      });
    } else {
      setTimeout(() => {
        this.loadingModal = false;
      }, 2000);
    }
  }

  /////////////////////////////////////////// Seleciona Produto Tabela Modal//////////////////
  SelectToPedido(row: any) {
    this.buttonPRS = true;
    this.camposPredefinidosProduto = {};

    this.formValueItems = {
      dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
    };

    if (this.typoAction == 'add') {
      const selectedItems = this.poTable.getSelectedRows();
      selectedItems.forEach((items) => {
        if (this.items_ped.find((item: { codigo: any }) => item.codigo === items.B1_COD) === undefined) {
          this.camposPredefinidosProduto = {
            codigo: items.B1_COD,
            desc: items.B1_DESC,
            quant: 0,
            um: items.B1_UM,
            tes: items.B1_TES,
            prunit: items.DA1_PRCVEN,
            ptotal: 0,
            amz: items.B1_LOCPAD,
            tab: this.codtab,
            dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
          };
        }

        if (this.items_ped_view.find((item: { codigo: any }) => item.codigo === items.B1_COD) === undefined) {
          this.camposPredefinidosProduto = {
            codigo: items.B1_COD,
            desc: items.B1_DESC,
            quant: 0,
            um: items.B1_UM,
            tes: items.B1_TES,
            prunit: items.DA1_PRCVEN,
            ptotal: 0,
            amz: items.B1_LOCPAD,
            tab: this.codtab,
            dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
          };
        }
      });

      if (Object.keys(this.camposPredefinidosProduto).length !== 0) {
        this.poModal.close();
        setTimeout(() => {
          this.titleDetailsModal = 'Informe a Quantidade !';
          this.modalAction = 'form';
          this.poModal.open();
        }, 500);
        this.poTable.unselectRows();
      } else {
        this.poNotification.warning(' Produto já  consta no pedido!');
      }
    }

    if (this.typoAction == 'edit') {
      this.camposPredefinidosProduto = {
        nitem: row['nitem'],
        codigo: row['codigo'],
        desc: row['desc'],
        quant: row['quant'],
        um: row['um'],
        tes: row['tes'],
        prunit: row['prunit'],
        ptotal: row['ptotal'],
        amz: row['amz'],
        tab: row['tab'],
        dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
      };

      this.poModal.close();
      setTimeout(() => {
        this.titleDetailsModal = 'Informe a Quantidade !';
        this.modalAction = 'form';
        this.poModal.open();
      }, 500);
    }

    if (this.typoAction == 'remove') {
      this.camposPredefinidosProduto = {
        nitem: row['nitem'],
        codigo: row['codigo'],
        desc: row['desc'],
        quant: row['quant'],
        um: row['um'],
        tes: row['tes'],
        prunit: row['prunit'],
        ptotal: row['ptotal'],
        amz: row['amz'],
        tab: row['tab'],
        dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
      };

      this.poModal.close();
      setTimeout(() => {
        this.titleDetailsModal = 'Deseja Remover o Produto ?';
        this.modalAction = 'formRemove';
        this.poModal.open();
      }, 500);
    }
  }
  /////////////////////////////////////////// Editar Produto /////////////////////////////////
  private editar(row: any) {
    this.typoAction = 'edit';
    this.SelectToPedido(row);
  }
  /////////////////////////////////////////// Remover Produto ////////////////////////////////
  private remover(row: any) {
    this.typoAction = 'remove';
    this.SelectToPedido(row);
  }
  ////////////////////////////////// Executa a ação de Remover Produto ///////////////////////
  removeToPedido() {
    let nitem = this.itemsForm?.form.value.nitem;
    let _nItemPai: number = 0;

    this.items_ped_view.forEach((_item: any) => {
      if (nitem === parseInt(_item.produto)) {
        let nItemrm = _item.nitem;

        if (_nItemPai == 0) {
          _nItemPai = nitem;
        }

        if (nItemrm == nitem) {
          const itemToRemove = this.items_ped_view.find((item: { nitem: any }) => item.nitem === nItemrm);
          this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
          this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);

          itemToRemove.nitem = _item.nitem;
          itemToRemove.codigo = this.itemsForm?.form.value.codigo;
          itemToRemove.desc = this.itemsForm?.form.value.desc;
          itemToRemove.quant = this.itemsForm?.form.value.quant;
          itemToRemove.um = this.itemsForm?.form.value.um;
          itemToRemove.prunit = this.itemsForm?.form.value.prunit;
          itemToRemove.ptotal = (this.itemsForm?.form.value.quant * this.itemsForm?.form.value.prunit).toFixed(2);
          itemToRemove.tes = this.itemsForm?.form.value.tes;
          itemToRemove.amz = this.itemsForm?.form.value.amz;
          itemToRemove.tab = this.codtab;
          itemToRemove.dtentreg = formatDate(this.date_now, 'yyyy-MM-dd', 'en-US');
          itemToRemove.tipo = 'D';
          itemToRemove.notaorig = '';
          itemToRemove.serirorig = '';
          itemToRemove.itemorig = '';
          itemToRemove.ident = '';
          itemToRemove.produto = nitem;

          this.items_ped.push(itemToRemove);
          this.items_ped = this.items_ped.sort((a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem);
        } else {
          const itemToRemove = this.items_ped_view.find((item: { nitem: any }) => item.nitem === nItemrm);
          this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
          this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);

          itemToRemove.nitem = _item.nitem;
          itemToRemove.codigo = _item.codigo;
          itemToRemove.desc = _item.desc;
          itemToRemove.quant = _item.quant;
          itemToRemove.um = _item.um;
          itemToRemove.prunit = _item.prunit;
          itemToRemove.ptotal = (_item.quant * _item.prunit).toFixed(4);
          itemToRemove.tes = _item.tes;
          itemToRemove.amz = _item.amz;
          itemToRemove.tab = this.codtab;
          itemToRemove.dtentreg = formatDate(this.date_now, 'yyyy-MM-dd', 'en-US');
          itemToRemove.tipo = 'D';
          itemToRemove.notaorig = _item.notaorig;
          itemToRemove.serirorig = _item.serirorig;
          itemToRemove.itemorig = _item.itemorig;
          itemToRemove.ident = _item.ident;
          itemToRemove.produto = nitem;

          this.items_ped.push(itemToRemove);
          this.items_ped = this.items_ped.sort((a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem);
        }
      }
    });

    if (this.items_ped_view.length == 0) {
      this.nitem = 1;
    }

    this.poModal.close();
  }
  ////////////////////////////////// Executa a ação de adcionar Produto ///////////////////////
  addToPedido(action: any) {
    let itemsPR;
    let _operacao = this.PedidoForm?.form.value.operacao.split('-');
    let _destino = this.PedidoForm?.form.value.destino.split('/');
    let _origem = this.PedidoForm?.form.value.origem.split('/')[1];
    let _grupo = this.PedidoForm?.form.value.origem.split('/')[0];
    let _tes: string;
    let _nItemPai: number = 0;

    if (this.itemsForm?.form.value.quant == 0) {
      this.poNotification.error('Quantidade é Obrigatório!');
    } else {
      if (action == 'add') {
        this.ProtheusService.getTES(
          _origem,
          _operacao[0].trim(),
          _destino[1] + '_' + _destino[2],
          this.itemsForm?.form.value.codigo,
        )
          .pipe(take(1))
          .subscribe(
            (data) => {
              if (data.tes.length > 0) {
                _tes = data.tes[0].tes;

                if (_tes != '') {
                  this.ProtheusService.getEST(
                    _origem,
                    _destino[1] + '_' + _destino[2],
                    this.itemsForm?.form.value.codigo,
                    this.itemsForm?.form.value.quant,
                  )
                    .pipe(take(1))
                    .subscribe(
                      (data) => {
                        if (data.status == 'success') {
                          if (_nItemPai == 0) {
                            _nItemPai = this.nitem;
                          }

                          itemsPR = {
                            nitem: this.nitem,
                            codigo: this.itemsForm?.form.value.codigo,
                            desc: this.itemsForm?.form.value.desc,
                            quant: this.itemsForm?.form.value.quant,
                            um: this.itemsForm?.form.value.um,
                            prunit: this.itemsForm?.form.value.prunit,
                            ptotal: (this.itemsForm?.form.value.quant * this.itemsForm?.form.value.prunit).toFixed(4),
                            tes: _tes,
                            amz: this.itemsForm?.form.value.amz,
                            tab: this.codtab,
                            dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
                            tipo: '',
                            notaorig: '',
                            serirorig: '',
                            itemorig: '',
                            ident: '',
                            produto: _nItemPai,
                          };

                          this.items_ped.push(itemsPR);
                          this.items_ped_view.push(itemsPR);
                          this.nitem++;

                          data.itens.forEach((item: any) => {
                            itemsPR = {
                              nitem: this.nitem,
                              codigo: item.matprima,
                              desc: item.desc,
                              quant: item.quantidade,
                              um: item.um,
                              prunit: item.preco,
                              ptotal: (item.quantidade * item.preco).toFixed(4),
                              tes: item.tes,
                              amz: item.amz,
                              tab: '',
                              dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
                              tipo: '',
                              notaorig: item.nota,
                              serirorig: item.serie,
                              itemorig: item.item,
                              ident: item.ident,
                              produto: _nItemPai,
                            };

                            this.items_ped.push(itemsPR);
                            this.items_ped_view.push(itemsPR);
                            this.nitem++;
                          });
                        } else {
                          this.poNotification.warning(data.status);
                        }
                      },
                      (error: HttpErrorResponse) => {
                        let erro = error.error;

                        this.poNotification.warning(erro.errorMessage);
                      },
                    );
                } else {
                  this.poNotification.warning('TES não encontrada para esse produto !');
                }
              }
            },
            (error: HttpErrorResponse) => {
              let erro = error.error;

              this.poNotification.warning(erro.errorMessage);
            },
          );

        this.poModal.close();
      } else if (action == 'edit') {
        let nitem = this.itemsForm?.form.value.nitem;

        this.ProtheusService.getEST(
          _origem,
          _destino[1] + '_' + _destino[2],
          this.itemsForm?.form.value.codigo,
          this.itemsForm?.form.value.quant,
        )
          .pipe(take(1))
          .subscribe(
            (data) => {
              const dataItem = data.itens;

              this.items_ped_view.forEach((_item: any) => {
                if (nitem === parseInt(_item.produto)) {
                  let nItemrm = _item.nitem;

                  if (nItemrm == nitem) {
                    const itemToRemove = this.items_ped_view.find((item: { nitem: any }) => item.nitem === nItemrm);
                    this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
                    this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);

                    itemToRemove.nitem = _item.nitem;
                    itemToRemove.codigo = this.itemsForm?.form.value.codigo;
                    itemToRemove.desc = this.itemsForm?.form.value.desc;
                    itemToRemove.quant = this.itemsForm?.form.value.quant;
                    itemToRemove.um = this.itemsForm?.form.value.um;
                    itemToRemove.prunit = this.itemsForm?.form.value.prunit;
                    itemToRemove.ptotal = (
                      this.itemsForm?.form.value.quant * this.itemsForm?.form.value.prunit
                    ).toFixed(2);
                    itemToRemove.tes = this.itemsForm?.form.value.tes;
                    itemToRemove.amz = this.itemsForm?.form.value.amz;
                    itemToRemove.tab = this.codtab;
                    itemToRemove.dtentreg = formatDate(this.date_now, 'yyyy-MM-dd', 'en-US');
                    itemToRemove.tipo = 'A';
                    itemToRemove.notaorig = _item.notaorig;
                    itemToRemove.serirorig = _item.serirorig;
                    itemToRemove.itemorig = _item.itemorig;
                    itemToRemove.ident = _item.ident;
                    itemToRemove.produto = nitem;
                    this.items_ped.push(itemToRemove);
                    this.items_ped = this.items_ped.sort(
                      (a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem,
                    );
                    this.items_ped_view.push(itemToRemove);
                    this.items_ped_view = this.items_ped.sort(
                      (a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem,
                    );
                  } else {
                    dataItem.forEach((_itemb: any) => {
                      if (_itemb.matprima == _item.codigo) {
                        const itemToRemove = this.items_ped_view.find(
                          (item: { codigo: any }) => item.codigo === _itemb.matprima,
                        );
                        this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
                        this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);

                        itemToRemove.nitem = nItemrm;
                        itemToRemove.codigo = _itemb.matprima;
                        itemToRemove.desc = _itemb.desc;
                        itemToRemove.quant = _itemb.quantidade;
                        itemToRemove.um = _itemb.um;
                        itemToRemove.prunit = _itemb.preco;
                        itemToRemove.ptotal = (_itemb.quantidade * _itemb.preco).toFixed(4);
                        itemToRemove.tes = _itemb.tes;
                        itemToRemove.amz = _itemb.amz;
                        itemToRemove.tab = this.codtab;
                        itemToRemove.dtentreg = formatDate(this.date_now, 'yyyy-MM-dd', 'en-US');
                        itemToRemove.tipo = 'A';
                        itemToRemove.notaorig = _itemb.nota;
                        itemToRemove.serirorig = _itemb.serie;
                        itemToRemove.itemorig = _itemb.item;
                        itemToRemove.ident = _itemb.ident;
                        itemToRemove.produto = nitem;

                        this.items_ped.push(itemToRemove);
                        this.items_ped = this.items_ped.sort(
                          (a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem,
                        );
                        this.items_ped_view.push(itemToRemove);
                        this.items_ped_view = this.items_ped.sort(
                          (a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem,
                        );
                      }
                    });
                  }
                }
              });
            },
            (error: HttpErrorResponse) => {
              let erro = error.error;

              this.poNotification.warning(erro.errorMessage);
            },
          );

        this.poModal.close();
      } else {
        this.items_ped = '';
        this.items_ped_view = '';
      }
    }
  }
  ////////////////////////////////// Salva Pedido /////////////////////////////////////////////
  salvar() {
    if (this.items_ped.length > 0) {
      let _destino = this.PedidoForm?.form.value.destino.split('/');
      let _natureza = this.PedidoForm?.form.value.natureza.split('-');
      let _operacao = this.PedidoForm?.form.value.operacao.split('-');
      let _origem = this.PedidoForm?.form.value.origem.split('/')[1];
      let _grupo = this.PedidoForm?.form.value.origem.split('/')[0];
      let _ret;
      this.ItemPedido = [];

      this.buttonPRG = true;

      this.items_ped.forEach((_item: any) => {
        this.ItemPedido = [
          ...this.ItemPedido,
          {
            item: _item.nitem.toString().padStart(2, '0'),
            codigo: _item.codigo,
            quantidade: _item.quant,
            preco: _item.prunit,
            local: _item.amz,
            tes: _item.tes,
            entrega: _item.dtentreg,
            tipo: _item.tipo,
            nota: _item.notaorig,
            serie: _item.serirorig,
            itemorig: _item.itemorig,
            ident: _item.ident,
          },
        ];
      });

      let pedido = {
        cliente: _destino[1],
        loja: _destino[2],
        clienteEntrega: _destino[1],
        lojaEntrega: _destino[2],
        condpag: this.PedidoForm?.form.value.condicao,
        tabela: this.PedidoForm?.form.value.tabela,
        natureza: _natureza[0].trim(),
        frete: 'S',
        transportadora: '',
        mensagem: this.PedidoForm?.form.value.obs == undefined ? '' : this.PedidoForm?.form.value.obs,
        operacao: _operacao[0].trim(),
        itens: this.ItemPedido,
        tipo: this.tipoPedid,
        xtipo: this.xtipoPedid,
        xuser: sessionStorage.getItem('user'),
      };

      if (this.action == actionInsert) {
        this.buttonPR = true;

        this.ProtheusService.postPedido(_origem, JSON.stringify(pedido)).subscribe(
          (data) => {
            if (data.retorno) {
              this.poNotification.success('Pedido: ' + data.numero + '. Cadastrado com Sucesso!');
              setTimeout(() => {
                this.items_ped = [];
                this.items_ped_view = [];
                this.PedidoForm?.form.reset();
                this.buttonPRG = false;
              }, 2000);
            } else {
              this.poNotification.warning(
                'Tente novamente e caso não conseguir salvar o pedido, entre e, contato com a T.I.!',
              );
              this.buttonPRG = false;
              this.buttonPR = false;
            }
          },
          (error: HttpErrorResponse) => {
            let erro = error.error;

            this.buttonPRG = false;

            this.poNotification.warning(erro.errorMessage);
          },
        );
      }
      if (this.action == actionUpdate) {
        this.buttonPR = true;

        this.ProtheusService.putPedido(
          _grupo,
          _origem,
          this.pedidoNum,
          JSON.stringify(pedido),
          this.invoice,
          this.faturar,
        ).subscribe(
          (data) => {
            if (data.retorno) {
              this.poNotification.success('Pedido: ' + this.pedidoNum + '. Atualizado com Sucesso!');
              setTimeout(() => {
                this.items_ped = [];
                this.items_ped = this.items_ped_view;

                // this.items_ped = [];
                // this.PedidoForm?.form.reset();
                this.buttonPRG = false;
                this.buttonPR = false;
              }, 2000);
            } else {
              this.poNotification.warning(
                'Tente novamente e caso não conseguir salvar o pedido, entre e, contato com a T.I.!',
              );
              this.buttonPRG = false;
            }
          },
          (error: HttpErrorResponse) => {
            let erro = error.error;

            this.buttonPRG = false;
            this.buttonPR = false;

            this.poNotification.warning(erro.errorMessage);
          },
        );
      }
      if (this.action == actionFaturar) {
        let nota = '';

        this.ProtheusService.putPedido(
          _grupo,
          _origem,
          this.pedidoNum,
          JSON.stringify(pedido),
          this.invoice,
          this.faturar,
        ).subscribe(
          (data) => {
            if (data.retorno) {
              nota = data.nota;

              this.poNotification.success('Pedido: ' + this.pedidoNum + '. Foi gerado a nota fiscal: ' + nota + '.');
              setTimeout(() => {
                // this.items_ped = [];
                // this.PedidoForm?.form.reset();
                this.salvarDBT = true;
                this.buttonPRG = false;
              }, 2000);
            } else {
              this.salvarDBT = true;

              this.poNotification.warning(data.mensagem);
              this.buttonPRG = false;
            }
          },
          (error: HttpErrorResponse) => {
            let erro = error.error;

            this.buttonPRG = false;

            this.poNotification.warning(erro.errorMessage);
          },
        );
      }
      if (this.action == actionClassif) {
        let nota = '';

        this.ProtheusService.putPedido(
          _grupo,
          _origem,
          this.pedidoNum,
          JSON.stringify(pedido),
          this.invoice,
          this.faturar,
        ).subscribe(
          (data) => {
            if (data.retorno == '200') {
              nota = data.nota;

              this.poNotification.success('Nota Fiscal: ' + nota + '. Foi classificada com Sucesso!');
              setTimeout(() => {
                // this.items_ped = [];
                // this.PedidoForm?.form.reset();
                this.salvarDBT = true;
                this.buttonPRG = false;
              }, 2000);
            } else {
              this.salvarDBT = true;

              this.poNotification.warning(data.mensagem);
              this.buttonPRG = false;
            }
          },
          (error: HttpErrorResponse) => {
            let erro = error.error;

            this.buttonPRG = false;

            this.poNotification.warning(erro.errorMessage);
          },
        );
      }
    } else {
      this.poNotification.warning('O Pedido deve ter pelo menos 1(um) produto !');
    }
    // }
  }
  //////////////////// Volar para a Pagina Principal Pedido /////////////////////////////////
  voltar() {
    this.router.navigateByUrl('/retorno');
  }
}
