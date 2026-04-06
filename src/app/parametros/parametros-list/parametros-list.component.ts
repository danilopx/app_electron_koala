import { Component, OnInit, ViewChild } from '@angular/core';
import { PoModalComponent, PoNotificationService, PoTableColumn } from '@po-ui/ng-components';
import { ParametrosService, Parametro } from '../../service/parametros.service';
import { ConfiguracaoSistemaService } from '../../service/configuracao-sistema.service';

@Component({
  selector: 'app-parametros-list',
  templateUrl: './parametros-list.component.html',
  styleUrls: ['./parametros-list.component.scss']
})
export class ParametrosListComponent implements OnInit {
  @ViewChild('parametroModal') parametroModal!: PoModalComponent;

  parametros: Parametro[] = [];
  filteredParametros: Parametro[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 15;
  filterParametro = '';
  filterDescricao = '';
  filterStatus = 'ativos';
  private originalSensitiveValue = '';

  columns: PoTableColumn[] = [
    { property: 'parametro', label: 'Parâmetro', width: '18%' },
    { property: 'valor', label: 'Valor', width: '18%' },
    { property: 'descricao', label: 'Descrição', width: '24%' },
    {
      property: 'deleted',
      label: 'Status',
      width: '10%',
      type: 'label',
      labels: [
        { value: '', label: 'Ativo', color: 'green' },
        { value: '*', label: 'Deletado', color: 'gray' },
      ],
    },
    { property: 'created_at', label: 'Criado', width: '12%' },
    { property: 'updated_at', label: 'Atualizado', width: '12%' },
    { property: 'acoes', label: 'Ações', width: '6%' }
  ];
  customLiterals = {
    loadingData: 'Carregando parametros',
  };

  editingParametro: Parametro | null = null;
  formParametro: Partial<Parametro> = {
    parametro: '',
    valor: '',
    descricao: '',
    deleted: ''
  };

  constructor(
    private parametrosService: ParametrosService,
    private poNotification: PoNotificationService,
    private configuracaoSistemaService: ConfiguracaoSistemaService,
  ) { }

  ngOnInit(): void {
    this.loadParametros();
  }

  async loadParametros(): Promise<void> {
    this.loading = true;
    try {
      this.parametros = await this.parametrosService.getAll();
      this.applyFilters();
    } catch (error) {
      this.poNotification.error('Erro ao carregar parâmetros');
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  openNewModal(): void {
    this.editingParametro = null;
    this.originalSensitiveValue = '';
    this.formParametro = {
      parametro: '',
      valor: '',
      descricao: '',
      deleted: ''
    };
    this.parametroModal.open();
  }

  editParametro(parametro: Parametro): void {
    this.editingParametro = parametro;
    this.originalSensitiveValue = parametro.parametro.trim().toUpperCase() === 'PR_SENHA' ? parametro.valor : '';
    this.formParametro = {
      ...parametro,
      valor: this.isSensitiveParametro(parametro.parametro) ? '' : parametro.valor,
    };
    this.parametroModal.open();
  }

  async toggleParametroStatus(parametro: Parametro): Promise<void> {
    const isDeleted = parametro.deleted === '*';
    const confirmMessage = isDeleted
      ? 'Tem certeza que deseja reativar este parâmetro?'
      : 'Tem certeza que deseja desativar este parâmetro?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await this.parametrosService.update(parametro.id, {
        deleted: isDeleted ? '' : '*',
      });

      this.poNotification.success(
        isDeleted ? 'Parâmetro reativado com sucesso' : 'Parâmetro desativado com sucesso'
      );

      if (this.editingParametro?.id === parametro.id) {
        this.formParametro.deleted = isDeleted ? '' : '*';
        this.editingParametro = {
          ...parametro,
          deleted: isDeleted ? '' : '*',
        };
      }

      await this.loadParametros();
    } catch (error) {
      this.poNotification.error('Erro ao alterar status do parâmetro');
      console.error(error);
    }
  }

  async saveParametro(): Promise<void> {
    try {
      const parametro = this.formParametro.parametro?.trim() || '';
      const typedValor = this.formParametro.valor?.trim() || '';
      const valor = this.isSensitiveParametro(parametro) && !typedValor ? this.originalSensitiveValue : typedValor;
      const descricao = this.formParametro.descricao?.trim() || '';

      if (!parametro) {
        this.poNotification.warning('Informe o nome do parâmetro.');
        return;
      }

      const existing = await this.parametrosService.getByParametro(parametro);
      if (existing && existing.id !== this.editingParametro?.id) {
        this.poNotification.warning('Já existe um parâmetro com essa chave.');
        return;
      }

      if (this.editingParametro) {
        await this.parametrosService.update(this.editingParametro.id, {
          parametro,
          valor,
          descricao,
        });
        this.configuracaoSistemaService.applySystemParameterValue(parametro, valor);
        this.poNotification.success('Parâmetro atualizado com sucesso');
      } else {
        await this.parametrosService.create({
          parametro,
          valor,
          descricao,
        });
        this.configuracaoSistemaService.applySystemParameterValue(parametro, valor);
        this.poNotification.success('Parâmetro criado com sucesso');
      }

      this.parametroModal.close();
      this.originalSensitiveValue = '';
      await this.loadParametros();
    } catch (error) {
      this.poNotification.error('Erro ao salvar parâmetro');
      console.error(error);
    }
  }

  closeModal(): void {
    this.originalSensitiveValue = '';
    this.parametroModal.close();
  }

  applyFilters(): void {
    const parametroFilter = this.filterParametro.trim().toLowerCase();
    const descricaoFilter = this.filterDescricao.trim().toLowerCase();

    this.filteredParametros = this.parametros.filter((item) => {
      const matchesParametro = !parametroFilter || item.parametro.toLowerCase().includes(parametroFilter);
      const matchesDescricao = !descricaoFilter || item.descricao.toLowerCase().includes(descricaoFilter);
      const matchesStatus = this.filterStatus === 'todos'
        || (this.filterStatus === 'ativos' && item.deleted !== '*')
        || (this.filterStatus === 'deletados' && item.deleted === '*');

      return matchesParametro && matchesDescricao && matchesStatus;
    });

    this.currentPage = 1;
  }

  clearFilters(): void {
    this.filterParametro = '';
    this.filterDescricao = '';
    this.filterStatus = 'ativos';
    this.applyFilters();
  }

  getStatusLabel(parametro: Parametro): string {
    return parametro.deleted === '*' ? 'Deletado' : 'Ativo';
  }

  isBooleanParametroValue(value: string | undefined): boolean {
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'true' || normalized === 'false';
  }

  setBooleanParametroValue(value: boolean): void {
    this.formParametro.valor = value ? 'true' : 'false';
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('pt-BR');
  }

  isSensitiveParametro(parametro?: string): boolean {
    return String(parametro || '').trim().toUpperCase() === 'PR_SENHA';
  }

  displayParametroValor(parametro: Parametro): string {
    if (this.isSensitiveParametro(parametro.parametro)) {
      return '********';
    }

    return parametro.valor;
  }
}
