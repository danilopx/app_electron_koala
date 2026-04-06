import { Component } from '@angular/core';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  items: string[];
  note: string;
}

interface HelpTopic {
  label: string;
  target: string;
  note: string;
}

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent {
  readonly topics: HelpTopic[] = [
    {
      label: 'Configuracao',
      target: 'configuracao-inicial',
      note: 'Parametros obrigatorios e acesso inicial.',
    },
    {
      label: 'Papeis',
      target: 'papeis-sistema',
      note: 'O que cada perfil pode fazer.',
    },
    {
      label: 'Producao manual',
      target: 'producao-manual',
      note: 'Lista, filtros e detalhe da OP.',
    },
    {
      label: 'Producao automatica',
      target: 'producao-automatica',
      note: 'OP com 11 digitos, serial e apontamento.',
    },
    {
      label: 'Cadastro Protheus',
      target: 'cadastro-protheus',
      note: 'B1_QE e B1_ZTPPRD.',
    },
    {
      label: 'Problemas comuns',
      target: 'problemas-comuns',
      note: 'Erros frequentes e validacoes.',
    },
  ];

  selectedSectionId = 'configuracao-inicial';

  readonly sections: HelpSection[] = [
    {
      id: 'configuracao-inicial',
      title: 'Configuracao inicial',
      description: 'A tela inicial so libera o sistema quando os parametros obrigatorios estiverem preenchidos e validados.',
      note: 'Sem isso o sistema nao entra.',
      items: [
        'Preencha ambiente, API Protheus, usuario, senha, grupo, filial e codigo do equipamento.',
        'A senha de integracao nao deve ficar visivel na lista de parametros.',
        'Se a validacao falhar, revise a URL da API e as credenciais.',
        'Depois de salvar, o sistema volta para o login.',
      ],
    },
    {
      id: 'papeis-sistema',
      title: 'Papeis no sistema',
      description: 'Cada perfil enxuga o que o usuario consegue fazer no processo.',
      note: 'Define o alcance de uso.',
      items: [
        'Administrador / TI: configura a instalacao e integra o Protheus.',
        'Operador manual: consulta OP, filtra, abre detalhe e acompanha saldo.',
        'Operador automatico: informa OP, usa serial, aponta e imprime etiqueta.',
        'Apoio / supervisor: valida erros, impressao e saldo zerado.',
      ],
    },
    {
      id: 'acesso-menus',
      title: 'Acesso e menus',
      description: 'Os menus aparecem conforme os parametros ativos da instalacao.',
      note: 'Se nao estiver ativo, o menu some.',
      items: [
        'Producao manual so aparece com a rotina manual ativa.',
        'Producao automatica so aparece com a rotina automatica ativa.',
        'Acesso direto a uma rotina desabilitada volta para a Home.',
        'A pagina Help so fica disponivel para usuarios autenticados.',
      ],
    },
    {
      id: 'producao-manual',
      title: 'Producao manual',
      description: 'Lista ordens, mostra o avanço e abre o detalhe da OP.',
      note: 'A OP aparece completa.',
      items: [
        'A grade mostra OP, produto, data, unidade, quantidade, apontado e saldo.',
        'Status: Aberta, Parcialmente apontada e Finalizada.',
        'Filtros: OP, produto, status e data.',
        'O intervalo de data nao pode passar de 6 meses.',
      ],
    },
    {
      id: 'producao-automatica',
      title: 'Producao automatica',
      description: 'Usa leitura serial, apontamento automatico e impressao.',
      note: 'No desktop funciona melhor.',
      items: [
        'A OP precisa ter 11 digitos, somente numeros.',
        'A leitura serial funciona no app desktop.',
        'O apontamento automatico depende do multiplo da caixa e do pulso lido.',
        'Se o saldo zerar, a ordem bloqueia novas acoes.',
      ],
    },
    {
      id: 'cadastro-protheus',
      title: 'Cadastro no Protheus',
      description: 'Alguns campos do produto definem como a rotina se comporta.',
      note: 'Esses campos mandam na regra.',
      items: [
        'B1_QE: multiplo de caixa do produto.',
        'B1_ZTPPRD: tipo do produto usado pela rotina.',
        'Mapeamento: 1 Serraria, 2 WoodPallet, 3 Classificacao, 4 Remanofatura, 5 Granel.',
        'Se B1_ZTPPRD estiver vazio ou diferente, o tipo fica em branco.',
      ],
    },
    {
      id: 'problemas-comuns',
      title: 'Problemas comuns',
      description: 'O que verificar quando algo nao funcionar.',
      note: 'Primeiro passo do suporte.',
      items: [
        'Tela nao abre: confira se a rotina esta habilitada.',
        'OP nao carrega: confirme os 11 digitos.',
        'Impressao nao sai: confira a Argox.',
        'Protheus parado: revise URL e credenciais.',
      ],
    },
  ];

  selectSection(sectionId: string): void {
    this.selectedSectionId = sectionId;
  }

  get selectedSection(): HelpSection {
    return this.sections.find((section) => section.id === this.selectedSectionId) || this.sections[0];
  }
}
