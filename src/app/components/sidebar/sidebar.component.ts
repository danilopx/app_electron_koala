import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PoMenuItem } from '@po-ui/ng-components';
import { Subscription } from 'rxjs';
import { SidebarStateService } from '../../service/sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly expandedKey = 'sidebar_expanded_groups';
  private sidebarSubscription?: Subscription;
  @Input() menus: Array<PoMenuItem> = [];
  collapsed = true;
  expandedGroups = new Set<string>();

  constructor(private sidebarStateService: SidebarStateService) {}

  ngOnInit(): void {
    this.collapsed = this.sidebarStateService.collapsed;
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe((collapsed) => {
      this.collapsed = collapsed;
    });

    const expanded = localStorage.getItem(this.expandedKey);
    if (expanded) {
      try {
        const parsed = JSON.parse(expanded) as string[];
        this.expandedGroups = new Set(parsed);
      } catch {
        this.expandedGroups = new Set<string>();
      }
    }
  }

  ngOnDestroy(): void {
    this.sidebarSubscription?.unsubscribe();
  }

  toggleCollapse(): void {
    this.sidebarStateService.toggle();
  }

  toggleGroup(label: string): void {
    if (this.expandedGroups.has(label)) {
      this.expandedGroups.delete(label);
    } else {
      this.expandedGroups.clear();
      this.expandedGroups.add(label);
    }
    this.persistExpanded();
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups.has(label);
  }

  shortLabel(item: PoMenuItem): string {
    const label = (item.shortLabel || item.label || '').toString();
    return label.trim().slice(0, 2).toUpperCase() || '?';
  }

  handleAction(item: PoMenuItem): void {
    if (item.action) {
      item.action(item);
    }
  }
  private persistExpanded(): void {
    localStorage.setItem(this.expandedKey, JSON.stringify(Array.from(this.expandedGroups)));
  }
}
