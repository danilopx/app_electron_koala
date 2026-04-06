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
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { ProtheusService } from '../../../service/protheus.service';
import { EdiService } from '../../../service/edi.service';
import { DatePipe } from '@angular/common';
import { DocumentIdi } from 'src/app/interfaces/documentEdi.interface';
import { PedidoIdi } from 'src/app/interfaces/interface-pedidoedi';

@Component({
  selector: 'app-aplicacao',
  templateUrl: './aplicacao.component.html',
  styleUrls: ['./aplicacao.component.scss'],
  providers: [ProtheusService, EdiService],
})
export class AplicacaoComponent implements OnInit, OnDestroy {


    constructor( private router: Router, public ProtheusService: ProtheusService, private changeDetector: ChangeDetectorRef,private datePipe: DatePipe) { }


    ngOnDestroy(): void {
        throw new Error('Method not implemented.');
    }
    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }

   

    menu = [
        { label: 'Detalhes do checklist', icon: 'po-icon-document' },
        { label: 'Utilização', icon: 'po-icon-ok', selected: true },
        { label: 'Organização', icon: 'po-icon-folder' },
        { label: 'Compartilhamento', icon: 'po-icon-share' },
        { label: 'Assinaturas', icon: 'po-icon-edit' }
      ];
    
      icones = [
        { label: 'N/A', icon: 'po-icon-close' },
        { label: '', icon: 'po-icon-thumbs-down' },
        { label: '', icon: 'po-icon-star' },
        { label: '', icon: 'po-icon-thumbs-up' },
        { label: '', icon: 'po-icon-ok' }
      ];
    
  
   
}
