import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { PoDynamicFormComponent, PoDynamicFormField } from '@po-ui/ng-components';

import { SolicitacaoForm } from '../../interfaces/solicitacao.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-manutencao',
  templateUrl: './form-manutencao.component.html',
  styleUrls: ['./form-manutencao.component.css'],
})
export class FormManutencaoComponent {
  // Expor o formulário filho com um @ViewChild na variável de template e Getter p/ ser acessível pelo componente pai.
  @ViewChild('formAberturaOs')
  formAberturaOs!: PoDynamicFormComponent;

  // Enviar o Formulário com os dados para o Componente Pai.
  @Output() formularioValido = new EventEmitter<boolean>();

  public resetForm(): void {
    // Reseta o formulário para os valores padrões da solicitação.
    this.formAberturaOs.form.reset({
      solicitante: '',
      tipoDeProblema: null, // Null pq o Usuario precisa Selecionar.
      maquinaParada: 'nao', // Valor padrão
      descricaoProblema: '', // Opcional, mas iniciado como string vazia
    });

    console.log('Formulário Resetado! Valores atuais:\n', this.formAberturaOs.form.value);
  }

  // Event Listeners do Formulario.
  private formSubscription!: Subscription | null;

  public setupFormListener() {
    // Desfaz o listener anterior, se houver.
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }

    // Recria o Subscription container
    this.formSubscription = new Subscription();

    if (this.formAberturaOs && this.formAberturaOs.form) {
      // Adiciona os listeners ao Subscription container
      this.formSubscription.add(
        this.formAberturaOs.form.statusChanges?.subscribe((status) => {
          console.log('Status do Formulário: ', status);
          if (status === 'VALID') this.formularioValido.emit(true);
          else this.formularioValido.emit(false);
        }),
      );

      this.formSubscription.add(
        this.formAberturaOs.form.valueChanges?.subscribe((value) => {
          console.log('Valor do Formulário mudou:', value);
        }),
      );
    }
  }

  public removerFormListeners() {
    // Desfaz a inscrição atual
    this.formularioValido.emit(false);
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    this.formSubscription = null;
  }

  // Iniciar o Value do Form vazio (Correção TypeError: Undefined)
  solicitacaoForm: SolicitacaoForm = {
    solicitante: '',
    tipoDeProblema: null, // Null pq o Usuario precisa Selecionar.
    maquinaParada: 'nao',
    descricaoProblema: '', // Opcional, mas iniciado como string vazia
  };

  // Lista com os campos do formulário que validam o form.
  camposValidadores: string[] = ['tipoDeProblema', 'maquinaParada','solicitante'];

  // Coleção que implementa a interfaces PoDynamicFormField.
  // Define e cria os campos dinamicamente.
  fieldsAberturaOs: PoDynamicFormField[] = [

    {
      property: 'solicitante',
      divider: 'Informações do Solicitante',
      required: true,
      minLength: 4,
      maxLength: 50,
      gridColumns: 12,
      gridSmColumns: 12,
      order: 1,
      placeholder: 'Nome solicitante'
    },

    {
      divider: 'Informações sobre o Incidente',
      property: 'tipoDeProblema',
      label: 'Tipo de Incidente',
      gridColumns: 9,
      required: true,
      showRequired: true,

      // Validar o Campo:
      // 1. Definir as Options.
      // 2. Mapear o fieldValue e fieldLabel com os campos da Options.
      options: [
        { label: 'Incidente Mecânico', value: 'CORMEC' },
        { label: 'Incidente Elétrico', value: 'CORELE' },
        { label: 'Desconheço', value: 'CORGEN' },
      ],
      fieldValue: 'value',
      fieldLabel: 'label',

      order: 1,
      formatModel: true,
    },
    {
      label: 'Máquina Parada?',
      property: 'maquinaParada',
      gridColumns: 3,
      required: true,
      showRequired: true,
      type: 'boolean',
      booleanFalse: 'nao',
      booleanTrue: 'sim',
      order: 1,
      formatModel: true,
    },
    {
      property: 'descricaoProblema',
      label: 'Relatar o Incidente',
      gridColumns: 12,
      required: true,
      showRequired: true,
      maxLength: 255,
      placeholder: 'Relate o incidente, escrevendo o que aconteceu.',
      help: 'Descreva o que está acontecendo, no campo de texto acima.',
      order: 2,
      rows: 5,
      formatModel: true,
      optional: true,
    },
  ];
}
