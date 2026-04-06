import {  Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject,  takeUntil } from 'rxjs';
import {
  PoModalComponent,
  PoTableComponent,
  PoTableLiterals,
  PoTableColumn,
  PoInfoOrientation,
  PoTableAction,
  PoNotificationService,
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { ChecklistService } from '../../../../service/checklist.service';
import { DatePipe } from '@angular/common';
import { IUnidade } from '../../../../interfaces/interface-checklist';

@Component({
  selector: 'app-edi',
  templateUrl: './unidadeListar.component.html',
  styleUrls: ['./unidadeListar.component.scss'],
  providers: [ChecklistService],
})
export class UnidadeListarComponent implements OnInit, OnDestroy {
  @ViewChild(PoTableComponent, { static: true }) poTable!: PoTableComponent;
  @ViewChild('modalExcluir', { static: false }) modalExcluir!: PoModalComponent;
  @ViewChild('modalAlterStatus', { static: false }) modalAlterStatus!: PoModalComponent;

  constructor(
    private router: Router,
    public ChecklistService: ChecklistService,
    private poNotification: PoNotificationService,
  ) {}

  private destroy$ = new Subject<void>();

  unidade: IUnidade[] = [];

  columns!: Array<PoTableColumn>;
  loagingPage = true;
  orientation = PoInfoOrientation.Horizontal;
  codigoConfirmacao = '';
  codigoDigitado = '';
  codigoInvalido = false;
  idUniddade = '';
  statusUniddade = '';

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
      { property: 'id', label: 'Código' },
      { property: 'empresa', label: 'Empresa' },
      { property: 'descricao', label: 'Descrição' },
      { property: 'identificacao', label: 'Identificação' },
      {
        property: 'status',
        type: 'label',
        labels: [
          { value: 'Ativo', color: 'green', label: 'Ativo' },
          { value: 'Desativado', color: 'red', label: 'Desativado' },
          { value: '', color: 'red', label: 'Desativado' },
        ],
      },
    ];
  }

  actions: Array<PoTableAction> = [
    {
      action: this.alter.bind(this),
      icon: 'an an-edit',
      label: 'Alterar',
    },
    { action: this.abrirModalAlterStatus.bind(this), icon: 'an an-info', label: 'Ativar/Inativar' },
    { action: this.abrirModalRemove.bind(this), icon: 'po-icon an an-trash', label: 'Excluir' },
  ];

  ngOnInit(): void {
    this.listUnidade();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  novoCkecklist() {
    this.router.navigateByUrl('/checklist/unidade/cadastrar');
  }

  listUnidade(id?: string) {
    this.columns = this.getColumns();
    this.loagingPage = true;

    this.ChecklistService.getUnidade(id || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: IUnidade[]) => {
          this.unidade = data;

          console.log('Unidade:', this.unidade);
        },
        error: (err) => {
          console.error('Erro ao buscar pedidos:', err);
          this.loagingPage = false;
        },
        complete: () => {
          this.loagingPage = false;
        },
      });
  }

  abrirModalRemove(item: { [key: string]: any }) {
    this.codigoConfirmacao = Math.floor(10000 + Math.random() * 90000).toString();
    this.codigoDigitado = '';
    this.codigoInvalido = false;
    this.idUniddade = item['id'];

    this.modalExcluir.open();
  }

   abrirModalAlterStatus(item: { [key: string]: any }) {
    this.codigoConfirmacao = Math.floor(10000 + Math.random() * 90000).toString();
    this.codigoDigitado = '';
    this.codigoInvalido = false;
    this.idUniddade = item['id'];
    this.statusUniddade = item['status'] || 'Desativado';
    this.modalAlterStatus.open();
  }

  alter(item: { [key: string]: any }) {
    this.router.navigateByUrl(`/checklist/unidade/editar/${item['id']}`);
  }
  remove() {
    if (this.codigoDigitado === this.codigoConfirmacao) {
      this.ChecklistService.deleteUnidade(this.idUniddade)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.modalExcluir.close();
            this.poNotification.success(res.message || 'Unidade excluída com sucesso!');
            this.listUnidade(); // opcional, se quiser atualizar a lista
          },
          error: () => {
              this.modalExcluir.close();
              this.poNotification.error('Problema ao exluir Unidade!');
          },
        });

      
    } else {
      this.codigoInvalido = true;
    }
  }

  alterStatus() {


    if (this.codigoDigitado === this.codigoConfirmacao) {
      this.ChecklistService.alterStatusUnidade(this.idUniddade)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
             this.modalAlterStatus.close();
            this.poNotification.success(res.message || 'Status da Unidade alterado com sucesso!');
            this.listUnidade(); // opcional, se quiser atualizar a lista
          },
          error: () => {
            this.modalAlterStatus.close();
            this.poNotification.error('Problema ao alterar Status da Unidade!');
          },
        });

     
    } else {
      this.codigoInvalido = true;
    }
  }

 
}
