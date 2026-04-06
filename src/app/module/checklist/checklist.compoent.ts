import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  PoModalComponent,
  PoTableComponent,
  PoStepperItem,
  PoTableLiterals,
  PoStepperStatus,
  PoTableColumn,
  PoSelectOption,
  PoStepperComponent,
  PoToasterType,
  PoInfoOrientation
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { ProtheusService } from '../../service/protheus.service';
import { EdiService } from '../../service/edi.service';
import { DatePipe } from '@angular/common';
import { DocumentIdi } from 'src/app/interfaces/documentEdi.interface';
import { PedidoIdi } from 'src/app/interfaces/interface-pedidoedi';

@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss'],
  providers: [ProtheusService, EdiService],
})
export class ChecklistComponent implements OnInit, OnDestroy {

  constructor( private router: Router, public ProtheusService: ProtheusService, private changeDetector: ChangeDetectorRef,private datePipe: DatePipe) { }

    ngOnDestroy(): void {
      console.log('ChecklistComponent initialized');
    }
    ngOnInit(): void {
       console.log('ChecklistComponent initialized');
    }

    newPedido() {
      this.router.navigateByUrl('/checklist/aplicacao');
    }
    newUnidade() {
      this.router.navigateByUrl('/checklist/unidade/listar');
    }

    columns = [
        { property: 'unidade', label: 'Unidade' },
        { property: 'checklist', label: 'Checklist' },
        { property: 'data', label: 'Data de início' },
        { property: 'usuario', label: 'Usuário' },
        { property: 'resultado', label: 'Resultado' }
      ];
    
      items = [
        {
          unidade: 'Funcionário XPTO',
          checklist: "Auditoria de EPI's",
          data: '12/05/2025 05:09',
          usuario: 'danilo',
          resultado: '-'
        }
      ];

      type = PoToasterType.Error
      orientation= PoInfoOrientation.Horizontal
  
   
}
