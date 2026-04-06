import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef
} from '@angular/core';
import {
  PoTableAction,
  PoTableColumn,
  PoTableColumnIcon,
  PoTableColumnSpacing,
  PoTableColumnTemplateDirective,
  PoTableLiterals,
  PoTableRowTemplateDirective
} from '@po-ui/ng-components';

@Component({
  selector: 'app-table',
  templateUrl: './app-table.component.html',
  styleUrls: ['./app-table.component.scss'],
})
export class AppTableComponent implements OnChanges, AfterContentInit {
  @Input('p-columns') columns: Array<PoTableColumn> = [];
  @Input('p-items') items: Array<any> = [];
  @Input() headerLabel = 'Registros';
  @Input('p-page-size') pageSize = 12;
  @Input() searchPlaceholder = 'Buscar';
  private _page = 1;

  @Input('p-page')
  set page(value: any) {
    const nextPage = this.toNumber(value);
    if (!nextPage || nextPage < 1) {
      return;
    }
    if (nextPage !== this._page) {
      this._page = nextPage;
      this.currentPage = nextPage;
      this.updateDisplayedItems();
    }
  }
  get page(): number {
    return this._page;
  }

  searchTerm = '';

  private _hideColumnsManager = false;
  private _hideTableSearch = false;
  private _hideExpand = false;
  private _sort = false;
  private _striped = false;
  private _selectable = false;
  private _selectableEntireLine = false;
  private _singleSelect = false;
  private _autoCollapse = false;
  private _loading = false;
  private _hideBatchActions = false;
  private _infiniteScroll = false;
  private _infiniteScrollDistance?: number;
  private _serverSide = false;
  @Input('p-total-records') totalRecords?: number;

  @Input('p-hide-columns-manager')
  set hideColumnsManager(value: any) { this._hideColumnsManager = this.toBoolean(value); }
  get hideColumnsManager() { return this._hideColumnsManager; }

  @Input('p-hide-table-search')
  set hideTableSearch(value: any) { this._hideTableSearch = this.toBoolean(value); }
  get hideTableSearch() { return this._hideTableSearch; }

  @Input('p-hide-expand')
  set hideExpand(value: any) { this._hideExpand = this.toBoolean(value); }
  get hideExpand() { return this._hideExpand; }

  @Input('p-sort')
  set sort(value: any) { this._sort = this.toBoolean(value); }
  get sort() { return this._sort; }

  @Input('p-striped')
  set striped(value: any) { this._striped = this.toBoolean(value); }
  get striped() { return this._striped; }

  @Input('p-selectable')
  set selectable(value: any) { this._selectable = this.toBoolean(value); }
  get selectable() { return this._selectable; }

  @Input('p-selectable-entire-line')
  set selectableEntireLine(value: any) { this._selectableEntireLine = this.toBoolean(value); }
  get selectableEntireLine() { return this._selectableEntireLine; }

  @Input('p-single-select')
  set singleSelect(value: any) { this._singleSelect = this.toBoolean(value); }
  get singleSelect() { return this._singleSelect; }

  @Input('p-auto-collapse')
  set autoCollapse(value: any) { this._autoCollapse = this.toBoolean(value); }
  get autoCollapse() { return this._autoCollapse; }

  @Input('p-container') container: boolean | string = false;

  @Input('p-height')
  set height(value: any) { this._height = this.toNumber(value); }
  get height() { return this._height; }
  private _height?: number;

  @Input('p-literals') literals: PoTableLiterals = {};

  @Input('p-max-columns')
  set maxColumns(value: any) { this._maxColumns = this.toNumber(value); }
  get maxColumns() { return this._maxColumns; }
  private _maxColumns?: number;

  @Input('p-loading')
  set loading(value: any) { this._loading = this.toBoolean(value); }
  get loading() { return this._loading; }

  @Input('p-actions') actions: Array<PoTableAction> = [];

  @Input('p-hide-batch-actions')
  set hideBatchActions(value: any) { this._hideBatchActions = this.toBoolean(value); }
  get hideBatchActions() { return this._hideBatchActions; }

  @Input('p-spacing') spacing?: PoTableColumnSpacing;

  @Input('p-infinite-scroll')
  set infiniteScroll(value: any) { this._infiniteScroll = this.toBoolean(value); }
  get infiniteScroll() { return this._infiniteScroll; }

  @Input('p-infinite-scroll-distance')
  set infiniteScrollDistance(value: any) { this._infiniteScrollDistance = this.toNumber(value); }
  get infiniteScrollDistance() { return this._infiniteScrollDistance; }

  @Input('p-server-side')
  set serverSide(value: any) { this._serverSide = this.toBoolean(value); }
  get serverSide() { return this._serverSide; }

  @Output('p-show-more') showMore = new EventEmitter<any>();
  @Output('p-page-change') pageChange = new EventEmitter<{ page: number; pageSize: number }>();
  @Output('p-expanded') expanded = new EventEmitter<any>();
  @Output('p-collapsed') collapsed = new EventEmitter<any>();
  @Output('p-selected') selected = new EventEmitter<any>();
  @Output('p-unselected') unselected = new EventEmitter<any>();

  @ContentChildren(PoTableColumnTemplateDirective)
  columnTemplates!: QueryList<PoTableColumnTemplateDirective>;

  @ContentChild(PoTableRowTemplateDirective)
  rowTemplate?: PoTableRowTemplateDirective;

  visibleColumns: Array<PoTableColumn> = [];
  displayedItems: Array<any> = [];
  currentPage = 1;
  totalPages = 1;
  sortProperty?: string;
  sortAscending = true;
  private expandedRows = new Set<any>();
  private selectedRows = new Set<any>();
  private columnTemplateMap = new Map<string, PoTableColumnTemplateDirective>();
  statusLegend: Array<{ label: string; className: string }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] || changes['maxColumns']) {
      this.updateColumns();
    }
    if (changes['items'] || changes['sort'] || changes['columns']) {
      this.updateDisplayedItems();
    }
  }

  ngAfterContentInit(): void {
    this.mapColumnTemplates();
    this.columnTemplates.changes.subscribe(() => this.mapColumnTemplates());
  }

  get sortEnabled(): boolean {
    return this.sort;
  }

  get hasActions(): boolean {
    return this.actions && this.actions.length > 0;
  }

  get isServerSide(): boolean {
    return this.serverSide || this.totalRecords !== undefined;
  }

  get shownCount(): number {
    if (!this.isServerSide) {
      return this.displayedItems.length;
    }
    const total = this.totalRecords ?? this.items.length;
    const remaining = total - (this.currentPage - 1) * this.pageSize;
    return Math.max(0, Math.min(this.pageSize, remaining));
  }

  get showExpandColumn(): boolean {
    return !!this.rowTemplate && !this.hideExpand;
  }

  get columnCount(): number {
    let count = this.visibleColumns.length;
    if (!count && this.columns?.length) {
      count = this.columns.filter(column => column.visible !== false).length;
    }
    if (this.showExpandColumn) {
      count += 1;
    }
    if (this.hasActions) {
      count += 1;
    }
    return Math.max(1, count);
  }

  onSort(column: PoTableColumn): void {
    if (!this.sortEnabled || column.sortable === false || !column.property) {
      return;
    }
    if (this.sortProperty === column.property) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortProperty = column.property;
      this.sortAscending = true;
    }
    this.updateDisplayedItems();
  }

  onRowClick(row: any, rowIndex: number): void {
    if (!this.selectable) {
      return;
    }
    if (this.singleSelect) {
      this.selectedRows.clear();
    }
    const isSelected = this.selectedRows.has(row);
    if (isSelected) {
      this.selectedRows.delete(row);
      this.unselected.emit(row);
    } else {
      this.selectedRows.add(row);
      this.selected.emit(row);
    }
  }

  isSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  getSelectedRows(): any[] {
    return Array.from(this.selectedRows);
  }

  unselectRows(): void {
    this.selectedRows.clear();
  }

  toggleRow(row: any, rowIndex: number, event: Event): void {
    event.stopPropagation();
    if (!this.rowTemplate) {
      return;
    }
    if (!this.canExpand(row, rowIndex)) {
      return;
    }
    if (this.expandedRows.has(row)) {
      this.expandedRows.delete(row);
      this.collapsed.emit(row);
    } else {
      if (this.autoCollapse) {
        this.expandedRows.clear();
      }
      this.expandedRows.add(row);
      this.expanded.emit(row);
    }
  }

  isExpanded(row: any): boolean {
    return this.expandedRows.has(row);
  }

  canExpand(row: any, rowIndex: number): boolean {
    if (!this.rowTemplate) {
      return false;
    }
    if (this.rowTemplate.poTableRowTemplateShow) {
      return this.rowTemplate.poTableRowTemplateShow(row, rowIndex);
    }
    return true;
  }

  getColumnTemplate(column: PoTableColumn): PoTableColumnTemplateDirective | undefined {
    if (!column.property) {
      return undefined;
    }
    return this.columnTemplateMap.get(column.property);
  }

  getCellValue(row: any, column: PoTableColumn): any {
    if (!column.property) {
      return '';
    }
    return column.property.split('.').reduce((acc: any, part: string) => (acc ? acc[part] : undefined), row);
  }

  formatValue(value: any, column: PoTableColumn): any {
    if (value === null || value === undefined) {
      return '';
    }
    if (column.type === 'label' && column.labels) {
      return this.getLabelForValue(column, value);
    }
    if (column.type === 'boolean') {
      return value ? (column.boolean?.trueLabel ?? 'Sim') : (column.boolean?.falseLabel ?? 'Não');
    }
    return value;
  }

  getColumnIcons(column: PoTableColumn): Array<PoTableColumnIcon> {
    return (column.icons || []) as Array<PoTableColumnIcon>;
  }

  executeColumnIcon(icon: PoTableColumnIcon, row: any, event: Event): void {
    event.stopPropagation();
    if ((icon as any).disabled) {
      return;
    }
    if ((icon as any).action) {
      (icon as any).action(row);
    }
  }

  onScroll(event: Event): void {
    if (!this.infiniteScroll) {
      return;
    }
    const target = event.target as HTMLElement;
    const distance = this.infiniteScrollDistance ?? 0;
    if (target.scrollHeight - target.scrollTop - target.clientHeight <= distance) {
      this.showMore.emit(true);
    }
  }

  getRowActions(row: any): Array<PoTableAction> {
    return (this.actions || []).filter(action => {
      if (typeof action.visible === 'function') {
        return action.visible(row);
      }
      if (typeof action.visible === 'boolean') {
        return action.visible;
      }
      return true;
    });
  }

  isActionDisabled(action: PoTableAction, row: any): boolean {
    if (typeof action.disabled === 'function') {
      return action.disabled(row);
    }
    return !!action.disabled;
  }

  executeAction(action: PoTableAction, row: any, event: Event): void {
    event.stopPropagation();
    if (this.isActionDisabled(action, row)) {
      return;
    }
    if (action.action) {
      action.action(row);
    }
  }

  isIconString(icon: PoTableAction['icon']): boolean {
    return typeof icon === 'string';
  }

  getIconLabel(icon: any): string {
    return icon?.label ?? '';
  }

  private toBoolean(value: any): boolean {
    if (value === '' || value === true) {
      return true;
    }
    if (value === false || value === null || value === undefined) {
      return false;
    }
    return String(value).toLowerCase() !== 'false';
  }

  private toNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private updateColumns(): void {
    const visible = (this.columns || []).filter(column => column.visible !== false);
    const ordered = [...visible].sort((a, b) => {
      const aIsStatus = this.isStatusColumn(a);
      const bIsStatus = this.isStatusColumn(b);
      if (aIsStatus && !bIsStatus) {
        return -1;
      }
      if (!aIsStatus && bIsStatus) {
        return 1;
      }
      return 0;
    });

    if (this.maxColumns && ordered.length > this.maxColumns) {
      this.visibleColumns = ordered.slice(0, this.maxColumns);
    } else {
      this.visibleColumns = ordered;
    }
    this.buildStatusLegend();
  }

  isStatusColumn(column: PoTableColumn): boolean {
    if (!column || !column.property) {
      return false;
    }
    const property = column.property.toLowerCase();
    return property === 'status' || property === 'statusportal' || property === 'solicitacao_step' || property === 'op_status';
  }

  getStatusLabel(column: PoTableColumn, value: any): string {
    if (!column || !column.labels) {
      return String(value ?? '');
    }
    const found = column.labels.find(label => String(label.value ?? '') === String(value ?? ''));
    return found?.label ?? String(value ?? '');
  }

  private getLabelForValue(column: PoTableColumn, value: any): string {
    const normalize = (input: any) => String(input ?? '').trim().toUpperCase();
    const target = normalize(value);
    const found = (column.labels || []).find(label => normalize(label.value) === target);
    return found?.label ?? String(value ?? '');
  }

  getStatusClass(value: any): string {
    const code = String(value ?? '').toUpperCase();
    if (code === 'ABERTA') {
      return 'status-dot open';
    }
    if (code === 'PARCIALMENTE_APONTADA') {
      return 'status-dot analysis';
    }
    if (code === 'FINALIZADA') {
      return 'status-dot delivered';
    }
    if (code === '1') {
      return 'status-dot step-created';
    }
    if (code === '2') {
      return 'status-dot step-blocked';
    }
    if (code === '3') {
      return 'status-dot step-billing';
    }
    if (code === '4') {
      return 'status-dot step-transmission';
    }
    if (code === '5') {
      return 'status-dot step-classification';
    }
    if (code === '6') {
      return 'status-dot step-return';
    }
    if (code === '7') {
      return 'status-dot step-done';
    }
    if (code === 'AB' || code === 'A_ABERTO') {
      return 'status-dot open';
    }
    if (code === 'FT' || code === '10') {
      return 'status-dot delivered';
    }
    if (code === 'FP') {
      return 'status-dot analysis';
    }
    if (code === 'E_ENT_PARCIAL') {
      return 'status-dot entrega-parcial';
    }
    if (code === 'F_ENT_TOTAL') {
      return 'status-dot delivered';
    }
    if (code === 'SC9_MISTO' || code === '01' || code === '04' || code === '05' || code === '09' || code === 'ZZ') {
      return 'status-dot credito';
    }
    if (code === '02') {
      return 'status-dot blq-estoque';
    }
    if (code === '03') {
      return 'status-dot blq-estoque-manual';
    }
    if (code === 'B_BLOQ_REGRA') {
      return 'status-dot blq-regra';
    }
    if (code === 'C_BLOQ_VERBA') {
      return 'status-dot blq-verba';
    }
    if (code === 'D_ENCERRADO') {
      return 'status-dot encerrado';
    }
    if (code === 'H_SEM_STATUS') {
      return 'status-dot sem-status';
    }
    return 'status-dot other';
  }

  getLabelClass(column: PoTableColumn, value: any): string {
    const normalize = (input: any) => String(input ?? '').trim().toUpperCase();
    const target = normalize(value);
    const label = (column.labels || []).find(item => normalize(item.value) === target);
    const color = String(label?.color ?? '').toLowerCase();

    if (color === 'green' || target === 'T') {
      return 'kpi-status kpi-status-aberto';
    }
    if (color === 'gray' || target === 'N') {
      return 'kpi-status kpi-status-parcial';
    }
    if (color === 'red') {
      return 'kpi-status kpi-status-faturado';
    }
    return 'kpi-status';
  }

  private buildStatusLegend(): void {
    const statusColumn = (this.columns || []).find(col => this.isStatusColumn(col));
    if (!statusColumn || !statusColumn.labels) {
      this.statusLegend = [];
      return;
    }
    const seen = new Set<string>();
    this.statusLegend = statusColumn.labels
      .map(label => ({
        label: label.label ?? String(label.value ?? ''),
        className: this.getStatusClass(label.value),
      }))
      .filter(item => {
        const key = `${item.label}|${item.className}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  private updateDisplayedItems(): void {
    let items = Array.isArray(this.items) ? [...this.items] : [];
    if (this.searchTerm && this.searchTerm.trim().length) {
      const term = this.searchTerm.toLowerCase();
      items = items.filter(item => {
        const searchableColumns = this.visibleColumns.length ? this.visibleColumns : (this.columns || []);

        for (const column of searchableColumns) {
          const value = this.getCellValue(item, column);
          if (value === null || value === undefined) {
            continue;
          }
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            if (String(value).toLowerCase().includes(term)) {
              return true;
            }
          }
          if (value instanceof Date) {
            if (value.toISOString().toLowerCase().includes(term)) {
              return true;
            }
          }
        }
        return false;
      });
    }
    if (this.sortEnabled && this.sortProperty) {
      items.sort((a, b) => {
        const aValue = this.getCellValue(a, { property: this.sortProperty } as PoTableColumn);
        const bValue = this.getCellValue(b, { property: this.sortProperty } as PoTableColumn);
        if (aValue === bValue) {
          return 0;
        }
        if (aValue === undefined || aValue === null) {
          return this.sortAscending ? -1 : 1;
        }
        if (bValue === undefined || bValue === null) {
          return this.sortAscending ? 1 : -1;
        }
        return this.sortAscending ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
      });
    }
    if (this.isServerSide) {
      const total = (this.totalRecords && this.totalRecords > 0) ? this.totalRecords : 100;
      this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
      this.displayedItems = items;
      return;
    }

    this.totalPages = Math.max(1, Math.ceil(items.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedItems = items.slice(start, end);
  }

  goToPage(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage -= 1;
    }
    if (direction === 'next' && this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
    this.updateDisplayedItems();
    this.pageChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  setPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
    this.updateDisplayedItems();
    this.pageChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  private mapColumnTemplates(): void {
    this.columnTemplateMap.clear();
    if (!this.columnTemplates) {
      return;
    }
    this.columnTemplates.forEach(template => {
      if (template.targetProperty) {
        this.columnTemplateMap.set(template.targetProperty, template);
      }
    });
  }
}
