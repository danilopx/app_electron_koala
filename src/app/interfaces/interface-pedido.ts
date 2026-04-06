export interface Ipedido {
  grupo:string;
  filial: string;
  empresa: string;
  status: string;
  numero: string;
  filial_destino: string;
  cliente: string;
  loja:  string;
  nome:string;	
  clientrega:string;	
  lojaentrega	:string;	
  transportadora:string;		
  tipo:string;	
  condpag	:string;	
  tabela:string;	
  natureza:string;
  emissao:string;	
  operacao:string;	
  frete:string;	
  mensagem:string;
  saldo:string;
  step1:string;
  step2:string;
  step3:string;
  step4:string;
  pedcliente:string;
  notas?: Array<Inota>
  items?: Array<Iitem>
}

export interface Iitem {
  nota: any;
  item: string;
  produto: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  saldo: string;
  preco: string;
  total: string;
  entrega: string;
  operacao: string;
  tes: string;
  local: string;
  serie:string;
  ident:string;
  codpai:string;
}

  export interface ItemPedido {
  nitem: number;
  codigo?: string;
  desc?: string;
  quant?: number;
  um?: string;
  prunit?: number;
  ptotal?: string;
  tes?: string;
  amz?: string;
  tab?: string;
  dtentreg?: string;
  tipo?: string;
  notaorig?: string;
  servirorig?: string;
  itemorig?: string;
  ident?: string;
  produto?: number;
}

export interface Inota {
  nota: string;
  serie: string;
  emissaonf: string;
  item: string;
  produto: string;
  lote: string;
  quant:string;
  tes:string;
  um:string;
  retsefaz: string;
  descretsefaz: string;
  statusnfe: string;
  filial_nf?: string;
  doc?: string;
  cliente?: string;
  loja?: string;
  chave_nfe?: string;
  chave_nf?: string;
  item_pedido?: string;
  quantidade?: number;
  total_item?: number;
}
