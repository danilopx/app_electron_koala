import { Equipamento } from "./equipamento.interface";
import { Executor } from "./executor.interface";
import { OrdemServicoIn } from "./ordem-servico.interface";
import { Setor } from "./setor.interface";
import { SolicitacaoServico } from "./solicitacao-servico.interface";

export interface ApiResponse {
    solicitacoes: SolicitacaoServico[];
    ordens: OrdemServicoIn[];
    setores: Setor[];
    equipamentos: Equipamento[];
    executores : Executor[];
  
  }