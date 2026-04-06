import { Component, OnDestroy, OnInit } from '@angular/core';
import { OrdemServicoIn } from '../../../interfaces/ordem-servico.interface';
import { ManutencaoFacadeService } from '../../manutencao/services/manutencao-facade.service';
import { filter, Observable, of, Subscription, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-pagina-ordens-servico',
  templateUrl: './pagina-ordens-servico.component.html',
  styleUrls: ['./pagina-ordens-servico.component.css'],
})
export class PaginaOrdensServicoComponent implements OnInit, OnDestroy {
  get ordensCarregadas(): boolean {
    return this._ordensCarregadas;
  }

  get ordensServicoAtuais() {
    return this._ordensServicoAtuais;
  }

  /** Observable com os dados da O.S., para trabalhar com reatividade de acordo com os dados.
   * Ref. 1: https://stackoverflow.com/a/76025282/8297745
   * Ref. 2: https://stackoverflow.com/a/50586048/8297745
   * Ref. 3: https://stackoverflow.com/a/73599001/8297745
   * */
  ordensServico$!: Observable<OrdemServicoIn[]>;

  constructor(private manutencaoFacade: ManutencaoFacadeService) {}

  /** Ordens Subscription: Utilizado apenas para controle dinâmico do Observable com os dados de O.S. */
  private ordensSubscription!: Subscription;
  private _ordensCarregadas = false;
  protected ordemComErros = false;
  private _ordensServicoAtuais: OrdemServicoIn[] = [];

  filtrosDaOs: Array<string> = ['ordem_id'];
  ordensFiltradas: Array<OrdemServicoIn> = [];
  seFilial = localStorage.getItem('filial');
  setGrupo = localStorage.getItem('grupo');

  event_ordensFiltradas(eventoFiltro: Array<OrdemServicoIn>) {
    console.log('Evento de Filtro: ', eventoFiltro);

    // Se a pesquisa não retornar nenhum resultado, mostra todos os itens
    if (!eventoFiltro.length) {
      this.ordensFiltradas = [...this._ordensServicoAtuais];
    } else {
      // Filtra os itens com base na pesquisa
      this.ordensFiltradas = eventoFiltro;
    }

    console.log('Checando as Ordens, se a distribuição foi feita com sucesso... (Executor como Insumo).');
    // Adiciona uma verificação para remover as ordens de serviço que não possuem 'executor_nome'
    this.ordensFiltradas = this.ordensFiltradas.filter((ordemServico) => {
      // Verifica se 'ordem_insumos' existe e tem pelo menos um item e se 'detalhes_insumo' tem 'executor_nome'
      return (
        ordemServico.ordem_insumos &&
        ordemServico.ordem_insumos.length > 0 &&
        ordemServico.ordem_insumos[0].detalhes_insumo &&
        ordemServico.ordem_insumos[0].detalhes_insumo.executor_nome
      );
    });
  }

  /**
   * Usado para verificar novas ordens de serviço, trazendo a lista de todas as Ordens abertas.
   * Atualiza a lista com as ordens de serviço periodicamente, com o RxJS `timer` e `Observable`.
   *
   * O Timer cria um novo `Observable` a partir do retornado pela service, usando o `SwitchMap`.
   * Como comportamento padrão do Observable do `Timer`, ele nunca executa o método `Complete`, então,
   * por causa desta redundância, o método `Complete` foi removido.
   *
   * Usamos o `Subscription` para controlar o estado do Observable, e o `Filter` para evitar do `Next` ser chamado
   * quando não há alterações na lista de ordens de serviço.
   *
   * Ref: https://rxjs.dev/api/index/function/timer#example
   * */
  verificarOrdensServico() {
    console.log('##### Iniciando Verificação de O.S. #####');

    if (this.setGrupo !== '02') {
      this.ordensServico$ = timer(0, 15000).pipe(
        //switchMap(() => this.ordensService.verificarSolicitacoesEquipamento('01','','')),
        switchMap(() => this.manutencaoFacade.listarOrdensServico('01', '', '')),
        filter((ordensServicoNova) =>
          this.manutencaoFacade.verSeAlteraOrdensServico(this._ordensServicoAtuais, ordensServicoNova),
        ),
        tap((ordensServico) => {
          // Uso o tap() para debugar o fluxo de dados, sem alterar o fluxo.
          console.log('##### Dados do Observable Ordens de Serviço ANTES da Subscription:', ordensServico);
        }),
      );

      /**
       * Método de Subscrição com Objeto Observer (Estilo Recomendado).
       * Cada propriedade é uma função, ao invés de serem usados como argumentos de `Callbacks` separados.
       * Ele se inscreve o `Observable` criado pelo `Timer` e `SwitchMap`.
       **/
      this.ordensSubscription = this.ordensServico$.subscribe({
        next: (ordensServico) => {
        
          this._ordensCarregadas = true;

          // Verifica se o tamanho das listas de ordens de serviço é diferente
          if (this._ordensServicoAtuais.length !== ordensServico.length) {
            this._ordensServicoAtuais = ordensServico;

            // Atualiza a lista de ordens de serviço filtradas para exibir na tela na primeira vez.
            this.ordensFiltradas = [...this._ordensServicoAtuais];

            this.ordemComErros = false;
           
          }
        },
        error: (error) => {
          this._ordensCarregadas = false;
          this.ordemComErros = true;
          this._ordensServicoAtuais = [];
        
        },
      });
    }else {
      this._ordensCarregadas = true;

    }
  }

  ngOnInit() {
    this.verificarOrdensServico();
  }

  ngOnDestroy() {
    this.ordensSubscription?.unsubscribe();
    this._ordensServicoAtuais = [];
    this.ordensFiltradas = [];
    this.ordemComErros = false;
    this._ordensCarregadas = false;
    this.filtrosDaOs = [];
  }

  /** Esse método é usado p/ pausar o fluxo de dados para evitar reatividades em momentos específicos. */
  pausarFluxoDedados() {
    console.log('##### Página de O.S. - Pausando Fluxo de Dados. #####');
    this.ordensSubscription?.unsubscribe();
  }

  protected readonly of = of;
}
