import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';
import { ConfiguracaoSistemaService } from '../service/configuracao-sistema.service';

@Component({
  selector: 'app-configuracao-inicial',
  templateUrl: './configuracao-inicial.component.html',
  styleUrls: ['./configuracao-inicial.component.scss'],
})
export class ConfiguracaoInicialComponent implements OnInit {
  saving = false;
  showPassword = false;

  readonly form = this.formBuilder.group({
    production: [true, Validators.requiredTrue],
    apiRoot: ['', Validators.required],
    admUser: ['', Validators.required],
    pass: ['', Validators.required],
    grupo: ['', Validators.required],
    filial: ['', Validators.required],
    codigoEquipamento: ['', Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly configuracaoSistemaService: ConfiguracaoSistemaService,
    private readonly poNotification: PoNotificationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const defaults = this.configuracaoSistemaService.getFormDefaults();
    this.form.patchValue(defaults);

    if (this.configuracaoSistemaService.isConfigured()) {
      this.router.navigate(['/login']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async save(): Promise<void> {
    if (this.saving) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const currentValues = this.configuracaoSistemaService.getCurrentValues();
    const configToSave = {
      production: Boolean(this.form.value.production),
      apiRoot: String(this.form.value.apiRoot || '').trim(),
      admUser: String(this.form.value.admUser || '').trim(),
      pass: String(this.form.value.pass || '').trim(),
      grupo: String(this.form.value.grupo || '').trim(),
      filial: String(this.form.value.filial || '').trim(),
      codigoEquipamento: String(this.form.value.codigoEquipamento || '').trim(),
      baudRate: currentValues.baudRate,
      setor: currentValues.setor,
      processo: currentValues.processo,
      apManual: currentValues.apManual,
      apAuto: currentValues.apAuto,
      apAutoMenu: currentValues.apAutoMenu,
      apForaMultiplo: currentValues.apForaMultiplo,
    };

    try {
      await this.configuracaoSistemaService.validateInitialConfig(configToSave);
    } catch (error) {
      console.error(error);
      this.poNotification.error('Configurações inválidas. Revise os dados de conexão e tente novamente.');
      this.saving = false;
      return;
    }

    try {
      await this.configuracaoSistemaService.saveInitialConfig(configToSave);
      this.poNotification.success('Configuração inicial salva com sucesso.');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'A conexão foi validada, mas não foi possível salvar os parâmetros locais.';
      this.poNotification.error(`A conexão foi validada, mas não foi possível salvar os parâmetros locais. ${message}`);
    } finally {
      this.saving = false;
    }
  }
}
