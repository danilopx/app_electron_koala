import { Component } from '@angular/core';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  items: string[];
  highlight: string;
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

  readonly sections: HelpSection[] = [
    {
      id: 'configuracao-inicial',
      title: 'Configuracao inicial',
      description: 'A tela inicial so libera o sistema quando os parametros obrigatorios estiverem preenchidos e validados.',
      highlight: 'Obrigatorio para entrar no sistema',
      items: [
        'Preencha obrigatoriamente: ambiente, API Protheus, usuario, senha, grupo, filial e codigo do equipamento.',
        'A senha do usuario administrador nao deve ser exibida na lista de parametros; ela fica protegida na tela de edicao.',
        'Se a validacao falhar, revise a URL da API e as credenciais antes de salvar.',
        'Depois de salvar a configuracao, o sistema retorna para o login para iniciar a sessao com os dados novos.',
      ],
    },
    {
      id: 'papeis-sistema',
      title: 'Papeis no sistema',
      description: 'Os papéis abaixo ajudam a entender o que cada usuario normalmente consegue fazer na operação.',
      highlight: 'Quem faz o que',
      items: [
        'Administrador / TI: configura a instalacao, ajusta parametros, credenciais e recursos de integracao.',
        'Operador de Producao Manual: consulta OPs, acompanha o saldo, aplica filtros e abre o detalhe da ordem.',
        'Operador de Producao Automatica: informa a OP completa com 11 digitos, acompanha a leitura serial e aciona apontamento e etiqueta.',
        'Usuario de apoio / supervisor: valida mensagens de erro, saldo zerado, impressao e retornos do Protheus.',
        'O acesso aos menus tambem depende dos parametros de habilitacao da rotina na instalacao.',
      ],
    },
    {
      id: 'acesso-menus',
      title: 'Acesso e menus',
      description: 'Os menus aparecem conforme os parametros de habilitacao da instalacao.',
      highlight: 'Menus dependem da configuracao',
      items: [
        'A rotina de Producao manual so aparece quando o parametro de habilitacao manual estiver ativo.',
        'A rotina de Producao automatica so aparece quando o parametro de habilitacao automatica estiver ativo.',
        'Se a rota for acessada direto e estiver desabilitada, o sistema volta para a Home e mostra aviso.',
        'A pagina Help so fica disponivel para usuarios autenticados.',
      ],
    },
    {
      id: 'producao-manual',
      title: 'Producao manual',
      description: 'Lista ordens, mostra o avanço e permite abrir o detalhe da OP para consulta e acompanhamento.',
      highlight: 'Consulta e acompanhamento de OP',
      items: [
        'A grade mostra a OP completa, produto, data de emissao, unidade, quantidade total, apontado e saldo.',
        'Os status usados pela tela sao: Aberta, Parcialmente apontada e Finalizada.',
        'Os filtros aceitam busca por OP, produto, status e intervalo de datas.',
        'O intervalo de datas nao pode passar de 6 meses.',
        'A coluna OP usa a chave completa da ordem, nao apenas o numero curto.',
        'Ao abrir o detalhe, a pagina usa numero, item e sequencia da OP para buscar os dados completos.',
      ],
    },
    {
      id: 'producao-automatica',
      title: 'Producao automatica',
      description: 'Rotina voltada para leitura serial, apontamento automatico e impressao de etiqueta.',
      highlight: 'Leitura serial e apontamento',
      items: [
        'A OP deve ser informada com 11 digitos, apenas numeros.',
        'A leitura serial funciona apenas no app desktop; no navegador ela nao executa.',
        'O apontamento automatico depende do multiplo da caixa e do contador de pulsos lido na serial.',
        'O apontamento manual so fica disponivel quando a rotina nao estiver presa ao multiplo ou quando o parametro permitir fora do multiplo.',
        'Se o saldo da OP chegar a zero, a ordem fica bloqueada para novas acoes.',
        'A etiqueta e impressa com os dados da OP carregada; se nao houver impressora Argox, o sistema abre o preview.',
        'Quando a OP e finalizada, o sistema bloqueia novas acoes e tenta preservar o estado da execucao automatica.',
      ],
    },
    {
      id: 'cadastro-protheus',
      title: 'Cadastro no Protheus',
      description: 'Alguns campos do cadastro de produto no Protheus determinam o comportamento da rotina de producao.',
      highlight: 'B1_QE e B1_ZTPPRD',
      items: [
        'Para apontamento com multiplo de caixa, o campo B1_QE precisa estar preenchido com a quantidade do multiplo no cadastro do produto.',
        'O tipo do produto vem do campo B1_ZTPPRD e define como o sistema classifica a OP na tela e nas regras de operação.',
        'Mapeamento do B1_ZTPPRD: 1 = Serraria, 2 = WoodPallet, 3 = Classificacao, 4 = Remanofatura, 5 = Granel.',
        'Se B1_ZTPPRD nao estiver preenchido ou vier diferente de 1 a 5, o tipo do produto fica em branco.',
        'O campo B1_QE impacta diretamente o limite do apontamento e a validacao da rotina automatica.',
      ],
    },
    {
      id: 'problemas-comuns',
      title: 'Problemas comuns',
      description: 'Use este bloco para orientar o usuario quando algo nao funcionar como esperado.',
      highlight: 'Checklist de suporte',
      items: [
        'Se a tela de producao nao abrir, verifique se a rotina correspondente esta habilitada na configuracao.',
        'Se a OP nao carregar, confirme se os 11 digitos foram digitados corretamente.',
        'Se a impressao nao sair, confira se a impressora Argox esta instalada e acessivel.',
        'Se o sistema avisar sobre Protheus parado, revise a URL da API e as credenciais da integracao.',
        'Se o apontamento estiver travado, confirme se o saldo da OP ainda e maior que zero.',
      ],
    },
  ];
}
