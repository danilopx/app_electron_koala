import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { interval, startWith, Subscription, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SolicitacaoServico } from '../../../interfaces/solicitacao-servico.interface';

// Importar Componentes do PO UI.
import {
  PoComboOption,
  PoDynamicFormComponent,
  PoDynamicFormField,
  PoModalComponent,
  PoNotificationService,
  PoStepperComponent,
  PoStepperItem,
  PoTableColumn,
} from '@po-ui/ng-components';

import { Executor } from '../../../interfaces/executor.interface';

import { environment } from 'src/environments/environment';
import { DatePipe } from '@angular/common';
import { ManutencaoFacadeService } from '../../manutencao/services/manutencao-facade.service';

@Component({
  selector: 'app-pagina-distribuicao',
  templateUrl: './pagina-distribuicao.component.html',
  styleUrls: ['./pagina-distribuicao.component.css'],
})
export class PaginaDistribuicaoComponent implements OnInit, OnDestroy {
  @ViewChild('stepperDistribuicaoSs') stepperDistribuicaoSs!: PoStepperComponent;
  @ViewChild('poModal', { static: true }) poModal!: PoModalComponent;
  @ViewChild('modalAprovacao', { static: true }) modalAprovacao!: PoModalComponent;
  @ViewChild(PoStepperComponent) stepper!: PoStepperComponent;

  constructor(
    private manutencaoFacade: ManutencaoFacadeService,
    private changeDetector: ChangeDetectorRef,
    private datePipe: DatePipe,
    private poNotification: PoNotificationService,
  ) {}

  // Ref. https://medium.com/totvsdevelopers/websocket-com-springboot-e-angular-portinari-ui-8169846583da

  // Variáveis de Controle.
  solicitacoes: SolicitacaoServico[] = []; // Criar Array pra poder usar o método `length` no HTML.
  solicitacoesColunas: PoTableColumn[] = []; // Manter o nome igual a documentação e ao que vem nos dados. senao dá erro.
  titleModal = 'Distribuição';
  solicitacaoAlter: Partial<SolicitacaoServico> | null = null;
  distribuido = false;
  steps: Array<PoStepperItem> = [];
  executoresSelecionados: Array<string> = [];
  fieldsFormDistribuicao: PoDynamicFormField[] = [];
  executoresCarregados!: boolean;
  listaDeExecutores: Executor[] = [];
  aprovacao = '';
  loadingStart = false;
  solicitacoesOriginais: Array<SolicitacaoServico> = [];
  filtroStatusSelecionado = '';
  filtroDataDe = '';
  filtroDataAte = '';
  setGrupo = environment.grupo ?? '';
  setFilial = environment.filial ?? '';

  protected gerandoOs = false;
  private solicitacoesSubscription!: Subscription;
  protected solicitacoesCarregadas!: boolean;
  private solicitacaoEstaExpandida!: boolean;
  protected fazendoDistribuicao!: boolean;
  private executorSubscription!: Subscription;

  aprovacaoOptions: Array<{ label: string; value: string }> = [
    { label: '', value: '' },
    { label: 'Aprovado', value: 'A' },
    { label: 'Reprovado', value: 'B' },
  ];

  /** Opções utilizadas no componente de Combo */
  listaDeStatus: Array<PoComboOption> = [
    { value: '1', label: 'Ag. Distribuição' },
    { value: '2', label: 'Ag. Inicio do Atendimento' },
    { value: '3', label: 'Ag. Finalização do Atendimento' },
    { value: '4', label: 'Ag. Validação Manutenção' },
    { value: '5', label: 'Ag. Validação do Setor' },
    { value: '6', label: 'Ag. o Retorno da OS no Protthues' },
    { value: '7', label: 'Ordem de Serviço Finalizado' },
  ];

  statusCards = [
    { step: '1', label: 'Ag. Distribuição', colorClass: 'step-green', count: 0 },
    { step: '2', label: 'Ag. Início', colorClass: 'step-orange', count: 0 },
    { step: '3', label: 'Ag. Finalização', colorClass: 'step-blue', count: 0 },
    { step: '4', label: 'Validação Manutenção', colorClass: 'step-yellow', count: 0 },
    { step: '5', label: 'Validação Setor', colorClass: 'step-pink', count: 0 },
    { step: '6', label: 'Retorno Protheus', colorClass: 'step-purple', count: 0 },
    { step: '7', label: 'Finalizado', colorClass: 'step-red', count: 0 },
  ];
  statusUpdatedAt = '';

  getStatusDescription(statusNumber: string): string {
    const status = this.listaDeStatus.find((item) => item.value === statusNumber.toString());
    return status?.label ?? '';
  }

  setSolicitacoesColunas() {
    // Não usar o valor `type` p/ evitar bugs no PO UI como o erro:
    // ERROR TypeError: Cannot read properties of undefined (reading 'find')

    this.solicitacoesColunas = [
      { property: 'solicitacao_id', label: 'Solicitação' },
      { property: 'ordem_id', label: 'Ordem Serviço' },
      { property: 'setor_nome', label: 'Setor' },
      { property: 'solicitacao_equipamento', label: 'Equipamento' },
      { property: 'solicitacao_tipo', label: 'Tipo' },
      { property: 'solicitacao_prioridade', label: 'Prioridade', type: 'columnTemplate' },
      {
        property: 'solicitacao_step',
        type: 'label',
        label: 'Status',
        labels: [
          { value: '1', color: '#FF6400', label: 'Ag. Distribuição', icon: '' },
          { value: '2', color: '#0000FF', label: 'Ag. Inicio do Atendimento', icon: '' },
          { value: '3', color: '#008000', label: 'Ag. Finalização do Atendimento', icon: '' },
          { value: '4', color: '#d703fc', label: 'Ag. Validação Manutenção', icon: '' },
          { value: '5', color: '#6f7378', label: 'Ag. Validação do Setor', icon: '' },
          { value: '6', color: '#6f7378', label: 'Ag. o Retorno da OS no Protthues', icon: '' },
          { value: '7', color: '#FF0000', label: 'Solicitação Finalizado ', icon: '' },
        ],
      },
    ];
  }

  /**
   * Essa função é usada para mapear um objeto de entrada para a estrutura definida pela interfaces SolicitacaoServico.
   * Ela verifica cada propriedade do objeto de entrada e inclui apenas aquelas que correspondem às definidas na interfaces.
   * Campos adicionais presentes no objeto de entrada que não estão definidos na interfaces serão ignorados.
   *
   * @param objeto_solicitacao Objeto de entrada que pode conter campos adicionais além dos definidos na interfaces.
   * @returns Um objeto que contém apenas as propriedades definidas na interfaces SolicitacaoServico.
   */
  mapearSolicitacaoServico(objeto_solicitacao: object): SolicitacaoServico {
    const modeloSolicitacaoServico: Record<keyof SolicitacaoServico, null> = {
      solicitacao_equipamento: null,
      solicitacao_grupo: null,
      solicitacao_filial: null,
      solicitacao_prioridade: null,
      solicitacao_status: null,
      solicitacao_tipo: null,
      solicitacao_descricao: null,
      solicitacao_databer: null,
      solicitacao_horaber: null,
      solicitacao_executante: null,
      solicitacao_usuario: null,
      solicitacao_setor: null,
      solicitacao_dataini: null,
      solicitacao_horaini: null,
      solicitacao_datafim: null,
      solicitacao_horafim: null,
      solicitacao_prioridade2: null,
      solicitacao_origin: null,
      solicitacao_datafec: null,
      solicitacao_horafec: null,
      solicitacao_tempo: null,
      solicitacao_ccusto: null,
      solicitacao_exec: null,
      solicitacao_step: null,
      solicitacao_avaliacao: null,
      solicitacao_qualidade: null,
      solicitacao_satisfacao: null,
      ordem_id: null,
      ordem_codsolicitacao: null,
      ordem_filial: null,
      ordem_equipamento: null,
      ordem_cod_servico: null,
      ordem_data: null,
      ordem_data_ultima_manutencao: null,
      ordem_data_prevista_parada: null,
      ordem_hora_prevista_parada: null,
      ordem_data_prevista_parada_fim: null,
      ordem_hora_prevista_parada_fim: null,
      ordem_data_previsto_inicio_manutencao: null,
      ordem_hora_previsto_inicio_manutencao: null,
      ordem_data_previsto_fim_manutencao: null,
      ordem_hora_previsto_fim_manutencao: null,
      ordem_data_real_inicio_manutencao: null,
      ordem_hora_real_inicio_manutencao: null,
      ordem_data_real_fim_manutencao: null,
      ordem_hora_real_fim_manutencao: null,
      ordem_data_fim_atendimento: null,
      ordem_hora_fim_atendimento: null,
      ordem_ultima_alteracao: null,
      ordem_codsetor: null,
      ordem_situacao: null,
      ordem_problema: null,
      ordem_causa: null,
      ordem_solucao: null,
      ordem_avaliacao: null,
      setor_filial: null,
      setor_codigo: null,
      setor_nome: null,
      equipamento_id: null,
      equipamento_filial: null,
      equipamento_setor: null,
      equipamento_nome: null,
      equipamento_ccusto: null,
      executor_matricula: null,
      executor_filial: null,
      executor_nome: null,
      executor_usuario: null,
      exeutor_ccusto: null,
      executor_turno: null,
      solicitacao_id: null,
    };

    const solicitacaoMapeada: Partial<SolicitacaoServico> = {};

    for (const propriedade in objeto_solicitacao) {
      if (propriedade in modeloSolicitacaoServico) {
        const valorOriginal = (objeto_solicitacao as Record<string, unknown>)[propriedade];
        const valorTratado =
          typeof valorOriginal === 'string' ? this.corrigirTextoMojibake(valorOriginal) : valorOriginal;

        // O `as keyof SolicitacaoServico` evita o erro:
        // Can't index type 'object' with an arbitrary index type.
        solicitacaoMapeada[propriedade as keyof SolicitacaoServico] =
          // O cast para `unknown as string | undefined` mantém compatibilidade com a interface atual.
          valorTratado as unknown as string | undefined;
      }
    }

    return solicitacaoMapeada as SolicitacaoServico;
  }

  ngOnInit() {
    this.setSolicitacoesColunas();
    this.definirPeriodoPadrao();
    this.verificarNovasSolicitacoes();
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
  /**
   * Verifica se existem novas solicitações a cada 15 segundos.
   * Caso a linha de solicitação esteja extendida, não remapeia os dados, pois a página renderiza e a linha é fechada.
   * @private
   */
  private verificarNovasSolicitacoes() {
    this.solicitacoesSubscription = interval(1500000)
      .pipe(
        startWith(0),
        switchMap(() => this.manutencaoFacade.listarSolicitacoesDistribuicao()),
      )
      .subscribe({
        next: (dados_solicitacoes) => {
          if (!this.solicitacoesCarregadas) console.log('Verificando novas solicitações...');

          /** Mapeia as Solicitações da API com as Solicitações atuais, para verificar se existem mudanças. */
          const solicitacoesMapeadas = this.solicitacoesOriginais.map((solicitacaoServico) =>
            this.mapearSolicitacaoServico(solicitacaoServico),
          );

          const dados_solicitacoesMapeados = dados_solicitacoes.map((dados_solicitacao) =>
            this.mapearSolicitacaoServico(dados_solicitacao),
          );

          if (
            !this.fazendoDistribuicao &&
            JSON.stringify(solicitacoesMapeadas) !== JSON.stringify(dados_solicitacoesMapeados)
          ) {
            console.log(`Atualizando a Lista de Solicitações: \n${JSON.stringify(dados_solicitacoesMapeados)}`);
            console.log(`Valores Anteriores: \n${JSON.stringify(this.solicitacoes)}`);
            this.solicitacoesOriginais = dados_solicitacoesMapeados;
            this.atualizarStatusCards(this.manutencaoFacade.getTotalPorStepDistribuicao());
            this.statusUpdatedAt = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm') || '';
            this.solicitacoes = [...this.solicitacoesOriginais];

            if (
              (!this.solicitacoesColunas || this.solicitacoesColunas.length === 0) &&
              this.solicitacoes.length > 0
            ) {
              this.setSolicitacoesColunas();

              console.log(
                'Definindo as Colunas da Tabela de Solicitações:' + ' this.solicitacoesColunas: ',
                this.solicitacoesColunas,
              );
            }
          } else console.log('Solicitações inalteradas ou está sendo distribuída uma S.S.');

          this.solicitacoesCarregadas = true;

          if (this.solicitacoesOriginais.length === 0) {
            this.solicitacoes = [];
          }
        },
        error: (error) => {
          if (!this.fazendoDistribuicao)
            console.log('Verificar Novas Solicitacoes - Erro ao Ativar o Observable. ', error);
        },
      });
  }

  ngOnDestroy() {
    // Ao sair do Componente, cancelo a inscrição do Observable e os outros dados.
    console.log('Desfazendo o Observable de Solicitações, e outros dados.');
    this.solicitacoesSubscription?.unsubscribe();
    this.executorSubscription?.unsubscribe();
    this.solicitacoes = [];
    this.solicitacoesOriginais = [];
    this.statusCards = this.statusCards.map((card) => ({ ...card, count: 0 }));
    this.statusUpdatedAt = '';
    this.solicitacoesColunas = [];
    this.executoresSelecionados = [];
  }

  /**
   * Usada no ngOnInit p/ evitar re-renderização durante distribuição da S.S. e no controlada no método
   * de distribuição de S.S. */

  /**
   * Método que gera o formulário de `Distribuição`.
   * Utilizado no momento que a linha da solicitação é expandida.
   * Ele também faz uso do método que carrega os executores da S.S. presente no ExecutorService.
   *
   * @param solicitacao_step
   * @param solicitacao_tipo
   * */
  gerarFormDistribuicao(solicitacao_step?: string, solicitacao_tipo?: string) {
    console.log(`Gerando o Form de Distribuição da S.S. com os dados: ${solicitacao_tipo} e ${solicitacao_step}`);

    /**
     * Criação do Dynamic Form e seus componentes.
     * Importante: Se você usar `optionsMulti` com `options`, se ter 3 opções ou menos, o validator não funciona.
     * */
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
        disabled: this.fazendoDistribuicao || solicitacao_step !== '1',
      },
    ];

    // Debug: Imprimir o objeto fieldsFormDistribuicao e verificar a função validate
    console.log('fieldsFormDistribuicao:', this.fieldsFormDistribuicao);
    console.log('Função validate vinculada:', this.fieldsFormDistribuicao[0].validate);

    // Carregar executores e atualizar o formulário quando os dados estiverem disponíveis
    this.executorSubscription = this.manutencaoFacade.executores$.subscribe((executores) => {
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

    // Carregar os executores
    this.manutencaoFacade.carregarExecutores('');
    if (solicitacao_step !== '1') this.buttonDisabled = true;
  }

  progressBarValue = 0;
  buttonDisabled = false;

  barraProgressoDistribuicao() {
    this.fazendoDistribuicao = true;
    this.buttonDisabled = true;

    const interval = setInterval(() => {
      if (this.progressBarValue >= 100) {
        clearInterval(interval);
      } else {
        this.progressBarValue++;
      }
    }, 20);
  }

  // API TOTVS SIGAMNT - Distribuir S.S.: https://tdn.totvs.com/pages/releaseview.action?pageId=683181217
  distribuirSs(rowSolicitacao: unknown, formDistribuicao: PoDynamicFormComponent) {
    /** Enquanto estou distribuindo ou gerando a O.S., seto esta variável p/ não fazer outras requisições. */
    this.fazendoDistribuicao = true;
    this.distribuido = true;

    console.log(`Distribuir S.S. Clicado, para a S.S. `, rowSolicitacao, `\nDesabilitando o Botão de Distribuição...`);

    formDistribuicao.form.controls['executoresSelecionados'].disable();

    /**
     * As variáveis abaixo acessam os executores selecionados presentes no FormGroup.
     * A Síntaxe abaixo evite do erro "Possible null value" de ocorrer.
     */
    console.log('Executores Selecionados: ', formDistribuicao.form.value['executoresSelecionados']);
    const matricula_do_executor = formDistribuicao.form.value['executoresSelecionados'];

    // Invoco a API p/ Distribuir a S.S.
    this.barraProgressoDistribuicao();

    const distribuicaoObservable = this.manutencaoFacade.distribuirSolicitacao(
      `${(rowSolicitacao as SolicitacaoServico).solicitacao_id}`,
      `${(rowSolicitacao as SolicitacaoServico).solicitacao_tipo}`,
      '',
      `${(rowSolicitacao as SolicitacaoServico).solicitacao_filial}`,
    );

    console.log('##### Distribuição da S.S. #####' + '\nDados do PoDynamicFormComponent: ', formDistribuicao);

    // Checagens na solicitação `rowSolicitacao` para ver o tipo e a estrutura do objeto.
    console.log('Tipo do Objeto rowSolicitacao:', typeof rowSolicitacao);
    if (typeof rowSolicitacao === 'object' && rowSolicitacao !== null) {
      console.log('Estrutura (Schema) do Objeto rowSolicitacao:', Object.keys(rowSolicitacao as object));
    }

    // Geração da O.S...
    distribuicaoObservable
      .pipe(
        switchMap((responseDistribuicao) => {
          console.log('Distribuição realizada com sucesso: ', responseDistribuicao);
          this.gerandoOs = true; // Ativar a indicação de que a geração da OS está em progresso

          // Certifique-se de que rowSolicitacao é do tipo SolicitacaoServico antes de passá-lo
          if (typeof rowSolicitacao === 'object' && rowSolicitacao !== null && 'solicitacao_id' in rowSolicitacao) {
            return this.manutencaoFacade.gerarOs(
              `${(rowSolicitacao as SolicitacaoServico).solicitacao_equipamento}`,
              `${(rowSolicitacao as SolicitacaoServico).solicitacao_tipo}`,
              `${(rowSolicitacao as SolicitacaoServico).solicitacao_filial}`,
              `${(rowSolicitacao as SolicitacaoServico).solicitacao_id}`,
              `${matricula_do_executor}`,
              rowSolicitacao as SolicitacaoServico, // Enviar a Solicitação de Serviço
            );
          } else {
            // Trate o caso em que rowSolicitacao não é um objeto válido de SolicitacaoServico
            console.error('Erro: rowSolicitacao não é um objeto válido de SolicitacaoServico.');
            return throwError(() => new Error('rowSolicitacao não é um objeto válido de SolicitacaoServico.'));
          }
        }),
        // Outros operadores aqui, como catchError, etc... E o resto do código, como o subscribe, etc...
      )
      .subscribe({
        next: (responseGerarOs) => {
          console.log('Resposta da geração da OS:', responseGerarOs);
          this.fecharModal();
          this.distribuido = false;
          this.poNotification.success('Solicitação Distribuida com Sucesso !');
          this.gerandoOs = false; // Desativa a indicação de progresso
          this.fazendoDistribuicao = false;
          this.verificarNovasSolicitacoes();
          // this.changeDetector.detectChanges();
        },
        error: (error) => {
          console.error('Erro na distribuição ou na geração da OS:', error);
          this.gerandoOs = false; // Desativa a indicação de progresso também em caso de erro
          this.fazendoDistribuicao = false;
          this.distribuido = false;
          this.poNotification.error('Problema na Distribuição da Solicitação de Serviço. Tente Novamente.');
          this.fecharModal();
          this.verificarNovasSolicitacoes();
          // this.changeDetector.detectChanges();
        },
        // Não é necessário colocar nada aqui, pois o 'next' e 'error' já tratam as ações necessárias
        // A lógica aqui seria redundante, já que 'complete' não é chamado se 'error' for chamado
      });
  }

  /**
   * Método emitido ao expandir a solicitação.
   * O evento emite um tipo `Any`.
   *
   * Conforme a Documentação do Componente: directive output p-expanded: any
   *
   * Ele também auxilia nos métodos executados que controlam as etapas do `stepper`, e também para facilitar
   * a saber qual o `step` que deve estar ativo no momento.
   * */
  aoExpandirSolicitacao(solicitacao: unknown) {
    if (this.executorSubscription) {
      this.executorSubscription.unsubscribe(); // Cancela a subscrição
    }

    // Eu não vou gerar o `form` de distribuição se a S.S. estiver em `Distribuído` ou `Em Atendimento`.
    this.gerarFormDistribuicao(
      (solicitacao as SolicitacaoServico).solicitacao_step,
      (solicitacao as SolicitacaoServico).solicitacao_tipo,
    ); // Chama a função para atualizar os campos do form

    // Detecto se existem mudanças visuais na tela...
    // Verificar mudança nos dados ao expandir a linha da tabela depois das funções síncronas.

    //  setTimeout(() => {
    //     this.changeDetector.detectChanges();
    //  });

    console.log('##### Ao Expandir Solicitação - Solicitação Expandida: ', solicitacao);
    this.solicitacaoEstaExpandida = true;

    switch ((solicitacao as SolicitacaoServico).solicitacao_step) {
      case '1':
        setTimeout(() => this.activeStep(Number(0)));
        break;
      case '2':
        setTimeout(() => this.activeStep(Number(1)));
        break;
      case '3':
        setTimeout(() => this.activeStep(Number(2)));
        break;
      case '4':
        setTimeout(() => this.activeStep(Number(3)));
        break;
      case '5':
        setTimeout(() => this.activeStep(Number(4)));
        break;
      case '6':
        setTimeout(() => this.activeStep(Number(5)));
        break;
      case '7':
        setTimeout(() => this.activeStep(Number(6)));
        break;

      default:
        console.log('Ação desconhecida');
    }

    // Mostrar os Steps no console, depois de um tempo, com o setTimeout.
    // O SetTimeout aguarda o Final da Fila de Eventos do JavaScript, e ai acessamos o `stepList` depois de disponivel.
    //  setTimeout(() => {
    //    this.mudancaDeEtapa({
    //       solicitacaoServico: solicitacao as SolicitacaoServico,
    //     });
    //   });
  }

  aoColapsarSolicitacao() {
    this.executoresCarregados = false;
    this.executoresSelecionados = [];
    this.progressBarValue = 0;
    this.buttonDisabled = false;
    this.fazendoDistribuicao = false;
    this.fieldsFormDistribuicao = [];
    this.solicitacaoEstaExpandida = false;

    if (this.executorSubscription) {
      this.executorSubscription.unsubscribe(); // Cancela a subscrição
    }

    // setTimeout(() => {
    //   this.changeDetector.detectChanges();
    //   });
  }

  aplicarFiltrosTabela() {
    const step = this.normalizarStatus(this.filtroStatusSelecionado) || undefined;
    const dataDe = this.formatarDataInputParaApi(this.filtroDataDe);
    const dataAte = this.formatarDataInputParaApi(this.filtroDataAte);

    this.manutencaoFacade.listarSolicitacoesDistribuicao(step, dataDe, dataAte).subscribe({
      next: (dados_solicitacoes) => {
        const dados_solicitacoesMapeados = dados_solicitacoes.map((dados_solicitacao) =>
          this.mapearSolicitacaoServico(dados_solicitacao),
        );
        this.solicitacoesOriginais = dados_solicitacoesMapeados;
        this.solicitacoes = [...dados_solicitacoesMapeados];
        this.atualizarStatusCards(this.manutencaoFacade.getTotalPorStepDistribuicao());
        this.statusUpdatedAt = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm') || '';
      },
      error: (error) => {
        this.poNotification.error('Não foi possível aplicar o filtro de status.');
        console.error('Erro ao filtrar solicitações via API:', error);
      },
    });
  }

  limparFiltrosTabela() {
    this.filtroStatusSelecionado = '';
    this.definirPeriodoPadrao();
    this.solicitacoes = [...this.solicitacoesOriginais];
  }

  filtrarPorStatusCard(step: string) {
    this.filtroStatusSelecionado = step;
    this.aplicarFiltrosTabela();
  }

  private atualizarStatusCards(totalPorStepApi?: Record<string, number>) {
    let contagem: Record<string, number> = totalPorStepApi || {};

    if (!Object.keys(contagem).length) {
      contagem = {};
      this.solicitacoesOriginais.forEach((solicitacao) => {
        const status = this.normalizarStatus(solicitacao.solicitacao_step);
        if (!status) return;
        contagem[status] = (contagem[status] || 0) + 1;
      });
    }

    this.statusCards = this.statusCards.map((card) => ({
      ...card,
      count: contagem[card.step] || 0,
    }));
  }

  private obterDataBaseDaSolicitacao(solicitacao: SolicitacaoServico): Date | null {
    return (
      this.converterDataFiltroParaDate(solicitacao.solicitacao_databer ?? null) ||
      this.converterDataFiltroParaDate(solicitacao.ordem_data ?? null)
    );
  }

  private converterDataFiltroParaDate(data: string | Date | null): Date | null {
    if (!data) return null;

    if (data instanceof Date) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    const valorData = `${data}`.trim();
    if (!valorData) return null;

    if (/^\d{8}$/.test(valorData)) {
      const ano = Number(valorData.substring(0, 4));
      const mes = Number(valorData.substring(4, 6)) - 1;
      const dia = Number(valorData.substring(6, 8));
      return new Date(ano, mes, dia);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(valorData)) {
      const [ano, mes, dia] = valorData.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valorData)) {
      const [dia, mes, ano] = valorData.split('/').map(Number);
      return new Date(ano, mes - 1, dia);
    }

    const dataConvertida = new Date(valorData);
    if (isNaN(dataConvertida.getTime())) return null;
    return new Date(dataConvertida.getFullYear(), dataConvertida.getMonth(), dataConvertida.getDate());
  }

  private definirPeriodoPadrao() {
    const dataAte = new Date();
    const dataDe = new Date(dataAte);
    dataDe.setMonth(dataDe.getMonth() - 3);

    this.filtroDataDe = this.formatarDataParaInputDate(dataDe);
    this.filtroDataAte = this.formatarDataParaInputDate(dataAte);
  }

  private normalizarStatus(status: string | number | null | undefined): string {
    return `${status ?? ''}`.trim();
  }

  private formatarDataParaInputDate(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private formatarDataInputParaApi(dataInput: string): string | undefined {
    const valor = `${dataInput ?? ''}`.trim();
    if (!valor) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor.replace(/-/g, '');
    }
    return valor;
  }

  private corrigirTextoMojibake(texto: string): string {
    if (!texto) return texto;

    // Só tenta corrigir quando há padrão típico de UTF-8 lido como ISO-8859-1/Windows-1252.
    if (!/[ÃÂ]/.test(texto)) return texto;

    try {
      const bytes = Uint8Array.from(Array.from(texto).map((char) => char.charCodeAt(0) & 0xff));
      const corrigido = new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim();
      return corrigido || texto;
    } catch {
      return texto;
    }
  }

  distribuicao(rowSolicitacao: any) {
    this.solicitacaoAlter = { ...(rowSolicitacao as SolicitacaoServico) };

    this.poModal.open();
  }

  fecharModal() {
    if (this.poModal.isHidden === false) {
      // Verifica se o modal está visível
      this.poModal.close();
    }
  }

  activeStep(nstep: number) {
    this.stepper.active(nstep);
  }

  eventAprovacao(rowSolicitacao: any) {
    this.solicitacaoAlter = { ...(rowSolicitacao as SolicitacaoServico) };
    this.modalAprovacao.open();
  }

  //todo fafer a ação aprovar

  salvarAprocacao(Solicitacao: unknown) {
    const filial = (Solicitacao as SolicitacaoServico).solicitacao_filial ?? '';
    const ordem = (Solicitacao as SolicitacaoServico).ordem_id ?? '';
    const aprovacaoSelecionada = this.aprovacao;

    console.log(`Distribuir S.S. Clicado, para a S.S. `, Solicitacao, `\nDesabilitando o Botão de Distribuição...`);

    this.loadingStart = true;

    if (aprovacaoSelecionada) {
      this.manutencaoFacade.aprovaOrdemServico(filial, ordem, aprovacaoSelecionada).subscribe({
        next: (response) => {
          this.loadingStart = false;
        },
        error: (error) => {
          this.loadingStart = false;
          this.poNotification.error('Houve problemas ao Iniciar Ordem de Serviço!');
        },
        complete: () => {
          this.baixaRequisicao(filial, ordem);
          this.loadingStart = false;
          this.verificarNovasSolicitacoes();
          this.poNotification.success('Ordem de Serviço Finalizada!');
        },
      });
      this.modalAprovacao.close();
    } else {
      // Implementar a lógica para exibir uma mensagem de erro
      this.poNotification.warning('Selecione uma opção!');
    }
  }

  baixaRequisicao(filial: string, ordem: string) {
    console.log(` baixa requisicao `, ordem, `\n...`);

    this.manutencaoFacade.baixaReqOrdemServico(filial, ordem).subscribe({
      next: (response) => {
        if (response.body?.status == 'error') {
          this.poNotification.warning('Requisição Não pode ser baixada. Verifique no Protheus.');
        }

        this.loadingStart = false;
      },
      error: (error) => {
        this.loadingStart = false;
        this.poNotification.warning('Requisição Não pode ser baixada. Verifique no Protheus.');
      },
      complete: () => {
        this.loadingStart = false;
        return true;
      },
    });
    this.modalAprovacao.close();
  }

  cancelarAprovacao() {
    this.modalAprovacao.close();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case '1':
        return 'Ótimo';
      case '2':
        return 'Bom';
      case '3':
        return 'Satisfatório';
      case '4':
        return 'Ruim';
      default:
        return '';
    }
  }
}
