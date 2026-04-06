import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PoModalComponent, PoNotificationService } from '@po-ui/ng-components';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { Observable, throwError } from 'rxjs';
import { Iordem } from '../../interfaces/interface-ordem';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-iot',
  templateUrl: './iot.component.html',
  styleUrls: ['./iot.component.scss']
})
export class IotComponent implements OnInit {
  @ViewChild('zoomModal', { static: true })
  zoomModalElement!: PoModalComponent;
  @ViewChild('zoomBody')
  zoomBodyElement?: ElementRef<HTMLDivElement>;

  constructor(
    private fb: UntypedFormBuilder,
    private http: HttpClient,
    private poNotification: PoNotificationService
  ) {
    GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';
    this.createReactiveForm();
  }

  reactiveForm!: UntypedFormGroup;

  // ✅ TIPO CORRETO PARA ng2-pdf-viewer
  pdfSrc!: Uint8Array;
  pdfUrl?: string;
  private pdfObjectUrl?: string;
  private pdfBuffer?: ArrayBuffer;
  pdfImageUrl?: string;

  loadingState = false;
  iOrdem!: Iordem[];

  getEmpresa: string = environment.grupo ?? '';
  getFilial: string = environment.filial ?? '';

  produtoView = '';
  zoomTitle = 'PDF';

  ngOnInit(): void {
    this.createReactiveForm();
  }

  createReactiveForm() {
    this.reactiveForm = this.fb.group({
      ordem: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(11)
        ])
      ]
    });
  }

  saveForm() {
    this.loadingState = true;
    const ordemControl = this.reactiveForm.get('ordem');

    if (ordemControl instanceof AbstractControl) {
      const ordemValue = ordemControl.value;

      this.getOpData(ordemValue, this.getEmpresa, this.getFilial)
        .subscribe((data) => {
          if (data?.ordem?.length) {
            this.iOrdem = data.ordem;
            this.getIOTPDF(this.iOrdem);
          } else {
            this.poNotification.warning('Ordem de Produção Não encontrada!');
            this.pdfSrc = undefined as any;
            this.clearPdfUrl();
            this.produtoView = '';
          }

          this.loadingState = false;
          ordemControl.setValue('');
        });
    } else {
      this.loadingState = false;
    }
  }

 downloadFile(codigo: string): Observable<ArrayBuffer> {
  // Endpoint legado dependia de `environment.apiApp`, removido com módulos antigos.
  return throwError(() => new Error('Rotina de PDF IoT desativada.'));
}

getIOTPDF(iOrdem: Iordem[]) {
  const produto = iOrdem[0]['B1_DESC'].split(' ');
  const codigo = produto.find(part => /^\d+$/.test(part)) ?? produto[0];

  if (!codigo) {
    this.poNotification.warning('IO Não Encontrada, Informe a Qualidade.');
    this.pdfSrc = undefined as any;
    this.pdfImageUrl = undefined;
    this.produtoView = '';
    return;
  }

      this.downloadFile(codigo).subscribe({
    next: (buffer: ArrayBuffer) => {
      // ✅ verifica assinatura do PDF
      const head = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 5)));
      if (head !== '%PDF-') {
        console.error('Resposta não é PDF. Assinatura:', head);
        this.poNotification.warning('O servidor não retornou um PDF válido.');
        this.pdfSrc = undefined as any;
        this.clearPdfUrl();
        this.pdfImageUrl = undefined;
        return;
      }

      this.produtoView = `${iOrdem[0]['C2_OP']} - ${iOrdem[0]['B1_DESC']}`;
      this.zoomTitle = this.produtoView;
      this.pdfSrc = new Uint8Array(buffer);
      this.pdfBuffer = buffer;
      this.setPdfUrl(buffer);
      void this.renderPdfToImage(buffer);
    },
    error: (err) => {
      console.error(err);
      this.poNotification.warning('Tente novamente!');
    }
  });
}
  getOpData(
    opId: string,
    grupo?: string,
    filial?: string
  ): Observable<any> {
    // Endpoint legado dependia de `environment.apiApp`, removido com módulos antigos.
    return throwError(() => new Error('Consulta de ordem IoT desativada.'));
  }

  openZoomModal() {
    if (!this.pdfSrc || !this.pdfUrl) {
      return;
    }

    this.zoomModalElement.open();
    setTimeout(() => {
      if (!this.pdfBuffer) {
        return;
      }

      void this.renderPdfToImage(this.pdfBuffer);
    }, 0);
  }

  closeZoomModal() {
    this.zoomModalElement.close();
  }

  private setPdfUrl(buffer: ArrayBuffer) {
    this.clearPdfUrl();
    this.pdfObjectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
    this.pdfUrl = this.pdfObjectUrl;
  }

  private clearPdfUrl() {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }

    this.pdfObjectUrl = undefined;
    this.pdfUrl = undefined;
  }

  private async renderPdfToImage(
    buffer: ArrayBuffer
  ) {
    try {
      const loadingTask = getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      if (!context) {
        return;
      }

      await page.render({ canvasContext: context, viewport }).promise;
      this.pdfImageUrl = canvas.toDataURL('image/png');
    } catch (error) {
      console.error(error);
      this.pdfImageUrl = undefined;
    }
  }
}
