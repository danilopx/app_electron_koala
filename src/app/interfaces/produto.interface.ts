/** Mapeia a Interface Produto do Protheus, tabela SB1 */
export interface Produto {
  produto_codigo: string;
  produto_descricao: string;
  produto_descricao_ing?: string;
  produto_unidade: string;
  produto_tipo: string;
  produto_local: string;
}

/** Interface mapeia uma lista de produtos no padrão API TOTVS, de acordo com a documentação
 * do PO-Ui para usar Filters, Services prontos e etc.
 *
 * Ref: https://po-ui.io/documentation/po-combo
 * */
export interface ProdutosPadraoAPITotvs {
  items?: Produto[];
  produtos?: Produto[];
}
