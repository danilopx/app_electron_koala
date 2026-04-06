import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import { SolicitacoesService as DistribuicaoSolicitacoesService } from '../../distribuicao/services/solicitacoes.service';
import { ExecutorService } from '../../distribuicao/services/executor.service';
import { OrdensService } from '../../../service/ordens.service';

import { SolicitacaoServico, ApiResponse } from '../../../interfaces/solicitacao-servico.interface';
import { Executor } from '../../../interfaces/executor.interface';
import { OrdemServicoIn } from '../../../interfaces/ordem-servico.interface';

@Injectable({
  providedIn: 'root',
})
export class ManutencaoFacadeService {
  constructor(
    private distribuicaoSolicitacoesService: DistribuicaoSolicitacoesService,
    private executorService: ExecutorService,
    private ordensService: OrdensService,
  ) {}

  listarSolicitacoesDistribuicao(
    step?: string,
    dataDe?: string,
    dataAte?: string,
  ): Observable<SolicitacaoServico[]> {
    return this.distribuicaoSolicitacoesService.listarSolicitacoesDaFilial(step, dataDe, dataAte);
  }

  getTotalPorStepDistribuicao(): Record<string, number> {
    return this.distribuicaoSolicitacoesService.getTotalPorStep();
  }

  distribuirSolicitacao(
    solicitacaoId: string,
    solicitacaoTipo: string,
    executor: string,
    idFilial: string,
  ): Observable<object> {
    return this.distribuicaoSolicitacoesService.distribuirSolicitacao(
      solicitacaoId,
      solicitacaoTipo,
      executor,
      idFilial,
    );
  }

  get executores$(): Observable<Executor[]> {
    return this.executorService.executores$;
  }

  carregarExecutores(solicitacaoTipo?: string): void {
    this.executorService.carregarExecutores(solicitacaoTipo);
  }

  gerarOs(
    equipment: string,
    service: string,
    idFilial: string,
    solicitacaoId: string,
    executorMatric?: string,
    solicitacaoServico?: SolicitacaoServico,
  ): Observable<HttpResponse<object>> {
    return this.ordensService.gerarOs(
      equipment,
      service,
      idFilial,
      solicitacaoId,
      executorMatric,
      solicitacaoServico,
    );
  }

  listarOrdensServico(grupo: string, filial: string, equipamentoId: string): Observable<OrdemServicoIn[]> {
    return this.ordensService.listarOrdensServico(grupo, filial, equipamentoId);
  }

  verSeAlteraOrdensServico(ordensServicoAtual: OrdemServicoIn[], ordensServicoNova: OrdemServicoIn[]): boolean {
    return this.ordensService.verSeAlteraOrdensServico(ordensServicoAtual, ordensServicoNova);
  }

  aprovaOrdemServico(filial: string, ordem: string, aprovacao: string): Observable<object> {
    return this.ordensService.aprovaOrdemServico(filial, ordem, aprovacao);
  }

  baixaReqOrdemServico(filial: string, ordem: string): Observable<HttpResponse<ApiResponse>> {
    return this.ordensService.baixaReqOrdemServico(filial, ordem);
  }
}
