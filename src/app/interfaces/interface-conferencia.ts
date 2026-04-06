export interface IConferenciaItem {
  item: string;
  produto: string;
  quantidade: number;
  lote: string;
  pedido: string;
}

export interface IConferenciaNota {
  nota: string;
  filial: string;
  dataConf: string;
  horaConf?: string;
  codCliente: string;
  cliente: string;
  nota_conf: string;
  conferente: string;
  chaveNFe: string;
  statusNFe: string;
  itens: IConferenciaItem[];
  dataConfFormatada?: string;
  horaConfFormatada?: string;
  statusLabel?: string;
  actions?: string;
}

export interface IConferenciaResponse {
  status: string;
  totalRegistros: number;
  totalPaginas: number;
  paginaAtual: number;
  limit: number;
  hasNext: boolean;
  notas: IConferenciaNota[];
}
