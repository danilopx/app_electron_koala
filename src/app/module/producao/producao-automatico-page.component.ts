import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PoModalComponent, PoNotificationService } from '@po-ui/ng-components';
import { firstValueFrom } from 'rxjs';
import { EtiquetaImpressaoDados, ProducaoEtiquetaService } from '../../service/producao-etiqueta.service';
import { SidebarStateService } from '../../service/sidebar-state.service';
import { environment } from '../../../environments/environment';
import {
  ApontamentoProducaoInfo,
  ApontamentoProducaoPayload,
  OrdemProducao,
  OrdemProducaoDetalhe,
  ProducaoService,
} from '../../service/producao.service';

interface ProducaoAutomaticaHistorico {
  quantidade: number;
  dataHora: string;
  caixa: string;
  usuario: string;
}

interface ProducaoAutomaticaOrdem {
  numero: string;
  internalOrder: string;
  codigoInterno: string;
  productionOrder: string;
  data: string;
  hora: string;
  usuario: string;
  produto: string;
  descricao: string;
  cliente: string;
  quantidade: number;
  multiploCaixa: number;
  armazem: string;
  unidadeMedida: string;
  setorProducao: string;
  situacao: string;
  quantidadeProduzidaAtual: number;
  producao: number;
  saldo: number;
  etiqueta: string;
  certificate: string;
  pallet: string;
  visual: string;
  packing: string;
  strech: string;
  origem: string;
}

interface ProducaoAutomaticaPersistencia {
  codigo?: number;
  op: string;
  quantidade: number;
  quantPar: number;
  dataHora: string;
  dataUltPc: string;
  cicloMedio: number;
  tempo: number;
  totalProd: number;
  tempoPrev: number;
  perda: number;
}

@Component({
  selector: 'app-producao-automatico',
  templateUrl: './producao-automatico.component.html',
  styleUrls: ['./producao-automatico.component.scss'],
})
export class ProducaoAutomaticoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('opModal', { static: false }) opModal!: PoModalComponent;
  @ViewChild('acertoModal', { static: false }) acertoModal!: PoModalComponent;
  @ViewChild('apontamentoStatusModal', { static: false }) apontamentoStatusModal!: PoModalComponent;
  @ViewChild('preRequisitosModal', { static: false }) preRequisitosModal!: PoModalComponent;

  private previousSidebarCollapsed: boolean | null = null;
  private removeSerialDataListener?: () => void;
  private removeSerialErrorListener?: () => void;
  private removeAutoExecutionUpdateListener?: () => void;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private tempoProducaoTimer: ReturnType<typeof setInterval> | null = null;
  private tempoProducaoBaseMinutos = 0;
  private tempoProducaoInicioSessaoMs: number | null = null;
  private cicloApontamentoInicioMs: number | null = null;
  tempoProducaoTickMs = Date.now();
  private ignorarFechamentoModalOp = false;
  historico: ProducaoAutomaticaHistorico[] = [];
  ordem?: ProducaoAutomaticaOrdem;
  ordemDetalhe?: OrdemProducaoDetalhe;
  numeroOpInformado = '';
  carregandoOrdem = false;
  usuarioLogado = '';
  serialStatus = 'Leitura serial inativa.';
  serialPorta = '';
  serialUltimoValor = '';
  serialLendo = false;
  serialTesteManual = false;
  contadorPulso = 0;
  ultimoSinalSerial = '0';
  apontandoAutomatico = false;
  autoPersistencia?: ProducaoAutomaticaPersistencia;
  screenMessage = '';
  screenMessageType: 'error' | 'info' | 'success' = 'info';
  private lastToastKey = '';
  acertoQuantidade = '';
  acertoTempoProducao = '';
  salvandoAcerto = false;
  acertoExecucaoPausada = false;
  apontamentoStatusMensagem = '';
  apontamentoStatusDetalhe = '';
  apontamentoStatusTipo: 'info' | 'success' | 'error' = 'info';
  apontamentoStatusProcessando = false;
  apontamentoStatusAcao: 'none' | 'processing' | 'api-error' | 'print-error' | 'support' = 'none';
  tentandoReimprimirEtiqueta = false;
  preRequisitosMensagem = '';
  preRequisitosDetalhe = '';
  validandoPreRequisitos = false;
  private fechandoStatusAutomaticamente = false;

  constructor(
    private ngZone: NgZone,
    private poNotification: PoNotificationService,
    private producaoService: ProducaoService,
    private producaoEtiquetaService: ProducaoEtiquetaService,
    private sidebarStateService: SidebarStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.previousSidebarCollapsed = this.sidebarStateService.collapsed;
    this.sidebarStateService.setCollapsed(true);
    this.usuarioLogado =
      sessionStorage.getItem('username') ||
      sessionStorage.getItem('user') ||
      localStorage.getItem('username') ||
      localStorage.getItem('user') ||
      'USUARIO';
    this.configureSerialListeners();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      void this.validarPreRequisitos();
    }, 0);
  }

  ngOnDestroy(): void {
    this.consolidarTempoProducaoSessao();
    void this.persistAutomaticOrderState('', false);
    this.removeSerialDataListener?.();
    this.removeSerialErrorListener?.();
    this.removeAutoExecutionUpdateListener?.();
    this.clearReconnectTimer();
    this.pararRelogioTempoProducao();

    if (this.previousSidebarCollapsed !== null) {
      this.sidebarStateService.setCollapsed(this.previousSidebarCollapsed);
    }
  }

  abrirModalOp(): void {
    if (this.opModal) {
      this.opModal.open();
    }
  }

  fecharPreRequisitos(): void {
    this.preRequisitosModal?.close();
    this.sair();
  }

  consultarOp(): void {
    const codigoInformado = String(this.numeroOpInformado || '').trim();
    const digits = codigoInformado.replace(/\D/g, '');

    if (digits.length !== 11) {
      this.setScreenMessage('Informe a OP completa com 11 digitos.', 'error');
      return;
    }

    const op = this.parseOp(digits);
    const filial = environment.filial || '';

    this.carregandoOrdem = true;

    this.producaoService.getDetalheOrdemProducao(filial, op.numero, op.item, op.sequencia, '', '').subscribe({
      next: (detalhe) => {
        this.ordemDetalhe = detalhe;
        this.ordem = this.mapOrdemTela(detalhe);
        this.historico = this.mapHistoricoLista(detalhe);
        this.carregandoOrdem = false;
        this.ignorarFechamentoModalOp = true;
        this.opModal.close();
        setTimeout(() => {
          this.ignorarFechamentoModalOp = false;
        }, 0);
        this.clearScreenMessage();
        void this.restoreOrCreatePersistedOrderState();
        void this.activateAutomaticExecution();
        void this.syncSerialByOrderStatus();
      },
      error: () => {
        this.carregandoOrdem = false;
        this.ordem = undefined;
        this.ordemDetalhe = undefined;
        this.historico = [];
        this.autoPersistencia = undefined;
        this.resetAutomaticCounter();
        this.setScreenMessage('Nao foi possivel carregar os dados da rotina uSimp05C para a OP informada.', 'error');
        this.abrirModalOp();
      },
    });
  }

  registrarAcerto(): void {
    void this.abrirModalAcerto();
  }

  acionarApontamentoManual(): void {
    void this.tryManualApontamento();
  }

  async sair(): Promise<void> {
    this.consolidarTempoProducaoSessao();
    await this.persistAutomaticOrderState('', false);
    this.stopSerialReading(false);
    this.router.navigate(['/home']);
  }

  fecharModalAcerto(): void {
    this.acertoModal?.close();
  }

  aoFecharModalOp(): void {
    if (this.ignorarFechamentoModalOp) {
      return;
    }

    this.sair();
  }

  aoFecharModalAcerto(): void {
    void this.retornarExecucaoAposAcerto();
  }

  async salvarAcerto(): Promise<void> {
    if (this.salvandoAcerto || !this.ordem || !this.ordemDetalhe?.ordem) {
      return;
    }

    const quantidadeInformada = String(this.acertoQuantidade || '').trim();
    if (!/^\d+$/.test(quantidadeInformada)) {
      this.setScreenMessage('Informe uma quantidade inteira valida para o acerto.', 'error');
      return;
    }

    const quantidade = Number(quantidadeInformada);
    const limite = this.getLimiteQuantidadeAcerto();
    if (quantidade > limite) {
      this.setScreenMessage(`A quantidade informada nao pode ser maior que ${limite}.`, 'error');
      return;
    }

    const tempoAcertoMinutos = this.parseTempoAcertoMinutos(this.acertoTempoProducao);
    if (tempoAcertoMinutos === null) {
      this.setScreenMessage('Informe o tempo de producao em minutos.', 'error');
      return;
    }

    if (!window.electronAPI?.sqlite?.apontamentoAutomatico?.adjustQuantPar) {
      this.setScreenMessage('Acerto disponivel apenas no app desktop.', 'error');
      return;
    }

    this.salvandoAcerto = true;

    try {
      const result = await window.electronAPI.sqlite.apontamentoAutomatico.adjustQuantPar({
        op: this.ordem.productionOrder,
        quantPar: quantidade,
      });

      if (!result.success || !result.row) {
        this.setScreenMessage(result.error || 'Nao foi possivel realizar o acerto.', 'error');
        return;
      }

      this.autoPersistencia = {
        codigo: result.row.codigo,
        op: result.row.op,
        quantidade: Number(result.row.quantidade || 0),
        quantPar: Number(result.row.quantPar || 0),
        dataHora: String(result.row.dataHora || ''),
        dataUltPc: String(result.row.dataUltPc || ''),
        cicloMedio: Number(result.row.cicloMedio || 0),
        tempo: tempoAcertoMinutos,
        totalProd: Number(result.row.totalProd || 0),
        tempoPrev: Number(result.row.tempoPrev || 0),
        perda: Number(result.row.perda || 0),
      };
      this.aplicarTempoAcertoAoCiclo(tempoAcertoMinutos, this.autoPersistencia.quantPar);
      this.contadorPulso = this.autoPersistencia.quantPar;

      if (this.ordem) {
        this.ordem = {
          ...this.ordem,
          quantidadeProduzidaAtual: this.contadorPulso,
        };
      }

      this.setScreenMessage('Acerto realizado com sucesso.', 'success');
      this.fecharModalAcerto();
    } finally {
      this.salvandoAcerto = false;
    }
  }

  async alternarTesteSerial(): Promise<void> {
    if (!window.electronAPI?.serial) {
      this.setScreenMessage('Leitura serial disponivel apenas no app desktop.', 'error');
      return;
    }

    if (this.serialLendo && this.serialTesteManual) {
      this.stopSerialReading();
      return;
    }

    const result = await window.electronAPI.serial.startReading();
    if (!result.success) {
      this.serialLendo = false;
      this.serialTesteManual = false;
      this.serialStatus = result.error || 'Falha ao iniciar leitura serial.';
      this.setScreenMessage(this.serialStatus, 'error');
      return;
    }

    this.serialLendo = true;
    this.serialTesteManual = true;
    this.serialPorta = result.port || '';
    this.serialUltimoValor = result.lastValue || this.serialUltimoValor;
    this.serialStatus = `Teste serial ativo na porta ${result.port || result.path || '-'}.`;
    this.setScreenMessage(this.serialStatus, 'info');
  }

  async imprimirEtiqueta(): Promise<void> {
    if (!this.ordem) {
      this.poNotification.warning('Consulte uma OP antes de imprimir a etiqueta.');
      return;
    }

    const resultado = await this.imprimirEtiquetaAtual();

    if (!resultado.success) {
      this.poNotification.warning(resultado.error || 'Nao foi possivel abrir a impressao da etiqueta.');
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

  private getEtiquetaDados(): EtiquetaImpressaoDados {
    if (!this.ordem || !this.ordemDetalhe?.ordem) {
      throw new Error('Ordem nao carregada.');
    }

    const ordem = this.ordemDetalhe.ordem;
    const dadosSerraria = this.calcularDadosEtiquetaSerraria(ordem, Number(this.ordem.quantidadeProduzidaAtual || 0));

    return {
      internalOrder: this.ordem.internalOrder,
      date: this.ordem.data,
      productionOrder: this.ordem.productionOrder,
      code: this.ordem.codigoInterno,
      time: this.ordem.hora,
      userName: this.ordem.usuario,
      customer: this.ordem.cliente,
      productDescription: this.getDescricaoEtiqueta(ordem),
      shift: '1',
      netWeight: `${String(this.ordem.quantidadeProduzidaAtual || 0).replace('.', ',')} ${this.ordem.unidadeMedida}`,
      certificate: this.ordem.certificate || '-',
      pallet: this.ordem.pallet || '',
      visual: this.ordem.visual || '',
      packing: this.ordem.packing || '',
      stretch: this.ordem.strech || '',
      barcodeValue: this.ordem.productionOrder,
      countryOfOrigin: this.ordem.origem,
      productType: ordem.op_tipo_prod || '',
      observation: ordem.op_observacao || '',
      quantity: dadosSerraria.pecas,
      unit: ordem.op_um || '-',
      volume: dadosSerraria.volume,
    };
  }

  private mapOrdemTela(detalhe: OrdemProducaoDetalhe): ProducaoAutomaticaOrdem {
    const ordem = detalhe.ordem as OrdemProducao;
    const ultimoMovimento = this.getUltimoMovimento(detalhe);
    const ordemCompleta = `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`;

    return {
      numero: `OP - ${ordemCompleta}`,
      internalOrder: ordem.op_numero.slice(0, 6),
      codigoInterno: ordem.produto_codigo || ordem.op_produto,
      productionOrder: ordemCompleta,
      data: this.formatDate(ordem.op_emissao),
      hora: this.extractTime(ultimoMovimento?.data_hora),
      usuario: ultimoMovimento?.operador || this.usuarioLogado,
      produto: ordem.op_produto || ordem.produto_codigo,
      descricao: ordem.produto_descricao || ordem.op_observacao || '-',
      cliente: ordem.op_cliente || `Filial ${ordem.op_filial}`,
      quantidade: Number(ordem.op_quantidade || 0),
      multiploCaixa: Number(ordem.produto_quant_multipla || 0),
      armazem: ordem.op_local || '-',
      unidadeMedida: ordem.op_um || '-',
      setorProducao: ordem.op_tipo_prod || '-',
      situacao: this.getStatusLabel(ordem.op_status),
      quantidadeProduzidaAtual: 0,
      producao: Number(ordem.op_quant_apontada || 0),
      saldo: Number(ordem.op_saldo || 0),
      etiqueta: String(ultimoMovimento?.seq || ultimoMovimento?.numseq || detalhe.apontamentos.length || '-').trim() || '-',
      certificate: 'EN PLUS A1',
      pallet: '',
      visual: '',
      packing: '',
      strech: '',
      origem: 'Brazil',
    };
  }

  private mapHistoricoLista(detalhe: OrdemProducaoDetalhe): ProducaoAutomaticaHistorico[] {
    const historico = detalhe.apontamentos.concat(detalhe.reimpressoes).map((item) => ({
      quantidade: Number(item.quantidade || 0),
      dataHora: this.formatDateTime(item.data_hora),
      caixa: String(item.seq || item.numseq || '-').trim() || '-',
      usuario: item.operador || this.usuarioLogado,
    }));

    return historico.sort((left, right) => this.parseHistoricoDate(right.dataHora) - this.parseHistoricoDate(left.dataHora));
  }

  private getUltimoMovimento(detalhe: OrdemProducaoDetalhe): ApontamentoProducaoInfo | undefined {
    const movimentos = detalhe.apontamentos.concat(detalhe.reimpressoes);
    movimentos.sort((left, right) => this.parseHistoricoDate(right.data_hora) - this.parseHistoricoDate(left.data_hora));
    return movimentos[0];
  }

  private parseOp(value: string): { numero: string; item: string; sequencia: string } {
    const digits = String(value || '').replace(/\D/g, '');
    return {
      numero: digits.slice(0, 6),
      item: digits.slice(6, 8),
      sequencia: digits.slice(8, 11),
    };
  }

  onNumeroOpInformadoChange(value: string): void {
    this.numeroOpInformado = String(value || '').replace(/\D/g, '').slice(0, 11);
  }

  private parseHistoricoDate(value: string): number {
    const normalized = String(value || '').trim();
    const compact = normalized.replace(/\D/g, '');

    if (compact.length >= 14) {
      const year = Number(compact.slice(0, 4));
      const month = Number(compact.slice(4, 6)) - 1;
      const day = Number(compact.slice(6, 8));
      const hour = Number(compact.slice(8, 10));
      const minute = Number(compact.slice(10, 12));
      const second = Number(compact.slice(12, 14));
      return new Date(year, month, day, hour, minute, second).getTime();
    }

    const brMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brMatch) {
      const [, day, month, year, hour = '00', minute = '00', second = '00'] = brMatch;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)).getTime();
    }

    return 0;
  }

  private isSetorGranel(ordem: OrdemProducao | undefined): boolean {
    return String(ordem?.op_tipo_prod || '').trim().toUpperCase() === 'GRANEL';
  }

  private isSerrariaComConversao(ordem: OrdemProducao | undefined): boolean {
    if (!ordem) {
      return false;
    }

    const setor = String(ordem.op_tipo_prod || '').trim().toUpperCase();
    return setor === 'SERRARIA' && this.hasMedidasProduto(ordem);
  }

  private getQuantidadeApontamentoConvertida(ordem: OrdemProducao, quantidade: number): number {
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

  private getDescricaoEtiqueta(ordem: OrdemProducao): string {
    return ordem.produto_descricao_ing || ordem.produto_descricao || ordem.op_observacao || '-';
  }

  private calcularDadosEtiquetaSerraria(ordem: OrdemProducao, quantidade: number): { pecas: string; volume: string } {
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

  private hasMedidasProduto(ordem: OrdemProducao): boolean {
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

  private formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const digits = String(value).replace(/\D/g, '');
    if (digits.length >= 8) {
      return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
    }

    return value;
  }

  private formatDateTime(value: string): string {
    if (!value) {
      return '-';
    }

    const normalized = String(value).trim();
    const compact = normalized.replace(/\D/g, '');
    if (compact.length >= 8) {
      const data = `${compact.slice(6, 8)}/${compact.slice(4, 6)}/${compact.slice(0, 4)}`;
      if (compact.length >= 14) {
        return `${data} ${compact.slice(8, 10)}:${compact.slice(10, 12)}:${compact.slice(12, 14)}`;
      }
      return data;
    }

    return normalized;
  }

  private extractTime(value?: string): string {
    const compact = String(value || '').replace(/\D/g, '');
    if (compact.length >= 14) {
      return `${compact.slice(8, 10)}:${compact.slice(10, 12)}:${compact.slice(12, 14)}`;
    }

    const brMatch = String(value || '').match(/(\d{2}:\d{2}(?::\d{2})?)/);
    return brMatch ? brMatch[1] : '--:--:--';
  }

  private getStatusLabel(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();

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

  private configureSerialListeners(): void {
    if (!window.electronAPI?.serial) {
      this.serialStatus = 'Leitura serial disponivel apenas no app desktop.';
      return;
    }

    this.removeSerialDataListener = window.electronAPI.serial.onData((payload) => {
      this.ngZone.run(() => {
        this.clearReconnectTimer();
        this.serialLendo = true;
        this.serialPorta = payload.port || this.serialPorta;
        this.serialUltimoValor = payload.raw || '';
        this.serialStatus = `Leitura ativa na porta ${payload.port || payload.path}.`;
      });
    });

    this.removeSerialErrorListener = window.electronAPI.serial.onError((payload) => {
      this.ngZone.run(() => {
        this.serialLendo = false;
        this.serialPorta = payload.port || this.serialPorta;
        this.serialStatus = payload.error || 'Falha na leitura serial.';
        if (this.isSerialAccessDeniedMessage(this.serialStatus)) {
          this.setScreenMessage('A porta esta sendo liberada. O sistema vai tentar reconectar automaticamente.', 'info');
          this.scheduleSerialReconnect();
          return;
        }

        this.setScreenMessage(this.serialStatus, 'error');
      });
    });

    this.removeAutoExecutionUpdateListener = window.electronAPI.serial.onAutoExecutionUpdate((payload) => {
      this.ngZone.run(() => {
        if (!this.ordem || this.ordem.productionOrder !== payload.op) {
          return;
        }

        this.contadorPulso = Number(payload.quantPar || 0);
        this.ordem = {
          ...this.ordem,
          quantidadeProduzidaAtual: this.contadorPulso,
        };

        if (this.autoPersistencia) {
          this.autoPersistencia = {
            ...this.autoPersistencia,
            quantPar: Number(payload.quantPar || 0),
            totalProd: Number(payload.totalProd || 0),
            cicloMedio: Number(payload.cicloMedio || 0),
            tempo: this.getTempoProducaoAtualMinutos(),
            tempoPrev: Number(payload.tempoPrev || 0),
            dataUltPc: String(payload.dataUltPc || ''),
          };
        }

        this.iniciarRelogioTempoProducao();
        this.iniciarCicloApontamentoSeNecessario();
        void this.tryAutoApontamento();
      });
    });
  }

  private async syncSerialByOrderStatus(): Promise<void> {
    if (!this.ordemDetalhe?.ordem || !this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status)) {
      this.consolidarTempoProducaoSessao();
      await this.persistAutomaticOrderState('', false);
      this.pararRelogioTempoProducao();
      this.serialStatus = 'Leitura serial desabilitada para OP fechada.';
      this.setScreenMessage(this.serialStatus, 'info');
      return;
    }

    if (this.isOrdemBloqueadaParaAcao()) {
      await this.enforceOrderFinalizationState();
      return;
    }

    if (!window.electronAPI?.serial) {
      this.serialStatus = 'Leitura serial disponivel apenas no app desktop.';
      this.setScreenMessage(this.serialStatus, 'error');
      return;
    }

    const result = await window.electronAPI.serial.startReading();
    if (!result.success) {
      this.serialLendo = false;
      this.serialTesteManual = false;
      this.serialPorta = result.port || '';
      this.serialStatus = result.error || 'Falha ao iniciar leitura serial.';
      if (this.isSerialAccessDeniedMessage(this.serialStatus)) {
        this.setScreenMessage('A porta esta sendo liberada. O sistema vai tentar reconectar automaticamente.', 'info');
        this.scheduleSerialReconnect();
      } else {
        this.setScreenMessage(this.serialStatus, 'error');
      }
      return;
    }

    this.clearReconnectTimer();
    this.serialLendo = true;
    this.serialTesteManual = false;
    this.serialPorta = result.port || '';
    this.serialUltimoValor = result.lastValue || '';
    this.serialStatus = `Leitura ativa na porta ${result.port || result.path || '-'}.`;
    this.clearScreenMessage();
  }

  private stopSerialReading(resetMessage: boolean = true): void {
    this.clearReconnectTimer();

    if (window.electronAPI?.serial) {
      void window.electronAPI.serial.stopReading();
    }

    this.serialLendo = false;
    this.serialTesteManual = false;
    this.serialUltimoValor = '';

    if (resetMessage) {
      this.serialStatus = 'Leitura serial inativa.';
      this.serialPorta = '';
    }
  }

  private isSerialEnabledForOrderStatus(status: string): boolean {
    const normalized = String(status || '').trim().toUpperCase();
    return normalized === 'ABERTA' || normalized === 'PARCIALMENTE_APONTADA';
  }

  private async abrirModalAcerto(): Promise<void> {
    if (!this.ordem || !this.ordemDetalhe?.ordem) {
      this.setScreenMessage('Consulte uma OP antes de realizar o acerto.', 'error');
      return;
    }

    if (this.isOrdemBloqueadaParaAcao()) {
      await this.enforceOrderFinalizationState();
      return;
    }

    this.acertoQuantidade = String(Math.max(0, Math.trunc(Number(this.contadorPulso || 0))));
    this.acertoTempoProducao = this.formatDecimalMinutes(this.getTempoProducaoAtualMinutos());
    await this.pausarExecucaoParaAcerto();
    if (window.electronAPI?.serial?.autoExecPause && !this.acertoExecucaoPausada) {
      return;
    }
    this.acertoModal?.open();
  }

  private async pausarExecucaoParaAcerto(): Promise<void> {
    if (!window.electronAPI?.serial?.autoExecPause || !this.ordemDetalhe?.ordem) {
      this.acertoExecucaoPausada = false;
      return;
    }

    const result = await window.electronAPI.serial.autoExecPause({
      op: `${this.ordemDetalhe.ordem.op_numero}${this.ordemDetalhe.ordem.op_item}${this.ordemDetalhe.ordem.op_sequencia}`,
    });

    this.acertoExecucaoPausada = Boolean(result.success);
    if (!result.success) {
      this.setScreenMessage(result.error || 'Nao foi possivel pausar a contagem para o acerto.', 'error');
    }
  }

  private async retornarExecucaoAposAcerto(): Promise<void> {
    if (!this.acertoExecucaoPausada) {
      return;
    }

    this.acertoExecucaoPausada = false;
    await this.activateAutomaticExecution();
  }

  private getLimiteQuantidadeAcerto(): number {
    if (!this.ordem || !this.ordemDetalhe?.ordem) {
      return 0;
    }

    const multiplo = this.getQuantidadeMetaAutomatica();
    if (multiplo > 0) {
      return multiplo;
    }

    const quantidadeOrdem = Math.max(0, Number(this.ordemDetalhe.ordem.op_quantidade || this.ordem.quantidade || 0));
    const saldoBruto = this.ordemDetalhe.ordem.op_saldo;
    const hasSaldo = saldoBruto !== undefined && saldoBruto !== null && String(saldoBruto).trim() !== '';
    const saldo = Math.max(0, Number(saldoBruto || 0));

    return hasSaldo ? Math.min(quantidadeOrdem, saldo) : quantidadeOrdem;
  }

  private getSaldoDisponivelAtual(): number {
    if (!this.ordemDetalhe?.ordem) {
      return 0;
    }

    return Math.max(0, Number(this.ordemDetalhe.ordem.op_saldo || 0));
  }

  private isOrdemBloqueadaParaAcao(): boolean {
    return !!this.ordemDetalhe?.ordem && this.getSaldoDisponivelAtual() <= 0;
  }

  private async enforceOrderFinalizationState(): Promise<void> {
    if (!this.isOrdemBloqueadaParaAcao()) {
      return;
    }

    this.consolidarTempoProducaoSessao();
    await this.persistAutomaticOrderState('', false);
    this.pararRelogioTempoProducao();
    this.serialStatus = 'OP finalizada. Saldo restante zerado.';
    this.setScreenMessage('OP finalizada. Saldo restante zerado. Nenhuma outra acao esta disponivel para esta ordem.', 'info');

    if (window.electronAPI?.serial?.autoExecPause && this.ordemDetalhe?.ordem) {
      await window.electronAPI.serial.autoExecPause({
        op: `${this.ordemDetalhe.ordem.op_numero}${this.ordemDetalhe.ordem.op_item}${this.ordemDetalhe.ordem.op_sequencia}`,
      });
    }

    this.stopSerialReading(false);
  }

  private async tryAutoApontamento(): Promise<void> {
    if (!this.ordem || !this.ordemDetalhe?.ordem || this.apontandoAutomatico || this.apontamentoStatusAcao !== 'none') {
      return;
    }

    const meta = this.getQuantidadeMetaAutomatica();
    if (!(meta > 0) || this.contadorPulso < meta) {
      return;
    }

    const ordem = this.ordemDetalhe.ordem;
    const produtoTipo = String(ordem.produto_tipo || '').trim().toUpperCase();

    if (produtoTipo !== 'PA' && produtoTipo !== 'PI') {
      return;
    }

    await this.executarApontamento(meta, 'Apontamento automatico por sinal serial.', 'Apontamento automatico realizado.', 'automatico');
  }

  get exibirBotaoApontamentoManual(): boolean {
    if (!this.ordem || !this.ordemDetalhe?.ordem) {
      return false;
    }

    return this.getQuantidadeMetaAutomatica() <= 0 || environment.apForaMultiplo;
  }

  get apontamentoManualDesabilitado(): boolean {
    return !this.ordem || !this.ordemDetalhe?.ordem || this.apontandoAutomatico || this.contadorPulso <= 0 || this.isOrdemBloqueadaParaAcao();
  }

  get acertoDesabilitado(): boolean {
    return !this.ordem || !this.ordemDetalhe?.ordem || this.salvandoAcerto || this.isOrdemBloqueadaParaAcao();
  }

  private async tryManualApontamento(): Promise<void> {
    if (!this.ordem || !this.ordemDetalhe?.ordem || this.apontandoAutomatico || !this.exibirBotaoApontamentoManual) {
      return;
    }

    if (this.isOrdemBloqueadaParaAcao()) {
      this.setScreenMessage('OP finalizada. Saldo restante zerado.', 'info');
      return;
    }

    const quantidadeApontamento = Number(this.contadorPulso || 0);
    if (!(quantidadeApontamento > 0)) {
      this.setScreenMessage('Nenhuma peca foi contada para apontar.', 'error');
      return;
    }

    await this.executarApontamento(
      quantidadeApontamento,
      'Apontamento manual acionado na rotina automatica.',
      'Apontamento realizado.',
      'manual'
    );
  }

  private async executarApontamento(
    quantidadeApontamento: number,
    observacao: string,
    mensagemSucesso: string,
    tipo: 'automatico' | 'manual',
  ): Promise<void> {
    if (!this.ordem || !this.ordemDetalhe?.ordem || this.apontandoAutomatico) {
      return;
    }

    const ordem = this.ordemDetalhe.ordem;
    const saldoDisponivel = this.getSaldoDisponivelAtual();
    const quantidadeConvertida = this.getQuantidadeApontamentoConvertida(ordem, quantidadeApontamento);
    if (!(saldoDisponivel > 0)) {
      this.setScreenMessage('Saldo da OP zerado. Nao e permitido realizar novos apontamentos.', 'error');
      await this.enforceOrderFinalizationState();
      return;
    }

    if (!(quantidadeConvertida > 0)) {
      this.setScreenMessage('Nao foi possivel converter a quantidade informada para M3.', 'error');
      return;
    }

    if (quantidadeConvertida > saldoDisponivel) {
      this.setScreenMessage('Quantidade do apontamento maior que o saldo da OP.', 'error');
      return;
    }

    const payload: ApontamentoProducaoPayload = {
      empresa: environment.grupo || '',
      filial: ordem.op_filial || environment.filial || '',
      ordem: `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`,
      produto: ordem.op_produto,
      conta: '',
      parctot: this.getParcialTotal(ordem, quantidadeConvertida),
      perda: 0,
      quantidade: quantidadeConvertida,
      um: this.isSerrariaComConversao(ordem) ? 'M3' : ordem.op_um,
      ccusto: '',
      controle: '',
      obs: observacao,
    };

    this.apontandoAutomatico = true;
    this.serialStatus = 'Realizando apontamento...';
    this.abrirStatusApontamento('Realizando apontamento...', 'Enviando apontamento para o Protheus.', 'info');
    const fimCicloApontamentoMs = Date.now();

    try {
      const response = await firstValueFrom(this.producaoService.apontarProducao(payload));
      this.apontandoAutomatico = false;

      if (String(response.status || '').trim().toLowerCase() === 'error') {
        this.serialStatus = response.msg || 'Falha no apontamento.';
        this.atualizarStatusApontamento(this.serialStatus, 'O processo foi interrompido. Feche esta mensagem para voltar à Home.', 'error', false, 'api-error');
        this.setScreenMessage(this.serialStatus, 'error');
        return;
      }

      this.atualizarStatusApontamento(response.backendMsg || response.msg || mensagemSucesso, 'Apontamento confirmado. Imprimindo etiqueta...', 'success');
      await this.registrarTempoCicloApontamento(quantidadeApontamento, tipo, observacao, fimCicloApontamentoMs);

      const resultadoImpressao = await this.imprimirEtiquetaAtual();
      if (!resultadoImpressao.success) {
        this.atualizarStatusApontamento(
          'Apontamento realizado, mas a etiqueta não foi impressa.',
          resultadoImpressao.error || 'Verifique a impressora e tente novamente.',
          'error',
          false,
          'print-error',
        );
        return;
      }

      await this.finalizarApontamentoAposImpressao(resultadoImpressao);
    } catch {
      this.apontandoAutomatico = false;
      this.serialStatus = 'Falha no apontamento.';
      this.atualizarStatusApontamento('Não foi possível realizar o apontamento.', 'O processo foi interrompido. Feche esta mensagem para voltar à Home.', 'error', false, 'api-error');
      this.setScreenMessage('Nao foi possivel realizar o apontamento.', 'error');
    }
  }

  fecharStatusApontamento(): void {
    if (this.apontamentoStatusAcao === 'api-error' || this.apontamentoStatusAcao === 'support') {
      this.fechandoStatusAutomaticamente = true;
      this.apontamentoStatusProcessando = false;
      this.apontamentoStatusAcao = 'none';
      this.apontamentoStatusModal?.close();
      this.sair();
      return;
    }

    this.apontamentoStatusProcessando = false;
    this.apontamentoStatusAcao = 'none';
    this.apontamentoStatusModal?.close();
  }

  async tentarReimprimirEtiqueta(): Promise<void> {
    if (this.tentandoReimprimirEtiqueta || this.apontamentoStatusAcao !== 'print-error') {
      return;
    }

    this.tentandoReimprimirEtiqueta = true;
    this.atualizarStatusApontamento('Tentando imprimir novamente...', 'Enviando etiqueta para a impressora.', 'info', true, 'processing');

    try {
      const resultadoImpressao = await this.imprimirEtiquetaAtual();
      if (!resultadoImpressao.success) {
        this.atualizarStatusApontamento(
          'A etiqueta não foi impressa.',
          resultadoImpressao.error || 'Verifique a impressora e tente novamente.',
          'error',
          false,
          'print-error',
        );
        return;
      }

      await this.finalizarApontamentoAposImpressao(resultadoImpressao);
    } finally {
      this.tentandoReimprimirEtiqueta = false;
    }
  }

  cancelarReimpressaoEtiqueta(): void {
    this.atualizarStatusApontamento(
      'Impressão cancelada.',
      'Informar ao Suporte para verificar o problema da impressora.',
      'error',
      false,
      'support',
    );
  }

  aoFecharStatusApontamento(): void {
    if (this.fechandoStatusAutomaticamente) {
      this.fechandoStatusAutomaticamente = false;
      return;
    }

    if (this.apontamentoStatusAcao === 'api-error' || this.apontamentoStatusAcao === 'support') {
      this.fecharStatusApontamento();
      return;
    }

    if (this.apontamentoStatusAcao === 'print-error') {
      this.cancelarReimpressaoEtiqueta();
    }
  }

  private abrirStatusApontamento(
    mensagem: string,
    detalhe: string,
    tipo: 'info' | 'success' | 'error',
  ): void {
    this.atualizarStatusApontamento(mensagem, detalhe, tipo, true, 'processing');
    this.apontamentoStatusModal?.open();
  }

  private atualizarStatusApontamento(
    mensagem: string,
    detalhe: string,
    tipo: 'info' | 'success' | 'error',
    processando = true,
    acao: 'none' | 'processing' | 'api-error' | 'print-error' | 'support' = processando ? 'processing' : 'none',
  ): void {
    this.apontamentoStatusMensagem = mensagem;
    this.apontamentoStatusDetalhe = detalhe;
    this.apontamentoStatusTipo = tipo;
    this.apontamentoStatusProcessando = processando;
    this.apontamentoStatusAcao = acao;
  }

  private async imprimirEtiquetaAtual() {
    if (this.isSetorGranel(this.ordemDetalhe?.ordem)) {
      return { success: true, usedPreview: false };
    }

    const etiqueta = this.getEtiquetaDados();
    return this.producaoEtiquetaService.imprimirEtiqueta(etiqueta);
  }

  private async validarPreRequisitos(): Promise<void> {
    if (this.validandoPreRequisitos) {
      return;
    }

    this.validandoPreRequisitos = true;

    try {
      const problemaComunicacao = await this.validarComunicacaoDispositivo();
      if (problemaComunicacao) {
        this.bloquearTelaPorPreRequisito('Problema na comunicação com o dispositivo.', problemaComunicacao);
        return;
      }

      const problemaImpressora = await this.validarImpressoraArgox();
      if (problemaImpressora) {
        this.bloquearTelaPorPreRequisito('Problema na impressora.', problemaImpressora);
        return;
      }

      this.abrirModalOp();
    } finally {
      this.validandoPreRequisitos = false;
    }
  }

  private async validarComunicacaoDispositivo(): Promise<string> {
    if (!window.electronAPI?.isDesktop || !window.electronAPI.serial?.startReading) {
      return 'A comunicação automática está disponível apenas no aplicativo desktop.';
    }

    try {
      const result = await window.electronAPI.serial.startReading();
      if (!result.success) {
        return result.error || 'Não foi possível iniciar a comunicação com a porta configurada.';
      }

      this.serialLendo = true;
      this.serialTesteManual = false;
      this.serialPorta = result.port || '';
      this.serialUltimoValor = result.lastValue || this.serialUltimoValor;
      this.serialStatus = `Leitura ativa na porta ${result.port || result.path || '-'}.`;
      return '';
    } catch (error) {
      return error instanceof Error ? error.message : 'Falha ao validar a comunicação com o dispositivo.';
    }
  }

  private async validarImpressoraArgox(): Promise<string> {
    if (!window.electronAPI?.isDesktop || !window.electronAPI.getPrinters) {
      return 'A validação da impressora está disponível apenas no aplicativo desktop.';
    }

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

      return argoxPrinter?.name ? '' : 'Impressora Argox OS214 Plus não encontrada. Verifique se a impressora está instalada e disponível no Windows.';
    } catch (error) {
      return error instanceof Error ? error.message : 'Não foi possível consultar as impressoras instaladas.';
    }
  }

  private bloquearTelaPorPreRequisito(mensagem: string, detalhe: string): void {
    this.preRequisitosMensagem = mensagem;
    this.preRequisitosDetalhe = detalhe;
    this.preRequisitosModal?.open();
  }

  private async finalizarApontamentoAposImpressao(resultadoImpressao: { success: boolean; printerName?: string; usedPreview?: boolean }): Promise<void> {
    this.atualizarStatusApontamento(
      'Etiqueta impressa.',
      resultadoImpressao.usedPreview
        ? 'Preview de impressão aberto. Reiniciando processo...'
        : `Etiqueta enviada para ${resultadoImpressao.printerName || 'a impressora'}. Reiniciando processo...`,
      'success',
      true,
      'processing',
    );

    this.clearScreenMessage();
    this.resetAutomaticCounter();
    await this.persistAutomaticOrderState('', true);
    await this.reloadCurrentOrderDetail();
    this.fechandoStatusAutomaticamente = true;
    this.fecharStatusApontamento();
  }

  private async reloadCurrentOrderDetail(): Promise<void> {
    if (!this.ordemDetalhe?.ordem) {
      return;
    }

    const ordemAtual = this.ordemDetalhe.ordem;

    this.producaoService
      .getDetalheOrdemProducao(
        ordemAtual.op_filial || environment.filial || '',
        ordemAtual.op_numero,
        ordemAtual.op_item,
        ordemAtual.op_sequencia,
        '',
        '',
      )
      .subscribe({
        next: (detalhe) => {
          this.ordemDetalhe = detalhe;
          this.ordem = this.mapOrdemTela(detalhe);
          this.historico = this.mapHistoricoLista(detalhe);
          void this.restoreOrCreatePersistedOrderState();
          void this.enforceOrderFinalizationState();
          void this.syncSerialByOrderStatus();
        },
      });
  }

  private getQuantidadeMetaAutomatica(): number {
    if (!this.ordemDetalhe?.ordem) {
      return 0;
    }

    const multiplo = Number(this.ordemDetalhe.ordem.produto_quant_multipla || 0);
    if (multiplo > 0) {
      return multiplo;
    }

    return 0;
  }

  private getParcialTotal(ordem: OrdemProducao, quantidade: number): string {
    const quantidadeTotal = Number(ordem.op_quantidade || 0);
    const quantidadeApontada = Number(ordem.op_quant_apontada || 0);
    return quantidadeApontada + quantidade >= quantidadeTotal ? 'T' : 'P';
  }

  private resetAutomaticCounter(): void {
    this.consolidarTempoProducaoSessao();
    this.pararRelogioTempoProducao();
    this.cicloApontamentoInicioMs = null;
    this.contadorPulso = 0;

    if (this.ordem) {
      this.ordem = {
        ...this.ordem,
        quantidadeProduzidaAtual: 0,
      };
    }
  }

  private async restoreOrCreatePersistedOrderState(): Promise<void> {
    if (!window.electronAPI?.sqlite?.apontamentoAutomatico || !this.ordem || !this.ordemDetalhe?.ordem) {
      return;
    }

    const op = this.ordem.productionOrder;
    const result = await window.electronAPI.sqlite.apontamentoAutomatico.getOrdemByOp(op);

    if (!result.success) {
      this.setScreenMessage(result.error || 'Falha ao recuperar o estado da OP.', 'error');
      return;
    }

    const ordemAtual = this.ordemDetalhe.ordem;
    const existente = result.row || null;

    this.autoPersistencia = {
      codigo: existente?.codigo,
      op,
      quantidade: Number(existente?.quantidade || ordemAtual.op_quantidade || 0),
      quantPar: Number(existente?.quantPar || 0),
      dataHora: String(existente?.dataHora || new Date().toISOString()),
      dataUltPc: String(existente?.dataUltPc || ''),
      cicloMedio: Number(existente?.cicloMedio || 0),
      tempo: Number(existente?.tempo || 0),
      totalProd: Number(existente?.totalProd || 0),
      tempoPrev: Number(existente?.tempoPrev || 0),
      perda: Number(existente?.perda || 0),
    };

    this.tempoProducaoBaseMinutos = Number(this.autoPersistencia.tempo || 0);
    this.tempoProducaoInicioSessaoMs = null;
    this.cicloApontamentoInicioMs = this.autoPersistencia.quantPar > 0 && this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status)
      ? Date.now()
      : null;
    this.pararRelogioTempoProducao();
    this.contadorPulso = this.autoPersistencia.quantPar;
    this.ordem = {
      ...this.ordem,
      quantidadeProduzidaAtual: this.contadorPulso,
    };

    if (
      this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status)
      && !this.isOrdemBloqueadaParaAcao()
      && (this.tempoProducaoBaseMinutos > 0 || this.contadorPulso > 0 || !!this.autoPersistencia.dataUltPc)
    ) {
      this.iniciarRelogioTempoProducao();
    }
  }

  private async persistAutomaticOrderState(rawValue: string, resetQuantPar: boolean = false): Promise<void> {
    if (!window.electronAPI?.sqlite?.apontamentoAutomatico || !this.ordem || !this.ordemDetalhe?.ordem) {
      return;
    }

    const nextQuantPar = resetQuantPar ? 0 : this.contadorPulso;

    const payload: ProducaoAutomaticaPersistencia = {
      codigo: this.autoPersistencia?.codigo,
      op: this.ordem.productionOrder,
      quantidade: Number(this.autoPersistencia?.quantidade || this.ordemDetalhe.ordem.op_quantidade || 0),
      quantPar: nextQuantPar,
      dataHora: this.autoPersistencia?.dataHora || new Date().toISOString(),
      dataUltPc: this.autoPersistencia?.dataUltPc || '',
      cicloMedio: Number(this.autoPersistencia?.cicloMedio || 0),
      tempo: this.getTempoProducaoAtualMinutos(),
      totalProd: Number(this.autoPersistencia?.totalProd || 0),
      tempoPrev: Number(this.autoPersistencia?.tempoPrev || 0),
      perda: Number(this.autoPersistencia?.perda || 0),
    };

    void rawValue;

    const result = await window.electronAPI.sqlite.apontamentoAutomatico.upsertOrdem(payload);
    if (!result.success) {
      this.setScreenMessage(result.error || 'Falha ao salvar o estado da OP.', 'error');
      return;
    }

    this.autoPersistencia = payload;
  }

  private async activateAutomaticExecution(): Promise<void> {
    if (!window.electronAPI?.serial?.autoExecActivate || !this.ordemDetalhe?.ordem || !this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status)) {
      return;
    }

    const ordem = this.ordemDetalhe.ordem;
    const result = await window.electronAPI.serial.autoExecActivate({
      op: `${ordem.op_numero}${ordem.op_item}${ordem.op_sequencia}`,
      empresa: environment.grupo || '',
      filial: ordem.op_filial || environment.filial || '',
      produto: ordem.op_produto || ordem.produto_codigo,
      quantidade: Number(ordem.op_quantidade || 0),
    });

    if (!result.success) {
      this.setScreenMessage(result.error || 'Falha ao ativar a execucao automatica.', 'error');
    }
  }

  get tempoProducaoLabel(): string {
    void this.tempoProducaoTickMs;
    return this.formatMinutes(this.getTempoProducaoAtualMinutos());
  }

  get cicloMedioLabel(): string {
    return this.formatSeconds(this.autoPersistencia?.cicloMedio || 0);
  }

  get tempoPrevistoLabel(): string {
    return this.formatMinutes(this.autoPersistencia?.tempoPrev || 0);
  }

  private setScreenMessage(message: string, type: 'error' | 'info' | 'success' = 'info'): void {
    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) {
      this.screenMessage = '';
      return;
    }

    if (type === 'error') {
      this.screenMessage = normalizedMessage;
      this.screenMessageType = type;
      return;
    }

    this.screenMessage = '';
    const toastKey = `${type}:${normalizedMessage}`;
    if (this.lastToastKey === toastKey) {
      return;
    }

    this.lastToastKey = toastKey;

    if (type === 'success') {
      this.poNotification.success(normalizedMessage);
      return;
    }

    this.poNotification.information(normalizedMessage);
  }

  private clearScreenMessage(): void {
    this.screenMessage = '';
  }

  private iniciarRelogioTempoProducao(): void {
    if (this.tempoProducaoInicioSessaoMs !== null || !this.ordemDetalhe?.ordem) {
      return;
    }

    if (!this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status) || this.isOrdemBloqueadaParaAcao()) {
      return;
    }

    this.tempoProducaoInicioSessaoMs = Date.now();
    this.tempoProducaoTickMs = this.tempoProducaoInicioSessaoMs;

    if (!this.tempoProducaoTimer) {
      this.tempoProducaoTimer = setInterval(() => {
        this.tempoProducaoTickMs = Date.now();
      }, 1000);
    }
  }

  private iniciarCicloApontamentoSeNecessario(): void {
    if (this.cicloApontamentoInicioMs !== null || !this.ordemDetalhe?.ordem) {
      return;
    }

    if (!this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status) || this.isOrdemBloqueadaParaAcao()) {
      return;
    }

    this.cicloApontamentoInicioMs = Date.now();
  }

  private aplicarTempoAcertoAoCiclo(tempoMinutos: number, quantidade: number): void {
    const tempoNormalizado = Math.max(0, Number(tempoMinutos || 0));
    this.tempoProducaoBaseMinutos = tempoNormalizado;
    this.tempoProducaoInicioSessaoMs = Date.now();
    this.tempoProducaoTickMs = this.tempoProducaoInicioSessaoMs;

    if (quantidade > 0) {
      this.cicloApontamentoInicioMs = this.tempoProducaoInicioSessaoMs - (tempoNormalizado * 60000);
    } else {
      this.cicloApontamentoInicioMs = null;
    }

    if (!this.tempoProducaoTimer) {
      this.tempoProducaoTimer = setInterval(() => {
        this.tempoProducaoTickMs = Date.now();
      }, 1000);
    }
  }

  private parseTempoAcertoMinutos(value: string): number | null {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return 0;
    }

    if (/^\d+$/.test(normalized)) {
      return Number(normalized);
    }

    return null;
  }

  private async registrarTempoCicloApontamento(
    quantidadeApontamento: number,
    tipo: 'automatico' | 'manual',
    observacao: string,
    fimMs: number,
  ): Promise<void> {
    if (!window.electronAPI?.sqlite?.apontamentoAutomatico?.registrarCicloApontamento || !this.ordem || !this.ordemDetalhe?.ordem) {
      return;
    }

    const inicioMs = this.cicloApontamentoInicioMs ?? this.tempoProducaoInicioSessaoMs ?? fimMs;
    const tempoSegundos = Math.max(0, (fimMs - inicioMs) / 1000);
    const ordem = this.ordemDetalhe.ordem;

    const result = await window.electronAPI.sqlite.apontamentoAutomatico.registrarCicloApontamento({
      op: this.ordem.productionOrder,
      empresa: environment.grupo || '',
      filial: ordem.op_filial || environment.filial || '',
      produto: ordem.op_produto || ordem.produto_codigo,
      quantidade: quantidadeApontamento,
      tipo,
      usuario: this.usuarioLogado,
      inicioEm: new Date(inicioMs).toISOString(),
      fimEm: new Date(fimMs).toISOString(),
      tempoSegundos,
      tempoMinutos: tempoSegundos / 60,
      observacao,
    });

    if (!result.success) {
      this.setScreenMessage(result.error || 'Falha ao registrar tempo de ciclo do apontamento.', 'error');
    }
  }

  private consolidarTempoProducaoSessao(): void {
    if (this.tempoProducaoInicioSessaoMs === null) {
      if (this.autoPersistencia) {
        this.autoPersistencia = {
          ...this.autoPersistencia,
          tempo: this.tempoProducaoBaseMinutos,
        };
      }
      return;
    }

    this.tempoProducaoBaseMinutos = this.getTempoProducaoAtualMinutos();
    this.tempoProducaoInicioSessaoMs = null;
    this.tempoProducaoTickMs = Date.now();

    if (this.autoPersistencia) {
      this.autoPersistencia = {
        ...this.autoPersistencia,
        tempo: this.tempoProducaoBaseMinutos,
      };
    }
  }

  private pararRelogioTempoProducao(): void {
    if (this.tempoProducaoTimer) {
      clearInterval(this.tempoProducaoTimer);
      this.tempoProducaoTimer = null;
    }
  }

  private getTempoProducaoAtualMinutos(): number {
    if (this.tempoProducaoInicioSessaoMs === null) {
      return Math.max(0, Number(this.tempoProducaoBaseMinutos || this.autoPersistencia?.tempo || 0));
    }

    return Math.max(0, Number(this.tempoProducaoBaseMinutos || 0) + ((Date.now() - this.tempoProducaoInicioSessaoMs) / 60000));
  }

  private formatSeconds(value: number): string {
    const totalSeconds = Math.max(0, Math.round(Number(value || 0)));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private formatMinutes(value: number): string {
    const totalSeconds = Math.max(0, Math.round(Number(value || 0) * 60));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private formatDecimalMinutes(value: number): string {
    const minutes = Math.max(0, Math.round(Number(value || 0)));
    return String(minutes);
  }

  private isSerialAccessDeniedMessage(message: string): boolean {
    const normalized = String(message || '').trim().toLowerCase();
    return normalized.includes('access denied') || normalized.includes('permission denied') || normalized.includes('resource busy');
  }

  private scheduleSerialReconnect(): void {
    if (this.reconnectTimer || !window.electronAPI?.serial) {
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;

      if (!this.ordemDetalhe?.ordem || !this.isSerialEnabledForOrderStatus(this.ordemDetalhe.ordem.op_status) || this.isOrdemBloqueadaParaAcao()) {
        return;
      }

      const result = await window.electronAPI?.serial?.reconnectReading();
      if (!result?.success) {
        if (this.isSerialAccessDeniedMessage(result?.error || '')) {
          this.scheduleSerialReconnect();
          return;
        }

        this.setScreenMessage(result?.error || 'Falha ao reconectar a porta serial.', 'error');
        return;
      }

      this.serialLendo = true;
      this.serialPorta = result.port || this.serialPorta;
      this.serialStatus = `Leitura ativa na porta ${result.port || result.path || '-'}.`;
      this.setScreenMessage('Leitura da porta retomada com sucesso.', 'info');
    }, 3000);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
