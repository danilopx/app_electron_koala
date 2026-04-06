import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  public sessionStorageReady = new BehaviorSubject<boolean>(false);

  sessionStorageReady$ = this.sessionStorageReady.asObservable();

  constructor() {
    this.checkSessionStorage();
  }

  public checkSessionStorage() {
    if (environment.grupo) {
      this.sessionStorageReady.next(true);
    }
  }

  public markReady(): void {
    this.sessionStorageReady.next(true);
  }
}
