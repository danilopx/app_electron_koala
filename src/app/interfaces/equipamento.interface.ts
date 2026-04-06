export interface Equipamento {
  equipamento_ccusto: string;
  equipamento_filial: string;
  equipamento_grupo: string;
  equipamento_id: string;
  equipamento_nome: string;
  equipamento_setor: string;
  equipamento_ss_aberta?: boolean | string;
  equipamento_ss_prioridade?: string;
  equipamento_ss_prioridade2?: string;
  equipamento_ss_status?: string;
  equipamento_ss_numero?: string;
  equipameno_ss_imagem: string;
}



export interface EquipamentoResponse {

    equipamentos: Equipamento[];
  
}
