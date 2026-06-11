#!/bin/bash
# ===============================================================================
# ESTRUTURA PARA ATIVAR: recycle (Ambiente de Infraestrutura / Terminal Host)
# CAMINHO FÍSICO: /boot/torre/recycle/tests/run_isolated_server.sh
# CONFIGURAÇÃO: Shell Script para build e execução do container de runtime
# STATUS: NOVO ARQUIVO PARA CRIAR
# ===============================================================================

echo "======================================================================"
echo "🛡️ LEVANTANDO BARRAMENTO ISOLADO RECYCLE (PORTA 3001)"
echo "======================================================================"

# 1. Derruba processos zumbis na porta do host para liberar o bind
kill -9 $(lsof -t -i:3001) 2>/dev/null

# 2. Remove instâncias antigas do micro-contêiner se houver
docker rm -f recycle-api-dev 2>/dev/null

# 3. Builda o ambiente usando o manifesto isolado
docker build -f Dockerfile.dev -t recycle-core:dev .

# 4. Inicia o servidor com encaminhamento de porta e logs em tempo real
docker run -d --name recycle-api-dev -p 3001:3001 recycle-core:dev

echo -e "\n🟢 Servidor Core Isolado Inicializado com Sucesso!"
echo "Acompanhando logs de tráfego abaixo (Ctrl+C para sair do log, o servidor continuará ativo):"
echo "======================================================================"

docker logs -f recycle-api-dev