import { InsumoOrdemIn, InsumoServico } from './insumo-servico.interface';

/** Interface Representando a Ordem de Serviço no Protheus. Uma OS pode ou não conter muitos insumos. */
export interface OrdemServico {
  origin: string;
  equipment: string;
  costCenter: string;
  startDate: string;
  service: string;
  situation: string;
  inputs?: InsumoServico[];
}

/** Essa interfaces representa as Ordens de Serviço tratadas, da API. */
export interface OrdemServicoApiResponse {
  ordens_de_servico: OrdemServico[];
}

/** Essa interfaces representa as Ordens de Serviço tratadas, da API. */
export interface OrdemServicoApiResponseIn {
  ordens_de_servico: OrdemServicoIn[];
}

/**
 * Interface representando a estrutura de uma ordem de serviço recebida da API.
 */
export interface OrdemServicoIn {
  solicitacao_equipamento?: string
  solicitacao_grupo?: string
  solicitacao_filial?: string
  solicitacao_id?: string
  solicitacao_prioridade?: string
  solicitacao_status?: string
  solicitacao_tipo?: string
  solicitacao_descricao?: string
  solicitacao_databer?: string
  solicitacao_horaber?: string
  solicitacao_executante?: string
  solicitacao_usuario?: string
  solicitacao_setor?: string
  solicitacao_dataini?: string
  solicitacao_horaini?: string
  solicitacao_datafim?: string
  solicitacao_horafim?: string
  solicitacao_prioridade2?: string
  solicitacao_origin?: string
  solicitacao_datafec?: string
  solicitacao_horafec?: string
  solicitacao_tempo?: string
  solicitacao_ccusto?: string
  solicitacao_exec?: string
  solicitacao_step?: string
  solicitacao_avaliacao?: string
  solicitacao_qualidade?: string
  solicitacao_satisfacao?: string
  ordem_id: string
  ordem_codsolicitacao?: string
  ordem_filial: string
  ordem_equipamento?: string
  ordem_cod_servico?: string
  ordem_data?: string
  ordem_data_ultima_manutencao?: string
  ordem_data_prevista_parada?: string
  ordem_hora_prevista_parada?: string
  ordem_data_prevista_parada_fim?: string
  ordem_hora_prevista_parada_fim?: string
  ordem_data_previsto_inicio_manutencao?: string
  ordem_hora_previsto_inicio_manutencao?: string
  ordem_data_previsto_fim_manutencao?: string
  ordem_hora_previsto_fim_manutencao?: string
  ordem_data_real_inicio_manutencao?: string
  ordem_hora_real_inicio_manutencao?: string
  ordem_data_real_fim_manutencao?: string
  ordem_hora_real_fim_manutencao?: string
  ordem_data_fim_atendimento?: string
  ordem_hora_fim_atendimento?: string
  ordem_ultima_alteracao?: string
  ordem_codsetor?: string
  ordem_situacao?: string
  ordem_observacao?: string
  ordem_problema?: string
  ordem_causa?: string
  ordem_solucao?: string
  ordem_avaliacao?: string
  setor_filial?: string
  setor_codigo?: string
  setor_nome?: string
  equipamento_id?: string
  equipamento_filial?: string
  equipamento_setor?: string
  equipamento_nome?: string
  equipamento_ccusto?: string
  executor_matricula?: string
  executor_filial?: string
  executor_nome?: string
  executor_usuario?: string
  exeutor_ccusto?: string
  executor_turno?: string
  ordem_insumos: InsumoOrdemIn[]; // Array de insumos - Precisa ter ao menos um executor e não pode ser opcional.
}

export interface OrdemServicoComentarios {
  comentarios: comentarioOs[];
}

interface comentarioOs {
  comentario_os_data: string;
  comentario_os_hora: string;
  comentario_os_filial: string;
  comentario_os_ordem: string;
  comentario_os_seq: string;
  comentario_os_texto: string;
  comentario_os_usuario: string;
}

export interface OrdemServicoImagens {
  imagem: ImagemOs[];
}

export interface ImagemOs {
  imagem_os_filial: string;
  imagem_os_ordem: string;
  imagem_os_url: ImagemUrl[];
}

interface ImagemUrl {
  imagem_os_url: string;
  imagem_os_data: string;
  imagem_os_hora: string;
  imagem_os_seq: string;
  imagem_os_usuario: string;
  imagem_os_base64:	string;
}
