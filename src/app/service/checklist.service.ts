import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, from, lastValueFrom, map, mergeMap, Observable, of, toArray } from 'rxjs';
import { IUnidade } from '../interfaces/interface-checklist';
import { PedidoIdi } from 'src/app/interfaces/interface-pedidoedi';
import { Cliente } from '../interfaces/interface-cliente';

@Injectable()
export class ChecklistService {
  constructor(private http: HttpClient) {}
  /////////////////////////////// API EDI /////////////////////////////////////////////////////////////////////////////////////////////////////////

  setUnidade(unidade: any): Observable<any> {
    console.log('Payload:', unidade); // Aqui o payload é um objeto
    // Endpoint legado dependia de `environment.apiCheckList`, removido com módulos antigos.
    return of(null);
  }

  getUnidade(id: string): Observable<IUnidade[]> {
    // Endpoint legado dependia de `environment.apiCheckList`, removido com módulos antigos.
    return of([]);
  }

  deleteUnidade(id: string): Observable<any> {
    // Endpoint legado dependia de `environment.apiCheckList`, removido com módulos antigos.
    return of(null);
  }
  alterStatusUnidade(id: string): Observable<any> {
    // Endpoint legado dependia de `environment.apiCheckList`, removido com módulos antigos.
    return of(null);
  }
  /*
  downloadDocuments(documentos: any[]): Observable<any[]> {
    return from(documentos).pipe(
      mergeMap((doc) => {
        const urlLimpa = this.removerBaseURL(doc.downloadLink);
        return this.http.get(environment.apiEdiDoc + urlLimpa, { responseType: 'text' }).pipe(
          mergeMap(async (rawText) => {
            try {
              const json = await this.parseTxtToJson(rawText);
              return { documentId: doc.documentId, json };
            } catch (parseError) {
              console.error(`Erro ao parsear documento ${doc.documentId}:`, parseError);
              return { documentId: doc.documentId, json: null };
            }
          }),
          catchError((err) => {
            console.error(`Erro ao baixar documento ${doc.documentId}:`, err);
            return of({ documentId: doc.documentId, json: null });
          }),
        );
      }),
      toArray(),
    );
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

    return this.http.patch<any[]>(environment.apiEdi, payload);
  }

  /////////////////////////////// API Protheus ///////////////////////////////////////////////////////////////////////////////////////////

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
    limit: number,
  ): Observable<PedidoIdi[]> {
    return this.http
      .get<{
        pedido_edi: PedidoIdi[];
      }>(
        `${environment.apiRoot}PEDIDO_EDI?GRUPO=${grupo}&FILIAL=${filial}&PEDIDO=${pedido}&PEDIDO_CLI=${pedidoCli}&STATUS=${status}&OFFISET=1&LIMIT=${limit}`,
      )
      .pipe(map((response) => response.pedido_edi));
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
        itemAtual = {
          item_pedido: linha.slice(2, 8).trim(),
          Cod_prod_cli: linha.slice(25, 40).trim(),
          quantidade: `${linha.slice(55, 62).trim()}.${linha.slice(62, 64).trim()}`,
        };
      } else if (linha.startsWith('05')) {
        itemAtual.data_entrega = linha.slice(24, 32).trim();

        // Adiciona os dados do cliente também no item
        itemAtual.nome_cliente = cliente?.cliente_nome || 'Desconhecido';
        itemAtual.codigo_cliente = cliente?.cliente_codigo || '';
        itemAtual.loja_cliente = cliente?.cliente_loja || '';

        resultado.itens.push(itemAtual);
        itemAtual = {};
      }
    }

    return resultado;
  }

  removerBaseURL(url: string): string {
    const basePrefix = 'https://ingestionlayer.neogrid.com/rest/sidecar-rest/api/v1/proxy/document/';
    if (url.startsWith(basePrefix)) {
      return url.replace(basePrefix, '');
    }
    return url;
  }*/
}
