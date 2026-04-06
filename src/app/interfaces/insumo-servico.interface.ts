/**
 * Mapping de Insumo de acordo com a API SIGAMNT
 * https://tdn.totvs.com/pages/releaseview.action?pageId=683181217#0-1
 *
 * Mapeia as colunas:
 * Operation - Não existe no Banco.
 * Task - TL_TAREFA
 * Type - TL_TIPOREG
 * Code - TL_CODIGO
 * Unity - TL_UNIDADE
 * Amount - TL_QUANTID
 * IsDone - Não existe no Banco.
 * Date - TL_DTINICI e TL_HOINICI
 * Note - TL_OBSERVA
 *
 * @export
 * */
export interface InsumoServico {
  operation: string;
  task: string;
  type: string;
  code: string;
  unity: string;
  amount: number;
  isDone: boolean;
  date: string;
}

/**
 * Interface representando os detalhes de um insumo de uma ordem de serviço.
 */
export interface DetalhesInsumo {
  executor_nome?: string;
  insumo_codigo: string;
  insumo_data_inicio: string;
  insumo_hora_inicio: string;
  insumo_quantidade: number; // Ajustado para number baseado no JSON fornecido
  insumo_tipo: string;
  insumo_unidade: string;
  insumo_local?: string;
}

/**
 * Interface representando a estrutura de um insumo de uma ordem de serviço recebida da API.
 */
export interface InsumoOrdemIn {
  detalhes_insumo: DetalhesInsumo;
}

export interface InsumoOrdemView {
  executor_nome?: string;
  insumo_tipo?: string;
  insumo_codigo?: string;
  insumo_quantidade?: string;
  insumo_unidade?: string;
  insumo_desc?: string;
  ordem_filial?: string;
  insumo_data_inicio?: string;
  insumo_hora_inicio?: string;
}


export interface RequisicaoOrdemView {
  CP_SOLICIT?: string;
  CP_PRODUTO?: string;
  CP_UM ?: string;
  CP_DATPRF?: string;
  CP_LOCAL?: string;
  CP_OBS?: string;
  CP_OP ?: string;
  CP_CODSOLI?: string;
  CP_XHORA ?: string;
}