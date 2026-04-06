export interface PedidoIdi {
  pedido_grupo:string;
  pedido_filial: string;
  pedido_id: string;
  pedido_idcli: string;
  pedido_codcli: string;
  pedido_loja: string;
  pedido_cliente: string;
  pedido_emissao: string;
  pedido_usuario:  string;
  pedido_tipo:  string;
  Status:string;	
  pedido_items?: Array<Iitem>
}



export interface Iitem {
  item: string;
  produto: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  quantidade_fat: string;
  saldo: string;
  preco: string;
  total: string;
  entrega: string;
  operacao: string;
  tes: string;
  local: string;
  nota: string;
  serie:string;
  data_fat:string;
}

