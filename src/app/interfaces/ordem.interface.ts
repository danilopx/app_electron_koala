/**
 * Interface representando a estrutura de uma Ordem de Serviço no contexto do sistema Protheus.
 *
 * Os campos nesta interfaces são mapeados diretamente para tabelas no Protheus, conforme especificado
 * em cada propriedade.
 */
export interface OrdemInterface {
  /**
   * Origem de Registro
   * @length 20
   * @required Sim
   * @protheusField TQB_ORIGEM
   */
  origin: string;

  /**
   * Código do Bem/Localização
   * @length 16
   * @required Sim
   * @protheusField TJ_CODBEM
   */
  equipment: string;

  /**
   * Código do Centro de Custo da O.S.
   * @length 20
   * @required Sim
   * @protheusField TJ_CCUSTO
   */
  costCenter: string;

  /**
   * Data e Hora da abertura da O.S.
   * @length 13 (20220419 13:00)
   * @required Sim
   * @protheusField TJ_DTORIGI / TJ_HOMPINI / TJ_HORACO1 / TJ_HORACO2
   */
  startDate: string;

  /**
   * Código do serviço da O.S.
   * @length 20
   * @required Sim
   * @protheusField TJ_SERVICO
   */
  service: string;

  /**
   * Situação da O.S.
   * @length 9
   * @required Sim
   * @protheusField TJ_SITUACA
   */
  situation: number;
}
