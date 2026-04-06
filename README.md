# Módulos do Software - Koala Protheus

O projeto contém módulos de software como IoT, ANDON, Manutenção, Monitoramento.

## Frontend na nuvem com Electron local

O Electron pode funcionar apenas como ponte com o computador local, enquanto o frontend Angular fica hospedado na nuvem.

- Em desenvolvimento, o Electron abre `http://127.0.0.1:4301/#/login`.
- Em produção, o Electron abre `http://koala.simplifysystem.com.br/` por padrão, ou a URL definida em `desktopAppUrl` no `package.json` ou pela variável `KOALA_DESKTOP_URL`.
- O build desktop final não empacota mais o frontend Angular.
- O desktop pode checar atualizacoes via GitHub Releases quando for empacotado com `GH_OWNER` e `GH_REPO`.

### Como configurar

No arquivo `package.json`, ajuste:

```json
"desktopAppUrl": "http://koala.simplifysystem.com.br/"
```

Para gerar o executável final desacoplado do frontend:

```bash
npm run build:desktop
```

Para gerar um release desktop e publicar no GitHub Releases:

```powershell
$env:KOALA_DESKTOP_URL = 'http://koala.simplifysystem.com.br/'
$env:GH_OWNER = 'seu-usuario-ou-organizacao'
$env:GH_REPO = 'seu-repositorio'
$env:GH_TOKEN = 'seu-token-do-github' # ou GITHUB_TOKEN
npm run release:desktop:github
```

Antes de publicar, aumente a `version` no `package.json`. O Electron compara essa versao com a do GitHub Releases para decidir se existe atualizacao.

Para evitar reescrever as variáveis toda vez, use o atalho local:

```powershell
npm run release:desktop:local
```

Esse comando usa por padrão:
- `http://koala.simplifysystem.com.br/`
- `danilopx`
- `app_electron_koala`

Se `GH_TOKEN` ou `GITHUB_TOKEN` já estiverem definidos na sessão, ele usa esses valores; caso contrário, pede o token na hora.

Para gerar web de producao e instalador em uma unica execucao, informando a URL final do frontend:

```powershell
$env:KOALA_DESKTOP_URL = 'http://koala.simplifysystem.com.br/'
npm run release:desktop
```

Se quiser apenas gerar o build web para subir no servidor:

```bash
npm run build:web:prod
```

Para publicar somente a web em uma pasta de destino:

```powershell
$env:KOALA_WEB_PUBLISH_DIR = 'C:\inetpub\wwwroot\koala'
npm run publish:web
```

Ou manualmente:

```powershell
.\scripts\publish-web.ps1 -PublishDir 'C:\inetpub\wwwroot\koala' -Clean
```

Se o frontend for publicado em uma pasta local ou compartilhamento, o release pode copiar a saida para um diretorio destino:

```powershell
.\scripts\release.ps1 -DesktopUrl 'http://koala.simplifysystem.com.br/' -PublishDir 'C:\deploy\koala-web'
```

## Build web com Docker

O `Dockerfile` agora faz build de producao do Angular e publica o `dist/Koala` em um container `nginx`.

Para subir localmente:

```bash
docker compose up --build
```

O frontend fica exposto em `http://localhost:4600`.

## Deploy no servidor

Para atualizar o app em um servidor com Git e Docker:

```bash
./deploy.sh
```

O script faz:

1. `git pull`
2. `docker compose up -d --build simplifysystem_koala`
3. mostra o status do container
4. exibe os ultimos logs do serviço

Para testar localmente apontando para um frontend remoto sem empacotar:

```bash
npm run start:electron:remote
```

## Executar como desktop com Electron

O projeto agora pode continuar web e também rodar como aplicativo desktop para acessar impressoras locais.

1. Instale as novas dependências:
   `npm install`
2. Para desenvolvimento web:
   `npm run start:web`
3. Para desenvolvimento desktop:
   `npm run start:desktop`
4. Para gerar o build desktop:
   `npm run build:desktop`
5. Para publicar uma nova versão no GitHub Releases:
   `npm run release:desktop:github`

### Como chamar a impressão no Angular

No Angular, use a ponte exposta pelo `preload`:

```ts
const printers = await window.electronAPI?.getPrinters();
const result = await window.electronAPI?.print({
  silent: false,
  printBackground: true,
  deviceName: 'Nome da impressora'
});
```

Se `window.electronAPI` estiver vazio, o sistema está rodando no navegador comum.

## Arquivo de configuração Produção
export const environment = {
  production: true,
  apiRoot: 'http://172.16.107.13:8066/wsarotubi/',
  apiApp:  'http://172.16.107.16:5001/api/v1/arotubi/',
  apiAppMT:  'http://172.16.107.16:5002/',
  apiRepositorio:'http://repositorio.simplifysystem.com.br/',
  configUrl: '',
  usuarioMntPadrao: 'SIMPLIFY MNT',
  originMntPadrao: 'APP_MNT',
  costCenterMntPadrao: '1361499',
  situationMntPadrao: 'L',
  admUser: 'totvs_auto',
  pass:'@mandrake570',
  grupo: '01',
  filial: '010101'
};



## Arquivo de configuração Homologação
export const environment = {
  production: true,
  apiRoot: 'http://192.168.1.224:2281/wsarotubi/',
  apiApp:  'http://172.16.107.16:5010/api/v1/arotubi/',
  apiAppMT:  'http://172.16.107.16:9010/',
  apiRepositorio:'http://172.16.107.16:5333/',
  configUrl: '',
  usuarioMntPadrao: 'SIMPLIFY MNT',
  originMntPadrao: 'APP_MNT',
  costCenterMntPadrao: '1361499',
  situationMntPadrao: 'L',
  admUser: 'totvs_auto',
  pass:'@mandrake570',
  grupo: '01',
  filial: '010101'
};
