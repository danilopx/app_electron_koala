import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SupportModalPayload {
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupportModalService {
  private readonly openSubject = new Subject<SupportModalPayload>();

  get open$(): Observable<SupportModalPayload> {
    return this.openSubject.asObservable();
  }

  openWithMessage(subject: string, message: string): void {
    this.openSubject.next({ subject, message });
  }
}
