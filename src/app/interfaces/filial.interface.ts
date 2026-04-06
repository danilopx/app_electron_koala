export interface Filial {
  filial_codigo: string;
  filial_familia: string;
  filial_grupo: string;
  filial_nome: string;
}

// Response da API espera retornar a lista das filiais.
export interface FilialResponse {
  filiais: Filial[];
}
