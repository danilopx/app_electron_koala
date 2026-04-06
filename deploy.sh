#!/usr/bin/env bash

set -euo pipefail

echo "======================================"
echo " 🚀 Atualizando simplifysystem_koala"
echo "======================================"

# 1. Ir para a pasta do projeto
cd "$(dirname "$0")"

# 2. Atualizar código do Git
echo "🔄 Fazendo git pull..."
git pull || { echo "❌ Erro no git pull"; exit 1; }

# 3. Rebuild e recriar container
echo "🐳 Rebuild da imagem e atualização do container..."
docker compose up -d --build simplifysystem_koala || { echo "❌ Erro ao atualizar container"; exit 1; }

# 4. Mostrar status
echo "✅ Container atualizado com sucesso!"
docker ps --filter "name=simplifysystem_koala"

# 5. Mostrar últimos logs
echo "📜 Últimos logs:"
docker compose logs -f --tail=50 simplifysystem_koala
