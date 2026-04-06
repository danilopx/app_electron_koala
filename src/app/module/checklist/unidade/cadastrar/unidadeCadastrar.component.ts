import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {
  ForceOptionComponentEnum,
  PoDynamicFormComponent,
  PoDynamicFormField,
  PoNotificationService,
  PoInfoOrientation,
} from '@po-ui/ng-components';
import { ActivatedRoute, Router } from '@angular/router';

import { ChecklistService } from '../../../../service/checklist.service';

@Component({
  selector: 'app-unidade',
  templateUrl: './unidadeCadastrar.component.html',
  styleUrls: ['./unidadeCadastrar.component.scss'],
  providers: [ChecklistService],
})
export class UnidadeCadastrarComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    private router: Router,
    public ChecklistService: ChecklistService,
    private changeDetector: ChangeDetectorRef,
    private fb: FormBuilder,
    private poNotification: PoNotificationService,
    private route: ActivatedRoute,
  ) {}

  @ViewChild('dynamicForm', { static: true }) dynamicForm!: PoDynamicFormComponent;
  formData = {}; // Dados iniciais (vazio ou com valores)
  private destroy$ = new Subject<void>();
  fields: PoDynamicFormField[] = [
    {
      label: 'Empresa',
      property: 'empresa',
      gridColumns: 12,
      gridSmColumns: 12,
      forceOptionsComponentType: ForceOptionComponentEnum.select,
      options: [
        { filial: '', code: '' },
        { filial: 'Arotubi Metais', code: '01010101' },
        { filial: 'Arotubi Componentes', code: '01020101' },
        { filial: 'Arotubi Sistemas', code: '01030101' },
        { filial: 'Eletropolar', code: '02010101' },
        { filial: 'Austral', code: '02020101' },
      ],
      fieldLabel: 'filial',
      fieldValue: 'code',
      optional: true,
      required: false,
    },

    {
      property: 'descricao',
      label: '* Descrição Da Unidade',
      required: true,
      gridColumns: 12,
      maxLength: 100,
      optional: false,
      showRequired: true,
    },
    {
      property: 'identificacao',
      label: 'Código De Identificação',
      required: false,
      gridColumns: 12,
      optional: true,
      maxLength: 100,
      placeholder: 'Ex: Equipamento = Numero de Série | Veiculo = Placa',
    },

    {
      property: 'status',
      label: 'Status',
      type: 'boolean',
      gridColumns: 12,
      booleanTrue: 'Ativo',
      booleanFalse: 'Desativado',
      formatModel: true,
    },
  ];


  private paramsSub!: Subscription;

  buttonPRG = false;
  orientation = PoInfoOrientation.Horizontal;
  loagingPage = false;
  unidade_id = '';
  action = 'Cadastrar';
  ngOnInit(): void {
    console.warn('Formulário inválido!');
    this.paramsSub = this.route.params.subscribe((params) => {

      console.log('params:', params['id']);

      if (params['id'] != undefined ) {
        this.unidade_id = params['id'];
        this.action = 'Alterar';
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngAfterViewInit(): void {
    console.warn('Formulário inválido!');
  }

  voltar() {
    this.router.navigateByUrl('/checklist/unidade/listar');
  }

  submitForm(): void {
    const form = this.dynamicForm.form as NgForm;


    if (form.valid) {
      this.onSubmit(form.value);
    } else {
      Object.values(form.controls).forEach((control) => control.markAsTouched());

      const camposInvalidos = Object.keys(form.controls)
        .filter((controlName) => form.controls[controlName].invalid)
        .map((controlName) => {
          const field = this.fields.find((f) => f.property === controlName);
          return field?.label || controlName;
        });

      const mensagem = 'Preencha os campos obrigatórios: ' + camposInvalidos.join(', ');
      this.poNotification.warning(mensagem);
    }
  }

  onSubmit(value: any): void {
    
    const unidade = this.replaceUndefinedWithEmptyString(value);
    this.loagingPage = true;
    if (this.action == 'Cadastrar') {
      
      this.ChecklistService.setUnidade(unidade)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any) => {
            console.log('Unidade cadastrada com sucesso:', data);
            (this.dynamicForm.form as NgForm).resetForm();
            this.poNotification.success('Cadastro realizado com sucesso!');
          },
          error: (err) => {
            console.error('Erro ao cadastrar unidade:', err);
            this.loagingPage = false; // Corrigido "loagingPage"
          },
          complete: () => {
            this.loagingPage = false;
          },
        });
    } else {
      console.log('Alterar unidade:', value);
    }

    // Aqui você pode limpar o formulário se necessário
  }

  private replaceUndefinedWithEmptyString(obj: any): any {
    for (let key in obj) {
      if (obj[key] === undefined) {
        obj[key] = ''; // Substitui undefined por uma string vazia
      }
    }
    return obj;
  }
}
