import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoModalComponent, PoNotificationService } from '@po-ui/ng-components';
import { EmailHelperService } from 'src/app/shared/services/email-helper.service';
import { environment } from '../../../environments/environment';
import { EtiquetaImpressaoDados, ProducaoEtiquetaService } from '../../service/producao-etiqueta.service';
import {
  ApontamentoProducaoPayload,
  ApontamentoProducaoResponse,
  ApontamentoProducaoInfo,
  OrdemIntermediaria,
  OrdemIntermediariaDetalhe,
  OrdemProducao,
  OrdemProducaoDetalhe,
  ProducaoService,
  ReimpressaoEtiquetaPayload,
} from '../../service/producao.service';

@Component({
  selector: 'app-producao-detalhe',
  templateUrl: './producao-detalhe.component.html',
  styleUrls: ['./producao-detalhe.component.scss'],
})
export class ProducaoDetalheComponent implements OnInit {
  private readonly quantidadeSimuladaEtiqueta = 1;
  @ViewChild('reprintModal', { static: false }) reprintModal!: PoModalComponent;
  @ViewChild('apontamentoModal', { static: false }) apontamentoModal!: PoModalComponent;
  @ViewChild('logModal', { static: false }) logModal!: PoModalComponent;

  detalhe?: OrdemProducaoDetalhe;
  loadingState = true;
  motivoReimpressao = '';
  loginAprovacao = '';
  senhaAprovacao = '';
  apontamentoSelecionado?: ApontamentoProducaoInfo;
  ordemSelecionadaReimpressao?: OrdemProducao | OrdemIntermediaria;
  contextoReimpressao = '';
  usuarioLogado = '';
  ordemSelecionadaApontamento?: OrdemProducao | OrdemIntermediaria;
  contextoApontamento = '';
  quantidadeApontamento: number | null = null;
  perdaApontamento: number | null = null;
  observacaoApontamento = '';
  salvandoApontamento = false;
  salvandoReimpressao = false;
  mensagemLog = '';
  loagingButton = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private producaoService: ProducaoService,
    private poNotification: PoNotificationService,
    private emailHelper: EmailHelperService,
    private producaoEtiquetaService: ProducaoEtiquetaService,
  ) {}

  ngOnInit(): void {
    this.usuarioLogado =
      sessionStorage.getItem('username') ||
      sessionStorage.getItem('user') ||
      localStorage.getItem('username') ||
      localStorage.getItem('user') ||
      '';
    this.carregarDetalhe();
  }

  voltar(): void {
    this.router.navigate(['/producao']);
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 8) {
      return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
    }

    return value;
  }

  formatDateTime(value: string): string {
    if (!value) {
      return '-';
    }

    const normalized = String(value).trim();
    const match = normalized.match(/^(\d{4})(\d{2})(\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?$/);

    if (match) {
      const [, year, month, day, time] = match;
      return `${day}/${month}/${year}${time ? ` ${time}` : ''}`;
    }

    return normalized;
  }

  onDecimalInput(field: 'quantidade' | 'perda', event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const normalized = input.value.replace(',', '.');
    input.value = normalized;

    if (field === 'quantidade') {
      this.quantidadeApontamento = normalized === '' ? null : Number(normalized);
      return;
    }

    this.perdaApontamento = normalized === '' ? null : Number(normalized);
  }

  getProgress(quantidade: number, apontado: number): number {
    if (!quantidade) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((apontado / quantidade) * 100)));
  }

  getGaugeBackground(quantidade: number, apontado: number): string {
    const progress = this.getProgress(quantidade, apontado);
    return `conic-gradient(#4b5563 0 ${progress}%, #d9e1ec ${progress}% 100%)`;
  }

  getContextoApontamentoClass(): string {
    return this.contextoApontamento === 'OP principal' ? 'contexto-badge contexto-badge--principal' : 'contexto-badge contexto-badge--intermediaria';
  }

  getStatusDotClass(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'ABERTA') {
      return 'status-dot open';
    }
    if (normalized === 'PARCIALMENTE_APONTADA') {
      return 'status-dot analysis';
    }
    if (normalized === 'FINALIZADA' || normalized === 'OUTROS') {
      return 'status-dot delivered';
    }

    return 'status-dot sem-status';
  }

  getStatusLabel(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'REIMPRESSAO' || normalized === 'RIP') {
      return 'Reimpressão';
    }
    if (normalized === 'ABERTA') {
      return 'Aberta';
    }
    if (normalized === 'PARCIALMENTE_APONTADA') {
      return 'Parcialmente apontada';
    }
    if (normalized === 'FINALIZADA' || normalized === 'OUTROS') {
      return 'Finalizada';
    }

    return status || 'Sem status';
  }

  getApontamentoStatusClass(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === 'REIMPRESSAO' || normalized === 'RIP') {
      return 'apontamento-badge apontamento-badge--reprint';
    }

    return 'apontamento-badge apontamento-badge--default';
  }

  trackIntermediaria(_index: number, item: OrdemIntermediariaDetalhe): string {
    return item.ordem.op_chave;
  }

  getUsuarioReimpressao(): string {
    return this.usuarioLogado || 'usuário logado';
  }

  abrirModalReimpressao(apontamento: ApontamentoProducaoInfo, contexto: string, ordem: OrdemProducao | OrdemIntermediaria): void {
    this.apontamentoSelecionado = apontamento;
    this.ordemSelecionadaReimpressao = ordem;
    this.contextoReimpressao = contexto;
    this.motivoReimpressao = '';
    this.loginAprovacao = '';
    this.senhaAprovacao = '';
    this.reprintModal.open();
  }

  async confirmarReimpressao(): Promise<void> {
    if (this.salvandoReimpressao) {
      return;
    }

    if (!this.motivoReimpressao.trim()) {
      this.poNotification.warning('Informe o motivo da reimpressao.');
      return;
    }

    if (!this.loginAprovacao.trim() || !this.senhaAprovacao.trim()) {
      this.poNotification.warning('Informe login e senha para aprovacao.');
      return;
    }

    if (!this.apontamentoSelecionado || !this.ordemSelecionadaReimpressao) {
      return;
    }

    const ordem = this.ordemSelecionadaReimpressao;
    const apontamento = this.apontamentoSelecionado;
    const payload: ReimpressaoEtiquetaPayload = {
      empresa: environment.grupo || '',
      filial: ordem.op_filial || environment.filial || '',
      produto: ordem.op_produto || ordem.produto_codigo || '',
      local: apontamento.armazem || ordem.op_local || '',
      numseq: apontamento.numseq || '',
      usuario: this.usuarioLogado || '',
      seq: apontamento.seq || '',
      ordem: `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`,
      motivo: this.motivoReimpressao.trim(),
    };

    this.salvandoReimpressao = true;
    this.producaoService.reimprimirEtiqueta(
      payload,
      this.loginAprovacao.trim(),
      this.senhaAprovacao.trim(),
      this.motivoReimpressao.trim(),
    ).subscribe({
      next: async (response) => {
        this.salvandoReimpressao = false;

        if (String(response.status || '').trim().toLowerCase() === 'error') {
          this.abrirLogErroReimpressao(response.backendMsg || response.msg || 'Nao foi possivel autorizar a reimpressao.');
          return;
        }

        await this.imprimirEtiquetaReimpressao(apontamento, ordem);
        this.poNotification.success(response.backendMsg || response.msg || `Reimpressao solicitada para ${this.contextoReimpressao}.`);
        this.reprintModal.close();
        this.carregarDetalhe();
      },
      error: (error) => {
        this.salvandoReimpressao = false;
        this.abrirLogErroReimpressao(this.getErroApontamento(error));
      },
    });
  }

  isStatusAberto(status: string): boolean {
    const normalized = String(status || '').trim().toUpperCase();
    return normalized === 'ABERTA' || normalized === 'PARCIALMENTE_APONTADA';
  }

  abrirApontamento(contexto: string, ordem: OrdemProducao | OrdemIntermediaria): void {
    this.contextoApontamento = contexto;
    this.ordemSelecionadaApontamento = ordem;
    this.quantidadeApontamento = this.getQuantidadeMultipla(ordem);
    this.perdaApontamento = null;
    this.observacaoApontamento = '';
    this.salvandoApontamento = false;
    this.apontamentoModal.open();
  }

  async simularEtiqueta(ordem: OrdemProducao | OrdemIntermediaria): Promise<void> {
    const etiquetaId = `SIM${Date.now()}`;
    await this.imprimirEtiquetaApontamento(
      {
        status: 'success',
        msg: 'Simulacao de etiqueta.',
        backendMsg: 'Simulacao de etiqueta.',
        etiquetaId,
        seq: '001',
      },
      ordem,
      this.quantidadeSimuladaEtiqueta,
    );
  }

  confirmarApontamento(): void {
    if (!this.ordemSelecionadaApontamento || this.salvandoApontamento) {
      return;
    }

    const ordem = this.ordemSelecionadaApontamento;
    const quantidade = Number(this.quantidadeApontamento || 0);
    const quantidadeConvertida = this.getQuantidadeApontamentoConvertida(ordem, quantidade);
    const perda = Number(this.perdaApontamento || 0);
    const saldoDisponivel = Number(ordem.op_saldo || 0);

    if (!quantidade || quantidade <= 0) {
      this.poNotification.warning('Informe uma quantidade valida para apontamento.');
      return;
    }

    if (perda < 0) {
      this.poNotification.warning('Informe uma perda valida para apontamento.');
      return;
    }

    if (!quantidadeConvertida || quantidadeConvertida <= 0) {
      this.poNotification.warning('Nao foi possivel converter a quantidade informada para M3.');
      return;
    }

    if (quantidadeConvertida > saldoDisponivel) {
      this.poNotification.warning('Quantidade nao pode ser maior que o saldo da OP.');
      return;
    }

    const payload: ApontamentoProducaoPayload = {
      empresa: environment.grupo || '',
      filial: ordem.op_filial || environment.filial || '',
      ordem: `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`,
      produto: ordem.op_produto,
      conta: '',
      parctot: this.getParcialTotal(ordem, quantidadeConvertida, perda),
      perda,
      quantidade: quantidadeConvertida,
      um: this.isSerrariaComConversao(ordem) ? 'M3' : ordem.op_um,
      ccusto: '',
      controle: '',
      obs: this.observacaoApontamento.trim(),
    };

    this.salvandoApontamento = true;
    this.producaoService.apontarProducao(payload).subscribe({
      next: async (response) => {
        this.salvandoApontamento = false;

        if (String(response.status || '').trim().toLowerCase() === 'error') {
          this.abrirLogErro(response.msg || 'Nao foi possivel realizar o apontamento.');
          return;
        }

        await this.imprimirEtiquetaApontamento(response, ordem, quantidade);
        this.poNotification.success(response.backendMsg || response.msg || response.status || `Apontamento realizado para ${this.contextoApontamento}.`);
        this.apontamentoModal.close();
        this.carregarDetalhe();
      },
      error: (error) => {
        this.salvandoApontamento = false;
        this.abrirLogErro(this.getErroApontamento(error));
      },
    });
  }

  private carregarDetalhe(): void {
    const numero = this.route.snapshot.paramMap.get('numero') || '';
    const item = this.route.snapshot.paramMap.get('item') || '';
    const sequencia = this.route.snapshot.paramMap.get('sequencia') || '';
    const intermediario = this.route.snapshot.queryParamMap.get('intermediario') || '';
    const filial = environment.filial || '';

    this.loadingState = true;
    this.producaoService.getDetalheOrdemProducao(filial, numero, item, sequencia, intermediario, '').subscribe({
      next: (detalhe) => {
        this.detalhe = detalhe;
        this.loadingState = false;
      },
      error: () => {
        this.loadingState = false;
      },
    });
  }

  private getParcialTotal(ordem: OrdemProducao | OrdemIntermediaria, quantidade: number, perda: number): string {
    const quantidadeTotal = Number(ordem.op_quantidade || 0);
    const quantidadeApontada = Number(ordem.op_quant_apontada || 0);
    return quantidadeApontada + quantidade === quantidadeTotal ? 'T' : 'P';
  }

  private getErroApontamento(error: any): string {
    return (
      error?.error?.data?.msg ||
      error?.error?.msg ||
      error?.error?.status ||
      error?.message ||
      'Nao foi possivel realizar o apontamento.'
    );
  }

  isQuantidadeTravada(ordem: OrdemProducao | OrdemIntermediaria | undefined): boolean {
    return this.getQuantidadeMultipla(ordem) !== null;
  }

  isSerrariaComConversao(ordem: OrdemProducao | OrdemIntermediaria | undefined): boolean {
    if (!ordem) {
      return false;
    }

    const setor = String(ordem.op_tipo_prod || '').trim().toUpperCase();
    return setor === 'SERRARIA' && this.hasMedidasProduto(ordem);
  }

  getQuantidadeDisplayUm(ordem: OrdemProducao | OrdemIntermediaria | undefined): string {
    return this.isSerrariaComConversao(ordem) ? 'PC' : String(ordem?.op_um || '-');
  }

  isSetorGranel(ordem: OrdemProducao | OrdemIntermediaria | undefined): boolean {
    return String(ordem?.op_tipo_prod || '').trim().toUpperCase() === 'GRANEL';
  }

  getQuantidadeConvertidaM3(ordem: OrdemProducao | OrdemIntermediaria | undefined): string {
    if (!ordem || !this.isSerrariaComConversao(ordem)) {
      return '-';
    }

    const quantidade = Number(this.quantidadeApontamento || 0);
    const convertido = this.getQuantidadeApontamentoConvertida(ordem, quantidade);
    return convertido > 0 ? this.formatarInteiroEtiqueta(convertido) : '-';
  }

  private getQuantidadeMultipla(ordem: OrdemProducao | OrdemIntermediaria | undefined): number | null {
    const valor = Number(ordem?.produto_quant_multipla ?? 0);
    return valor > 0 ? valor : null;
  }

  private getQuantidadeApontamentoConvertida(
    ordem: OrdemProducao | OrdemIntermediaria,
    quantidade: number,
  ): number {
    if (!this.isSerrariaComConversao(ordem)) {
      return quantidade;
    }

    const altura = this.parseMedidaProduto(ordem.produto_altura);
    const comprimento = this.parseMedidaProduto(ordem.produto_comprimento);
    const largura = this.parseMedidaProduto(ordem.produto_largura);

    if (!(altura > 0) || !(comprimento > 0) || !(largura > 0) || !(quantidade > 0)) {
      return 0;
    }

    const volume = (altura / 100) * (comprimento / 100) * (largura / 100) * quantidade;
    return Math.round(volume);
  }

  private async imprimirEtiquetaApontamento(
    response: ApontamentoProducaoResponse,
    ordem: OrdemProducao | OrdemIntermediaria,
    quantidade: number,
  ): Promise<void> {
    if (this.isSetorGranel(ordem)) {
      return;
    }

    const etiquetaId = String(response.etiquetaId || '').trim();
    if (!etiquetaId) {
      return;
    }

    const agora = new Date();
    const ordemCompleta = `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`;
    const dadosSerraria = this.calcularDadosEtiquetaSerraria(ordem, quantidade);
    const etiqueta: EtiquetaImpressaoDados = {
      internalOrder: ordem.op_numero.slice(0, 6),
      date: this.formatDateForLabel(agora),
      productionOrder: ordemCompleta,
      code: ordem.produto_codigo || ordem.op_produto,
      time: this.formatTimeForLabel(agora),
      userName: this.usuarioLogado || 'USUARIO',
      customer: ordem.op_cliente || `Filial ${ordem.op_filial}`,
      productDescription: this.getDescricaoEtiqueta(ordem),
      shift: '-',
      netWeight: `${String(quantidade).replace('.', ',')} ${ordem.op_um}`,
      certificate: 'EN PLUS A1',
      pallet: '',
      visual: '',
      packing: '',
      stretch: '',
      barcodeValue: ordemCompleta,
      countryOfOrigin: 'Brazil',
      productType: ordem.op_tipo_prod || '',
      observation: ordem.op_observacao || '',
      quantity: dadosSerraria.pecas,
      unit: ordem.op_um || '-',
      volume: dadosSerraria.volume,
      sequenceLabel: response.seq ? `N${response.seq}` : (response.numseq ? `N${response.numseq}` : ''),
    };

    const resultado = await this.producaoEtiquetaService.imprimirEtiqueta(etiqueta);

    if (!resultado.success) {
      this.poNotification.warning('Nao foi possivel abrir a impressao da etiqueta.');
      return;
    }

    if (resultado.usedPreview) {
      this.poNotification.information('Nenhuma impressora Argox encontrada. Abrindo preview da etiqueta.');
      return;
    }

    if (resultado.printerName) {
      this.poNotification.success(`Etiqueta enviada para ${resultado.printerName}.`);
    }
  }

  private async imprimirEtiquetaReimpressao(
    apontamento: ApontamentoProducaoInfo,
    ordem: OrdemProducao | OrdemIntermediaria,
  ): Promise<void> {
    if (this.isSetorGranel(ordem)) {
      return;
    }

    const ordemCompleta = `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`;
    const dadosSerraria = this.calcularDadosEtiquetaSerraria(ordem, Number(apontamento.quantidade ?? 0));
    const etiqueta: EtiquetaImpressaoDados = {
      internalOrder: ordem.op_numero.slice(0, 6),
      date: this.formatDateTimeForLabel(apontamento.data_hora).date,
      productionOrder: ordemCompleta,
      code: ordem.produto_codigo || ordem.op_produto,
      time: this.formatDateTimeForLabel(apontamento.data_hora).time,
      userName: apontamento.operador || this.usuarioLogado || 'USUARIO',
      customer: ordem.op_cliente || `Filial ${ordem.op_filial}`,
      productDescription: this.getDescricaoEtiqueta(ordem),
      shift: '-',
      netWeight: `${String(apontamento.quantidade ?? 0).replace('.', ',')} ${ordem.op_um}`,
      certificate: 'EN PLUS A1',
      pallet: '',
      visual: '',
      packing: '',
      stretch: '',
      barcodeValue: ordemCompleta,
      countryOfOrigin: 'Brazil',
      productType: ordem.op_tipo_prod || '',
      observation: this.motivoReimpressao.trim() || ordem.op_observacao || '',
      quantity: dadosSerraria.pecas,
      unit: ordem.op_um || apontamento.um || '-',
      volume: dadosSerraria.volume,
      sequenceLabel: apontamento.seq ? `R${apontamento.seq}` : (apontamento.numseq ? `R${apontamento.numseq}` : ''),
    };

    const resultado = await this.producaoEtiquetaService.imprimirEtiqueta(etiqueta);

    if (!resultado.success) {
      this.poNotification.warning('Nao foi possivel abrir a impressao da etiqueta.');
      return;
    }

    if (resultado.usedPreview) {
      this.poNotification.information('Nenhuma impressora Argox encontrada. Abrindo preview da etiqueta.');
      return;
    }

    if (resultado.printerName) {
      this.poNotification.success(`Etiqueta enviada para ${resultado.printerName}.`);
    }
  }

  private getDescricaoEtiqueta(ordem: OrdemProducao | OrdemIntermediaria): string {
    return ordem.produto_descricao_ing || ordem.produto_descricao || ordem.op_observacao || '-';
  }

  private formatDateForLabel(value: Date): string {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatTimeForLabel(value: Date): string {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private formatDateTimeForLabel(value: string): { date: string; time: string } {
    const normalized = String(value || '').trim();
    const compact = normalized.match(/^(\d{4})(\d{2})(\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?$/);

    if (compact) {
      const [, year, month, day, time] = compact;
      return { date: `${day}/${month}/${year}`, time: time || '00:00:00' };
    }

    const brazilian = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?$/);
    if (brazilian) {
      const [, day, month, year, time] = brazilian;
      return { date: `${day}/${month}/${year}`, time: time || '00:00:00' };
    }

    const now = new Date();
    return {
      date: this.formatDateForLabel(now),
      time: this.formatTimeForLabel(now),
    };
  }

  private abrirLogErro(mensagem: string): void {
    this.mensagemLog = String(mensagem || 'Nao foi possivel realizar o apontamento.');
    this.apontamentoModal?.close();
    this.logModal?.open();
  }

  private abrirLogErroReimpressao(mensagem: string): void {
    this.mensagemLog = String(mensagem || 'Nao foi possivel realizar a reimpressao.');
    this.reprintModal?.close();
    this.logModal?.open();
  }

  enviarLog(log: string): void {
    this.emailHelper.enviarLog(log, '');
  }

  private calcularDadosEtiquetaSerraria(
    ordem: OrdemProducao | OrdemIntermediaria,
    quantidade: number,
  ): { pecas: string; volume: string } {
    const altura = this.parseMedidaProduto(ordem.produto_altura);
    const comprimento = this.parseMedidaProduto(ordem.produto_comprimento);
    const largura = this.parseMedidaProduto(ordem.produto_largura);
    const quant = Number(quantidade || 0);
    const unidade = String(ordem.op_um || '').trim().toUpperCase();

    if (!(altura > 0) || !(comprimento > 0) || !(largura > 0) || !(quant > 0)) {
      const valorPadrao = this.formatarInteiroEtiqueta(quant);
      return { pecas: valorPadrao, volume: '-' };
    }

    const volumePorPeca = (altura / 100) * (comprimento / 100) * (largura / 100);
    if (!(volumePorPeca > 0)) {
      const valorPadrao = this.formatarInteiroEtiqueta(quant);
      return { pecas: valorPadrao, volume: '-' };
    }

    if (unidade === 'M3') {
      const pecas = Math.round(quant / volumePorPeca);
      return {
        pecas: this.formatarInteiroEtiqueta(pecas),
        volume: this.formatarInteiroEtiqueta(quant),
      };
    }

    const volume = Math.round(volumePorPeca * quant);
    return {
      pecas: this.formatarInteiroEtiqueta(quant),
      volume: this.formatarInteiroEtiqueta(volume),
    };
  }

  private parseMedidaProduto(value: number | string | undefined): number {
    const raw = String(value ?? '').trim();
    const normalized = raw.includes(',') && raw.includes('.')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private hasMedidasProduto(ordem: OrdemProducao | OrdemIntermediaria): boolean {
    return (
      this.parseMedidaProduto(ordem.produto_altura) > 0 &&
      this.parseMedidaProduto(ordem.produto_comprimento) > 0 &&
      this.parseMedidaProduto(ordem.produto_largura) > 0
    );
  }

  private formatarInteiroEtiqueta(value: number): string {
    const numero = Math.round(Number(value || 0));
    return numero.toLocaleString('pt-BR');
  }
}
