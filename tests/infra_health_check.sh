#!/bin/bash
# ===============================================================================
# ESTRUTURA PARA ATIVAR: recicla (Ambiente de Infraestrutura / Host Fedora)
# CAMINHO FÍSICO: /boot/torre/recicla/tests/infra_health_check.sh
# CONFIGURAÇÃO: Shell Script Nativo - Varredura Forense de Contêineres e Portas
# STATUS: 100% PRONTO PARA EXECUÇÃO
# ===============================================================================

echo "======================================================================"
echo "🛡️  AUDITORIA DE INFRAESTRUTURA E SAÚDE DE SERVIDORES — RECICLA CORE"
echo "======================================================================"

# 🔄 1. VERIFICAÇÃO DO MOTOR DOCKER
echo -e "\n🐳 [1/3] Checando Motor Docker e Runtime de Contêineres..."
if systemctl is-active --quiet docker; then
    echo -e "  🟢 Docker Daemon: ATIVO (Running)"
else
    echo -e "  🔴 Docker Daemon: INATIVO. Tentando levantar..."
    sudo systemctl start docker
fi

echo -e "  📊 Contêineres em Execução no Módulo:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 💾 2. VERIFICAÇÃO E CONEXÃO DO POSTGRESQL (recicla-db-1)
echo -e "\n💾 [2/3] Testando Persistência Relacional (PostgreSQL)..."
# Verifica se o contêiner do banco está de pé
DB_STATUS=$(docker inspect -f '{{.State.Running}}' recicla-db-1 2>/dev/null)

if [ "$DB_STATUS" = "true" ]; then
    echo -e "  🟢 Contêiner recicla-db-1: UP"
    echo -e "  🔍 Testando Search Path na banda [simulation]..."
    # Executa um query de teste interna para garantir que o banco responde e tem tabelas
    docker exec -i recicla-db-1 psql -U postgres -d postgres -c "SET search_path TO simulation; SELECT COUNT(*) FROM corp_missoes;" 2>&1 | grep -E "(count|Erro)"
else
    echo -e "  🔴 Contêiner recicla-db-1: FORA DO AR"
fi

# ⛓️ 3. VERIFICAÇÃO DO HYPERLEDGER FABRIC (CAMADA 5)
echo -e "\n⛓️  [3/3] Checando Nós da Âncora de Confiança (Hyperledger Fabric)..."
# Varre as portas padrões do Fabric para checar se os nós de validação estão escutando
echo -e "  🔍 Verificando escuta de portas de ancoragem (7051, 7053)..."
ss -tulpn | grep -E "(7051|7053)"

if [ $? -eq 0 ]; then
    echo -e "  🟢 Rede Hyperledger Fabric: Portas de Validação Alinhadas"
else
    echo -e "  🟡 Rede Hyperledger Fabric: Portas em Standby / Aguardando Inicialização"
fi

echo -e "\n======================================================================"
echo "🏁 AUDITORIA DE INFRAESTRUTURA CONCLUÍDA"
echo "======================================================================"