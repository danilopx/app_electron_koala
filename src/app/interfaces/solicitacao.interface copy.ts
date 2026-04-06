/* Interface da Solicitação gerada do Form */
export interface SolicitacaoForm {
  tipoDeProblema: string | null;
  maquinaParada: string;
  descricaoProblema?: string;
}

export interface SolicitacaoAberta {
  solicitacao_equipamento: string;
  solicitacao_filial: string;
  solicitacao_id: string;
  solicitacao_status: string;
}

export interface SolicitacoesAbertasResponse {
  equipamento_ss_aberta: true;
  solicitacoes: SolicitacaoAberta[];
}

export interface SemSolicitacoesResponse {
  Mensagem: string;
  equipamento_ss_aberta: false;
}

// Ref. https://tdn.totvs.com/pages/releaseview.action?pageId=683181217
// A Interface reflete a estrutura da solicitacao no Protheus.
export interface SolicitacaoProtheus {
  numeroSolicitacao?: string; // TQB_SOLIC - Não usamos, gerado automaticamente pelo Protheus.
  origin: string; // TQB_ORIGEM - Obrigatório.
  equipment: string; // TQB_CODBEM - Obrigatório.
  description: string; // TQB_DESCRICAO - Obrigatório.
  serviceType?: string; // TQB_CDSERV - Condicional.
  dateTime?: string; // Condicional
  priority?: string; // TQB_PRIORI.
}

export interface SolicitacaoAbertaResponse {
  serviceRequest: string; // Retorno da Abertura de S.S. - TQB_SOLIC
}

export type SolicitacaoServicoResponse = SolicitacoesAbertasResponse | SemSolicitacoesResponse;
