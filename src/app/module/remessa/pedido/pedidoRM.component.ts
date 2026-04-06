import { ChangeDetectorRef, Component, ViewChild, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription, map, take } from 'rxjs';
import { PoDynamicFormField, PoModalComponent, PoTableColumn, PoDynamicFormFieldChanged, PoDynamicFormValidation, PoNotificationService, PoListViewAction, PoDynamicFormLoad } from '@po-ui/ng-components';
import { ForceOptionComponentEnum } from '@po-ui/ng-components';

import { ActivatedRoute, Router } from '@angular/router';
import { ProtheusService } from '../../../service/protheus.service';
import { formatDate } from '@angular/common';
import { Iitem, Ipedido } from '../../../interfaces/interface-pedido';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailHelperService } from 'src/app/shared/services/email-helper.service';
import { AppTableComponent } from 'src/app/components/table/app-table.component';
const actionInsert = 'insert';
const actionUpdate = 'update';
const actionFaturar = 'faturar';
const actionClassif = 'classificar';

@Component({
  selector: 'app-grid-form',
  templateUrl: './pedidoRM.component.html',
  styleUrls: ['./pedidoRM.component.css'],
  providers: [ProtheusService]
})
export class PedidoRMComponent implements OnInit {

  constructor(  private emailHelper: EmailHelperService, public ProtheusService: ProtheusService, private poNotification: PoNotificationService, private route: ActivatedRoute, private router: Router, private changeDetector: ChangeDetectorRef) { }

  @ViewChild(PoModalComponent, { static: false }) poModal!: PoModalComponent;
  @ViewChild('prodTable', { static: false }) poTable!: AppTableComponent;
  @ViewChild('PoModalLog', { static: true }) PoModalLog!: PoModalComponent;

  private paramsSub!: Subscription;
  action: string = actionInsert;

  title = "Pedido Remesaa Para Beneficiamento"
  titleDetailsModal!: string;    //
  loadingModal = false; // modal
  typeModal!: string;            //
  modalAction!: string;          //
  validateFields: Array<string> = ['quant', 'prunit'];
  typoAction = 'add';
  nitem = 1
  itemsForm?: NgForm;
  PedidoForm?: NgForm;
  columns!: Array<PoTableColumn>;  //table pedido
  columnsItens!: Array<PoTableColumn>; // table itens
  items!: Array<any>;
  items_ped_view: any = [];          //
  columnsProduto!: Array<PoTableColumn>;  //table modal
  items_ped: any = [];                 //
  formValue = {}
  formValueItems = {}
  codtab = ""; //
  codpgto = ""; // utilizado para gravar informações paa busca de tabela
  origem!: string; //
  destino!: string; //
  _origem!: string; //
  _destino!: string; //
  produtoTabela: any = []; // retorno dos produtos com tabela
  ItemPedido: any = []; // retorno dos produtos com tabela
  buttonPR = true
  buttonPRS = true
  buttonPRG = false
  buttonCan = false
  date_now: Date = new Date();
  camposPredefinidosProduto = {}
  IPedido!: Ipedido;
  pedidoNum!: string;
  faturar = "N"
  invoice = "N"
  salvarDBT = false
  notaFiscal = " ";
  tipoPedid = "B"; // N = Normal, B=Beneficiamento
  xtipoPedid = "B"; // N = Normal, B=Beneficiamento, R = Retorno
  tipo = ""
  filial = localStorage.getItem('filial') || '';
  grupo  = localStorage.getItem('grupo')  || '';
  mensagemLog = ''
  loagingButton = false

  //////////////////////////////////////// Ação da List View Produos //////////////////////////
  actions: Array<PoListViewAction> = []
  /////////////////////////////////////////////// Form principal /////////////////////////////
  fields: Array<PoDynamicFormField> = [
    {
      label: '* Filial(Origem)',
      property: 'origem',
      gridColumns: 4,
      gridSmColumns: 12,
      optional: false,
      required: true,
      readonly: true,
      disabled: true,
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
      label: '* Tabela de Preço',
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
      readonly: true
    },
    {
      label: 'Descrição',
      property: 'desc',
      gridColumns: 5,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true
    },
    {
      label: 'UM',
      property: 'um',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true
    },
    {
      label: 'TES',
      property: 'tes',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true
    },
    {
      label: 'AMZ',
      property: 'amz',
      gridColumns: 1,
      gridSmColumns: 12,
      optionsService: '',
      optional: false,
      readonly: true
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
      placeholder: 'Quantidade'
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
      readonly: false
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
      readonly: true
    }, {
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

    let itemsPR;
    this.formValue = {
      emissao: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
      origem: this.getOrigemValue() ?? `${this.grupo}/${this.filial}`,
      operacao: "03 - Remessa Para Industrialização",
      natureza: "10001 - Venda Nacional"
    };

    this.loadDestinoOptions();
    this.columnsItens = this.getColumnsItens();
    

    //this.loadingState = true;
    this.paramsSub = this.route.params.subscribe(params => {

      this.pedidoNum = params['id']
      this.filial = params['filial'] == undefined ? this.filial : params['filial'];
      this.tipo = params['tipo']
      this.faturar = params['fat'] == undefined ? "" : params['fat'];



      if (this.pedidoNum) {

        if (this.faturar == "S") {



          this.title = 'Gerar Nota Fiscal Pedido Remessa Para Beneficiamento: ' + params['id']
          this.buttonPR = true;
          this.action = actionFaturar;
          this.invoice = "S"


        } if (this.faturar == "N") {

          this.title = 'Classificar Pedido Remessa Para Beneficiamento: ' + params['id']
          this.buttonPR = true;
          this.action = actionClassif;
          this.invoice = "S"

        }
        if (this.faturar == "") {

          this.title = 'Editar Pedido Remessa Para Beneficiamento: ' + params['id']
          this.buttonPR = false;
          this.action = actionUpdate;
          this.invoice = "N"

          this.actions = [
            {
              label: '',
              action: this.editar.bind(this),
              icon: 'po-icon-edit'
            },
            {
              label: '',
              action: this.remover.bind(this),
              icon: 'po-icon-delete'
            },

          ];

        }





        this.ProtheusService.getPedido(this.filial, params['id'], this.tipo).pipe(
          map((data) => data)
        ).subscribe((data) => {

          this.IPedido = data.pedidos[0]
          this._origem = this.IPedido.filial;
          this.codtab = this.IPedido.tabela ? '' : '000';



          this.formValue = {
            origem: this.IPedido.grupo + '/' + this.IPedido.filial,

            destino: this.IPedido.filial_destino.trim() + '/' + this.IPedido.cliente + '/' + this.IPedido.loja,     // 010101/000007/0001


            obs: this.IPedido.mensagem,
            emissao: this.IPedido.emissao,
            operacao: "03 - Remessa Para Industrialização",
            natureza: "10001 - Venda Nacional",
            tabela: this.IPedido.tabela,
            condicao: this.IPedido.condpag,
          };



          console.log(this.formValue)

          this.IPedido.items?.forEach(_items => {

            this.nitem = parseInt(_items.item) + 1

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
              tipo: 'A'
            };

            this.items_ped = [...this.items_ped, itemsPR]
            this.items_ped_view = [...this.items_ped_view, itemsPR]
          });

          console.log(this.IPedido.notas)

          this.IPedido.notas?.forEach(_notas => {


            this.notaFiscal = _notas.nota + '/' + _notas.serie;

          });

          if (this.notaFiscal.length > 1) {

            this.title = 'Classificar Pedido Remessa Para Beneficiamento: ' + params['id'] + ' | Nota Fiscal: ' + this.notaFiscal

          }

        });

      } else {

        this.actions = [
          {
            label: '',
            action: this.editar.bind(this),
            icon: 'po-icon-edit'
          },
          {
            label: '',
            action: this.remover.bind(this),
            icon: 'po-icon-delete'
          },

        ];

        this.title = 'Cadastro de Pedido Remessa para Beneficiamento'


      }
    });



  }
  OnDestroy(): void {
    this.produtoTabela.unsubscribe();
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
        focus: 'obs'

      }

    }
    if (this.action == actionFaturar) {

      return {
        value: {},

        fields: [
          { property: 'origem', readonly: true },
          { property: 'destino', readonly: true },
          { property: 'emissao', readonly: true },
          { property: 'obs', readonly: true },
        ]


      }

    }

    if (this.action == actionInsert) {
      return {
        value: {},
        fields: [
          { property: 'emissao', readonly: true }
        ],
      }
    }

    return {}


  }

  onLoadFieldsPR(): PoDynamicFormLoad {



    return {
      value: {},

      fields: [],
      focus: 'quant'

    }




    return {}


  }

  /////////////////////////////////////////// Oncharge Form Principal //////////////////////
  onChangeFields(changeValue: PoDynamicFormFieldChanged): PoDynamicFormValidation {

    if (this.action != actionUpdate) {

      if (this.items_ped_view.length == 0) {

      /*  if (changeValue.property === 'origem') {

          this.origem = changeValue.value.origem

          if (this.destino != undefined) {

            if (this.origem == this.destino) {

              this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');

            }
          }

        }*/

        if (changeValue.property === 'destino') {

          const _destino = changeValue.value.destino.split("/");
          this.destino = _destino[0];
          this.origem = this.filial;
          this.items = [];
          this.buttonPR = true;
          this.codtab = "000";
          this.codpgto = "000";

          if (this.origem == this.destino) {
            this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');
          } else {
            // Consulta de tabela de preco desativada para remessa.
            this.codtab = "000";
            this.codpgto = "000";
            this.buttonPR = false;
            this._origem = this.origem;
            this._destino = changeValue.value.destino;
            this.formValue = {
              ...this.formValue,
              tabela: this.codtab,
              condicao: this.codpgto,
            };
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
        value: { tabela: this.codtab, condicao: this.codpgto }
      };

    }

    return {}

  }

  formatTitle(item:any) {
    return `${item.nitem} - ${item.codigo}`;
  }

  /////////////////////////////////////////// Oncharge Form Modal ////////////////////////////
  onChangeFieldsPR(changeValue: PoDynamicFormFieldChanged): PoDynamicFormValidation {
    let calculo = 0;

    if (changeValue.value.quant > 0 && changeValue.value.prunit > 0) {

      calculo = changeValue.value.quant * changeValue.value.prunit
      this.buttonPRS = false
    } else {

      this.buttonPRS = true

    }

    return {
      value: { ptotal: calculo }
    }

  }
  /////////////////////////////////////////// Carrega Modal //////////////////////////////////
  openModalProduto() {

    this.titleDetailsModal = "Lista de Produtos: " + this.codtab
    this.poModal.open();
    this.loadingModal = true;
    this.columnsProduto = this.getColumnsProduto();
    this.modalAction = 'select'
    this.typoAction = 'add'

    if (this.items === undefined || this.items.length == 0) {
      this.ProtheusService.getProduto(this._origem, this.codtab,this.xtipoPedid).subscribe((data) => {
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
    this.camposPredefinidosProduto = {}

    this.formValueItems = {

      dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),

    };

    if (this.typoAction == 'add') {

      const selectedItems = this.poTable?.getSelectedRows?.() ?? [];
      selectedItems.forEach(items => {

        if ((this.items_ped.find((item: { codigo: any; }) => item.codigo === items.B1_COD)) === undefined) {

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
            dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US')
          };
        }

        if ((this.items_ped_view.find((item: { codigo: any; }) => item.codigo === items.B1_COD)) === undefined) {

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
            dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US')
          };
        }
      })

      if (Object.keys(this.camposPredefinidosProduto).length !== 0) {

        this.poModal.close();
        setTimeout(() => {
          this.titleDetailsModal = "Informe a Quantidade !"
          this.modalAction = 'form'
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
        dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US')
      };

      this.poModal.close();
      setTimeout(() => {
        this.titleDetailsModal = "Informe a Quantidade !"
        this.modalAction = 'form'
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
        dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US')
      };

      this.poModal.close();
      setTimeout(() => {
        this.titleDetailsModal = "Deseja Remover o Produto ?"
        this.modalAction = 'formRemove'
        this.poModal.open();
      }, 500);
    }
  }
  /////////////////////////////////////////// Editar Produto /////////////////////////////////
  private editar(row: any) {
    this.typoAction = 'edit'
    this.SelectToPedido(row);
  }
  /////////////////////////////////////////// Remover Produto ////////////////////////////////
  private remover(row: any) {
    this.typoAction = 'remove'
    this.SelectToPedido(row);
  }
  ////////////////////////////////// Executa a ação de Remover Produto ///////////////////////
  removeToPedido() {

    let nitem = this.itemsForm?.form.value.nitem;

    const itemToRemove = this.items_ped_view.find((item: { nitem: any; }) => item.nitem === nitem);
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
    itemToRemove.tipo = "D";
    this.items_ped = [...this.items_ped, itemToRemove];
    this.items_ped = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);




    this.poModal.close();
  }
  ////////////////////////////////// Executa a ação de adcionar Produto ///////////////////////
  addToPedido(action: any) {

    let itemsPR;
    let _operacao = this.PedidoForm?.form.value.operacao.split("-");
    let _destino = this.PedidoForm?.form.value.destino.split("/");
    let _origem = this.PedidoForm?.form.value.origem.split("/")[1];
    let _grupo = this.PedidoForm?.form.value.origem.split("/")[0];
    let _tes;

    if (this.itemsForm?.form.value.quant == 0) {
      this.poNotification.error('Quantidade é Obrigatório!');
    } else {

      if (action == 'add') {

        this.ProtheusService.getTES(_origem, _operacao[0].trim(), _destino[1] + '_' + _destino[2], this.itemsForm?.form.value.codigo).pipe(
          take(1),
        ).subscribe((data) => {

          if (data.tes.length > 0) {
            _tes = data.tes[0].tes;

            if (_tes != '') {

              itemsPR = {
                nitem: this.nitem,
                codigo: this.itemsForm?.form.value.codigo,
                desc: this.itemsForm?.form.value.desc,
                quant: this.itemsForm?.form.value.quant,
                um: this.itemsForm?.form.value.um,
                prunit: this.itemsForm?.form.value.prunit,
                ptotal: (this.itemsForm?.form.value.quant * this.itemsForm?.form.value.prunit).toFixed(2),
                tes: _tes,
                amz: this.itemsForm?.form.value.amz,
                tab: this.codtab,
                dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
                tipo: ""
              };

              this.items_ped = [...this.items_ped, itemsPR]
              this.items_ped_view = [...this.items_ped_view, itemsPR]
              this.nitem++;



            } else {


              this.poNotification.warning('TES não encontrada para esse produto !');

            }

          }

        });


        this.poModal.close();


      } else {


        const nitem = this.itemsForm?.form.value.nitem; // O nitem do item que você deseja editar
        const itemToRemove = this.items_ped.find((item: { nitem: any; }) => item.nitem === nitem);
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
        itemToRemove.tipo = "A";
        this.items_ped = [...this.items_ped, itemToRemove];
        this.items_ped = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);

        this.items_ped_view = [...this.items_ped_view, itemToRemove];
        this.items_ped_view = this.items_ped_view.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);


        this.poModal.close();

      }


    }
  }
  ////////////////////////////////// Salva Pedido /////////////////////////////////////////////
  salvar() {


    if (this.items_ped.length > 0) {

      let _destino = this.PedidoForm?.form.value.destino.split("/");
      let _natureza = this.PedidoForm?.form.value.natureza.split("-");
      let _operacao = this.PedidoForm?.form.value.operacao.split("-");
      let _origem = this.PedidoForm?.form.value.origem.split("/")[1];
      let _grupo = this.PedidoForm?.form.value.origem.split("/")[0];
      let _ret;
      this.ItemPedido = []

      this.buttonPRG = true;

      this.items_ped.forEach((_item: any) => {
        this.ItemPedido = [...this.ItemPedido, {
          item: _item.nitem.toString().padStart(2, '0'),
          codigo: _item.codigo,
          quantidade: _item.quant,
          preco: _item.prunit,
          local: _item.amz,
          tes: _item.tes,
          entrega: _item.dtentreg,
          tipo: _item.tipo
        }];
      });

      let pedido = {
        cliente: _destino[1],
        loja: _destino[2],
        clienteEntrega: _destino[1],
        lojaEntrega: _destino[2],
        condpag: this.PedidoForm?.form.value.condicao,
        tabela: this.PedidoForm?.form.value.tabela == '' || this.PedidoForm?.form.value.tabela == "000" ? "" : this.PedidoForm?.form.value.tabela,
        natureza: _natureza[0].trim(),
        frete: "S",
        transportadora: "",
        mensagem: this.PedidoForm?.form.value.obs == undefined ? "" : this.PedidoForm?.form.value.obs,
        operacao: _operacao[0].trim(),
        itens: this.ItemPedido,
        tipo: this.tipoPedid,
        xtipo: this.xtipoPedid,
        xuser: sessionStorage.getItem('user'),

      }


      if (this.action == actionInsert) {

        this.buttonPR = true;

        this.buttonPR = true;

        this.ProtheusService.postPedido(_origem, JSON.stringify(pedido)).subscribe((data) => {

          if (data.retorno) {

            this.poNotification.success('Pedido: ' + data.numero + '. Cadastrado com Sucesso!');
            setTimeout(() => {
              this.items_ped = [];
              this.items_ped_view = [];
              this.formValue = {
                emissao: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
                origem: this.getOrigemValue() ?? `${this.grupo}/${this.filial}`,
                operacao: "03 - Remessa Para Industrialização",
                natureza: "10001 - Venda Nacional",
                tabela: this.codtab,
                condicao: this.codpgto,
                destino: this._destino ?? ''
              };
              this.PedidoForm?.form.reset(this.formValue);
              this.buttonPRG = false;

            }, 2000);
          } else {

            this.poNotification.warning('Tente novamente e caso não conseguir salvar o pedido, entre e, contato com a T.I.!');
            this.buttonPRG = false;
            this.buttonPR = false
          }

        },
          (error: HttpErrorResponse) => {

            const erro = error.error;
            this.buttonPRG = false;
            this.PoModalLog.open()
            this.mensagemLog = erro.errorMessage
          }
        );

      }
      if (this.action == actionUpdate) {

        this.buttonPR = true;


        this.ProtheusService.putPedido(_grupo, _origem, this.pedidoNum, JSON.stringify(pedido), this.invoice, this.faturar).subscribe((data) => {

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

            this.poNotification.warning('Tente novamente e caso não conseguir salvar o pedido, entre e, contato com a T.I.!');
            this.buttonPRG = false;
          }

        }, (error: HttpErrorResponse) => {

            const erro = error.error;
            this.buttonPRG = false;
             this.buttonPR = false;
            this.PoModalLog.open()
            this.mensagemLog = erro.errorMessage
        }
        );

      }
      if (this.action == actionFaturar) {


        let nota = ""

        this.ProtheusService.putPedido(_grupo, _origem, this.pedidoNum, JSON.stringify(pedido), this.invoice, this.faturar).subscribe((data) => {

          if (data.retorno) {

            nota = data.nota;

            this.poNotification.success('Pedido: ' + this.pedidoNum + '. Foi gerado a nota fiscal: ' + nota + '.');
            setTimeout(() => {
              // this.items_ped = [];
              // this.PedidoForm?.form.reset();
              this.salvarDBT = true
              this.buttonPRG = false;
            }, 2000);
          } else {

            this.salvarDBT = true

            this.poNotification.warning(data.mensagem);
            this.buttonPRG = false;
          }

        },
          (error: HttpErrorResponse) => {

            const erro = error.error;
            this.buttonPRG = false;
            this.PoModalLog.open()
            this.mensagemLog = erro.errorMessage

            
          }
        );


      }
      if (this.action == actionClassif) {


        let nota = ""

        this.ProtheusService.putPedido(_grupo, _origem, this.pedidoNum, JSON.stringify(pedido), this.invoice, this.faturar).subscribe((data) => {

          if (data.retorno == "200") {

            nota = data.nota;

            this.poNotification.success('Nota Fiscal: ' + nota + '. Foi classificada com Sucesso!');
            setTimeout(() => {
              // this.items_ped = [];
              // this.PedidoForm?.form.reset();
              this.salvarDBT = true
              this.buttonPRG = false;
            }, 2000);
          } else {

            this.salvarDBT = true

            this.poNotification.warning(data.mensagem);
            this.buttonPRG = false;
          }

        },
          (error: HttpErrorResponse) => {

     
            this.buttonPRG = false;
            this.PoModalLog.open()
            this.mensagemLog = String(error);
          }
        );


      }


    } else {

      this.poNotification.warning('O Pedido deve ter pelo menos 1(um) produto !');

    }
    // }

  }
  //////////////////// Volar para a Pagina Principal Pedido /////////////////////////////////
  voltar() {
    this.router.navigateByUrl('/remessa');
  }
  enviarLog(log: string) {
    this.emailHelper.enviarLog(log, '');
  }

  private getOrigemValue(): string | null {
    const raw = String(localStorage.getItem('grupofilial') || '').trim();
    return raw || null;
  }

  private loadDestinoOptions(): void {
    this.ProtheusService.getFilialDestino("ALL", this.filial)
      .pipe(take(1))
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

