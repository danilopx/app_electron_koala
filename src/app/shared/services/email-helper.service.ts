import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmailHelperService {
  enviarLog(log: string, destinatario = ''): void {


    const assunto = 'EDI - Importação de Pedidos - Log de Importação';
    const corpoTexto = this.converterHtmlParaTexto(log);

    const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoTexto)}`;
    window.location.href = mailtoLink;
  }

  formatarLogProtheus(erroBruto: string): string {
    // Substitui os separadores por marcação
    let html = erroBruto;

    html = html.replace('Erro na inclusao do pedido - AJUDA:', '<b>⚠️ Erro na Inclusão do Pedido:</b><br>AJUDA:');
    html = html.replace('Tabela SC5', '<br><hr><b>📄 Tabela SC5 (Cabeçalho)</b>');
    html = html.replace('Tabela SC6', '<br><hr><b>📦 Tabela SC6 (Itens)</b>');
    html = html.replace('Erro no Item 1', '<br><b>Erro no Item 1</b>');

    // Quebras entre campos do tipo "Campo - C5_X := VALOR"
    html = html.replace(/([A-Z0-9._]+ - [A-Z0-9_]+ := )/g, '<br>$1');

    // Melhorar visual dos valores (bold no valor)
    html = html.replace(/([A-Z0-9_]+ := )([^\n<]+)/g, '$1<b>$2</b>');

    // Substituir possíveis múltiplos <br> consecutivos
    html = html.replace(/<br><br>/g, '<br>');

    return html;
  }

  private converterHtmlParaTexto(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}
