import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarStateService {
  private readonly collapsedKey = 'sidebar_collapsed';
  private readonly collapsedSubject = new BehaviorSubject<boolean>(this.readInitialCollapsed());

  readonly collapsed$ = this.collapsedSubject.asObservable();

  get collapsed(): boolean {
    return this.collapsedSubject.value;
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsedSubject.next(collapsed);
    localStorage.setItem(this.collapsedKey, String(collapsed));
  }

  toggle(): void {
    this.setCollapsed(!this.collapsed);
  }

  private readInitialCollapsed(): boolean {
    const stored = localStorage.getItem(this.collapsedKey);
    return stored !== null ? stored === 'true' : true;
  }
}
