export interface Setor {
  setor_codigo: string;
  setor_filial: string;
  setor_grupo: string;
  setor_nome: string;
}

export interface SetorResponse {
  setores: Setor[];
}

// Esta interfaces é a nova adição para definir a estrutura completa da resposta da API.
export interface SetorApiResponse {
  resultado: {
    dados: Setor[];
  };
}
