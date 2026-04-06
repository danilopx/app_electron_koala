import { Component } from '@angular/core';

interface HelpSection {
  title: string;
  description: string;
  items: string[];
}

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent {
  readonly sections: HelpSection[] = [
    {
      title: 'Configuracao inicial',
      description: 'A tela inicial so libera o sistema quando os parametros obrigatorios estiverem preenchidos e validados.',
      items: [
        'Preencha obrigatoriamente: ambiente, API Protheus, usuario, senha, grupo, filial e codigo do equipamento.',
        'A senha do usuario administrador nao deve ser exibida na lista de parametros; ela fica protegida na tela de edicao.',
        'Se a validacao falhar, revise a URL da API e as credenciais antes de salvar.',
        'Depois de salvar a configuracao, o sistema retorna para o login para iniciar a sessao com os dados novos.',
      ],
    },
    {
      title: 'Acesso e menus',
      description: 'Os menus aparecem conforme os parametros de habilitacao da instalacao.',
      items: [
        'A rotina de Producao manual so aparece quando o parametro de habilitacao manual estiver ativo.',
        'A rotina de Producao automatica so aparece quando o parametro de habilitacao automatica estiver ativo.',
        'Se a rota for acessada direto e estiver desabilitada, o sistema volta para a Home e mostra aviso.',
        'A pagina Help so fica disponivel para usuarios autenticados.',
      ],
    },
    {
      title: 'Producao manual',
      description: 'Lista ordens, mostra o avanço e permite abrir o detalhe da OP para consulta e acompanhamento.',
      items: [
        'A grade mostra a OP completa, produto, data de emissao, unidade, quantidade total, apontado e saldo.',
        'Os status usados pela tela sao: Aberta, Parcialmente apontada e Finalizada.',
        'Os filtros aceitam busca por OP, produto, status e intervalo de datas.',
        'O intervalo de datas nao pode passar de 6 meses.',
        'A coluna OP usa a chave completa da ordem, nao apenas o numero curto.',
      ],
    },
    {
      title: 'Producao automatica',
      description: 'Rotina voltada para leitura serial, apontamento automatico e impressao de etiqueta.',
      items: [
        'A OP deve ser informada com 11 digitos, apenas numeros.',
        'A leitura serial funciona apenas no app desktop; no navegador ela nao executa.',
        'O apontamento automatico depende do multiplo da caixa e do contador de pulsos lido na serial.',
        'O apontamento manual so fica disponivel quando a rotina nao estiver presa ao multiplo ou quando o parametro permitir fora do multiplo.',
        'Se o saldo da OP chegar a zero, a ordem fica bloqueada para novas acoes.',
        'A etiqueta e impressa com os dados da OP carregada; se nao houver impressora Argox, o sistema abre o preview.',
      ],
    },
    {
      title: 'Regras de negocio',
      description: 'Resumo das regras que mais causam duvida no uso do processo.',
      items: [
        'PR_SENHA e um parametro sensivel e nao deve ficar exposto na lista de parametros.',
        'PR_CODIGO_EQUIPAMENTO e obrigatorio para a configuracao inicial.',
        'PR_GRUPO e PR_FILIAL definem o contexto padrao da instalacao.',
        'Se a porta serial recusar acesso, o sistema tenta reconectar automaticamente.',
        'Se a OP estiver finalizada ou sem saldo, a rotina bloqueia novos apontamentos.',
      ],
    },
    {
      title: 'Problemas comuns',
      description: 'Use este bloco para orientar o usuario quando algo nao funcionar como esperado.',
      items: [
        'Se a tela de producao nao abrir, verifique se a rotina correspondente esta habilitada na configuracao.',
        'Se a OP nao carregar, confirme se os 11 digitos foram digitados corretamente.',
        'Se a impressao nao sair, confira se a impressora Argox esta instalada e acessivel.',
        'Se o sistema avisar sobre Protheus parado, revise a URL da API e as credenciais da integracao.',
      ],
    },
  ];
}
