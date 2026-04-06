import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subject, Subscription, map, take, takeUntil } from 'rxjs';
import {
  PoDynamicFormField,
  PoModalComponent,
  PoTableColumn,
  PoDynamicFormFieldChanged,
  PoDynamicFormValidation,
  PoNotificationService,
  PoListViewAction,
  PoDynamicFormLoad,
} from '@po-ui/ng-components';
import { ForceOptionComponentEnum } from '@po-ui/ng-components';

import { ActivatedRoute, Router } from '@angular/router';
import { ProtheusService } from '../../../service/protheus.service';
import { formatDate } from '@angular/common';
import { Iitem, Ipedido, ItemPedido, Inota } from '../../../interfaces/interface-pedido';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { EmailHelperService } from 'src/app/shared/services/email-helper.service';
import { AppTableComponent } from 'src/app/components/table/app-table.component';



const actionInsert = 'insert';
const actionUpdate = 'update';
const actionFaturar = 'faturar';
const actionClassif = 'classificar';

@Component({
  selector: 'app-grid-form',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css'],
  providers: [ProtheusService],
})
export class PedidoComponent implements OnInit, OnDestroy {
  constructor(
    public ProtheusService: ProtheusService,
    private poNotification: PoNotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
     private emailHelper: EmailHelperService
  ) {}

  @ViewChild(PoModalComponent, { static: false }) poModal!: PoModalComponent;
  @ViewChild('prodTable', { static: false }) poTable!: AppTableComponent;
  @ViewChild('PoModalLog', { static: true }) PoModalLog!: PoModalComponent;


  private paramsSub!: Subscription;
  private destroy$ = new Subject<void>();
  action: string = actionInsert;
  private readonly tipoPedido = 'I';

  title = 'Pedido de Venda Entre Filiais';
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
  columnsItens!: Array<PoTableColumn>; // table itens
  items: Array<Record<string, any>> = []; //
  columnsProduto!: Array<PoTableColumn>; //table modal
  items_ped: ItemPedido[] = [];
  items_ped_view: ItemPedido[] = []; //
  formValue: Record<string, any> = {};
  formValueItems: Record<string, any> = {};
  codtab = ''; //
  codpgto = ''; // utilizado para gravar informações paa busca de tabela
  origem!: string; //
  destino!: string; //
  _origem!: string; //
  _destino!: string; //
  produtoTabela: { items?: Array<Record<string, any>> } | null = null; // retorno dos produtos com tabela
  ItemPedido: Array<Record<string, any>> = []; // retorno dos produtos com tabela
  buttonPR = true;
  buttonPRS = true;
  buttonPRG = false;
  buttonCan = false;
  date_now: Date = new Date();
  camposPredefinidosProduto = {};
  IPedido!: Ipedido;
  pedidoNum!: string;
  faturar = 'N';
  invoice = 'N';
  salvarDBT = false;
  notaFiscal = ' ';
  tipoPedid = 'N'; // N = Normal, B=Beneficiamento
  xtipoPedid = 'N'; // N = Normal, B=Beneficiamento, R = Retorno
  tipo = '';
  filial = environment.filial || '';
  grupo  = environment.grupo  || '';
  mensagemLog = ''
  loagingButton = false

  //////////////////////////////////////// Ação da List View Produos //////////////////////////
  actions: Array<PoListViewAction> = [];
  /////////////////////////////////////////////// Form principal /////////////////////////////
  fields: Array<PoDynamicFormField> = [
    {
      label: 'Filial(Origem)',
      property: 'origem',
      gridColumns: 4,
      gridSmColumns: 12,
      readonly: true,
      disabled: true,
      optional: false,
      required: true,
    },
    {
      label: '* Filial(Destino)',
      property: 'destino',
      gridColumns: 4,
      gridSmColumns: 12,
      options: [],
      forceOptionsComponentType: ForceOptionComponentEnum.select,
      fieldLabel: 'cliente',
      fieldValue: 'code',
      optional: false,
      readonly: false,
      required: true,
      showRequired: true,
    },

    {
      property: 'emissao',
      label: '* Data de Emissão',
      type: 'date',
      format: 'dd/mm/yyyy',
      gridColumns: 4,
      gridSmColumns: 12,
      readonly: true,
      required: true,
      showRequired: true,
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
      showRequired: true,
    },
    {
      label: '* Condição de Pgto',
      property: 'condicao',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
      required: true,
      showRequired: true,
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
      label: '* Natureza',
      property: 'natureza',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
      required: true,
      showRequired: true,
    },
    {
      label: '* Tipo de Operação ',
      property: 'operacao',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
      required: true,
      showRequired: true,
    },
    {
      property: 'obs',
      label: 'Mensagem para Nota',
      gridColumns: 12,
      gridSmColumns: 12,
      rows: 2,
      placeholder: 'Observação',
      readonly: false,
      optional: true,
    },
  ];
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
      decimalsLength: 2,
      thousandMaxlength: 7,
      property: 'prunit',
      gridColumns: 3,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true,
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
    let itemsPR: ItemPedido | undefined;
    const origemValue = this.getOrigemValue();
    this.formValue = {
      emissao: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
      origem: origemValue ?? `${this.grupo}/${this.filial}`,
      operacao: '01 - Venda de Mercadoria',
      natureza: '10001 - Venda Nacional',
    };
    this.loadDestinoOptions();
    this.columnsItens = this.getColumnsItens();

    //this.loadingState = true;
    this.paramsSub = this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.pedidoNum = params['id'];
      this.faturar = params['fat'] == undefined ? '' : params['fat'];
      this.filial = params['filial']  == undefined ? this.filial : params['filial'];
      this.tipo = params['tipo'];

      if (this.pedidoNum) {
        if (this.faturar == 'S') {
          this.title = 'Gerar Nota Fiscal Pedido de Venda Entre Filiais: ' + params['id'];
          this.buttonPR = true;
          this.action = actionFaturar;
          this.invoice = 'S';
        }
        if (this.faturar == 'N') {
          this.title = 'Classificar Pedido de Venda Entre Filiais: ' + params['id'];
          this.buttonPR = true;
          this.action = actionClassif;
          this.invoice = 'S';
        }
        if (this.faturar == '') {
          this.title = 'Editar Pedido de Venda Entre Filiais: ' + params['id'];
          this.buttonPR = false;
          this.action = actionUpdate;
          this.invoice = 'N';

          this.actions = [
            {
              label: '',
              action: this.editar.bind(this),
              icon: 'po-icon-edit',
            },
            {
              label: '',
              action: this.remover.bind(this),
              icon: 'po-icon-delete',
            },
          ];
        }

        this.ProtheusService.getPedido(this.filial, params['id'], this.tipo)
          .pipe(map((data) => data))
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.IPedido = data.pedidos[0] as Ipedido;
            this._origem = this.IPedido.filial;
            this.codtab = this.IPedido.tabela;

            const origemValue = this.getOrigemValue();
            this.formValue = {
              origem: origemValue ?? this.IPedido.grupo + '/' + this.IPedido.filial,
              destino: this.IPedido.filial_destino.trim() + '/' + this.IPedido.cliente + '/' + this.IPedido.loja, // 010101/000007/0001
              obs: this.IPedido.mensagem,
              emissao: this.IPedido.emissao,
              operacao: '01 - Venda',
              natureza: '10001 - Venda Nacional',
              tabela: this.IPedido.tabela,
              condicao: this.IPedido.condpag,
            };

            this.IPedido.items?.forEach((_items: Iitem) => {
              this.nitem = parseInt(_items.item) + 1;

              itemsPR = {
                nitem: parseInt(_items.item),
                codigo: _items.produto,
                desc: _items.descricao,
                quant: _items.quantidade,
                um: _items.unidade,
                prunit: Number(_items.preco),
                ptotal: (_items.quantidade * parseFloat(_items.preco)).toFixed(2),
                tes: _items.tes,
                amz: _items.local,
                tab: this.IPedido.tabela,
                dtentreg: _items.entrega,
                tipo: 'A',
              };

              this.items_ped = [...this.items_ped, itemsPR as ItemPedido];
              this.items_ped_view = [...this.items_ped_view, itemsPR as ItemPedido];
            });

            console.log(this.IPedido.notas);

            this.IPedido.notas?.forEach((_notas: Inota) => {
              this.notaFiscal = _notas.nota + '/' + _notas.serie;
            });

            if (this.notaFiscal.length > 1) {
              this.title =
                'Classificar Pedido de Venda Entre Filiais: ' + params['id'] + ' | Nota Fiscal: ' + this.notaFiscal;
            }
          });
      } else {
        this.actions = [
          {
            label: '',
            action: this.editar.bind(this),
            icon: 'po-icon-edit',
          },
          {
            label: '',
            action: this.remover.bind(this),
            icon: 'po-icon-delete',
          },
        ];

        this.title = 'Cadastro de Pedido Venda Entre Filiais';
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.paramsSub) {
      this.paramsSub.unsubscribe();
    }
  }

  formatTitle(item: any) {
    return `${item.nitem} - ${item.codigo}`;
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

  getColumnsItens(): Array<PoTableColumn> {
    return [
      { property: 'desc', label: 'Produto' },
      { property: 'um', label: 'UM' },
      { property: 'quant', label: 'Quantidade' },
      { property: 'prunit', label: 'Preço Unit.' },
      { property: 'ptotal', label: 'Total' },
      { property: 'tab', label: 'Tab. Preço' },
      { property: 'tes', label: 'TES' },
      { property: 'amz', label: 'Amz' },
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
    if (this.action == actionFaturar) {
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
    if (this.action == actionInsert) {
      return {
        value: {},
        fields: [{ property: 'emissao', readonly: true }],
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
    if (this.action != actionUpdate) {
      if (this.items_ped_view.length == 0) {
        /*if (changeValue.property === 'origem') {
          this.origem = changeValue.value.origem.split('/')[1];

          if (this.destino != undefined) {
            if (this.origem == this.destino) {
              this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');
            }
          }
        }*/

        if (changeValue.property === 'destino') {
          const destinoRaw = String(changeValue.value.destino || '').trim();
          if (!destinoRaw) {
            this.poNotification.warning('Informe a filial (Destino).');
            return {
              value: { tabela: this.codtab, condicao: this.codpgto },
            };
          }
          const _destino = destinoRaw.split('/').map((part) => part.trim()).filter(Boolean);
          if (_destino.length < 2) {
            this.poNotification.warning('Destino inválido.');
            return {
              value: { tabela: this.codtab, condicao: this.codpgto },
            };
          }
          const destinoFilial = _destino[0];
          const destinoClienteLoja =
            _destino.length >= 3 ? `${_destino[1]}/${_destino[2]}` : _destino[1];
          this.destino = destinoFilial;
          this.items = [];
          this.buttonPR = true;
          this.codtab = '';
          this.codpgto = '';

          if (this.filial == this.destino) {
            this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');
          } else {
            let cliente = '';
            let loja = '';
            if (destinoClienteLoja.includes('/')) {
              [cliente, loja] = destinoClienteLoja.split('/');
            } else {
              [cliente, loja] = destinoClienteLoja.split('-');
            }
            if (!cliente || !loja) {
              this.poNotification.warning('Destino inválido (cliente/loja).');
              return {
                value: { tabela: this.codtab, condicao: this.codpgto },
              };
            }
            this.ProtheusService.getTabelaInter(this.filial, cliente, loja, this.tipoPedido)
              .pipe(take(1))
              .pipe(takeUntil(this.destroy$))
              .subscribe((data) => {
                const table =
                  data?.data?.Tabela ??
                  data?.Tabela ??
                  (Array.isArray(data) ? data[0] : null);
                const codtab = String(table?.CodigoTab ?? table?.codigo ?? table?.codtab ?? '').trim();
                const condpgto = String(table?.CondPag ?? table?.condpagamento ?? table?.condpag ?? '').trim();

                if (codtab) {
                  this.codtab = codtab;
                  this.codpgto = condpgto;
                  this.buttonPR = false;
                  this._origem = this.filial;
                  this._destino = changeValue.value.destino;
                  this.formValue = {
                    ...this.formValue,
                    tabela: this.codtab,
                    condicao: this.codpgto,
                  };
                  this.changeDetector.detectChanges();
                } else {
                  this.poNotification.warning('Tabela de Preço não encontrada !');
                }
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

    return {};
  }
  /////////////////////////////////////////// Oncharge Form Modal ////////////////////////////
  onChangeFieldsPR(changeValue: PoDynamicFormFieldChanged): PoDynamicFormValidation {
    let calculo;

    if (changeValue.property === 'quant') {
      calculo = changeValue.value.quant * changeValue.value.prunit;

      if (changeValue.value.quant > 0) {
        this.buttonPRS = false;
      } else {
        this.buttonPRS = true;
      }
    }

    return {
      value: { ptotal: calculo },
    };
  }
  /////////////////////////////////////////// Carrega Modal //////////////////////////////////
  openModalProduto() {
    this.titleDetailsModal = 'Lista de Produtos da Tabela de Preço: ' + this.codtab;
    this.poModal.open();
    this.loadingModal = true;
    this.columnsProduto = this.getColumnsProduto();
    this.modalAction = 'select';
    this.typoAction = 'add';

    if (this.items === undefined || this.items.length == 0) {
      this.ProtheusService.getProduto(this._origem, this.codtab, this.xtipoPedid)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          this.produtoTabela = data;
          this.items = (this.produtoTabela?.items ?? []) as Array<Record<string, any>>;
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
      const selectedItems = this.poTable?.getSelectedRows?.() ?? [];
      selectedItems.forEach((items) => {
        if (this.items_ped.find((item) => item.codigo === items.B1_COD) === undefined) {
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

        if (this.items_ped_view.find((item) => item.codigo === items.B1_COD) === undefined) {
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
    const nitem = this.itemsForm?.form.value.nitem;

    const itemToRemove = this.items_ped_view.find((item: { nitem: any }) => item.nitem === nitem);
    if (!itemToRemove) {
      this.poNotification.warning('Item não encontrado para remoção.');
      return;
    }
    this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
    this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);

    itemToRemove.nitem = nitem;
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
    this.items_ped = [...this.items_ped, itemToRemove];
    this.items_ped = this.items_ped.sort((a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem);

    this.poModal.close();
  }
  ////////////////////////////////// Executa a ação de adcionar Produto ///////////////////////
  addToPedido(action: any) {
    let itemsPR: ItemPedido;

    if (this.itemsForm?.form.value.quant == 0) {
      this.poNotification.error('Quantidade é Obrigatório!');
    } else {
      if (action == 'add') {
        itemsPR = {
          nitem: this.nitem,
          codigo: this.itemsForm?.form.value.codigo,
          desc: this.itemsForm?.form.value.desc,
          quant: this.itemsForm?.form.value.quant,
          um: this.itemsForm?.form.value.um,
          prunit: this.itemsForm?.form.value.prunit,
          ptotal: (this.itemsForm?.form.value.quant * this.itemsForm?.form.value.prunit).toFixed(2),
          tes: this.itemsForm?.form.value.tes,
          amz: this.itemsForm?.form.value.amz,
          tab: this.codtab,
          dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
          tipo: '',
        };

        this.items_ped = [...this.items_ped, itemsPR];
        this.items_ped_view = [...this.items_ped_view, itemsPR];
        this.nitem++;
        this.poModal.close();
      } else {
        const nitem = this.itemsForm?.form.value.nitem; // O nitem do item que você deseja editar
        const itemToRemove = this.items_ped.find((item: { nitem: any }) => item.nitem === nitem);
        if (!itemToRemove) {
          this.poNotification.warning('Item não encontrado para edição.');
          return;
        }
        this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);
        this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);

        itemToRemove.nitem = nitem;
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
        itemToRemove.tipo = 'A';
        this.items_ped = [...this.items_ped, itemToRemove];
        this.items_ped = this.items_ped.sort((a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem);

        this.items_ped_view = [...this.items_ped_view, itemToRemove];
        this.items_ped_view = this.items_ped_view.sort((a: { nitem: number }, b: { nitem: number }) => a.nitem - b.nitem);

        this.poModal.close();
      }
    }
  }
  ////////////////////////////////// Salva Pedido /////////////////////////////////////////////
  salvar() {
    if (!this.PedidoForm?.form) {
      this.poNotification.warning('Formulário inválido.');
      return;
    }
    if (this.items_ped.length > 0) {
      const destinoValue = this.PedidoForm?.form.value.destino ?? this._destino ?? '';
      const destinoRaw =
        typeof destinoValue === 'string'
          ? destinoValue.trim()
          : String(
              (destinoValue?.code ?? destinoValue?.destino ?? destinoValue?.value ?? '') || '',
            ).trim();
      const naturezaRaw = String(this.PedidoForm?.form.value.natureza || '').trim();
      const operacaoRaw = String(this.PedidoForm?.form.value.operacao || '').trim();
      const origemRaw = String(this.PedidoForm?.form.value.origem || '').trim();

      if (!destinoRaw || !naturezaRaw || !operacaoRaw || !origemRaw) {
        this.poNotification.warning('Preencha os campos obrigatórios.');
        return;
      }

      let _destino = destinoRaw.split('/');
      const _natureza = naturezaRaw.split('-');
      const _operacao = operacaoRaw.split('-');
      const _origemParts = origemRaw.split('/');
        if (_destino.length < 2 || _natureza.length < 1 || _operacao.length < 1 || _origemParts.length < 2) {
          this.poNotification.warning('Dados do pedido inválidos.');
          return;
        }
        if (_destino.length === 2 && _destino[1].includes('-')) {
          const [cliente, loja] = _destino[1].split('-');
          _destino[1] = cliente;
          _destino[2] = loja;
        }
        if (_destino.length < 3 && destinoRaw.includes('-')) {
          const parts = destinoRaw.split('-');
          if (parts.length >= 3) {
            _destino = [parts[0], parts[1], parts[2]];
          }
        }
        if (_destino.length < 3) {
          this.poNotification.warning('Dados do pedido inválidos.');
          return;
        }
      const _origem = _origemParts[1].split('-')[0].trim();
      const _grupo = _origemParts[0].trim();
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
          },
        ];
      });

      const pedido = {
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

        this.buttonPR = true;

        this.ProtheusService.postPedido(_origem, JSON.stringify(pedido)).subscribe(
          (data) => {
            if (data.retorno) {
              this.poNotification.success('Pedido: ' + data.numero + '. Cadastrado com Sucesso!');
              setTimeout(() => {
                this.items_ped = [];
                this.items_ped_view = [];
                const origemValue = this.getOrigemValue();
                this.formValue = {
                  emissao: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
                  origem: origemValue ?? `${this.grupo}/${this.filial}`,
                  operacao: '01 - Venda de Mercadoria',
                  natureza: '10001 - Venda Nacional',
                  tabela: this.codtab,
                  condicao: this.codpgto,
                  destino: this._destino ?? '',
                };
                this.PedidoForm?.form.reset(this.formValue);
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
            const erro = error.error;
            this.buttonPRG = false;
            this.PoModalLog.open()
            this.mensagemLog = erro.errorMessage


            //this.poNotification.warning(erro.errorMessage);
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


            const erro = error.error;
            this.buttonPRG = false;
            this.buttonPR = false;
            this.PoModalLog.open()
            this.mensagemLog = erro.errorMessage


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
            const erro = error.error;

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

            const erro = error.error;
            this.buttonPRG = false;
            this.PoModalLog.open()
            this.mensagemLog = erro.errorMessage
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
    this.router.navigateByUrl('/intercompany');
  }

   enviarLog(log: string) {
    this.emailHelper.enviarLog(log, '');
  }

  private getOrigemValue(): string | null {
    const raw = String(environment.grupofilial || '').trim();
    return raw || null;
  }

  private loadDestinoOptions(): void {
    this.ProtheusService.getFilialDestino(this.grupo, this.filial)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const rawOptions = this.normalizeDestinoOptions(data);
          const grupoAtual = String(this.grupo || '').trim();
          const filialAtual = String(this.filial || '').trim();
          let options = rawOptions.filter((option: any) => {
            const empresa = String(option.empresa || '').trim();
            const filial = String(option.filial || '').trim();
            if (!empresa || !filial) {
              return true;
            }
            return !(empresa === grupoAtual && filial === filialAtual);
          });
          if (!options.length && rawOptions.length) {
            options = rawOptions;
          }
          this.fields = this.fields.map((field, index) =>
            index === 1 ? { ...field, options } : field,
          );
          this.changeDetector.detectChanges();
        },
        error: () => {
          this.fields = this.fields.map((field, index) =>
            index === 1 ? { ...field, options: [] } : field,
          );
          this.changeDetector.detectChanges();
        },
      });
  }

  private normalizeDestinoOptions(data: any): Array<{ cliente: string; code: string; empresa: string; filial: string }> {
    const raw =
      data?.data?.Empresas ??
      data?.Empresas ??
      data?.data?.Clientes ??
      data?.data?.Cliente ??
      data?.data?.clientes ??
      data?.data?.cliente ??
      data?.Clientes ??
      data?.Cliente ??
      data?.clientes ??
      data?.cliente ??
      data?.data?.items ??
      data?.items ??
      data?.data ??
      data ??
      [];
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list
      .map((item: any) => {
        const empresa = String(
          item?.CodigoEmpresa ??
            item?.codigoEmpresa ??
            item?.empresa ??
            item?.Empresa ??
            '',
        ).trim();
        const filial = String(
          item?.CodigoFilial ??
            item?.Filial ??
            item?.filial ??
            item?.filial_destino ??
            '',
        ).trim();
        const cliente = String(
          item?.CodigoCliente ??
            item?.codigoCliente ??
            item?.codigo_cliente ??
          item?.Cliente ??
            item?.cliente ??
            item?.codigo ??
            item?.CodigoFilial ??
            '',
        ).trim();
        const loja = String(
          item?.LojaCliente ??
            item?.lojaCliente ??
            item?.loja_cliente ??
            item?.Loja ??
            item?.loja ??
            '0001',
        ).trim();
        const nome = String(
          item?.NomeFilial ??
            item?.RazaoSocial ??
            item?.NomeCliente ??
            item?.nomeCliente ??
            item?.clienteNome ??
            item?.ClienteNome ??
            item?.descricao ??
            item?.nome ??
            '',
        ).trim();
        if (!filial || !cliente) {
          return null;
        }
        return {
          cliente: nome ? `${nome} (${cliente}-${loja})` : `${cliente}-${loja}`,
          code: `${filial}/${cliente}/${loja}`,
          empresa,
          filial,
        };
      })
      .filter((item): item is { cliente: string; code: string; empresa: string; filial: string } => item !== null);
  }
}
