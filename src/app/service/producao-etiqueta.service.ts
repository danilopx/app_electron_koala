import { Injectable } from '@angular/core';

export interface EtiquetaImpressaoDados {
  internalOrder: string;
  date: string;
  productionOrder: string;
  code: string;
  time: string;
  userName: string;
  customer: string;
  productDescription: string;
  shift: string;
  netWeight: string;
  certificate: string;
  pallet: string;
  visual: string;
  packing: string;
  stretch: string;
  barcodeValue: string;
  countryOfOrigin: string;
  productType?: string;
  observation?: string;
  quantity?: string;
  unit?: string;
  volume?: string;
  sequenceLabel?: string;
}

export interface EtiquetaImpressaoResultado {
  success: boolean;
  printerName?: string;
  usedPreview?: boolean;
  error?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProducaoEtiquetaService {
  private readonly code128Patterns: string[] = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112',
  ];

  async imprimirEtiqueta(etiqueta: EtiquetaImpressaoDados): Promise<EtiquetaImpressaoResultado> {
    const html = this.buildEtiquetaHtml(etiqueta);

    if (window.electronAPI?.isDesktop) {
      const argoxPrinter = await this.findArgoxPrinter();

      if (argoxPrinter?.name) {
        const result = await window.electronAPI.printHtml({
          html,
          silent: true,
          printBackground: true,
          deviceName: argoxPrinter.name,
          margins: { marginType: 'none' },
          pageSize: {
            width: 100000,
            height: 75000,
          },
          landscape: false,
          scaleFactor: 100,
          copies: 1,
          timeoutMs: 20000,
          useDialogFallback: true,
          dialogTimeoutMs: 120000,
        });

        if (result.success) {
          return { success: true, printerName: argoxPrinter.name, usedPreview: false };
        }

        return {
          success: false,
          printerName: argoxPrinter.name,
          usedPreview: false,
          error: result.error || 'O Windows recusou o envio da etiqueta para a impressora.',
        };
      }
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return { success: false, error: 'Nao foi possivel abrir a janela de preview da etiqueta.' };
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);

    return { success: true, usedPreview: true };
  }

  private async findArgoxPrinter(): Promise<ElectronPrinterInfo | undefined> {
    if (!window.electronAPI?.getPrinters) {
      return undefined;
    }

    const printers = await window.electronAPI.getPrinters();

    return printers.find((printer) => {
      const searchable = [printer.name, printer.displayName, printer.description]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();

      return (
        searchable.includes('ARGOX') ||
        searchable.includes('OS214') ||
        searchable.includes('OS-214') ||
        searchable.includes('OS 214') ||
        searchable.includes('PPLA')
      );
    });
  }

  private buildEtiquetaHtml(etiqueta: EtiquetaImpressaoDados): string {
    if (this.isEtiquetaSerraria(etiqueta.productType)) {
      return this.buildEtiquetaSerrariaHtml(etiqueta);
    }

    const barcode = this.buildBarcodeSvg(etiqueta.barcodeValue);

    return `
      <!doctype html>
      <html lang="pt-br">
        <head>
          <meta charset="utf-8" />
          <title>Etiqueta</title>
          <style>
            @page {
              size: 100mm 75mm;
              margin: 0;
            }
            html,
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              color: #111111;
              background: #ffffff;
              width: 100mm;
              max-width: 100mm;
              height: 75mm;
              max-height: 75mm;
              overflow: hidden;
            }
            .label {
              width: 98mm;
              max-width: 98mm;
              height: 75mm;
              max-height: 75mm;
              margin: 0 auto;
              padding: 1.2mm 0.8mm 0.9mm;
              box-sizing: border-box;
              overflow: hidden;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            .label-frame {
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              border: 1px solid #4b4b4b;
              padding: 1.3mm 0 0.95mm;
              display: flex;
              flex-direction: column;
            }
            .header-grid {
              display: grid;
              grid-template-columns: 1.1fr 0.8fr 1fr;
              gap: 1mm;
              align-items: start;
              padding-left: 1.2mm;
              padding-right: 1.2mm;
            }
            .split-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2mm;
              padding-left: 1.2mm;
              padding-right: 1.2mm;
            }
            .split-grid--meta {
              gap: 0;
              align-items: center;
              justify-items: center;
            }
            .cell-title {
              font-weight: 700;
              font-size: 6.7pt;
              margin-bottom: 0.315mm;
            }
            .cell-value {
              font-size: 7pt;
              line-height: 1.05;
            }
            .row {
              padding: 0.84mm 0;
              border-bottom: 1px solid #5f5f5f;
              margin: 0;
            }
            .row-tight {
              padding-top: 0.63mm;
              padding-bottom: 0.63mm;
            }
            .row-no-border {
              border-bottom: none;
              min-height: 8mm;
            }
            .row > * {
              padding-left: 1.2mm;
              padding-right: 1.2mm;
            }
            .meta-inline {
              display: flex;
              gap: 1.26mm;
              flex-wrap: wrap;
              margin-top: 0.315mm;
              font-size: 6.6pt;
            }
            .meta-inline strong {
              font-size: 6.6pt;
            }
            .net-weight-row {
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              min-height: 9mm;
            }
            .net-weight-box {
              display: inline-flex;
              align-items: baseline;
              justify-content: center;
              gap: 2.2mm;
              width: 100%;
            }
            .net-weight-label {
              font-size: 10pt;
              font-weight: 700;
            }
            .net-weight-value {
              font-size: 16pt;
              font-weight: 700;
              line-height: 1;
            }
            .small-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              border: 1px solid #5f5f5f;
              margin-top: 0.84mm;
              margin-left: 0;
              margin-right: 0;
            }
            .small-grid div {
              min-height: 7.875mm;
              padding: 0.75mm;
              border-right: 1px solid #5f5f5f;
              box-sizing: border-box;
              font-size: 6.4pt;
              line-height: 1.1;
            }
            .small-grid div:last-child {
              border-right: none;
            }
            .field-head {
              display: block;
              font-weight: 700;
              font-size: 6.6pt;
              margin-bottom: 0.42mm;
            }
            .barcode-wrap {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
            }
            .origin {
              margin-top: 0.21mm;
              font-size: 6.5pt;
              text-align: center;
            }
            .footer-note {
              display: flex;
              justify-content: flex-end;
              margin-top: 0.315mm;
              padding-left: 1.2mm;
              padding-right: 1.2mm;
              font-size: 6.8pt;
              font-weight: 700;
            }
            .barcode-area {
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              flex: 1;
              min-height: 0;
            }
            svg {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="label-frame">
              <div class="header-grid row row-tight">
                <div>
                  <div class="cell-title">Internal Order</div>
                  <div class="cell-value">${this.escapeHtml(etiqueta.internalOrder)}</div>
                  <div class="meta-inline">
                    <span><strong>Code:</strong> ${this.escapeHtml(etiqueta.code)}</span>
                  </div>
                </div>
                <div>
                  <div class="cell-title">Date</div>
                  <div class="cell-value">${this.escapeHtml(etiqueta.date)}</div>
                  <div class="meta-inline">
                    <span><strong>Time:</strong> ${this.escapeHtml(etiqueta.time)}</span>
                  </div>
                </div>
                <div>
                  <div class="cell-title">Production Order</div>
                  <div class="cell-value">${this.escapeHtml(etiqueta.productionOrder)}</div>
                  <div class="meta-inline">
                    <span><strong>User Name:</strong> ${this.escapeHtml(etiqueta.userName)}</span>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="cell-title">Customer</div>
                <div class="cell-value">${this.escapeHtml(etiqueta.customer)}</div>
              </div>

              <div class="row">
                <div class="cell-title">Product description:</div>
                <div class="cell-value">${this.escapeHtml(etiqueta.productDescription)}</div>
              </div>

              <div class="split-grid split-grid--meta row row-tight row-no-border net-weight-row">
                <div class="net-weight-box">
                  <span class="net-weight-label">Net Weight:</span>
                  <span class="net-weight-value">${this.escapeHtml(etiqueta.netWeight)}</span>
                </div>
              </div>

              <div class="small-grid">
                <div><span class="field-head">Certificate</span>${this.renderCellValue(etiqueta.certificate)}</div>
                <div><span class="field-head">Pallet</span>${this.renderCellValue(etiqueta.pallet)}</div>
                <div><span class="field-head">Visual</span>${this.renderCellValue(etiqueta.visual)}</div>
                <div><span class="field-head">Packing</span>${this.renderCellValue(etiqueta.packing)}</div>
                <div><span class="field-head">Stretch</span>${this.renderCellValue(etiqueta.stretch)}</div>
              </div>

              <div class="barcode-area">
                <div class="barcode-wrap">
                  ${barcode}
                  <div class="origin">Country of Origin: ${this.escapeHtml(etiqueta.countryOfOrigin)}</div>
                </div>
              </div>

              <div class="footer-note">${this.escapeHtml(etiqueta.sequenceLabel || '')}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private buildEtiquetaSerrariaHtml(etiqueta: EtiquetaImpressaoDados): string {
    const barcode = this.buildBarcodeSvg(etiqueta.barcodeValue);

    return `
      <!doctype html>
      <html lang="pt-br">
        <head>
          <meta charset="utf-8" />
          <title>Etiqueta Serraria</title>
          <style>
            @page {
              size: 100mm 75mm;
              margin: 0;
            }
            html,
            body {
              margin: 0;
              padding: 0;
              width: 100mm;
              max-width: 100mm;
              height: 75mm;
              max-height: 75mm;
              background: #ffffff;
              color: #111111;
              font-family: Arial, Helvetica, sans-serif;
              overflow: hidden;
            }
            .label {
              width: 100mm;
              max-width: 100mm;
              height: 75mm;
              max-height: 75mm;
              box-sizing: border-box;
              padding: 2.5mm;
            }
            .frame {
              width: 100%;
              height: 100%;
              border: 0.8px solid #1f1f1f;
              box-sizing: border-box;
              display: grid;
              grid-template-rows: 15mm 18mm 13mm 10mm 1fr;
            }
            .section {
              border-top: 0.8px solid #1f1f1f;
              padding: 2mm 2.8mm;
              box-sizing: border-box;
              overflow: hidden;
            }
            .section-barcode {
              position: relative;
              padding-bottom: 3.2mm;
            }
            .section:first-child {
              border-top: none;
            }
            .header-top {
              display: grid;
              grid-template-columns: 1.6fr 1fr;
              gap: 5mm;
              align-items: start;
              margin-bottom: 2mm;
            }
            .header-bottom {
              display: grid;
              grid-template-columns: 1fr 1fr 1.2fr;
              gap: 5mm;
              align-items: start;
            }
            .line-row {
              display: block;
              white-space: nowrap;
            }
            .title-inline {
              font-size: 7.6pt;
              font-weight: 700;
              line-height: 1.15;
            }
            .value-inline {
              font-size: 7.6pt;
              font-weight: 400;
            }
            .align-right {
              text-align: right;
            }
            .product-title,
            .obs-title {
              font-size: 7.6pt;
              font-weight: 700;
              margin-bottom: 1.4mm;
            }
            .product-code-row {
              margin-bottom: 1.4mm;
            }
            .product-code-value {
              font-size: 8.6pt;
              font-weight: 400;
              line-height: 1.15;
            }
            .product-value {
              font-size: 8.6pt;
              font-weight: 400;
              line-height: 1.15;
              padding-left: 3mm;
            }
            .obs-value {
              font-size: 7.6pt;
              font-weight: 400;
              min-height: 5mm;
              line-height: 1.15;
            }
            .footer-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              align-items: center;
              gap: 5mm;
              height: 100%;
            }
            .pieces {
              display: flex;
              align-items: center;
              gap: 0.8mm;
              white-space: nowrap;
            }
            .volume {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              gap: 0.8mm;
              white-space: nowrap;
            }
            .footer-label {
              font-size: 7.6pt;
              font-weight: 700;
            }
            .footer-value {
              font-size: 7.6pt;
              font-weight: 400;
            }
            .barcode-wrap {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              padding-top: 0.6mm;
              padding-bottom: 0.4mm;
            }
            .footer-note {
              position: absolute;
              right: 2.8mm;
              bottom: 0.8mm;
              font-size: 6.8pt;
              font-weight: 700;
            }
            .barcode-wrap svg {
              transform: scale(0.86);
              transform-origin: center center;
            }
            svg {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="frame">
              <div class="section">
                <div class="header-top">
                  <div class="line-row">
                    <span class="title-inline">ORDEM DE PRODUÇÃO : </span>
                    <span class="value-inline">${this.escapeHtml(etiqueta.productionOrder)}</span>
                  </div>
                  <div class="line-row align-right">
                    <span class="title-inline">PEDIDO : </span>
                    <span class="value-inline">${this.escapeHtml(etiqueta.internalOrder)}</span>
                  </div>
                </div>
                <div class="header-bottom">
                  <div class="line-row">
                    <span class="title-inline">DATA : </span>
                    <span class="value-inline">${this.escapeHtml(etiqueta.date)}</span>
                  </div>
                  <div class="line-row">
                    <span class="title-inline">HORA : </span>
                    <span class="value-inline">${this.escapeHtml(etiqueta.time)}</span>
                  </div>
                  <div class="line-row align-right">
                    <span class="title-inline">OPERADOR : </span>
                    <span class="value-inline">${this.escapeHtml(etiqueta.userName)}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="product-code-row">
                  <span class="title-inline">CÓDIGO : </span>
                  <span class="product-code-value">${this.escapeHtml(etiqueta.code)}</span>
                </div>
                <div class="product-title">DESCRIÇÃO DO PRODUTO :</div>
                <div class="product-code-value">${this.escapeHtml(etiqueta.productDescription)}</div>
              </div>

              <div class="section">
                <div class="obs-title">OBSERVAÇÃO:</div>
                <div class="obs-value">${this.escapeHtml(etiqueta.observation || '-')}</div>
              </div>

              <div class="section">
                <div class="footer-row">
                  <div class="pieces">
                    <span class="footer-label">PEÇAS :</span>
                    <span class="footer-value">${this.escapeHtml(etiqueta.quantity || '-')}</span>
                  </div>
                  <div class="volume">
                    <span class="footer-label">VOLUME M³ :</span>
                    <span class="footer-value">${this.escapeHtml(etiqueta.volume || '-')}</span>
                  </div>
                </div>
              </div>

              <div class="section section-barcode">
                <div class="barcode-wrap">${barcode}</div>
                <div class="footer-note">${this.escapeHtml(etiqueta.sequenceLabel || '')}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderCellValue(value: string): string {
    return value ? this.escapeHtml(value) : '&nbsp;';
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildBarcodeSvg(value: string): string {
    const normalized = this.normalizeCode128CValue(value);
    const bars = this.gerarSequenciaCode128C(normalized);
    const moduleWidth = 2;
    const quietZone = 20;
    let cursor = quietZone;
    let rects = '';

    bars.forEach((bar) => {
      if (bar.black) {
        rects += `<rect x="${cursor}" y="0" width="${bar.width * moduleWidth}" height="52" fill="#000000" />`;
      }
      cursor += bar.width * moduleWidth;
    });

    const width = cursor + quietZone;

    return `
      <svg width="320" height="52" viewBox="0 0 ${width} 52" xmlns="http://www.w3.org/2000/svg" aria-label="Codigo de barras Code128C">
        <rect x="0" y="0" width="${width}" height="52" fill="#ffffff" />
        ${rects}
      </svg>
    `;
  }

  private gerarSequenciaCode128C(value: string): Array<{ black: boolean; width: number }> {
    const codes: number[] = [105];

    for (let index = 0; index < value.length; index += 2) {
      codes.push(Number(value.slice(index, index + 2)));
    }

    let checksum = 105;
    for (let index = 1; index < codes.length; index++) {
      checksum += codes[index] * index;
    }
    checksum %= 103;
    codes.push(checksum, 106);

    const sequence = codes.map((code) => this.code128Patterns[code]).join('');
    const bars: Array<{ black: boolean; width: number }> = [];
    let black = true;

    for (const digit of sequence.split('')) {
      bars.push({ black, width: Number(digit) });
      black = !black;
    }

    return bars;
  }

  private normalizeCode128CValue(value: string): string {
    let normalized = String(value || '').replace(/\D/g, '');

    if (!normalized) {
      normalized = '000000';
    }

    if (normalized.length % 2 !== 0) {
      normalized = `0${normalized}`;
    }

    return normalized;
  }

  private isEtiquetaSerraria(productType?: string): boolean {
    const normalized = String(productType || '').trim().toUpperCase();
    return normalized === 'SERRARIA' || normalized === 'SERRALHERIA';
  }
}
