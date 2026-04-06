import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  PoModalComponent,
  PoInfoOrientation,
  PoTagType,
  PoModalAction,
  PoStepperItem,
  PoStepperComponent,
  PoRadioGroupOption,
} from '@po-ui/ng-components';
import { Router } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';
//import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { async, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Iempresa } from '../../interfaces/interface-empresa';
import { DatePipe } from '@angular/common';
import { EmpresaService } from '../../service/empresa.service';
import { EquipamentoService } from '../../service/equipamento.service';
import { Setor } from '../../interfaces/setor.interface';
import { Equipamento } from '../../interfaces/equipamento.interface';
import { ImageCacheService } from 'src/app/shared/services/image-cache.service';

//import { InformacoesEquipamentoComponent } from '../../components/informacoes-equipamento/informacoes-equipamento.component';
import { FormManutencaoComponent } from '../../components/form-manutencao/form-manutencao.component';

import { SolicitacoesService } from '../../service/solicitacoes.service';

import {
  //SolicitacaoAberta,
  SolicitacaoProtheus,
  //SolicitacaoServicoResponse,
  SolicitacaoProtheusOS,
  SolicitacoesAbertasResponse,
} from '../../interfaces/solicitacao.interface';
import { SolicitacaoServico } from '../../interfaces/solicitacao-servico.interface';

@Component({
  selector: 'app-sigamnt',
  templateUrl: './sigamnt.component.html',
  styleUrls: ['./sigamnt.component.scss'],
})
export class SigamntComponent implements OnInit {
  constructor(
    private empresaService: EmpresaService,
    public datePipe: DatePipe,
    private router: Router,
    private http: HttpClient,
    private poNotification: PoNotificationService,
    private equipamentoService: EquipamentoService,
    private ordemServicoService: SolicitacoesService,
    private cd: ChangeDetectorRef,
    private imageCacheService: ImageCacheService,
  ) {
    const filial = localStorage.getItem('filial');
    this.setFilial = filial !== null && filial !== '' ? filial : '030101';
    const grupo = localStorage.getItem('grupo');
    this.setGrupo = grupo !== null && grupo !== '' ? grupo : '01';
  }

  @ViewChild('modalReabrir') modalReabrir!: PoModalComponent;
  @ViewChild('modalAvaliacao') modalAvaliacao!: PoModalComponent;
  @ViewChild('modalAbrirSolicitacao') modalAbrirSolicitacao!: PoModalComponent;
  @ViewChild('modalSolicitacoesAbertas') modalSolicitacoesAbertas!: PoModalComponent;
  @ViewChild('modalInformacoesEquipamento') modalInformacoesEquipamento!: PoModalComponent;
  @ViewChild('formAbrirSolicitacao') formAbrirSolicitacao!: FormManutencaoComponent;
  @ViewChild('formReabrirSolicitacao') formReabrirSolicitacao!: FormManutencaoComponent;
  @ViewChild(FormManutencaoComponent) private formFilhoComponent!: FormManutencaoComponent;
  @ViewChild(PoStepperComponent) stepper!: PoStepperComponent;

  //@ViewChild(InformacoesEquipamentoComponent) private infoEquipamentoComponent!: InformacoesEquipamentoComponent;

  orientation!: PoInfoOrientation;
  IEmpresa!: Iempresa[];
  filtro!: string;
  setores!: Setor[];
  equipamentos!: Equipamento[];
  equipamentos_aberta!: Equipamento[];
  equipamentoSelecionado: Equipamento = {} as Equipamento;
  solicitacoesResponse: SolicitacoesAbertasResponse = {} as SolicitacoesAbertasResponse;
  solicitacaoResponse: SolicitacaoServico = {} as SolicitacaoServico;
  solicitacoesEquipamento: SolicitacaoServico[] = [];
  possuiSolicitacaoAberta!: boolean;
  formularioValido!: boolean;
  reFormularioValido!: boolean; // Armazena o estado de validade do formulário
  setorAtual: Setor = {} as Setor;
  loadingAbrirSolicitacao!: boolean;
  abrindoSolicitacao!: boolean;
  modalAbrirSolicitacaoVisivel!: boolean;
  modalSolicitacoesAbertasVisivel!: boolean;
  modalInformacoesEquipamentoVisivel!: boolean;
  activeSetorEquipamentos = 'Todos';
  activeSetorAbertas = 'Todos';
  mostrarSomenteAbertas = false;
  ultimaAtualizacaoResumo = '';
  setGrupo = localStorage.getItem('grupo') ?? '';
  setFilial = localStorage.getItem('filial') ?? '';
  steps: Array<PoStepperItem> = [];
  solicitacoes: SolicitacaoServico[] = [];
  avaliacaoSolicId = '';
  avaliacaoFilialId = '';
  protected loadingForm!: boolean;
  qualidadeServico = null;
  novoIncidente = null;
  satisfacaoAtendimento = null;
  srcImage =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QCuRXhpZgAASUkqAAgAAAAHABIBAwABAAAAAQAAABoBBQABAAAAYgAAABsBBQABAAAAagAAACgBAwABAAAAAgAAADEBAgANAAAAcgAAADIBAgAUAAAAgAAAAGmHBAABAAAAlAAAAAAAAABgAAAAAQAAAGAAAAABAAAAR0lNUCAyLjEwLjM2AAAyMDI1OjAzOjA2IDE1OjExOjQ3AAEAAaADAAEAAAABAAAAAAAAAP/hDM1odHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9ImdpbXA6ZG9jaWQ6Z2ltcDo1Y2MyMWM1Yy0xMDc3LTQ5YzMtODM0OS1mMTNlYTc5NjdlM2IiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZGU3ZGEyNGMtNDc2Yy00NmUwLWI4MjEtYzMwYzU0ODQzZDA1IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NzE4ZGQyNTItOTZjMy00MTc0LWIyNWYtOTNjNzJlZGI0NTA3IiBkYzpGb3JtYXQ9ImltYWdlL2pwZWciIEdJTVA6QVBJPSIyLjAiIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiIEdJTVA6VGltZVN0YW1wPSIxNzQxMjg0NzI0MzA2MzMwIiBHSU1QOlZlcnNpb249IjIuMTAuMzYiIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI1OjAzOjA2VDE1OjExOjQ3LTAzOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNTowMzowNlQxNToxMTo0Ny0wMzowMCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDpjaGFuZ2VkPSIvIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmFhNmM3YmNlLTY2ZjgtNDAwZC04ZmFlLWQzMGEwMmQwZTYwNCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChXaW5kb3dzKSIgc3RFdnQ6d2hlbj0iMjAyNS0wMy0wNlQxNToxMjowNCIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/Pv/iArBJQ0NfUFJPRklMRQABAQAAAqBsY21zBEAAAG1udHJSR0IgWFlaIAfpAAMABgARACgAOWFjc3BNU0ZUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD21gABAAAAANMtbGNtcwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADWRlc2MAAAEgAAAAQGNwcnQAAAFgAAAANnd0cHQAAAGYAAAAFGNoYWQAAAGsAAAALHJYWVoAAAHYAAAAFGJYWVoAAAHsAAAAFGdYWVoAAAIAAAAAFHJUUkMAAAIUAAAAIGdUUkMAAAIUAAAAIGJUUkMAAAIUAAAAIGNocm0AAAI0AAAAJGRtbmQAAAJYAAAAJGRtZGQAAAJ8AAAAJG1sdWMAAAAAAAAAAQAAAAxlblVTAAAAJAAAABwARwBJAE0AUAAgAGIAdQBpAGwAdAAtAGkAbgAgAHMAUgBHAEJtbHVjAAAAAAAAAAEAAAAMZW5VUwAAABoAAAAcAFAAdQBiAGwAaQBjACAARABvAG0AYQBpAG4AAFhZWiAAAAAAAAD21gABAAAAANMtc2YzMgAAAAAAAQxCAAAF3v//8yUAAAeTAAD9kP//+6H///2iAAAD3AAAwG5YWVogAAAAAAAAb6AAADj1AAADkFhZWiAAAAAAAAAknwAAD4QAALbEWFlaIAAAAAAAAGKXAAC3hwAAGNlwYXJhAAAAAAADAAAAAmZmAADypwAADVkAABPQAAAKW2Nocm0AAAAAAAMAAAAAo9cAAFR8AABMzQAAmZoAACZnAAAPXG1sdWMAAAAAAAAAAQAAAAxlblVTAAAACAAAABwARwBJAE0AUG1sdWMAAAAAAAAAAQAAAAxlblVTAAAACAAAABwAcwBSAEcAQv/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/CABEIASwBLAMBIgACEQEDEQH/xAAeAAEAAwACAwEBAAAAAAAAAAAACAkKBgcBAgQDBf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAb/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHHM9ZfHXdV/Z2dBc0mjww5rNugKEJrgQZnMAAAAAAAAAAAAAOOcjzjEcLs/NgR/S/Dj2eUu17Gwlc9N3/B/eisq60QxIgaa1nTfcgAAAAAAAAAAAB1Tmws/9CduMHVXkSHOfGqkprs4nlTwe3NvcWCfLnX1/Gd/RDkv1oAAAAAAAAAAAAFDFgcMpMH1ZEtduRotA0ZwLjKe3PvaQ5KDFVp3zDk+9gOP7YCZO9YmTjWOAAAAAAAAAAAAQlrQ0C5JS/aL1pVFh57H9rVTr6E/Qfgpg6rvz+ghRqa6bqoIq6o61bKgAAAAAAAAAAABCWbQxVW9zAo7NbyBs7z3Adb0hk7Kkf10xH97yAAAAAAAAAAAAADqntYZ+Ic6zRlE+XWKMs9vtjY8eQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//xAApEAABBAICAQIFBQAAAAAAAAAGBAUHCAEDAAJAGDcSFRcxgBATICQm/9oACAEBAAEFAvzYJzgQDE75ceKm3urvGg6bW+7gdswLWLiEt2dO/TZ1852d2xhbpUt09PCgQrHLEkbh+nEXNnRLW6E0etwqrCa7BfSb4dbaWTjXN2iGehKWE/mO7s3MLZJMkmtijWGa7i8YJubNuvTr2S/FWnYwGAoVdeEQ4wlbVJKEfAJJr1O6eUmvy7dSooeXqu8MpowF1CxIkx87ZuXBk1xWv3Bh9fht9HFzg5D9j7IZ3ZrzWVNqSyqEPdeJPj80bpBEPJOSfQFh9Yg/dI8ryga648AycrITJ24PDJAWOTfT6X1qWBK06Y9U2Pshnfmt9b/leEs3CbjKtgI/1yFGlKzfZpc/JuQ+bG2K6cD/AEbIutT7HcGh5yLH/wDwFX4/j5SeubZY+x+VGa31vw1YsfZDDVyr+c5nX78YOn0xtF5N5Fe3ogral1o4TtT7HcqA3pVswKo/a3Q8sfY/KnNb634acTE5KU8S/flXvfTk2/1rP+Tdxv8A3Q2qbj1XQnan2O1atu/bWqA98e6bH2PyqzXCt+GjEgyCRnpFaAlaQCIuVe99OH3fqVWp8mxArsLoipMYa9e2yTO4vsM11rppCtNj7H9lfauFb8M+HGbIiSrCW08SgzSZmZAfEHKntCxxmkpIEYoN1dZFpvNXk9uvXv1Nml3rrN4wStBeP2Osf2Wdq4VvwzYkIdJiod9DW/noa3c9DW7mqjWcbIviMSiZruJKurOqrsa9wOPfKnWI0ksiKY/kmPWSsVfkOhH/ACnmemqK2uu0Qucplf28ydK/NErJBORpWri/x9Y2Mj/p17de/X9CQwFhBJKdxcbdUQ1yKpPcmtrbmRu80uBxQ7bDilW348ANnYz59V7UpudyW1pfxhqjMResjesUdAGz8/v/xAAUEQEAAAAAAAAAAAAAAAAAAACA/9oACAEDAQE/ATT/AP/EABQRAQAAAAAAAAAAAAAAAAAAAID/2gAIAQIBAT8BNP8A/8QAThAAAgIBAgMFBAYECAkNAAAAAgMBBAUGERITIQAHFCIxFSMyQSQzNUBCURAWYbYlN2JxdIGW1iAmNENERYCCk1JTY3Jzg5GSlKKjstP/2gAIAQEABj8C/wBtiLOqdR4nBrLflDfuKW9+0SUxWq7zasltEzwoSwv2duXiq2pdRevv6WNXRqxt6RM5ezRteb5bUy/bt6dtqPdxbsp/5y3qhNJv/BTgr4//AD9h9qaM1LSmduPwFrF5KB/Phmw3FSUf7o7/AJdgrU9WVsZdZKxGnqBTcKZMdPCCl2LghQe2S8vLr3GlxTHTzDuLFkJgcQQGBQQkM9YISjeJiflMff7eXzN6tjcZRUT7d240UoQofUjMvz9BGNyMpgAiSmI7NwPdYluMomfh41E+vzMzkCI+CPZdFgGNBbfRZvW3IHBxwrouHbt7f1bcbp2ve2czJaoZayGoLYkAyDfZht8X6Tw7ZO1QZER5QIdu0Tm7WoNSvkR4/EXoxlPij4pUjFgiyEFPybfftHSJ+c8teg6LIn1K1fzVxn/EtZJpx/uzG3y7M5embeMYe/vcfns0MhM/iBVu7brRt8o5Eh/J27MsaE1abGCMyGM1OkI5pb+g5bGqAV+XeIE8VMSW27QjeYVjMivI08bzPLhcxxZHTORUBTxzjLK2GhMzE8cni7SHhMh4tc/Vdoq1y9i6pSiG3dO3GiTSgfrbGLsbLHI1BL4pAF2URIzZrqggI/vl7M5e2qjjMbWbcu23lwqQhI8RkU/OfkIxuRlMAESRRHarpXStW57C8ZK8BgFzwQ6F7wWbzZRPLhkL3aRNnw+Nr+7Vu2WtfXyeQWjP6zIYN2YsKg6+MMh2KvhEsj6OI7kJXijxtjcvMlJRWDsbXMBSljJsYwhBYAPUiMymBEYjrMzMRHY1M7xtFCxZSBj+smJ3ExnYhna16xPSf29mlprUmDz8V52f7IylLISmem3NGs5hL33jbjiN9+n6LOF1Hi6eXxdodnVbqhYG8dRasp86HqnzqsJIHJOINZiUb9rye7PU1y5Tw1tb6WTSfA/FZIDPn0K2QUW2QCicQuLoiENgirsh0qY984XOGmtrfEV4O2oeFa81TDhD2rTX6QYlIjkK4dENMGriEOEV/e1d1mBaZ0cW2u/UMV+OSyGaZwspYvYPrlUBNbjXHHB5BoDsLqMdl5DJoE9Z59CrGYecDJ41BxDE4SuUb8IV+hXSEp8Rd4vMSU1oAZt2q1WC6DNh6kwX/V5hDv8A1dvtfGf+vq//AK9qOgMRkeDT9XG18nlvA2YleVv3DbyUWiTOza1GutbFok5UViwTGrliK5B2xuX0zbt081Vsq8EdLjlrWkYxFWUhv4pVmdksqEJhYEuUQFBbdsLkcvjzxGUu4qjbyWMbMSePuurLZaqEUTMe4dJr/PYfNtO8dr3d73e3vd+8p6j1HTPqyfgdiMQ4Pw+q715c+bzVqxbcxkp1p3mYtdmxcRM4bSmQVBqq17C5H2hmqzI2K41Zb1KDY+gjMPsD43lrpY3OaWc5OLZZLMaTuskmiIAXDewV2eKDfFcG+FfBzvbx1pREyWm7gwmrMX5UZWrBur78R0ryplN6iz+XVtAxW/oYiLB8pjP3rUeqbMQQYPE27wrmYHn2FrmKlaJKYjis2iTXH+UyO1zVuf8Ap1fTjWaoyLHQBRc1DkbTTxvNCR2/yvxeTjh4dm0Aj4S27ak1eSxezE0o8Gg+Lgfkbj1UMcpnBElCiu2Uc4o+FXGW8bb9rGc1LlLWVyNkiKW2WEQJCZ4oRVT9VVrL32XXQIKCPQf0KxGm8RezWSb1GrRQTiEN4iWuL6uugZmOOw81pDeOM47LsPHTGKYYQc08hmmFaXMxvwMnG0MhV449J4LJjv8Ai7TqrW3gMpqpTGDiq9Yps4zCqGZHxq2NUrn5F4+YXEoYpqLhXHOk2Re7ve729PL3OnqPUdM+rZ6g7EYhwT8Hqu7eXPn61qxbcxk0e8DvBo75OeXb07py2v7N9DTlcqk4+0PRlKkyPoHlsWI8dy10k91eLZF+94DJsuZNLhmmjL48QsexU7RPirAUl33XWAcBUZXGt713iRrZygpHNzGISeewJRES3x+PUbCrLmZj7Qqc+jtM8PE5bJ6rHtqPu+tNma92v+seIGfhXbqymplFDMl62a503CEDtHg3nvuX3qril7f4xalx1N/X/RaKrOWmYj5/S6VOP5pmfXbtZzc8Mv1NqC9Y4+HYoqYyAxaEyX4oCyi+2PlHPmNvWZ1d/SNN/vNiP0YjTeIVzslmbyKFUZ34BNxbE5sjBSKK6+N9g9p5aVme3l7U0Ipsv5a+xVRKaihLPawz5jG/XYjCuBl5R8yaKCWlK22GrW+c5r1OOwtnIxzqOlsaqS9i0i2JQ5bIvNjbmVkfr4RFSpXgpXKDbHEF3u97vbs8rc6eotR0z6unqDsRiHB+D1XdvLnz9a9aeHmMKj3gd4FHfKTy7endO21/ZnoacrlUnH2j6HTpHH0DyvsD47gXSvd3/d/e3yk8ypqLUVVnTGeoOxWKcE/aPqu7cCfoHVCC8dzDpaGmesyWpJmZ9Zn9Uc/22nrE9q1FYQqrT7wnYlKkTwAGI1K9lGpG3SOBOPyyDIPTdfl32ifvXdvRj6mxb1RbZ/2tNOBSn/2339tCLV1hlLIWin/pLmbyVpn/AJTbI/siNvl21d/SNN/vNiP0KfYADZi9N5rIU5KN+XaIqeO4w/l+FyFkd/yKe1fXmbn2jawmNXjtL0XbFSwsmRvyOWBZRtOVuMMEc+d4r1aiOVs0zkbvd73e3Z5W509Raipn1fPwOxGIcvry/Vd26ufeda9aeDmMKj3gd4FHfKzy7endO219MZHxpymUScfaPodOmcfQOj3x47gClrvJ4bJspWa+nci2rkaLoFqzT5WQh478Bnwsr8xcwwJOZUYMgTHeesz6z20L/PqT90c/+jJGroQan0M8dvkycTpp3/3n/wAfvWjcrw7zS1LZoce3wjksW58xv8oKcUP88jHbTauZzGYu5nse7rvKy9s3Lqll+W1a6jhifwSPy27au/pGm/3mxHZaELY57mApKVATGtawoBa1rCJM2GcwIAMSRFMRETM9v121VJr1ZkqJor4sWSKcHjbPLYxVvgngsZF/LXL4LiTTgYUG7eYztd7ve7y7PJ3OnqLUVM+tifq24jENX15W+67t1c+961608HMYdHvA7wKO+Wnl2tO6dtL3jFxOxpymUSf+svQ6dM4/g/o98eO4ApM7pO6M286G+G13r2vBez9LUeLguUKNwPdlmJXxrKVHzVN+i1drI2rONx/dziWcm1m6+NwlGqBxzq+nsLNY7Vhu+88t0Vq+PmZ8zitNkZnls27aF/n1J+6Of/Q9VP6SL+8TTOJLl+f7KZh8Vd9Pwomi/mT+EVlM+k/etW0awSy7j6q8/SEVy1hNwrRvOUoB80tsUl26y+HcuJ0bQXwzqzQlhgib+TqfFjO/EwgFWOyw7/DuKxxZgPxSMOLrAzw6wo4qsy5cgMTdiskSY5icfnMddtcpYRJMMKyGsgBiSPh4RiZmI7Vtba3rLdq1q4djMY7hYnTSWD9Yz1A8yYT7xnUaAzKUzLeY3td7ve7y7Mo3OnqHUVM/NZn6tuIxDV9eVvuu7dXO7etetPL5jDo6/wC8CjE5eeC1p7T1oN4xUTsacplEnH2l6HUqHH8H9HOjx3AFLK4TJa5wSLWPa2hkqzXvCBaIxD0A4VcqwQcUqb4VreW4WoPhcpgCWK7uMYvNWEwaqdLE4ssBp6qwenG5ratU2K36x4Co/n7bc9cFDO13Uuprs3MlcmB6RwVqdYJnkUaKNyivTrwUwpUTMyRG5ptsNa0+2Au1wma+BoZ3JXj2nhBD8Ndw6vN6QR2smiBifWILb07ZzUuQLhp4TGXMi78z8MkmAkI/Ex7IFKhjqTDEY6z2Zqy/BMjCjl9UZF4jHJPK5WXVa6y33kZZYv2Liojr9CLrtE7/AHkgMYIDGRISjcSEo2kZiekxMdJjsrKYhJRja2R9uYCOoIv6evmxdvEyfWPcqO1im/EYcCrXDHGrti9S4WyNnF5aoFuuz5hBR71Dx/zVisyDRZUWxKcswLqPa73e93l2eRMnT1DqGmfmtF9W3EYhq+vJ33Xcurnd3WvXnl8bGUtf6/pROYmAtae09aDeMVE7GrJ5NRR1yfodSocfwf0c6PHcAU7OC0xqoNHWL+6bmYHFnk7w0iGYajH8GSxvgnu34Su8bWqVxxXFTyCwr+M1f9kD/vN2/jNV/Y8v7zdv4zVf2PL+83YOd3lwSeKOYKtJcDJD8UAZajYIlt6SSziP+TPZ9DTqXOt3pWeUzN8gbksiSuLlAw1gtaaqOM+RVQAKCTNhcbmMadfusw1kWMllfJ6sNRiXKhfC/F4hm0TswjkMnZHiA1wvH+ouOIXkclX5OoNYEnMXxYHC+rj4XMYegziAGDK67GXGqZ5k2bz1T8H3tlJUIRqbE825pu+3ywNmRjnY6w2Ikho5KABbuhQpwV7XAco4C1R3ZDeu4SpduEnL41wSF7HvXxLvIpP4uKovIhwDc5MkFlQLNJiLWG7Fd52rhrZC3cUq/pbFQa7NWik/OjLXeGTW3IFGx1K3WMf9a6PHcIU/8JmLxbEZHXOQRPs/H7wxWJWyJiMrloifIsPWpTnZt5sRtw1hc4Hd4mtBsW9O0cmd9r728lqnPw7nynzfXUaz/e5E49yw+DHjxxNkUbR6R98nLYwkYfW1RPDVyRDMVcopceShmIXEnI/hr3gE31N/gej3HZ2nMtj7E40Wky1pfMScY+yJl1v4S+ENFHN67XKPPqNKS8TWc0PdpQvMBp3NM4RLC6hNVFxNKSGAp3CPwF/j4dwGvY8TwyHNrJIuDtBCUEJRuJDO8TE+kxMdJj9M3tT5/F4StHoWQuKQbZ2meCuiS59lkxE8KkLYwtugz2s4butqtCTE1HqvKV+Aggh25mIxTokoPrPBZyYBIEP2eW4sgdZ94rcnQ09bseOcWQN0ag1QUlxTwS/6RVov/HkHe9anpQDYwtJp4nE00Y/G49C6tOnVXCkV0KjhBawHpER859SncimSmZ+/FidV4WnmKfmlXiA2s1GEMhzqVxchapv4ZmObWas9ukzMdOzrfd7qVchMyQYbU0EMr3OZkE5iklnGIBMCoLGPgp4fe25mZONsTU1zVp1DIFBpnJuzWNMd9uYOMxdq6EqL4vpFAZH1MAnfblFY1wMx02doesZ/1y7ThH/Xvv2iiJd5pi/pxUcLcwCv+8v0cfjFqD8+ZYAJ9J7RkNWWKuAh5/Srufyk5nMGED0YNek25zi32GAt5CoURvMzG0QSMjarnqzPpkWBks2tRVarh4J48fiR4qiJFgcxLrM3baZmeXZH/b//AP/EACIQAQADAAEFAAIDAAAAAAAAAAEAESExEEBBUWEgcYCBkf/aAAgBAQABPyH+bAKpdA+KbvN1kG2KOxlCzW10wDdUuGe/2J/h/L5KVioZnwWuRX9EzsgmY9nzWyK6RY9AdtEdqETR78qOzCdCFqr9U9rVZGIDlfa1EEXoLF4AGw1e6EwjNFB+mUoizcHpM13fKIv6PgJW2P0jl9apOF4juIwyinsMEU2C1wHL2QRtOHBYvARoQI97OUQ/Hc2Qyc0oK9dO7xOs2Gnke0Mr/qn3SFX82r0ylk1OohIpHAVQjjl+yK4CmheBHSBLhfmEK6kowG19KSxCPhYAgmAwP60SpAaGnIhi77miVPoZn3kBNSfjXwosPNrXHkxzh2XF35WC3yiqkORGZ5LdN6Xwsr22dBRbYS/YvZ5YrMrtuFPBhz9RtFwUrGBaRdSx3vc5BhRh5OFgbotlsHH+IuPyitagoSKxwoBTnM5aJjuaZjfbWBti6L5OdiCSNFNVAeZlGZfG0qL5RzlBnOTQdm/bF1KsNPNSuHwPfNeZBiDE0UjWYKH7iwl4RGqEsZzMuBKh1Wja1tSLEtFZAHDxZJYgHOoSiVnc5biEElIHNYTaCDDW96iVoQMNIZYvubAW3Qh+OeE4cIg1QODs8SzOKax1GIiVHeDqaYt7kUmb3QeWJg4TIgjg5RKml5aUFE1/kqd6hvetuaQpxBiBwMVw2YiGlCDkEogUZNPEjCjBUIququq6sQCABESxHETyMdSBAoX4xqmjuhegHz6h/kvftY9mv1qSr8MeDx6sRE11JCu4AQ0aQgQCacwuqrUpSt81OtVgtbVnNEEQgRUCYFmfGW3Mr6tgPKCbj+KpRQqNquqrqrqvPVU1mJYGiNexl92vuh9hUH3XjW/6OEsg6gnnhP6CjroxGpUkqGKuZGBBdL6IDRszqqeK/TUa1VKy0spoEgIJAABSjEhJI1YCqge1nKxJGapB7ojEAwjhvwqgjwVpd63peJvBu6zw3PfBvhkkaszaFHutgbVTPRud1Wek6D1QgltwXJDbsgKoFkWR9KVUrPSTNEki1+CgBY04J4FPNANFqG3IUHwfegq+OQ0MmT6KBuk0bSHlD3DUfjggvOJzK1Hj9Wjmg8IksIV7dLV3z/8Amd1Q+mPGC9kygRFGeAxK0J9+nk+ZtLf0KghtHmXiRklryhVKy00z0qVqhZRcg0AbuDlzRyd4VxEEAdVVdW1WVeVea9ceNLLOxfaV9hwajiZe5kYyFB/pNi9RKPh8SaGkyfclXRy/U6Y7uAITWticeIICZ0sMPILxZFYYfNHvRe5QHPQ/mSPTj5p3ZOmQk/PCwrCgZQlQEOAAAAABQBgB4A4O8s0TyYfOJoYECr9wrbC+GJh2WJ5LFrta7N5bAgA7hA9aZQaIonUHGKZTyREjgdDouWNaIjYilcCp8lNBFtIAimqSMPEyCAABaW1anesnmhY40Ql2LFRy31OzWwDknRqSASGLI2oGazAxBBHJ+2fqz3L7M0Ua6GVS85rpQGd2THd4GmDVDPRNZANoCiyAAAAGAYB6D+f3/9oADAMBAAIAAwAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhzigAAAAAAAAAAAAAAAAzRxAAAAAAAAAAAAADDBSRDCAAAAAAAAAAAABgCRwiiAAAAAAAAAAAACCCjygigAAAAAAAAAAABAQgAQAAAAAAAAAAAAAAACBACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8QAFBEBAAAAAAAAAAAAAAAAAAAAgP/aAAgBAwEBPxA0/wD/xAAUEQEAAAAAAAAAAAAAAAAAAACA/9oACAECAQE/EDT/AP/EAB0QAQEBAQADAQEBAAAAAAAAAAERACEQMUAgQYD/2gAIAQEAAT8Q/wBsJEeoxF0AMFVgiSWKgAZoSzy6mvbgas4Vzvo4L0xsvRj0ArZ02OZe4DlFlUKhhrIVtu1VHljdhAj99d68eFF4Y3RtMMrV6kT6Y6AYeAGS8lCqle02WH03+aKsig7Om4JgAVSlB8rW6eY4aFBZVeIwJEmaTSu+At2I7/a9O1jZ5Al2pMw8GZ4ftBXuq7nOHsrDx95Ckl0rvb5+/FhyKfYkt2PxCqeFPK+pXNg7nFz8+RySjm+mVIA7airpLXbUgC70qorKE8HDM888i9R33BzH8CCEEvtBn+fYK1m8/TifcOzbiyKmpD337QE35BjOKvRSSKEHUPw6LLb4lkt3idSTKsHd5I1JkEmH18sD09RAu7iaZJHXXdCDihGBzwAely6TnypXQU6rcff8hk48dEOjpG/1M8opLAZybcFCogKAibhuYrPeuRLkAmdyPICuFxN3rR2WEN2D4uzYS8jrY8+p2fW6tdKMKIkUAhUONzlXwmx9hKhGptNR92LRgRAvXydSEAcszIr+n9BrBfQmytKTecRqc97ek0amORL3lvq820itVUQV1LBA3MsiLcrtkg3mtSE4QCsQxRyyJQgh955kAMpWTPRMKsCk0Qb44uOZDS29gW4AqAjSxBL8jJrt8zLkRYj1c0MX8IivK5QUKquPyB4coBAKIiIok3cE3QWos502O+n2RSdH85cvrnCzphlQc4ivFVJZZQ81D+naqfLwrH4JgkCHi/eVom4be/uWclLaddJRuyFX8coq22aIZZqAaPmJcn8gSfq4oFBUqqvnTM58xH0RsstFKr9IWIYUpCODrBAaBlOilBIWKKTeEqP/AFf3b0oZv0JgwzODITMJ7CUNqXa1Awv201O6Q05WPqGnofHrG8MM7+d+RdvmoKj8E4oKNpjk8K62f7rcyMfSl98+u/MWpUTqQ4sp8BSgGfGDs3vkbJ60EkEmyNMMuTOdsxQoictagZOsWQVAwqgA6XqSXjUR5omuXEMrAkE8AkzU6XMzP15Xy+OC4sHfVtCuBbW4DpT7fwB1OgIi43tNOJttM0zC2yX6pqlMTCgTqcEU1QuJ7xA+nuRlpf6y96NOmipnPN7PjgWzwmn0C7hZkNmT9ihiP25fnSxz330om8tAVBqFVVVVW+desowD9lq4Qjhx1ak1oiaVcoX5WSD0YdWaw85RJc8Gm/DIYXH1xpuulyImMfzJmkh0CeOoOClUeeBuAong/fVrX4ZUS2uRstSo3daXoTlu9VjsoeHAQAAAAAAJ9kbf6qLfe7sW0N6c07tj5EhPe0fkuIYXY6cgww5fCQKFwCKPkQmaJowZKTBCa0qQmKCtlBGgNHkk3DwfvvcHwo+ZdJAXfley/ciR++lmD+pLO4mqDnVs+beppi4O3VUP4cg+GQAQ5kXqKq3eo0EZFCyqwlmdJzyA34JXn2RXSfC0FWPAGZAJiAAAgCABwAAOH+/v/9k=';
  loagingPage = false;
  loadingStart = false;
  step = [
    'Em Operação',
    'Solicitação Aberta',
    'Em Distribuição',
    'Atendimento Iniciado',
    'Atendimento Finalizado',
    'Validação Manutenção',
    'Validação Setor',
    'Solicitação Finalizado',
  ];
  readonly avaliacaoOptions: Array<PoRadioGroupOption> = [
    { label: 'Ótimo', value: 1 },
    { label: 'Bom', value: 2 },
    { label: 'Satisfatório', value: 3 },
    { label: 'Ruim', value: 4 },
  ];
  readonly avaliacaoOptions2: Array<PoRadioGroupOption> = [
    { label: 'Ótimo', value: 1 },
    { label: 'Bom', value: 2 },
    { label: 'Satisfatório', value: 3 },
    { label: 'Ruim', value: 4 },
  ];
  speakers!: Array<any>;
  //todo essa array de empresa existe pq o componete tab está com erro de renderização
  private getSpeakers() {
    return [
      {
        created_at: 'null',
        deleted_at: 'null',
        mp_desc: 'Arotubi Metais',
        mp_filial: '010101',
        mp_grupo: '01',
        mp_id: '1',
        updated_at: 'null',
      },
      {
        created_at: 'null',
        deleted_at: 'null',
        mp_desc: 'Arotubi Componentes',
        mp_filial: '020101',
        mp_grupo: '01',
        mp_id: '1',
        updated_at: 'null',
      },
      {
        created_at: 'null',
        deleted_at: 'null',
        mp_desc: 'Arotubi Sistemas',
        mp_filial: '030101',
        mp_grupo: '01',
        mp_id: '1',
        updated_at: 'null',
      },
      {
        created_at: 'null',
        deleted_at: 'null',
        mp_desc: 'Eletropolar3333333',
        mp_filial: '010101',
        mp_grupo: '02',
        mp_id: '1',
        updated_at: 'null',
      },
      {
        created_at: 'null',
        deleted_at: 'null',
        mp_desc: 'Austral',
        mp_filial: '020101',
        mp_grupo: '02',
        mp_id: '1',
        updated_at: 'null',
      },
    ];
  }

  ngOnInit() {
    this.orientation = PoInfoOrientation.Horizontal;
    this.setEmpresa();
  }

  //TODO - criar api no protheus para trazer as empresas
  setEmpresa() {
    this.loagingPage = true;

    this.speakers = this.getSpeakers();

    this.getEmpresaData('').subscribe({
      next: (response) => {
        this.speakers = response.data.filter(
          (empresa: { mp_filial: string; mp_grupo: string }) =>
            empresa.mp_filial === this.setFilial && empresa.mp_grupo === this.setGrupo,
        );

        this.setSetor(this.setFilial, this.setGrupo);
      },
      error: (erro) => {
        if (erro instanceof Error) {
          console.error('Erro ao carregar os setores da filial.\n' + erro.message);
        } else {
          console.error('Erro Generico ao carregar os setores da filial.\n' + erro);
          this.IEmpresa = [];
        }
      },
      complete: () => {
        setTimeout(() => {
          this.loagingPage = false;
        }, 5000);
      },
    });
  }

  //TODO - criar api no protheus para trazer os setorres
  setSetor(filial_codigo: string, filial_grupo: string) {
    this.setores = [];
    this.equipamentos = [];
    this.equipamentos_aberta = [];
    this.activeSetorEquipamentos = 'Todos';
    this.activeSetorAbertas = 'Todos';
    this.mostrarSomenteAbertas = false;
    this.ultimaAtualizacaoResumo = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Chamada ao serviço para obter os setores da filial específica
    this.empresaService.carregarSetoresDaFilial(filial_codigo, filial_grupo).subscribe({
      next: (response) => {
        this.setores = response.setores;

        this.setores.forEach((_setor: Setor) => {
          if (_setor.setor_codigo !== 'GENERI') {
            this.setEquipamento(_setor.setor_grupo, _setor.setor_filial, _setor.setor_codigo);
          }
        });
      },
      error: (erro) => {
        if (erro instanceof Error) {
          // Tratamento de erro específico para erros do tipo Error
          console.error('Erro ao carregar os setores da filial.\n' + erro.message);
        } else {
          // Tratamento de outros tipos de erros
          console.error('Erro Generico ao carregar os setores da filial.\n' + erro);

          // Se der erro, eu limpo os setores.

          this.setores = [];
        }
      },
      complete: () => {
        console.log('Carregamento dos setores concluído!');
      },
    });
  }

  //TODO - criar api no protheus para trazer os equipamento
  setEquipamento(setor_grupo: string, setor_filial: string, setor_codigo: string) {
    this.equipamentoService.getEquipamentosSS(setor_grupo, setor_filial, setor_codigo).subscribe({
      next: (response) => {
        const equipamentos = response.equipamentos;

        equipamentos.forEach((equipamento) => {
          this.imageCacheService.getImage(equipamento.equipamento_id).then((cachedImage) => {
            if (cachedImage) {
              equipamento.equipameno_ss_imagem = cachedImage;
            } else {
              this.equipamentoService.getImagemEquipamentos(equipamento.equipamento_id).subscribe({
                next: (imageUrl) => {
                  const base64Image = 'data:image/jpeg;base64,' + imageUrl;
                  equipamento.equipameno_ss_imagem = base64Image;
                  this.imageCacheService.saveImage(equipamento.equipamento_id, base64Image);
                  this.loagingPage = false;
                },
                error: (error) => {
                  equipamento.equipameno_ss_imagem = this.srcImage;
                  this.loagingPage = false;
                },
              });
            }

            if (equipamento.equipamento_ss_aberta) {
              this.equipamentos_aberta.push(equipamento);
            } else {
              this.equipamentos.push(equipamento);
            }
          });
        });
      },
    });
  }

  //TODO = MUDAR PARA API POTHEUS
  getEmpresaData(id?: string): Observable<any> {
    const url = '';
    return this.http.get<any>(url);
  }

  getValidacoesVisuais(equipamento: Equipamento): {
    primaryLabel: string;
    secondaryLabel: string;
    avatarSrc: string;
    tagValue: string;
    tagType: PoTagType;
  } {
    // Verificar se o equipamento possui S.S. aberta e qual o valor do campo `equipamento_ss_prioridade` do equipamento.
    const equipamento_ss_prioridade = equipamento.equipamento_ss_prioridade;
    const possuiSsAberta =
      typeof equipamento.equipamento_ss_aberta === 'string'
        ? equipamento.equipamento_ss_aberta === 'true'
        : equipamento.equipamento_ss_aberta;

    // Se o Equipamento possuir uma SS aberta, e se a prioridade não for 1 (Prioridade Alta)
    if (possuiSsAberta && equipamento_ss_prioridade !== '1') {
      return {
        primaryLabel: 'Exibir Solicitações',
        secondaryLabel: 'Relatar Incidente',
        avatarSrc: 'assets/atendendo.svg',
        tagValue: 'Solicitacao Aberta',
        tagType: PoTagType.Warning,
      };
    } // Se ele ter uma S.S. aberta mas a prioridade da SS for 3.
    else if (possuiSsAberta && equipamento_ss_prioridade === '1') {
      return {
        primaryLabel: 'Exibir Solicitações',
        secondaryLabel: 'Relatar Incidente',
        avatarSrc: 'assets/urgente.svg',
        tagValue: 'Máquina Parada',
        tagType: PoTagType.Danger,
      };
    } // Se ele não tiver uma S.S. aberta.
    else {
      return {
        primaryLabel: 'Relatar Problema',
        secondaryLabel: '+ Informações',
        avatarSrc: 'assets/success.svg',
        tagValue: 'Em operação',
        tagType: PoTagType.Success,
      };
    }
  }

  private normalizarSetor(setor?: string): string {
    const setorTratado = (setor ?? '').trim();
    return setorTratado === '' ? 'Sem Setor' : setorTratado;
  }

  getSetoresTabs(equipamentos: Equipamento[]): string[] {
    const setores = (equipamentos ?? []).map((equipamento) => this.normalizarSetor(equipamento.equipamento_setor));
    return Array.from(new Set(setores)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  filtrarPorSetor(equipamento: Equipamento, tipo: 'equipamentos' | 'abertas'): boolean {
    const setorAtivo = tipo === 'equipamentos' ? this.activeSetorEquipamentos : this.activeSetorAbertas;
    if (setorAtivo === 'Todos') {
      return true;
    }
    return this.normalizarSetor(equipamento.equipamento_setor) === setorAtivo;
  }

  possuiSolicitacaoAbertaNoEquipamento(equipamento: Equipamento): boolean {
    return typeof equipamento.equipamento_ss_aberta === 'string'
      ? equipamento.equipamento_ss_aberta === 'true'
      : !!equipamento.equipamento_ss_aberta;
  }

  getTituloCard(equipamento: Equipamento): string {
    const codigo = (equipamento.equipamento_id || '').trim();
    const nome = (equipamento.equipamento_nome || '').trim();
    return nome ? `${codigo} - ${nome}` : codigo;
  }

  abrirListaSolicitacoes() {
    this.mostrarSomenteAbertas = true;
  }

  mostrarTodosEquipamentos() {
    this.mostrarSomenteAbertas = false;
    this.activeSetorEquipamentos = 'Todos';
  }

  abrirSolicitacao: PoModalAction = {
    // API: https://tdn.totvs.com/pages/releaseview.action?pageId=683181217

    action: () => {
      console.log(
        'Manutenção sendo Aberta. ' + '\nDados do Formulário sendo enviados: ',
        this.formFilhoComponent.formAberturaOs.value,
        '\nDados do Setor Atual: ',
        this.setGrupo + ' ' + this.setFilial,
      );

      this.abrindoSolicitacao = true;

      // Garanta que os valores não sejam nulos
      const usuario = sessionStorage.getItem('user') ?? 'userError';
      const grupoFilial = this.setGrupo ?? 'grupoError';
      const idFilial = this.setFilial ?? 'idFilialError';

      // Verifica se os dados obrigatórios da Modal estão certos, senão fecha a Modal.
      if (this.formFilhoComponent.formAberturaOs.value.tipoDeProblema === null) {
        this.poNotification.error('Selecione o tipo de problema.');
        return;
      }

      // Organizando os Dados da solicitação
      const dadosSolicitacao: SolicitacaoProtheus = {
        origin: '',
        equipment: this.equipamentoSelecionado.equipamento_id.trim(),
        description: this.formFilhoComponent.formAberturaOs.value.descricaoProblema,
        serviceType: this.formFilhoComponent.formAberturaOs.value.tipoDeProblema, // Mapeamento do Tipo de problema
        priority: this.formFilhoComponent.formAberturaOs.value.maquinaParada === 'sim' ? '1' : '3', // Mapeamento da prioridade
        solicitante: this.formFilhoComponent.formAberturaOs.value.solicitante,
      };

      // Ativa o carregamento e desabilita o botao
      console.log('Colocando o botão da Modal em Loading.');
      this.loadingAbrirSolicitacao = true;
      this.abrirSolicitacao.loading = this.loadingAbrirSolicitacao;
      this.abrirSolicitacao.disabled = true;

      // Chama o método do serviço
      this.ordemServicoService.abrirSolicitacao(usuario, grupoFilial, idFilial, dadosSolicitacao).subscribe({
        next: (resposta) => {
          // Lógica adicional baseada na resposta
          console.log('\n##### Solicitação foi Aberta! Distribuindo a S.S.... #####');
          console.log('Resposta da API:', resposta);
        },
        error: (erro) => {
          console.error('Erro ao abrir solicitação:', erro);
          // Reverte o estado do botão para o normal
          this.loadingAbrirSolicitacao = false;
          this.abrirSolicitacao.loading = this.loadingAbrirSolicitacao;
          this.abrirSolicitacao.disabled = false;
          this.abrindoSolicitacao = false;
        },
        complete: () => {
          // Faz uma cópia do equipamento selecionado
          const equipamentoAtual = { ...this.equipamentoSelecionado };

          // Espera um curto período antes de abrir a modal e resetar os botões.
          setTimeout(() => {
            //this.abrirModalEquipamento(equipamentoAtual);
            // Fecha a modal atual
            this.modalAbrirSolicitacao.close();

            // Chama o método para abrir a modal de solicitações abertas
            // passando o equipamento atual como argumento
            //this.abrirModalEquipamento(equipamentoAtual);

            // Reverte o estado do botão para o normal
            this.loadingAbrirSolicitacao = false;
            this.abrirSolicitacao.loading = this.loadingAbrirSolicitacao;
            this.abrirSolicitacao.disabled = false;

            // Recarrega os Equipamentos (Pra ajuste reativo da tela)
            // this.setorClicado(this.setorAtual);

            // Faço outro SetTimeout para Fechar a Modal do Equipamento depois de mostrar um pouco...
            // Task: GDM-37
            setTimeout(() => {
              // this.fecharModalAtual();
              this.abrindoSolicitacao = false;
              this.setSetor(idFilial, grupoFilial);
            }, 1000);
          });
        },
      });
    },
    label: 'Abrir Solicitação.',
    danger: false,
    loading: this.loadingAbrirSolicitacao, // Vincula ao estado de carregamento
    disabled: !this.formularioValido,
  };

  reabrirSolicitacao: PoModalAction = {
    action: () => {
      this.abrindoSolicitacao = true;
      // Garanta que os valores não sejam nulos
      //const usuario = sessionStorage.getItem('user') ?? 'userError';
      const grupoFilial = this.setGrupo ?? 'grupoError';
      const idFilial = this.setFilial ?? 'idFilialError';
      const idSolici = this.equipamentoSelecionado.equipamento_ss_numero ?? '';
      const now = new Date();
      const formattedDate: string = this.datePipe.transform(now, 'yyyyMMdd HH:mm') || '';
      let numOrder: string;
      // Verifica se os dados obrigatórios da Modal estão certos, senão fecha a Modal.
      if (this.formFilhoComponent.formAberturaOs.value.tipoDeProblema === null) {
        console.log('Tipo de problema nulo');
        this.poNotification.error('Selecione o tipo de problema.');
        return;
      }
      const incidente = this.formFilhoComponent.formAberturaOs.value.descricaoProblema;

      // Organizando os Dados da solicitação
      const dadosSolicitacao: SolicitacaoProtheusOS = {
        origin: '',
        equipment: this.equipamentoSelecionado.equipamento_id.trim(),
        costCenter: this.equipamentoSelecionado.equipamento_ccusto.trim(),
        startDate: formattedDate,
        service: this.formFilhoComponent.formAberturaOs.value.tipoDeProblema, // Mapeamento do Tipo de problema
        situation: 'L', // Mapeamento da prioridade
        inputs: [],
      };

      // Ativa o carregamento e desabilita o botao
      console.log('Colocando o botão da Modal em Loading.');
      this.loadingAbrirSolicitacao = true;
      this.reabrirSolicitacao.loading = this.loadingAbrirSolicitacao;
      this.reabrirSolicitacao.disabled = true;

      this.ordemServicoService.reabrirSolicitacao(idFilial, idSolici, dadosSolicitacao, incidente).subscribe({
        next: (resposta) => {
          console.log('resposta >>>>>>>>>>>' + resposta);

          numOrder = JSON.stringify(resposta).replace(/"/g, '');

          this.ordemServicoService.addIncidenteOs(idFilial, numOrder, incidente).subscribe({
            complete: () => {
              this.loadingAbrirSolicitacao = false;
              this.reabrirSolicitacao.loading = this.loadingAbrirSolicitacao;
              this.reabrirSolicitacao.disabled = false;
              this.abrindoSolicitacao = false;

              this.modalReabrir.close();
            },
          });
        },
        error: (erro) => {
          this.cancelarReabrir();
          console.error('Erro ao abrir solicitação:', erro);
          this.modalReabrir.close();
        },
        complete: () => {
          setTimeout(() => {
            //   this.addIncidenteOs(idFilial, numOrder, incidente);
            //    this.setSetor(idFilial, grupoFilial);
          }, 1000);
        },
      });

      // Chama o método do serviço
      /*  this.ordemServicoService.abrirSolicitacao(usuario, grupoFilial, idFilial, dadosSolicitacao).subscribe({
          next: (resposta) => {
            // Lógica adicional baseada na resposta
            console.log('\n##### Solicitação foi Aberta! Distribuindo a S.S.... #####');
            console.log('Resposta da API:', resposta);
  
  
          },
          error: (erro) => {
            console.error('Erro ao abrir solicitação:', erro);
            // Reverte o estado do botão para o normal
            this.loadingAbrirSolicitacao = false;
            this.abrirSolicitacao.loading = this.loadingAbrirSolicitacao;
            this.abrirSolicitacao.disabled = false;
            this.abrindoSolicitacao = false;
          },
          complete: () => {
            // Faz uma cópia do equipamento selecionado
            const equipamentoAtual = { ...this.equipamentoSelecionado };
  
            // Espera um curto período antes de abrir a modal e resetar os botões.
            setTimeout(() => {
              //this.abrirModalEquipamento(equipamentoAtual);
              // Fecha a modal atual
              this.modalAbrirSolicitacao.close();
  
              // Chama o método para abrir a modal de solicitações abertas
              // passando o equipamento atual como argumento
              //this.abrirModalEquipamento(equipamentoAtual);
  
              // Reverte o estado do botão para o normal
              this.loadingAbrirSolicitacao = false;
              this.abrirSolicitacao.loading = this.loadingAbrirSolicitacao;
              this.abrirSolicitacao.disabled = false;
  
              // Recarrega os Equipamentos (Pra ajuste reativo da tela)
              // this.setorClicado(this.setorAtual);
  
              // Faço outro SetTimeout para Fechar a Modal do Equipamento depois de mostrar um pouco...
              // Task: GDM-37
              setTimeout(() => {
                // this.fecharModalAtual();
                this.abrindoSolicitacao = false;
                this.setSetor(idFilial, grupoFilial);
              }, 1000);
  
  
  
            });
          },
        });*/
    },
    label: 'Reabrir Solicitação.',
    danger: false,
    loading: this.loadingAbrirSolicitacao, // Vincula ao estado de carregamento
    disabled: !this.reFormularioValido,
  };

  // Esse método está recebendo o evento do Formulário Filho, com TRUE/FALSE se o Formulário está válido.
  abrirFormularioValido(event: boolean) {
    this.formularioValido = event; // Atualiza a validade do formulário com base no evento
    this.abrirSolicitacao.disabled = !event; // Atualiza o estado do botão de solicitação
  }

  reabrirFormularioValido(event: boolean) {
    this.reFormularioValido = event; // Atualiza a validade do formulário com base no evento
    this.reabrirSolicitacao.disabled = !event; // Atualiza o estado do botão de solicitação
  }

  //TODO GRUPO ESTÁ FIXO, POIS A API DO PYTHON NÃO TRATA GRUPO, MUDAR PARA API DO PROTHEUS
  abrirModalEquipamento(equipamento: Equipamento, type: boolean) {
    this.equipamentoSelecionado = equipamento;
    this.loadingAbrirSolicitacao = false; // Desabilita o Loading do Botão de Abrir Solicitação
    this.reabrirSolicitacao.loading = this.loadingAbrirSolicitacao; // Inicia com Loading Desabilitado.
    let number_step: string;

    this.equipamentoService
      .listarSolicitacoesDaFilial('01', equipamento.equipamento_filial, equipamento.equipamento_id)
      .subscribe({
        next: (response) => {
          this.solicitacoes = response;

          if (this.solicitacoes.length > 0) {
            this.solicitacoes.forEach((solicitacao) => {
              type == true ? (this.possuiSolicitacaoAberta = true) : (this.possuiSolicitacaoAberta = false);
              number_step = solicitacao.solicitacao_step ?? '0';
            });
          } else {
            this.possuiSolicitacaoAberta = false;
          }
        },
        error: (error) => {
          console.error(
            'Erro ao verificar S.S. aberta:' +
              '\nURL: ' +
              error.url +
              '\nStatus: ' +
              error.status +
              '\nMensagem: ' +
              error.error,
          );

          // Se der qualquer tipo de erro, eu zero o equipamento.
          this.equipamentoSelecionado = {} as Equipamento;
        },

        complete: () => {
          if (this.possuiSolicitacaoAberta) {
            this.modalSolicitacoesAbertasVisivel = true;
          } else {
            this.modalAbrirSolicitacaoVisivel = true;
            this.formularioValido = false;
            this.abrirSolicitacao.disabled = true;
          }

          // Primeiro setTimeout: Aguarda a renderização do modal
          setTimeout(() => {
            // Verifica qual modal abrir e o abre
            if (this.possuiSolicitacaoAberta && this.modalSolicitacoesAbertas) {
              this.stepSolicitacao(number_step);
              this.modalSolicitacoesAbertas.open();
            } else if (!this.possuiSolicitacaoAberta && this.modalAbrirSolicitacao) {
              // Ativa o loading
              this.loadingForm = true;



              if (type == false) {
                if (
                  this.modalSolicitacoesAbertas &&
                  !this.modalSolicitacoesAbertas.isHidden
                ) {
                  console.log('Fechando modal de solicitações abertas e deixando ela invisível.');
                  this.modalSolicitacoesAbertas.close();
                  this.modalSolicitacoesAbertasVisivel = false;
                }
              }

              console.log('Abrindo o Modal de Abertura de S.S...');
              this.modalAbrirSolicitacao.open();

              // Segundo setTimeout: Aguarda a configuração do formListener e abre o modal
              setTimeout(() => {
                console.log('Definindo Form Listener na Modal de S.S...');
                if (this.formFilhoComponent) {
                  this.formFilhoComponent.setupFormListener();

                  // Desativa o loading após a configuração do listener
                  console.log('Listener configurado. Desativando o Loading.');
                  this.loadingForm = false;
                }
              });
            }

            // Só mapeia os dados quando a verificação estiver completa.
            this.solicitacoesEquipamento = this.solicitacoes;
            this.solicitacoesResponse = {} as SolicitacoesAbertasResponse; // Reseta a variável de resposta com as S.S.
          });
        },
      });
  }

  fecharModalAtual() {
    console.log('Fechando a Modal e Limpando o Equipamento.... ' + '\nInformação sobre as Modais do Componente:');

    setTimeout(() => {
      // Verifica qual modal está visível e fecha a modal correta
      if (this.possuiSolicitacaoAberta && this.modalSolicitacoesAbertas && !this.modalSolicitacoesAbertas.isHidden) {
        console.log('Fechando modal de solicitações abertas e deixando ela invisível.');
        this.modalSolicitacoesAbertas.close();
        this.modalSolicitacoesAbertasVisivel = false;
      } else if (!this.possuiSolicitacaoAberta && this.modalAbrirSolicitacao && !this.modalAbrirSolicitacao.isHidden) {
        console.log('Fechando modal para nova solicitação e deixando ela invisível.');
        this.modalAbrirSolicitacao.close();
        this.modalAbrirSolicitacaoVisivel = false;
      } else if (this.modalInformacoesEquipamento && !this.modalInformacoesEquipamento.isHidden) {
        console.log('Fechando modal de informações do equipamento e deixando ela invisível.');
        this.modalInformacoesEquipamento.close();
        this.modalInformacoesEquipamentoVisivel = false;
      } else if (this.modalReabrir && !this.modalReabrir.isHidden) {
        this.modalReabrir.close();
      } else {
        console.log('Nenhuma modal visível para ser fechada.');
      }

      // Limpar Variáveis de Controle após fechar a Modal.
      this.equipamentoSelecionado = {} as Equipamento;

      // Detecta mudanças com change detection.
      this.cd.detectChanges();
    });
  }

  // Correção de bug de loop de informações no Log (Usar este no evento da Modal - Close ao invés do fecharModalAtual)
  resetarFormularioFilho() {
    if (this.formAbrirSolicitacao) {
      console.log('Resetando: Equipamento, Formulário, EventListeners.');

      this.formularioValido = false;
      this.possuiSolicitacaoAberta = false;
      this.equipamentoSelecionado = {} as Equipamento;
      this.formAbrirSolicitacao.resetForm();
      this.formAbrirSolicitacao.removerFormListeners();
    }
    if (this.formReabrirSolicitacao) {
      this.formularioValido = false;
      this.equipamentoSelecionado = {} as Equipamento;
      this.formReabrirSolicitacao.resetForm();
      this.formReabrirSolicitacao.removerFormListeners();
    }
  }

  fecharJanela: PoModalAction = {
    action: this.fecharModalAtual.bind(this),
    label: 'Cancelar',
    danger: false,
  };

  okModalSolicitacoes: PoModalAction = {
    action: this.fecharModalAtual.bind(this),
    label: 'Ok',
    danger: false,
  };

  abrirInformacoes(equipamento: Equipamento) {
    // Abre a Modal de Informações do Equipamento
    this.equipamentoSelecionado = equipamento;

    // Seta a Tab Active Padrao antes de abrir.
    console.log('Abrindo Modal de Informações do Equipamento. Aba de Informacoes Ativa resetada.');
    //this.infoEquipamentoComponent.resetarAbaAtiva();
    this.modalInformacoesEquipamentoVisivel = true;
    this.modalInformacoesEquipamento.open();
  }

  stepSolicitacao(solicitacao: string) {
    switch (solicitacao) {
      case '1':
        setTimeout(() => this.activeStep(Number(1)));
        break;
      case '2':
        setTimeout(() => this.activeStep(Number(2)));
        break;
      case '3':
        setTimeout(() => this.activeStep(Number(3)));
        break;
      case '4':
        setTimeout(() => this.activeStep(Number(4)));
        break;
      case '5':
        setTimeout(() => this.activeStep(Number(5)));
        break;
      case '6':
        setTimeout(() => this.activeStep(Number(6)));
        break;
      case '7':
        setTimeout(() => this.activeStep(Number(7)));
        break;

      default:
        console.log('Ação desconhecida');
    }
  }

  activeStep(nstep: number) {
    this.stepper.active(nstep);
  }

  salvarAvaliacao() {
    if (this.qualidadeServico && this.satisfacaoAtendimento) {
      this.loadingStart = true;

      // Chama o método do serviço
      this.ordemServicoService
        .avalialcaoSolicitacao(
          this.avaliacaoFilialId,
          this.avaliacaoSolicId,
          this.qualidadeServico,
          this.satisfacaoAtendimento,
        )
        .subscribe({
          next: (resposta) => {
            console.log('Resposta da API:', resposta);
            this.cancelarAvaliacao();
            this.setEmpresa();
          },
          error: (erro) => {
            this.cancelarAvaliacao();
            console.error('Erro ao abrir solicitação:', erro);
          },
          complete: () => {
            this.cancelarAvaliacao();
          },
        });
    } else {
      this.poNotification.error('Por favor, preencha todas as avaliações.');
    }
  }

  cancelarAvaliacao() {
    this.qualidadeServico = null;
    this.satisfacaoAtendimento = null;

    this.avaliacaoSolicId = '';
    this.avaliacaoFilialId = '';
    this.loadingStart = false;
    this.modalAvaliacao.close();
  }

  abrirModalAvaliacao(filial: string, solicitacao_id: string) {
    this.avaliacaoSolicId = solicitacao_id;
    this.avaliacaoFilialId = filial;
    this.modalSolicitacoesAbertas.close();
    this.modalAvaliacao.open();
  }

  abrirModalReabrir(equipamento: Equipamento) {
    this.equipamentoSelecionado = equipamento;
    this.loadingAbrirSolicitacao = false; // Desabilita o Loading do Botão de Abrir Solicitação
    this.abrirSolicitacao.loading = this.loadingAbrirSolicitacao; // Inicia com Loading Desabilitado.
    let number_step: string;

    this.equipamentoService
      .listarSolicitacoesDaFilial('01', equipamento.equipamento_filial, equipamento.equipamento_id)
      .subscribe({
        next: (response) => {
          this.solicitacoes = response;

          if (this.solicitacoes.length > 0) {
            this.solicitacoes.forEach((solicitacao) => {
              this.possuiSolicitacaoAberta = true;
              number_step = solicitacao.solicitacao_step ?? '0';
            });
          } else {
            this.possuiSolicitacaoAberta = false;
          }
        },
        error: (error) => {
          console.error(
            'Erro ao verificar S.S. aberta:' +
              '\nURL: ' +
              error.url +
              '\nStatus: ' +
              error.status +
              '\nMensagem: ' +
              error.error,
          );

          // Se der qualquer tipo de erro, eu zero o equipamento.
          this.equipamentoSelecionado = {} as Equipamento;
        },

        complete: () => {
          this.reFormularioValido = false;
          this.reabrirSolicitacao.disabled = true;
          this.modalSolicitacoesAbertas.close();
          this.modalReabrir.open();

          setTimeout(() => {
            console.log('Definindo Form Listener na Modal de S.S...');
            if (this.formFilhoComponent) {
              this.formFilhoComponent.setupFormListener();

              // Desativa o loading após a configuração do listener
              console.log('Listener configurado. Desativando o Loading.');
              this.loadingForm = false;
            }
          });
        },
      });
  }

  addIncidenteOs(filial: string, ordem: string, incidente: string) {
    if (filial) {
      this.loadingStart = true;

      // Chama o método do serviço
      this.ordemServicoService.addIncidenteOs(filial, ordem, incidente).subscribe({
        next: (resposta) => {
          this.fecharModalAtual();
          this.abrindoSolicitacao = false;
        },
        error: (erro) => {
          this.poNotification.error('Erro ao alterar Ordem de Serviço.');
        },
        complete: () => {
          this.poNotification.success('Ordem de Serviço aberta com Sucesso');
        },
      });
    } else {
      this.poNotification.error('Por favor, preencha todas as avaliações.');
    }
  }

  cancelarReabrir() {
    this.avaliacaoSolicId = '';
    this.avaliacaoFilialId = '';
    this.loadingStart = false;
    this.modalReabrir.close();
  }

  /* salvarReabrir() {
     if (this.novoIncidente) {
       this.loadingStart = true;
 
 
       // Chama o método do serviço
       this.ordemServicoService.reabrirSolicitacao(this.avaliacaoFilialId, this.avaliacaoSolicId, this.novoIncidente).subscribe({
         next: (resposta) => {
 
           console.log('Resposta da API:', resposta);
           this.cancelarReabrir();
           this.setEmpresa();
 
 
         },
         error: (erro) => {
 
           this.cancelarReabrir();
           console.error('Erro ao abrir solicitação:', erro);
 
         },
         complete: () => {
           this.cancelarReabrir();
 
         },
       });
 
     } else {
       this.poNotification.error('Por favor, Relate novo incidente.');
     }
   }*/

  formatarDataBrasileira(data: Date | string | null): string {
    if (!data) return ''; // Retorna uma string vazia se não houver data

    let dateObj: Date;
    if (typeof data === 'string' && /^\d{8}$/.test(data)) {
      // Se a data for uma string no formato 'yyyyMMdd'
      const year = parseInt(data.substring(0, 4), 10);
      const month = parseInt(data.substring(4, 6), 10) - 1; // Mês em JavaScript é 0-11
      const day = parseInt(data.substring(6, 8), 10);
      dateObj = new Date(year, month, day);
    } else if (data instanceof Date) {
      dateObj = data;
    } else {
      return ''; // Formato inválido
    }

    return this.datePipe.transform(dateObj, 'dd/MM/yyyy') || ''; // Usa transform e lida com possíveis valores nulos
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case '1':
        return 'Ótimo';
      case '2':
        return 'Bom';
      case '3':
        return 'Satisfatório';
      case '4':
        return 'Ruim';
      default:
        return '';
    }
  }

  findStep(stepNumber: string | undefined): string {
    if (stepNumber === undefined) {
      return 'Status não definido';
    }

    const index = parseInt(stepNumber, 10);
    return this.step[index] || 'Etapa não encontrada';
  }

  /*getEquipData(linha?: string, grupo?: string, filial?: string): Observable<any> {

    if (linha == '') {
      this.loadingState = true;
    }

    this.countD = 0;
    this.countA = 0;

    const url = '';
    return this.http.get<any>(url);
  }

  */

  /*EventEquipData(grupo: string, filial: string) {

    this.getEquipData('', grupo, filial).subscribe((data) => {
      this.loadingState = false;
      this.iEquipamento = data.data;
      this.count = data.count;
      this.version = ''; //fazer buscar da tabela sistema
      data.data.forEach((item: any) => {

        if (item.eq_statusupd == 'A') {

          this.countA = this.countA + 1;

        } else {

          this.countD++;

        }

      });
    });
  }*/

  /* openModal() {
 
   
 
   }*/
}
