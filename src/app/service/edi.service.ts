import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, from, lastValueFrom, map, mergeMap, Observable, of, toArray } from 'rxjs';
import { DocumentIdi } from '../interfaces/documentEdi.interface';
import { PedidoIdi } from 'src/app/interfaces/interface-pedidoedi';
import { Cliente } from '../interfaces/interface-cliente';

@Injectable()
export class EdiService {
  constructor(private http: HttpClient) {}
  /////////////////////////////// API EDI /////////////////////////////////////////////////////////////////////////////////////////////////////////

  getDocuments(): Observable<DocumentIdi[]> {
    // Endpoint legado dependia de `environment.apiEdi`, removido com módulos antigos.
    return of([]);
  }

  downloadDocuments(documentos: any[]): Observable<any[]> {
    // Endpoint legado dependia de `environment.apiEdiDoc`, removido com módulos antigos.
    return of([]);
  }

  returnDocumentos(documentId: string): Observable<any[]> {
    const payload = {
      documents: [
        {
          documentId: documentId,
          status: 'PROCESSED',
          message: 'Document successfully received and processed by software Simplifysoluções',
        },
      ],
    };

    // Endpoint legado dependia de `environment.apiEdi`, removido com módulos antigos.
    return of([]);
  }

  /////////////////////////////// API Protheus ///////////////////////////////////////////////////////////////////////////////////////////

 setTriangulado(grupo: string, filial: string, cnpj:string,pedido:string, cliente: string, loja: string, tipopedido: string, itens: any[]): Observable<any> {
  const payload = JSON.stringify(itens);
  return this.http.post(
    `${environment.apiRoot}INFOTRIANGULADO?GRUPO=${grupo}&FILIAL=${filial}&CLIENTE=${cliente}&LOJA=${loja}&TIPOPEDIDO=${tipopedido}`,
    payload
  );
}

  setPedido(documentos: any[], grupo: string, filial: string, usuario: string): Observable<any> {
    const payload = JSON.stringify(documentos);
    console.log('Payload:', payload);
    return this.http.post(
      `${environment.apiRoot}PEDIDO_EDI_IMPORT?GRUPO=${grupo}&FILIAL=${filial}&USUARIO=${usuario}`,
      payload,
    );
  }

  getPedido(
    grupo: string,
    filial: string,
    pedido: string,
    pedidoCli: string,
    status: string,
    offset: number,
    limit: number,
    cliente: string,
  ): Observable<{ items: PedidoIdi[]; total?: number }> {
    return this.http
      .get<any>(
        `${environment.apiRoot}PEDIDO_EDI?GRUPO=${grupo}&FILIAL=${filial}&PEDIDO=${pedido}&PEDIDO_CLI=${pedidoCli}&STATUS=${status}&OFFISET=${offset}&LIMIT=${limit}&CLIENTE=${cliente}`,
      )
      .pipe(
        map((response) => ({
          items: response?.pedido_edi ?? [],
          total: response?.total ?? response?.total_records ?? response?.totalRegistros ?? response?.quantidade ?? undefined,
        }))
      );
  }

  getCliente(grupo: string, filial: string, cnpj: string): Observable<{ cliente: Cliente }> {
    return this.http.get<{ cliente: Cliente }>(
      `${environment.apiRoot}PEDIDO_EDI_CLIENTE?GRUPO=${grupo}&FILIAL=${filial}&CNPJ=${cnpj}`,
    );
  }

  getPadidoTotais(grupo: string, filial: string): Observable<any> {
    return this.http.get<any>(`${environment.apiRoot}PEDIDO_EDI_TOTALIZADOR?GRUPO=${grupo}&FILIAL=${filial}`);
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////// Funçõs auxiliares //////////////////////////////////////////////////////////////////

  private async parseTxtToJson(rawText: string): Promise<any> {
    const lines = rawText.split('\n').map((l) => l.trim());
    const resultado: any = { cabecalho: {}, itens: [] };
    let itemAtual: any = {};
    let cliente: any = null;
    let numItem = 0;
    let cod_prod_cli = '';
    let item_pedido = '';

    for (const linha of lines) {
      if (linha.startsWith('01')) {
        const cnpjFilial = linha.slice(128, 141).trim();
        const cnpjCliente = linha.slice(141, 155).trim();

        resultado.cabecalho = {
          tipo: linha.slice(0, 2),
          cPedido_cliente: linha.slice(2, 17).trim(),
          cnpj_filial: cnpjFilial,
          cnpj_cliente: cnpjCliente,
          nome_cliente: '',
          codigo_cliente: '',
          loja_cliente: '',
        };

        try {
          const resposta = await lastValueFrom(this.getCliente('', '', cnpjCliente));
          cliente = resposta?.cliente;

          resultado.cabecalho.nome_cliente = cliente?.cliente_nome || 'Desconhecido';
          resultado.cabecalho.codigo_cliente = cliente?.cliente_codigo || '';
          resultado.cabecalho.loja_cliente = cliente?.cliente_loja || '';
        } catch (e) {
          console.error(`Erro ao buscar cliente para o CNPJ ${cnpjCliente}:`, e);
          resultado.cabecalho.nome_cliente = 'Erro ao buscar';
        }
      } else if (linha.startsWith('04')) {
        //item_pedido  =  linha.slice(2, 8).trim();
        cod_prod_cli = linha.slice(25, 40).trim();

        /* itemAtual = {
          item_pedido: linha.slice(2, 8).trim() === '000000' ? '' : linha.slice(2, 8).trim(),
          Cod_prod_cli: linha.slice(25, 40).trim(),
         // quantidade: `${linha.slice(55, 62).trim()}.${linha.slice(62, 64).trim()}`,
        };*/
      } else if (linha.startsWith('05')) {
        numItem = numItem + 1;
        item_pedido = String(numItem).padStart(6, '0') + '0';

        itemAtual.item_pedido = item_pedido;
        itemAtual.Cod_prod_cli = cod_prod_cli;
        (itemAtual.quantidade = `${linha.slice(15, 22).trim()}.${linha.slice(22, 24).trim()}`),
          (itemAtual.data_entrega = linha.slice(24, 32).trim());

        // Adiciona os dados do cliente também no item
        itemAtual.nome_cliente = cliente?.cliente_nome || 'Desconhecido';
        itemAtual.codigo_cliente = cliente?.cliente_codigo || '';
        itemAtual.loja_cliente = cliente?.cliente_loja || '';

        resultado.itens.push(itemAtual);
        itemAtual = {};
      }

      item_pedido = '';
    }

    return resultado;
  }

  removerBaseURL(url: string): string {
    const basePrefix = 'https://ingestionlayer.neogrid.com/rest/sidecar-rest/api/v1/proxy/document/';
    if (url.startsWith(basePrefix)) {
      return url.replace(basePrefix, '');
    }
    return url;
  }
}
