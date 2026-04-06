export interface IUnidade {
  id: number;
  descricao: string;
  identificacao: string;
  empresa: string;
  status: string;
  created_at: string;   // pode ser convertido para Date se desejar
  updated_at: string;   // pode ser convertido para Date se desejar
  deleted_at: string | null;
}
