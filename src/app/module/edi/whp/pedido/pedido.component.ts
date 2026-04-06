import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription, map, take } from 'rxjs';
import { ForceOptionComponentEnum, PoDynamicFormField, PoModalComponent, PoTableColumn, PoDynamicFormFieldChanged, PoDynamicFormValidation, PoNotificationService, PoListViewAction, PoDynamicFormLoad } from '@po-ui/ng-components';

import { ActivatedRoute, Router } from '@angular/router';
import { ProtheusService } from '../../../../service/protheus.service';
import { formatDate } from '@angular/common';
import { Iitem, Ipedido } from '../../../../interfaces/interface-pedido';
import { HttpErrorResponse } from '@angular/common/http';
import { AppTableComponent } from 'src/app/components/table/app-table.component';

const actionInsert = 'insert';
const actionUpdate = 'update';
const actionFaturar = 'faturar';
const actionClassif = 'classificar';

@Component({
  selector: 'app-grid-form',
  templateUrl: './pedido.component.html',
  providers: [ProtheusService]
})
export class PedidoWHPComponent {

  constructor(public ProtheusService: ProtheusService, private poNotification: PoNotificationService, private route: ActivatedRoute, private router: Router, private changeDetector: ChangeDetectorRef) { }

  @ViewChild(PoModalComponent, { static: false }) poModal!: PoModalComponent;
  @ViewChild(AppTableComponent, { static: false }) poTable!: AppTableComponent;

  private paramsSub!: Subscription;
  action: string = actionInsert;

  title = "Pedido de Retorno de Beneficiamento"
  titleDetailsModal!: string;    //
  loadingModal  = false; // modal
  typeModal!: string;            //
  modalAction!: string;          //
  validateFields: Array<string> = ['quant'];
  typoAction  = 'add';
  nitem = 1
  itemsForm?: NgForm;
  PedidoForm?: NgForm;
  columns!: Array<PoTableColumn>;  //table pedido
  items!: Array<any>;              //
  columnsProduto!: Array<PoTableColumn>;  //table modal
  items_ped: any = [];
  items_ped_view: any = [];       //
  formValue = {}
  formValueItems = {}
  codtab  = ""; //
  codpgto  = ""; // utilizado para gravar informações paa busca de tabela
  origem!: string; //
  destino!: string; //
  _origem!: string; //
  _destino!: string; //
  produtoTabela: any = []; // retorno dos produtos com tabela
  ItemPedido: any = []; // retorno dos produtos com tabela
  buttonPR  = true
  buttonPRS  = true
  buttonPRG = false
  buttonCan  = false
  date_now: Date = new Date();
  camposPredefinidosProduto = {}
  IPedido!: Ipedido;
  pedidoNum!: string;
  faturar  = "N"
  invoice  = "N"
  salvarDBT  = false
  notaFiscal  = " ";
  tipoPedid  = ""; // N = Normal, B=Beneficiamento
  xtipoPedid  = ""; // N = Normal, B=Beneficiamento, R = Retorno
  filial  = "";
  tipo  = "";
  fields!: Array<PoDynamicFormField>;

  //////////////////////////////////////// Ação da List View Produos //////////////////////////
  actions: Array<PoListViewAction> = []
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

    this.fields = this.getCamposForm();

    let _nItemPai = ""
    let ncount = 1;

    if (localStorage.getItem('grupo')!.toString() == "01") {

      this.tipoPedid = "N"; // N = Normal, B=Beneficiamento
      this.xtipoPedid = "R"; // N = Normal, B=Beneficiamento, R = Retorno

      console.log('1' + this.xtipoPedid)

    }
    if (localStorage.getItem('grupo')!.toString() == "02") {

      this.tipoPedid = "N"; // N = Normal, B=Beneficiamento
      this.xtipoPedid = "R"; // N = Normal, B=Beneficiamento, R = Retorno

      console.log('2' + this.xtipoPedid)
    }

    let itemsPR;
    this.formValue = {
      //emissao: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
      operacao: "04 - Retorno Industrialização",
      natureza: "10001 - Venda Nacional",
    };


    //this.loadingState = true;
    this.paramsSub = this.route.params.subscribe(params => {

      this.pedidoNum = params['id']
      this.filial = params['filial']
      this.tipo = params['tipo']

      if (this.pedidoNum) {


        if (this.faturar == "") {

          this.title = 'Editar Pedido de Retorno de Beneficiamento: ' + params['id']
          this.buttonPR = false;
          this.action = actionUpdate;
          this.invoice = "N"

          this.actions = [
            {
              label: 'Editar',
              action: this.editar.bind(this),
              icon: 'po-icon-edit',
              disabled: this.disableEditButton.bind(this),
            },
            {
              label: 'Remover',
              action: this.remover.bind(this),
              icon: 'po-icon-delete',
              disabled: this.disableEditButton.bind(this),
              type: 'danger',
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
            operacao: "04 - Retorno Industrialização",
            natureza: "10001 - Venda Nacional",
            tabela: this.IPedido.tabela ? '' : '000',
            condicao: this.IPedido.condpag,
          };

          this.IPedido.items?.forEach(_items => {

            this.nitem = parseInt(_items.item) + 1

            if(ncount == 1){
              _nItemPai = _items.item
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
              itemorig: "",
              ident: _items.ident,
              produto: _nItemPai
            };

            this.items_ped.push(itemsPR)
            this.items_ped_view.push(itemsPR)

            ncount = ncount + 1;

          });

          console.log(this.IPedido.notas)

          this.IPedido.notas?.forEach(_notas => {


            this.notaFiscal = _notas.nota + '/' + _notas.serie;

          });

          if (this.notaFiscal.length > 1) {

            this.title = 'Classificar Pedido de Retorno de Beneficiamento: ' + params['id'] + ' | Nota Fiscal: ' + this.notaFiscal

          }

        });

      } else {

        this.actions = [
          {
            label: 'Editar',
            action: this.editar.bind(this),
            icon: 'po-icon-edit',
            disabled: this.disableEditButton.bind(this),

          },
          {
            label: 'Remover',
            action: this.remover.bind(this),
            icon: 'po-icon-delete',
            disabled: this.disableEditButton.bind(this),
            type: 'danger',
          },

        ];
        this.title = 'Pedido de Retorno de Beneficiamento'
      }
    });



  }
  OnDestroy(): void {
    this.produtoTabela.unsubscribe();
  }
  /////////////////////////////////////////////////////////////////////////////////////////

  private disableEditButton(item: any): boolean {

    return item['notaorig'] != '';
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

  getCamposForm(): Array<PoDynamicFormField> {
    if (localStorage.getItem('grupo')!.toString() == "01") {

      return [

        {
          label: '* Filial(Origem)',
          property: 'origem',
          gridColumns: 4,
          gridSmColumns: 12,
          forceOptionsComponentType: ForceOptionComponentEnum.select,
          options: [
            { filial: '', code: '' },
            //{ filial: 'Eletropolar', code: '02/010101' },
            //{ filial: 'Austral', code: '02/020101' },
            // { filial: 'Arotubi Componentes', code: '01/020101' },
            { filial: 'Arotubi Sistemas', code: '01/030101' }

          ],
          fieldLabel: 'filial',
          fieldValue: 'code',
          optional: false,
          required: true,
        },


        {
          label: '* Filial(Destino)',
          property: 'destino',
          gridColumns: 4,
          gridSmColumns: 12,
          forceOptionsComponentType: ForceOptionComponentEnum.select,
          options: [
            { cliente: '', code: '' },
            // { cliente: 'Arotubi Metais', code: '010101/000002/0001' },
            //{ cliente: 'Arotubi Componentes', code: '020101/000001/0001' },
            { cliente: 'Arotubi Componentes', code: '020101/000008/0001' }

          ],
          fieldLabel: 'cliente',
          fieldValue: 'code',
          optional: false,
          readonly: false,
          required: true,
        },

        {
          property: 'emissao',
          label: '* Data de Emissão',
          type: 'date',
          format: 'dd/mm/yyyy',
          gridColumns: 4,
          gridSmColumns: 12,
          readonly: false,
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
        },
        {
          property: 'obs',
          label: 'Mensagem para Nota',
          gridColumns: 12,
          gridSmColumns: 12,
          rows: 2,
          placeholder: 'Observação',
          readonly: false
        },

      ];

    } else {

      return [

        {
          label: '* Filial(Origem)',
          property: 'origem',
          gridColumns: 4,
          gridSmColumns: 12,
          forceOptionsComponentType: ForceOptionComponentEnum.select,
          options: [
            { filial: '', code: '' },
            { filial: 'Eletropolar', code: '02/010101' },
            { filial: 'Austral', code: '02/020101' },
          ],
          fieldLabel: 'filial',
          fieldValue: 'code',
          optional: false,
          required: true,
        },


        {
          label: '* Filial(Destino)',
          property: 'destino',
          gridColumns: 4,
          gridSmColumns: 12,
          forceOptionsComponentType: ForceOptionComponentEnum.select,
          options: [
            { cliente: '', code: '' },
           // { cliente: 'Arotubi Metais', code: '010101/000002/0001' },
            { cliente: 'Arotubi Componentes', code: '020101/000001/0001' },
            //    { cliente: 'Arotubi Sistemas', code: '030101/000133/0001' }

          ],
          fieldLabel: 'cliente',
          fieldValue: 'code',
          optional: false,
          readonly: false,
          required: true,
        },

        {
          property: 'emissao',
          label: '* Data de Emissão',
          type: 'date',
          format: 'dd/mm/yyyy',
          gridColumns: 4,
          gridSmColumns: 12,
          readonly: false,
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
        },
        {
          property: 'obs',
          label: 'Mensagem para Nota',
          gridColumns: 12,
          gridSmColumns: 12,
          rows: 2,
          placeholder: 'Observação',
          readonly: false
        },

      ];



    }
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

    if (this.action == actionFaturar || this.action == actionClassif) {

      return {
        value: {},

        fields: [
          { property: 'origem' , readonly: true },
          { property: 'destino', readonly: true },
          { property: 'emissao', readonly: true },
          { property: 'obs'    , readonly: true },
        ]
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



  }


  /////////////////////////////////////////// Oncharge Form Principal //////////////////////
  onChangeFields(changeValue: PoDynamicFormFieldChanged): PoDynamicFormValidation {


    if (localStorage.getItem('grupo')!.toString() == "01") {

      if (this.action != actionUpdate) {

        if (this.items_ped_view.length == 0) {


          if (changeValue.property === 'origem') {

            this.origem = changeValue.value.origem

            if (this.destino != undefined) {

              if (this.origem == this.destino) {

                this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');

              }
            }

          }

          if (changeValue.property === 'destino') {

            const _destino = changeValue.value.destino.split("/");
            const _origem_ = changeValue.value.origem.split("/");
            this.destino = _destino[0];
            this.origem = _origem_[1];
            this.items = [];
            this.buttonPR = true;
            this.codtab = "";
            this.codpgto = "";




            if (this.origem == this.destino) {
              this.poNotification.warning('Filial de (Origem) não pode ser igual a Filial de (Destino) !');
            } else {

              this.ProtheusService.getTabela(this.origem, _destino[1]).pipe(
                take(1),
              ).subscribe((data) => {
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
          value: { tabela: this.codtab, condicao: this.codpgto }
        };

      }

    } else {


      if (this.action != actionUpdate) {

        if (this.items_ped_view.length == 0) {

          if (changeValue.property === 'destino') {

            const _destino = changeValue.value.destino.split("/");
            const _origem_ = changeValue.value.origem.split("/");
            this.destino = _destino[0];
            this.origem   = _origem_[1];
            this.items    = [];
            this.buttonPR = true;
            this.codtab = "";
            this.codpgto = "";


            this.ProtheusService.getTabela(this.origem, _destino[1]).pipe(
              take(1),
            ).subscribe((data) => {
              if (data.length > 0) {
                this.codtab = data[0].codigo;
                this.codpgto = data[0].condpagamento;
              } else {
                this.codtab = "000";
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
          value: { tabela: this.codtab, condicao: this.codpgto }
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
      value: { tabela: this.codtab, condicao: this.codpgto }
    };


    return {}

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
    this.camposPredefinidosProduto = {}

    this.formValueItems = {
      dtentreg: formatDate(this.date_now, 'yyyy-MM-dd', 'en-US'),
    };

    if (this.typoAction == 'add') {

      const selectedItems = this.poTable.getSelectedRows();
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

    const nitem = this.itemsForm?.form.value.nitem;
    let _nItemPai = 0;

    this.items_ped_view.forEach((_item: any) => {

      if (nitem === parseInt(_item.produto)) {

        const nItemrm = _item.nitem

        if (_nItemPai == 0) {
          _nItemPai = nitem
        }

        if (nItemrm == nitem) {

          const itemToRemove = this.items_ped_view.find((item: { nitem: any; }) => item.nitem === nItemrm);
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
          itemToRemove.tipo = "D";
          itemToRemove.notaorig = "";
          itemToRemove.serirorig = "";
          itemToRemove.itemorig = "";
          itemToRemove.ident = "";
          itemToRemove.produto = nitem;


          this.items_ped.push(itemToRemove);
          this.items_ped = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);

        } else {


          const itemToRemove  = this.items_ped_view.find((item: { nitem: any; }) => item.nitem === nItemrm);
          this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
          this.items_ped      = this.items_ped.filter((item: any) => item !== itemToRemove);


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
          itemToRemove.tipo = "D";
          itemToRemove.notaorig = _item.notaorig;
          itemToRemove.serirorig = _item.serirorig;
          itemToRemove.itemorig = _item.itemorig;
          itemToRemove.ident = _item.ident;
          itemToRemove.produto = nitem;


          this.items_ped.push(itemToRemove);
          this.items_ped = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);

        }



      }

    });



    if (this.items_ped_view.length == 0){


      this.nitem = 1;

    }


    this.poModal.close();
  }
  ////////////////////////////////// Executa a ação de adcionar Produto ///////////////////////
  addToPedido(action: any) {

    let itemsPR;
    const _operacao = this.PedidoForm?.form.value.operacao.split("-");
    const _destino = this.PedidoForm?.form.value.destino.split("/");
    const _origem = this.PedidoForm?.form.value.origem.split("/")[1];
    const _grupo = this.PedidoForm?.form.value.origem.split("/")[0];
    let _tes: string;
    let _nItemPai = 0;

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

              this.ProtheusService.getEST(_origem, _destino[1] + '_' + _destino[2], this.itemsForm?.form.value.codigo, this.itemsForm?.form.value.quant).pipe(
                take(1),
              ).subscribe((data) => {




                if (data.status == "success") {

                  if (_nItemPai == 0) {
                    _nItemPai = this.nitem
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
                    tipo: "",
                    notaorig: "",
                    serirorig: "",
                    itemorig: "",
                    ident: "",
                    produto: _nItemPai
                  };

                  this.items_ped.push(itemsPR)
                  this.items_ped_view.push(itemsPR)
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
                      tipo: "",
                      notaorig: item.nota,
                      serirorig: item.serie,
                      itemorig: item.item,
                      ident: item.ident,
                      produto: _nItemPai
                    };

                    this.items_ped.push(itemsPR)
                    this.items_ped_view.push(itemsPR)
                    this.nitem++;

                  })

                } else {

                  this.poNotification.warning(data.status);
                }


              },
                (error: HttpErrorResponse) => {

                  const erro = error.error

                  this.poNotification.warning(erro.errorMessage);
                });

            } else {

              this.poNotification.warning('TES não encontrada para esse produto !');

            }

          }

        },
          (error: HttpErrorResponse) => {

            const erro = error.error

            this.poNotification.warning(erro.errorMessage);
          });


        this.poModal.close();


      } else if (action == 'edit') {

        const nitem = this.itemsForm?.form.value.nitem;

        this.ProtheusService.getEST(_origem, _destino[1] + '_' + _destino[2], this.itemsForm?.form.value.codigo, this.itemsForm?.form.value.quant).pipe(
          take(1),
        ).subscribe((data) => {

          const dataItem = data.itens

          this.items_ped_view.forEach((_item: any) => {

            if (nitem === parseInt(_item.produto)) {

              const nItemrm = _item.nitem

              if (nItemrm == nitem) {

                const itemToRemove = this.items_ped_view.find((item: { nitem: any; }) => item.nitem === nItemrm);
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
                itemToRemove.tipo = "A";
                itemToRemove.notaorig = _item.notaorig;
                itemToRemove.serirorig = _item.serirorig;
                itemToRemove.itemorig = _item.itemorig;
                itemToRemove.ident = _item.ident;
                itemToRemove.produto = nitem;
                this.items_ped.push(itemToRemove);
                this.items_ped = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);
                this.items_ped_view.push(itemToRemove);
                this.items_ped_view = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);

              } else {

                dataItem.forEach((_itemb: any) => {


                  if (_itemb.matprima == _item.codigo) {


                    const itemToRemove = this.items_ped_view.find((item: { codigo: any; }) => item.codigo === _itemb.matprima);
                    this.items_ped_view = this.items_ped_view.filter((item: any) => item !== itemToRemove);
                    this.items_ped = this.items_ped.filter((item: any) => item !== itemToRemove);

                    itemToRemove.nitem = nItemrm;
                    itemToRemove.codigo = _itemb.matprima
                    itemToRemove.desc = _itemb.desc;
                    itemToRemove.quant = _itemb.quantidade;
                    itemToRemove.um = _itemb.um;
                    itemToRemove.prunit = _itemb.preco;
                    itemToRemove.ptotal = (_itemb.quantidade * _itemb.preco).toFixed(4);
                    itemToRemove.tes = _itemb.tes;
                    itemToRemove.amz = _itemb.amz;
                    itemToRemove.tab = this.codtab;
                    itemToRemove.dtentreg = formatDate(this.date_now, 'yyyy-MM-dd', 'en-US');
                    itemToRemove.tipo = "A";
                    itemToRemove.notaorig = _itemb.nota;
                    itemToRemove.serirorig = _itemb.serie;
                    itemToRemove.itemorig = _itemb.item;
                    itemToRemove.ident = _itemb.ident;
                    itemToRemove.produto = nitem;

                    this.items_ped.push(itemToRemove);
                    this.items_ped = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);
                    this.items_ped_view.push(itemToRemove);
                    this.items_ped_view = this.items_ped.sort((a: { nitem: number; }, b: { nitem: number; }) => a.nitem - b.nitem);

                  }
                })
              }
            }


          });

        },
          (error: HttpErrorResponse) => {

            const erro = error.error

            this.poNotification.warning(erro.errorMessage);
          });


        this.poModal.close();

      }else{

        this.items_ped = '';
        this.items_ped_view = ''


      }
    }
  }
  ////////////////////////////////// Salva Pedido /////////////////////////////////////////////
  salvar() {


    if (this.items_ped.length > 0) {

      const _destino = this.PedidoForm?.form.value.destino.split("/");
      const _natureza = this.PedidoForm?.form.value.natureza.split("-");
      const _operacao = this.PedidoForm?.form.value.operacao.split("-");
      const _origem = this.PedidoForm?.form.value.origem.split("/")[1];
      const _grupo = this.PedidoForm?.form.value.origem.split("/")[0];
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
          tipo: _item.tipo,
          nota: _item.notaorig,
          serie: _item.serirorig,
          itemorig: _item.itemorig,
          ident: _item.ident
        }];
      });

      const pedido = {
        cliente: _destino[1],
        loja: _destino[2],
        clienteEntrega: _destino[1],
        lojaEntrega: _destino[2],
        condpag: this.PedidoForm?.form.value.condicao,
        tabela: this.PedidoForm?.form.value.tabela,
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


        this.ProtheusService.postPedido(_origem, JSON.stringify(pedido)).subscribe((data) => {

          if (data.retorno) {

            this.poNotification.success('Pedido: ' + data.numero + '. Cadastrado com Sucesso!');
            setTimeout(() => {
              this.items_ped = [];
              this.items_ped_view = [];
              this.PedidoForm?.form.reset();
              this.buttonPRG = false;

            }, 2000);
          } else {

            this.poNotification.warning('Tente novamente e caso não conseguir salvar o pedido, entre e, contato com a T.I.!');
            this.buttonPRG = false;
            this.buttonPR = false
          }

        },
          (error: HttpErrorResponse) => {

            const erro = error.error

            this.buttonPRG = false;

            this.poNotification.warning(erro.errorMessage);
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

          const erro = error.error

          this.buttonPRG = false;
          this.buttonPR = false;

          this.poNotification.warning(erro.errorMessage);
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

            let erro = error.error

            this.buttonPRG = false;

            this.poNotification.warning(erro.errorMessage);
          });


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

            const erro = error.error

            this.buttonPRG = false;

            this.poNotification.warning(erro.errorMessage);
          });
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

