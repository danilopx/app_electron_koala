import { Component, ViewChild } from '@angular/core';
import { PoModalComponent, PoDynamicFormField, PoNotificationService } from '@po-ui/ng-components';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionStorageService } from '../../components/header/service/session-storage.service';
import { environment } from '../../../environments/environment';
import { ConfiguracaoSistemaService } from '../../service/configuracao-sistema.service';

interface QuickAccessItem {
  titulo: string;
  descricao: string;
  rota: string;
  tag: string;
}

interface CalendarDay {
  label: string;
  muted?: boolean;
  active?: boolean;
  holiday?: boolean;
  holidayName?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [PoNotificationService],
})
export class HomeComponent {
  @ViewChild(PoModalComponent, { static: true }) poModal!: PoModalComponent;
  gurpos!: string;
  argoxStatus: 'checking' | 'found' | 'missing' | 'unavailable' = 'unavailable';
  argoxPrinterName = '';
  constructor(
    private router: Router,
    private poNotification: PoNotificationService,
    private sessionStorageService: SessionStorageService,
    private configuracaoSistemaService: ConfiguracaoSistemaService,
  ) {}

  loadingState = false;
  titleDetailsModal = '';
  formValue = {};
  PedidoForm?: NgForm;
  fields!: Array<PoDynamicFormField>;
  action!: string;
  isAnonymousLogin = false;
  userName = '';
  tenantLabel = '';
  calendarMonthLabel = '';
  calendarYearLabel = '';
  readonly calendarWeekLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  calendarDays: CalendarDay[] = [];
  private calendarCursor = new Date();
  quickAccessPrimary: QuickAccessItem[] = [];

  ngOnInit() {
    this.refreshSessionData();
    this.buildQuickAccess();
    this.sessionStorageService.sessionStorageReady$.subscribe((ready) => {
      if (ready) {
        this.refreshSessionData();
        this.buildQuickAccess();
      }
    });
    this.configuracaoSistemaService.runtimeChanges$.subscribe(() => {
      this.buildQuickAccess();
    });
    this.buildCalendar();
    this.loadPrinterStatus();

    if (environment.filial == null && 1 != 1) {
      this.action = 'filial';

      this.titleDetailsModal = 'Selecione Empresa/Filial';

      this.fields = this.getCamposForm();

      this.poModal.open();
    }
  }
  alter(): void {
    if (this.action == 'filial') {
      const _filial = this.PedidoForm?.form.value.filial.split('-')[0];
      this.poNotification.success(this.PedidoForm?.form.value.filial);
      this.poModal.close();
    }
  }
  getFormPedido(form: NgForm) {
    this.PedidoForm = form;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  shouldShowPrinterWarning(): boolean {
    return this.argoxStatus === 'missing' || this.argoxStatus === 'unavailable';
  }

  getPrinterWarningMessage(): string {
    if (this.argoxStatus === 'unavailable') {
      return 'Nao foi possivel validar a impressora Argox neste ambiente.';
    }

    return 'Instale ou configure uma Argox OS214 Plus para usar a impressão automática de etiquetas.';
  }

  private async loadPrinterStatus(): Promise<void> {
    if (!window.electronAPI?.isDesktop || !window.electronAPI.getPrinters) {
      this.argoxStatus = 'unavailable';
      return;
    }

    this.argoxStatus = 'checking';

    try {
      const printers = await window.electronAPI.getPrinters();
      const argoxPrinter = printers.find((printer) => {
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

      if (argoxPrinter?.name) {
        this.argoxStatus = 'found';
        this.argoxPrinterName = argoxPrinter.name;
        return;
      }

      this.argoxStatus = 'missing';
    } catch {
      this.argoxStatus = 'unavailable';
    }
  }

  getCamposForm(grupos = ''): Array<PoDynamicFormField> {
    if (this.action === 'filial') {
      return [
        {
          property: 'filial',
          gridColumns: 12,
          gridSmColumns: 12,
          options: [
            '01/010101-Arotubi Metais',
            '01/020101-Arotubi Componentes',
            '01/030101-Arotubi Sistema',
            '02/010101-Eletropolar',
            '02/020101-Austral',
          ],
        },
      ];
    } else {
      return [];
    }
  }

  changeCalendarMonth(offset: number): void {
    this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() + offset, 1);
    this.buildCalendar();
  }

  private refreshSessionData(): void {
    this.isAnonymousLogin = sessionStorage.getItem('anonimo') === 'true';
    this.userName = (sessionStorage.getItem('username') || sessionStorage.getItem('user') || 'Usuario').toUpperCase();
    const grupo = environment.grupo || '';
    const filial = environment.filial || '';
    this.tenantLabel = [grupo, filial].filter(Boolean).join(' / ');
  }

  private buildQuickAccess(): void {
    const quickAccess: QuickAccessItem[] = [];

    if (environment.apManual) {
      quickAccess.push({
        titulo: 'Produção',
        descricao: 'Acompanhe OPs, apontamentos e detalhes da produção.',
        rota: '/producao',
        tag: 'SigaPCP',
      });
    }

    if (environment.apAuto) {
      quickAccess.push({
        titulo: 'Produção Automático',
        descricao: 'Acesse o fluxo automático de apontamento e impressão.',
        rota: '/producao/automatico',
        tag: 'SigaPCP',
      });
    }

    this.quickAccessPrimary = quickAccess;
  }

  private buildCalendar(): void {
    const today = new Date();
    const year = this.calendarCursor.getFullYear();
    const month = this.calendarCursor.getMonth();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const todayDate = today.getDate();
    const holidays = this.getBrazilianHolidays(year);

    this.calendarMonthLabel = this.calendarCursor.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
    this.calendarYearLabel = String(year);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const previousMonthLastDay = new Date(year, month, 0).getDate();
    const startOffset = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];

    for (let index = startOffset - 1; index >= 0; index -= 1) {
      days.push({
        label: String(previousMonthLastDay - index),
        muted: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const holidayName = holidays.get(this.getDateKey(year, month, day));
      days.push({
        label: String(day),
        active: isCurrentMonth && day === todayDate,
        holiday: !!holidayName,
        holidayName,
      });
    }

    while (days.length % 7 !== 0) {
      days.push({
        label: String(days.length - (startOffset + daysInMonth) + 1),
        muted: true,
      });
    }

    this.calendarDays = days;
  }

  private getBrazilianHolidays(year: number): Map<string, string> {
    const holidays = new Map<string, string>();
    const addHoliday = (month: number, day: number, name: string) => {
      holidays.set(this.getDateKey(year, month, day), name);
    };

    addHoliday(0, 1, 'Confraternizacao Universal');
    addHoliday(3, 21, 'Tiradentes');
    addHoliday(4, 1, 'Dia do Trabalho');
    addHoliday(8, 7, 'Independencia do Brasil');
    addHoliday(9, 12, 'Nossa Senhora Aparecida');
    addHoliday(10, 2, 'Finados');
    addHoliday(10, 15, 'Proclamacao da Republica');
    addHoliday(11, 25, 'Natal');

    const easter = this.getEasterDate(year);
    const carnival = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 47);
    const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
    const corpusChristi = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 60);

    holidays.set(this.toDateKey(carnival), 'Carnaval');
    holidays.set(this.toDateKey(goodFriday), 'Sexta-feira Santa');
    holidays.set(this.toDateKey(easter), 'Pascoa');
    holidays.set(this.toDateKey(corpusChristi), 'Corpus Christi');

    return holidays;
  }

  private getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  private getDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private toDateKey(date: Date): string {
    return this.getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
  }

}
