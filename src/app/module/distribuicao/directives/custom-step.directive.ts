import { Directive, Input, OnInit } from '@angular/core';
import { PoStepComponent } from '@po-ui/ng-components';

@Directive({
  selector: '[appCustomstep]',
})

/** Essa Diretiva acrescenta um Indexer ao PO Step p/ poder identificar ele melhor.  */
export class CustomStepDirective implements OnInit {
  /** Valor a ser recebido do componente, com property binding - `[customStepIndex]` */
  @Input() customStepIndex!: number;

  constructor(private poStepComponent: PoStepComponent) {}

  /** O ngOnInit desta diretiva, vai acessar o elemento atual, informado no Constructor, e adicionar as propriedades. */
  ngOnInit() {
    this.poStepComponent.id = `${this.customStepIndex}`;
  }
}
