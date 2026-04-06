#!/bin/sh

echo "Iniciando serviço cron..."
# Start cron daemon
crond -f -d 8 &

echo "Iniciando sincronização inicial do SharePoint/OneDrive com rclone..."
# Initial sync SharePoint/OneDrive files to local directory (read-only)
rclone sync "sharepoint_arotubi:01 - Doc SGQ/06 - IO-AV-IT-Cep" /mnt/sharepoint_arotubi --dry-run --verbose
echo "Executando sincronização inicial real..."
rclone sync "sharepoint_arotubi:01 - Doc SGQ/06 - IO-AV-IT-Cep" /mnt/sharepoint_arotubi --verbose

echo "Verificando arquivos sincronizados:"
ls -la /mnt/sharepoint_arotubi

echo "Cron job configurado para sincronizar a cada 5 minutos"
echo "Log de sincronização disponível em: /var/log/rclone-sync.log"

echo "Vendo se o npm instalou os pacotes corretamente"
npm list

echo "Procurando se existe node_modules"
find / -name "node_modules"

echo "Verificando o conteúdo do diretório atual e caminho."
pwd && ls -la .

echo "Tentando criar um arquivo de testes"
touch teste.txt

echo "Verificando se o arquivo teste.txt foi criado"
ls -la teste.txt

echo "Aguardando para manter o container rodando"
tail -f /dev/null
