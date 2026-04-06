import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Executor } from '../../../interfaces/executor.interface';
import { map, tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class ExecutorService {
  /** Ferramentas de Reatividade para renderizar os componentes de forma dinãmica. */
  private executoresSubject = new BehaviorSubject<Executor[]>([]);
  public executores$ = this.executoresSubject.asObservable();

  constructor(private httpClient: HttpClient) {}

  carregarExecutores(solicitacao_tipo?: string): void {
    // Endpoint legado dependia de `environment.apiAppMT`, removido com módulos antigos.
    this.executoresSubject.next([]);
  }
}
