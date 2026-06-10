#!/bin/bash

# ============================================================================
# PROJETO: RECICLA 4.0
# COMPONENTE: Automação de Backup do PostgreSQL (Docker)
# DATA: 10 de Junho de 2026
# ============================================================================

# Configurações de Caminho e Variáveis (Extraídas do seu .env)
CONTAINER_NAME="recicla-db-1"  # Nome do contêiner do banco no Docker
DB_USER="recicla_user"         # Usuário cadastrado na rocha
DB_NAME="recicla"              # Base de dados principal
BACKUP_DIR="./backups/database" # Pasta destino no seu SSD
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/recicla_backup_$TIMESTAMP.sql.gz"

echo "[🛢️ RECICLA BACKUP] Iniciando rotina de espelhamento do banco de dados..."

# Garante que a pasta de destino exista no seu sistema de arquivos
mkdir -p "$BACKUP_DIR"

# Executa o dump pericial de forma interna no contêiner e compacta em tempo real
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"

# Verifica se o arquivo foi gerado com sucesso
if [ $? -eq 0 ]; then
  echo "[✅ SUCCESS] Backup cimentado com sucesso absoluto em: $BACKUP_FILE"
  echo "[📦 METRICS] Tamanho do dump reduzido: $(du -sh $BACKUP_FILE | cut -f1)"
else
  echo "[🚨 CRITICAL ERROR] Falha física ou de permissão ao extrair o dump do PostgreSQL!"
  exit 1
fi