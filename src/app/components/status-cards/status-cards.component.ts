import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface StatusCardItem {
  step: string;
  label: string;
  colorClass: string;
  count: number;
}

@Component({
  selector: 'app-status-cards',
  templateUrl: './status-cards.component.html',
  styleUrls: ['./status-cards.component.scss'],
})
export class StatusCardsComponent {
  @Input() cards: StatusCardItem[] = [];
  @Input() title = 'Pedidos';
  @Input() loading = false;
  @Input() updatedAt = '';
  @Output() list = new EventEmitter<string>();

  onList(step: string): void {
    this.list.emit(step);
  }
}
