/** Representa o Estado de uma Solicitação de acordo com seus valores retornadas pela API. */
export enum EstadoSolicitacao {
  AguardandoDistribuicao = 'A',
  DistribuirSS = 'A',
  AguardandoAtendimento = 'D',
  Atender = 'D',
}
