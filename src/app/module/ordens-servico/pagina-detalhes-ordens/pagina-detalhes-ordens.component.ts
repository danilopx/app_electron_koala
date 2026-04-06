import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import {
  PoComboOption,
  PoDynamicFormComponent,
  PoDynamicFormField,
  PoModalComponent,
  PoNotificationService,
  PoTableAction,
  PoTableColumn,
  PoTableColumnSpacing,
  PoTableComponent,

} from '@po-ui/ng-components';
import { OrdensService } from '../../../service/ordens.service';
import { OrdemServicoComentarios, OrdemServicoImagens, OrdemServicoIn, ImagemOs } from '../../../interfaces/ordem-servico.interface';
import { UtilsService } from '../../../service/utils.service';
import { ProdutoService } from '../../../service/produto.service';
import { Produto, ProdutosPadraoAPITotvs } from '../../../interfaces/produto.interface';
import { InsumoOrdemView } from '../../../interfaces/insumo-servico.interface';
import { DatePipe } from '@angular/common';
import { ExecutorService } from '../../../module/distribuicao/services/executor.service';
import { interval, startWith, Subject, Subscription, takeUntil, throwError } from 'rxjs';
import { Executor } from 'src/app/interfaces/executor.interface';
import { Filial } from 'src/app/components/header/enums/filiais';

@Component({
  selector: 'app-pagina-detalhes-ordens',
  templateUrl: './pagina-detalhes-ordens.component.html',
  styleUrls: ['./pagina-detalhes-ordens.component.css'],
})
export class PaginaDetalhesOrdensComponent implements OnInit, OnDestroy, OnChanges {
  @Input() ordemServicoData: Partial<OrdemServicoIn> | null = null;
 
  @ViewChild('tabelaInsumosOs', { static: false }) tabelaInsumosOs!: PoTableComponent;
  //@ViewChild('tabelaAdicionarInsumos', { static: false }) tabelaAdicionarInsumos!: PoTableComponent;
  @ViewChild('modalDetalhes', { static: true }) modalDetalhes!: PoModalComponent;
  @ViewChild('modalTipo', { static: true }) modalTipo!: PoModalComponent;
  @ViewChild('poModalAdicionarExec', { static: false }) poModalAdicionarExec!: PoModalComponent;
  @ViewChild('poModalAdicionarInsumos', { static: false }) poModalAdicionarInsumos!: PoModalComponent;

   private destroy$ = new Subject<void>();

  constructor(
    private ordensService: OrdensService,
    private produtoService: ProdutoService,
    private cdRef: ChangeDetectorRef,
    private utilsService: UtilsService,
    private poNotification: PoNotificationService,
    public datePipe: DatePipe,
    private executorService: ExecutorService,
  ) { }


  produtos!: Produto[];
  listaDeExecutores: Executor[] = [];
  items: Array<unknown> | undefined;
  ordemServicoAtual!: OrdemServicoIn;
  comentarios!: OrdemServicoComentarios;
  imagens: ImagemOs[] = []; // Corrigido para ser um array de ImagemOs
  fieldsFormDistribuicao: PoDynamicFormField[] = [];
  insumoQueVaiSerIncluido!: Produto;
  valoresCamposDynamicView = {};
  comentarioOs = '';

  prioridadeOS = '';
  executor_codigo = '';
  executor_nome = '';
  ordem_tipo = '';
  loadingStart = false;
  desabilitarBotaoIncluirInsumo = false;
  incluindoInsumo = false;

  produtosCarregados = false;
  carregandoProdutos = false;
  insumoSelecionado = false;
  quantidadeProdutoSelecionado = 0;

  quantidadeMaiorQueZero = false;
  problema = '';
  causa = '';
  solucao = '';
  maxlength = 250;
  minlength = 5
  tipo = ""

  buttonDisabled = false;

  executoresCarregados!: boolean;
  _usuario = sessionStorage.getItem('username') ?? '';

  insumosDaOs: InsumoOrdemView[] = [];
  executoresDaOs: InsumoOrdemView[] = [];
  loadingInclusaoInsumo = false;
  colunasInsumosDaOs: PoTableColumn[] = [
    { property: 'insumo_codigo', label: 'Código do Insumo' },
    { property: 'executor_nome', label: 'Descrição' },
    { property: 'insumo_unidade', label: 'Unidade' },
    { property: 'insumo_quantidade', label: 'Quantidade' },
  ];

  colunasExecutoresDaOs: PoTableColumn[] = [
    { property: 'insumo_codigo', label: 'Código' },
    { property: 'executor_nome', label: 'Executor' },


  ];

  tipoOptions: Array<{ label: string, value: string }> = [
    { label: '', value: '' },
    { label: 'Corretiva Elétrica', value: 'CORELE' },
    { label: 'Corretiva Mecanica', value: 'CORMEC' }
  ];

  countExecutor = 0

  private executorSubscription!: Subscription;
  protected readonly PoTableColumnSpacing = PoTableColumnSpacing;

  ngOnInit() {
    this.carregarOrdemServicoAtual();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ordemServicoData'] && changes['ordemServicoData'].currentValue) {
      this.carregarOrdemServicoAtual(changes['ordemServicoData'].currentValue);
    }
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarOrdemServicoAtual(ordemEntrada?: Partial<OrdemServicoIn> | null) {
    const ordemDoInput = ordemEntrada ?? this.ordemServicoData;
    const ordemDoStorage = localStorage.getItem('ordemServicoAtual');

    if (this.temIdentificadorValido(ordemDoInput)) {
      this.ordemServicoAtual = ordemDoInput as OrdemServicoIn;
      localStorage.setItem('ordemServicoAtual', JSON.stringify(this.ordemServicoAtual));
    } else if (ordemDoStorage) {
      const ordemStorageParseada = JSON.parse(ordemDoStorage) as Partial<OrdemServicoIn>;
      if (!this.temIdentificadorValido(ordemStorageParseada)) return;
      this.ordemServicoAtual = ordemStorageParseada as OrdemServicoIn;
    } else {
      return;
    }

    this.definirValoresCamposDynamicView();
    this.listarInsumosDaOS();
    this.verificarComentariosDaOs();
    this.imagenOs();

    this.prioridadeOS = this.ordensService.verificarPrioridade(this.ordemServicoAtual.solicitacao_prioridade);
    const primeiroExecutor = this.ordemServicoAtual.ordem_insumos?.[0]?.detalhes_insumo;
    this.executor_codigo = primeiroExecutor?.insumo_codigo ?? this.ordemServicoAtual.executor_matricula ?? '';
    this.executor_nome = primeiroExecutor?.executor_nome ?? this.ordemServicoAtual.executor_nome ?? '';
    this.ordem_tipo = this.ordemServicoAtual.ordem_cod_servico ?? '';
  }

  private temIdentificadorValido(ordem: Partial<OrdemServicoIn> | null | undefined): boolean {
    if (!ordem) return false;
    const ordemId = `${ordem.ordem_id ?? ''}`.trim();
    const solicitacaoId = `${ordem.solicitacao_id ?? ordem.ordem_codsolicitacao ?? ''}`.trim();
    return ordemId.length > 0 || solicitacaoId.length > 0;
  }


  imagenOs() {
    if (!this.ordemServicoAtual) return;



    this.ordensService.listarImagensOs(this.ordemServicoAtual.ordem_id ?? '', this.ordemServicoAtual.solicitacao_grupo ?? '', this.ordemServicoAtual.ordem_filial ?? '')
      .subscribe({
        next: (resposta: OrdemServicoImagens) => {
          console.log('Imagens da O.S. atualizadas:', resposta.imagem);

          // Atribua o array de ImagemOs à variável 'imagens'
          this.imagens = resposta.imagem; // Isso deve ser um array de ImagemOs
        },
        error: (erro: any) => {
          console.error('Erro ao buscar imagens da O.S.:', erro);
        },
      });
  }

  definirValoresCamposDynamicView() {
    const dataAberturaFormatada = this.utilsService.formatarDataHoraAtual();

    console.log('Pré Definições: \n', 'Data de Abertura Formatada: ', dataAberturaFormatada, '\n');
    console.log('Ordem de Serviço Atual: ', this.ordemServicoAtual, '\n');
    console.log('Executores da O.S. Atual: ', this.ordemServicoAtual.ordem_insumos?.[0], '\n');

    this.valoresCamposDynamicView = {
      equipamento_nome: `${this.ordemServicoAtual.equipamento_nome}`,
      equipamento_setor: `${this.ordemServicoAtual.ordem_codsetor}`,
      servico_codigo: `${this.ordemServicoAtual.ordem_cod_servico}`,
    };
  }



  listarInsumosDaOS() {
    console.log('Listando Insumos da O.S...');
    this.ordensService.listarInsumosDaOS(this.ordemServicoAtual).pipe(takeUntil(this.destroy$)).subscribe({
      next: (insumos) => {
        console.log('Dados recebidos:', insumos);

        // Verifique os valores de insumo_unidade com trim()
        insumos.forEach(insumo => console.log('insumo_unidade:', insumo.insumo_unidade?.trim()));

        // Aplicando os filtros com trim()
        this.insumosDaOs = insumos.filter(insumo => insumo.insumo_unidade?.trim() !== 'H');
        this.executoresDaOs = insumos.filter(insumo => insumo.insumo_unidade?.trim() === 'H');

        this.countExecutor = this.executoresDaOs.length

        console.log('Insumos da O.S. Listados!', this.insumosDaOs);
        console.log('Executores da O.S. Listados!', this.executoresDaOs);
      },
      error: (error) => {
        console.error('Erro ao listar insumos:', error);
      },
      complete: () => {
        console.log('Listagem de insumos concluída: ', this.insumosDaOs);
        this.loadingInclusaoInsumo = false;
        this.poModalAdicionarInsumos.close();
      },
    });
  }



  abrirModalAdicionarInsumo() {
    this.insumoSelecionado = false;
    this.quantidadeProdutoSelecionado = 0;

    console.log('Abrindo Modal de Adicionar Insumos...');
    this.poModalAdicionarInsumos.open();

    this.listarProdutos('MM,MC');
  }

  abrirModalAdicionarExecutor() {


    this.fieldsFormDistribuicao = [
      {
        property: 'executoresSelecionados',
        label: 'Executores',
        gridColumns: 12,
        order: 1,
        required: true,
        hideSelectAll: true,
        optionsMulti: false,
        columns: 1,
        options: [], // Inicialmente vazio

        // Função Comentada pois não funciona qndo PO Checkbox Group é gerada.
        // validate: this.validarExecutoresSelecionados.bind(this),
        //disabled: this.fazendoDistribuicao || solicitacao_step !== '1',
      },
    ];

    // Carregar executores e atualizar o formulário quando os dados estiverem disponíveis
    this.executorSubscription = this.executorService.executores$.subscribe((executores) => {
      this.listaDeExecutores = executores;
      this.executoresCarregados = true;

      // Atualize o campo do formulário com as novas opções
      this.fieldsFormDistribuicao = this.fieldsFormDistribuicao.map((field) => {
        if (field.property === 'executoresSelecionados') {
          const updatedField = {
            ...field,
            options: this.listaDeExecutores.map((executor) => ({
              label: executor.executor_nome,

              // Para distribuir, usa o código da matrícula do executor.
              value: executor.executor_matricula,
            })),
          };

          console.log('Campo atualizado (executoresSelecionados):', updatedField);

          return updatedField;
        }
        return field;
      });

      console.log('Formulário atualizado com executores:', this.fieldsFormDistribuicao);

      //  setTimeout(() => {
      //     this.changeDetector.detectChanges();
      //   });
    });


    this.executorService.carregarExecutores('');


    console.log('Abrindo Modal de Adicionar Insumos...');
    this.poModalAdicionarExec.open();


  }

  novoExecutor(rowSolicitacao: unknown, formDistribuicao: PoDynamicFormComponent) {

    const matricula_do_executor = formDistribuicao.form.value['executoresSelecionados'];
    const insumoParaIncluir = {
      insumo_codigo: matricula_do_executor,
      insumo_quantidade: '1',
      insumo_tipo: 'M',
      insumo_unidade: 'H',
      insumo_local: '',
    };

    this.ordensService.incluirInsumoNaOS(this.ordemServicoAtual.ordem_filial,this.ordemServicoAtual, insumoParaIncluir).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Insumo incluído com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao incluir insumo:', error);
        this.listarInsumosDaOS();
        this.poModalAdicionarExec.close();
      },
      complete: () => {

        this.listarInsumosDaOS();
        this.poModalAdicionarExec.close();
      },
    });


  }

  colunasAdicionarInsumos: PoTableColumn[] = [
    { property: 'produto_codigo', label: 'Código do Produto' },
    { property: 'produto_descricao', label: 'Descrição' },
    { property: 'produto_unidade', label: 'Unidade' },
    { property: 'produto_local', label: 'Armazem' },
    { property: 'produto_tipo', label: 'Tipo' },
  ];

  listarProdutos(tiposDeProduto: string) {

    this.carregandoProdutos = true;
    const filial = localStorage.getItem('filial') ?? '';

    this.produtoService.listarProdutos(filial, tiposDeProduto, 1, 5000).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: ProdutosPadraoAPITotvs) => {
        this.produtos = response.produtos || [];

        this.produtosCarregados = true;
      },
      error: (error) => {
        console.error('Erro ao listar produtos:', error);
        this.produtosCarregados = false;
      },
      complete: () => {
        console.log('Listagem de produtos completada.');
        this.carregandoProdutos = false;
        this.cdRef.detectChanges(); // Força a detecção de mudanças
      },
    });
  }

  validarBotaoAdicionarInsumos() {
    return this.insumoSelecionado && this.quantidadeMaiorQueZero;
  }

  aoSelecionarInsumo(insumoSelecionado: Produto) {
    console.log('Insumo Selecionado:', insumoSelecionado);
    this.insumoSelecionado = true;
    this.insumoQueVaiSerIncluido = insumoSelecionado;
  }

  aoInserirQuantidade() {
    if (this.quantidadeProdutoSelecionado > 0) {
      console.log('Quantidade maior que zero');
      this.quantidadeMaiorQueZero = true;
    } else {
      console.log('Quantidade menor ou igual a zero');
      this.quantidadeMaiorQueZero = false;
    }
  }

  incluirInsumoNaOS() {

    console.log('Incluindo o Insumo', this.insumoQueVaiSerIncluido, 'na O.S.');

    const insumoParaIncluir = {
      insumo_codigo: this.insumoQueVaiSerIncluido.produto_codigo,
      insumo_quantidade: this.quantidadeProdutoSelecionado.toString(),
      insumo_tipo: 'P',
      insumo_unidade: this.insumoQueVaiSerIncluido.produto_unidade,
      insumo_local: this.insumoQueVaiSerIncluido.produto_local,
    };

    this.desabilitarBotaoIncluirInsumo = true;
    this.incluindoInsumo = true;
    this.loadingInclusaoInsumo = true;

    this.ordensService.incluirInsumoNaOS(this.ordemServicoAtual.ordem_filial,this.ordemServicoAtual, insumoParaIncluir).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Insumo incluído com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao incluir insumo:', error);
        this.desabilitarBotaoIncluirInsumo = false;
        this.incluindoInsumo = false;
        this.listarInsumosDaOS();
      },
      complete: () => {
        console.log('chamada de requisição');
        this.incluirRequisicaoAlmox();

        console.log('Requisição de inclusão de insumo concluída');
        this.desabilitarBotaoIncluirInsumo = false;
        this.incluindoInsumo = false;
        this.listarInsumosDaOS();
      },
    });
  }

  formatarDataBrasileira(data: Date | string | null): string {
    if (!data) return ''; // Retorna uma string vazia se não houver data

    let dateObj: Date;
    if (typeof data === 'string' && /^\d{8}$/.test(data)) {
      // Se a data for uma string no formato 'yyyyMMdd'
      const year = parseInt(data.substring(0, 4), 10);
      const month = parseInt(data.substring(4, 6), 10) - 1; // Mês em JavaScript é 0-11
      const day = parseInt(data.substring(6, 8), 10);
      dateObj = new Date(year, month, day);
    } else if (data instanceof Date) {
      dateObj = data;
    } else {
      return ''; // Formato inválido
    }

    return this.datePipe.transform(dateObj, 'dd/MM/yyyy') || ''; // Usa transform e lida com possíveis valores nulos
  }

  incluirRequisicaoAlmox() {
    const requisicaoAlmox = {
      CP_SOLICIT: sessionStorage.getItem('user') || undefined,
      CP_PRODUTO: this.insumoQueVaiSerIncluido.produto_codigo.trim(),
      CP_UM: this.insumoQueVaiSerIncluido.produto_unidade,
      CP_QUANT: this.quantidadeProdutoSelecionado.toString(),
      CP_DATPRF: '',
      CP_LOCAL: this.insumoQueVaiSerIncluido.produto_local,
      CP_OBS: "",
      CP_OP: this.ordemServicoAtual.ordem_id,
      CP_CODSOLI: sessionStorage.getItem('userId') || undefined
    };

    this.ordensService.adicionarRequisicaoAlmox(this.ordemServicoAtual.ordem_filial, this.ordemServicoAtual.ordem_id, requisicaoAlmox).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Requisição incluído com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao incluir Requisição:', error);
      },
      complete: () => {
        console.log('Requisição Almox de inclusão de Requisição concluída');
      },
    });
  }


  adicionarComentario() {
    if (!this.comentarioOs || !this.ordemServicoAtual) return;

    this.ordensService
      .adicionarComentarioNaOs(this.ordemServicoAtual.ordem_id, this.ordemServicoAtual.ordem_filial, this.comentarioOs, this._usuario)
      .subscribe({
        next: (resposta) => {
          console.log('Comentário adicionado com sucesso. Resposta da API:', resposta);

          if (!this.comentarios) {
            this.comentarios = { comentarios: [] };
          }

          this.verificarComentariosDaOs();
          this.comentarioOs = '';
        },
        error: (error) => console.error('Erro ao adicionar comentário:', error),
      });
  }

  verificarComentariosDaOs() {
    console.log('Verificando se O.S. tem novos comentários...');

    if (!this.ordemServicoAtual) return;

    this.ordensService
      .listarComentariosDaOs(this.ordemServicoAtual.ordem_id ?? '', this.ordemServicoAtual.ordem_filial ?? '')
      .subscribe({
        next: (resposta: OrdemServicoComentarios) => {
          console.log('Comentários da O.S. atualizados:', resposta.comentarios);

          this.comentarios = resposta;
        },
        error: (erro: any) => {
          console.error('Erro ao buscar comentários da O.S.:', erro);
        },
      });
  }

  eventIniciarAtendimento(filial: string, ordem: string) {
    this.loadingStart = true;

    this.ordensService.iniciarOrdemServico(filial, ordem).pipe(takeUntil(this.destroy$)).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.loadingStart = false;
      },
      error: (error) => {
        this.loadingStart = false;
        this.poNotification.error('Houve problemas ao Finalizar Ordem de Serviço!');
      },
      complete: () => {
        this.atualizardemServicoStart();
        this.poNotification.success('Ordem de Serviço Iniciada!');
      }
    });
  }

  eventFinalizarAtendimento(problema: string) {

    this.problema = problema;
    this.modalDetalhes.open();
  }
  // Método de ação para o botão "Salvar"
  salvarDetalhes(filial: string, ordem: string) {

    this.loadingStart = true;

    if (this.problema && this.causa && this.solucao) {
      // Implementar a lógica de salvamento dos detalhes
      console.log('Problema:', this.problema);
      console.log('Causa:', this.causa);
      console.log('Solução:', this.solucao);

      this.ordensService.finalizarOrdemServico(filial, ordem, this.problema, this.causa, this.solucao).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.loadingStart = false;
        },
        error: (error) => {
          this.loadingStart = false;
          this.poNotification.error('Houve problemas ao Iniciar Ordem de Serviço!');
        },
        complete: () => {
          this.loadingStart = false;
          this.atualizardemServicoEnd(this.problema, this.causa, this.solucao);
          this.poNotification.success('Ordem de Serviço Finalizada!');
        }
      });
      this.modalDetalhes.close();
    } else {
      // Implementar a lógica para exibir uma mensagem de erro
      console.error('Todos os campos são obrigatórios.');
    }
  }

  // Método de ação para o botão "Cancelar"
  cancelarDetalhes() {
    this.loadingStart = false;
    this.modalDetalhes.close();
  }

  eventAlterarTipo() {


    this.modalTipo.open();
  }

  salvarTipo(filial: string, ordem: string) {


    const tipoSelecionada = this.tipo;


    this.loadingStart = true;

    if (tipoSelecionada) {


      this.ordensService.tipoOrdemServico(filial, ordem, tipoSelecionada).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.loadingStart = false;
        },
        error: (error) => {
          this.loadingStart = false;
          this.poNotification.error('Houve problemas ao alterar tipo de  Ordem de Serviço!');
        },
        complete: () => {


          this.loadingStart = false;
          const ordemServicoStr = localStorage.getItem('ordemServicoAtual') ?? '';
          const ordemServico = JSON.parse(ordemServicoStr);

          ordemServico.ordem_cod_servico = tipoSelecionada;

          const ordemServicoAtualizadoStr = JSON.stringify(ordemServico);
          localStorage.setItem('ordemServicoAtual', ordemServicoAtualizadoStr);

          this.ordemServicoAtual = ordemServico;
          this.cdRef.detectChanges(); // Força a detecção de mudanças
          
          this.poNotification.success('Ordem de Serviço alterada com sucesso!');
        }
      });
      this.modalTipo.close();
    } else {
      // Implementar a lógica para exibir uma mensagem de erro
      this.poNotification.warning('Selecione uma opção!');
    }
  }

  // Método de ação para o botão "Cancelar"
  cancelarTipo() {
    this.loadingStart = false;
    this.modalTipo.close();
  }

  atualizardemServicoStart(): void {
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const horaFormatada = `${horas}:${minutos}`;
    const formattedDate: string = this.datePipe.transform(now, 'dd/MM/yyyy') || '';

    //alert(formattedDate)

    const ordemServicoStr = localStorage.getItem('ordemServicoAtual') ?? '';
    const ordemServico = JSON.parse(ordemServicoStr);

    ordemServico.ordem_data_real_inicio_manutencao = formattedDate;

    //alert(ordemServico.ordem_data_real_inicio_manutencao)
    ordemServico.ordem_hora_real_inicio_manutencao = horaFormatada;
    ordemServico.solicitacao_step = '3';

    const ordemServicoAtualizadoStr = JSON.stringify(ordemServico);
    localStorage.setItem('ordemServicoAtual', ordemServicoAtualizadoStr);

    this.ordemServicoAtual = ordemServico;
    this.cdRef.detectChanges(); // Força a detecção de mudanças
  }


  atualizardemServicoEnd(problema: string, causa: string, solucao: string): void {
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const horaFormatada = `${horas}:${minutos}`;
    const formattedDate: string = this.datePipe.transform(now, 'dd/MM/yyyy') || '';


    const ordemServicoStr = localStorage.getItem('ordemServicoAtual') ?? '';
    const ordemServico = JSON.parse(ordemServicoStr);

    ordemServico.ordem_data_real_fim_manutencao = formattedDate;
    ordemServico.ordem_hora_real_fim_manutencao = horaFormatada;
    ordemServico.solicitacao_step = '4';


    ordemServico.ordem_problema = problema
    ordemServico.ordem_causa = causa
    ordemServico.ordem_solucao = solucao

    const ordemServicoAtualizadoStr = JSON.stringify(ordemServico);
    localStorage.setItem('ordemServicoAtual', ordemServicoAtualizadoStr);

    this.ordemServicoAtual = ordemServico;
    this.cdRef.detectChanges(); // Força a detecção de mudanças
  }

  listaDeStatus: Array<PoComboOption> = [
    { value: '1', label: 'Aguardando Distribuição' },
    { value: '2', label: 'Aguardando Inicio do Atendimento' },
    { value: '3', label: 'Aguardando Finalização do Atendimento' },
    { value: '4', label: 'Aguardando Validação Manutenção' },
    { value: '5', label: 'Aguardando Validação do Setor' },
    { value: '6', label: 'Aguardando o Retorno da OS no Protthues' },
    { value: '7', label: 'Ordem de Serviço Finalizado' },
  ];


  getStatusDescription(statusNumber: number): string {
    const status = this.listaDeStatus.find(item => item.value === statusNumber.toString());
    return status?.label ?? '';
  }
  getStatusDescriptionFromString(statusString: string): string {
    const statusNumber = parseInt(statusString, 10);
    return this.getStatusDescription(statusNumber);
  }

  actions: Array<PoTableAction> = [

    { action: this.remove.bind(this), icon: 'po-icon po-icon-delete', label: '' }
  ];

  remove(item: { [key: string]: any }) {

    const insumo_codigo = item['insumo_codigo'];
    const ordem_filial = this.ordemServicoAtual.ordem_filial;
    const ordem_num = this.ordemServicoAtual.ordem_id;


    this.ordensService.excluirExecutor(ordem_filial, ordem_num, insumo_codigo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Insumo incluído com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao incluir insumo:', error);
        this.listarInsumosDaOS();
        this.poModalAdicionarExec.close();
      },
      complete: () => {

        this.listarInsumosDaOS();
        this.poModalAdicionarExec.close();
      },
    });


  }



  formatarHora(hora: string): string {
    // Formata a string no formato HHMMSS para HH:mm:ss
    return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:${hora.substring(4, 6)}`;
  }

}
