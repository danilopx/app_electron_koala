import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LicenseErrorModalService {
  private modalActive = false;
  private readonly licenseErrorSubject = new Subject<string>();

  readonly licenseError$ = this.licenseErrorSubject.asObservable();

  show(message: string): void {
    if (this.modalActive) {
      return;
    }

    this.modalActive = true;
    this.licenseErrorSubject.next(
      String(message || '').trim() ||
        'Nao existe licenca disponivel no License Server para atender a requisicao nesse momento.',
    );
  }

  close(): void {
    this.modalActive = false;
  }
}
