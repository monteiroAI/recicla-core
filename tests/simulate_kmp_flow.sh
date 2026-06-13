#!/bin/bash
# ===============================================================================
# CAMINHO FÍSICO: tests/simulate_kmp_flow.sh
# CONFIGURAÇÃO: Autenticação via Usuário Real do Contêiner (recicla_user)
# DIRETRIZ: Garantir injeção limpa para execução da Jornada do Herói
# ===============================================================================

API_URL="http://localhost:3001/api/v1"
UUID_MISSAO="jornada-gplaza-forensic-2026"
ID_MOTORISTA="MOT-MONTEIRO-01"

# 🔑 CREDENCIAIS HISTÓRICAS EXTRAÍDAS DO DOCKER INSPECT
DB_USER="recicla_user"
DB_NAME="postgres" # Caso sua aplicação use um banco com o nome 'recicla', mude aqui.

echo "🧹 [1/7] Expurgando tabelas e preparando o pátio com o usuário legítimo ($DB_USER)..."
docker exec -i recicla-db-1 psql -U $DB_USER -d $DB_NAME <<EOF
SET search_path TO simulation;

-- Garante a existência da tabela limpa na base central do Recicla
CREATE TABLE IF NOT EXISTS recicla_missoes (
    id SERIAL PRIMARY KEY,
    uuid_missao VARCHAR(64) UNIQUE NOT NULL,
    id_motorista VARCHAR(50) NOT NULL,
    veiculo_placa VARCHAR(20) NOT NULL,
    cliente_nome VARCHAR(100) NOT NULL,
    id_destino VARCHAR(50) NOT NULL,
    classe_residuo VARCHAR(30) NOT NULL,
    status_missao VARCHAR(40) DEFAULT 'DESIGNADA',
    peso_1_tara_gerador NUMERIC DEFAULT 0,
    peso_2_bruto_gerador NUMERIC DEFAULT 0,
    peso_3_bruto_destino NUMERIC DEFAULT 0,
    peso_4_tara_destino NUMERIC DEFAULT 0,
    biometria_confirmada_origem BOOLEAN DEFAULT FALSE,
    biometria_confirmada_destino BOOLEAN DEFAULT FALSE,
    tempo_parado_anormal_detectado BOOLEAN DEFAULT FALSE,
    mtr_numero VARCHAR(50),
    nfe_numero VARCHAR(50),
    elegivel_blockchain BOOLEAN DEFAULT TRUE,
    status_auditoria VARCHAR(50) DEFAULT 'AGUARDANDO_PROCESSAMENTO',
    motivo_rejeicao_motorista TEXT,
    data_criacao TIMESTAMP DEFAULT NOW(),
    cliente_latitude NUMERIC,
    cliente_longitude NUMERIC
);

CREATE TABLE IF NOT EXISTS recicla_missoes_evidencias (
    id SERIAL PRIMARY KEY,
    id_missao INT REFERENCES recicla_missoes(id) ON DELETE CASCADE,
    step VARCHAR(50) NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    foto_latitude NUMERIC NOT NULL,
    foto_longitude NUMERIC NOT NULL,
    foto_timestamp TIMESTAMP NOT NULL,
    data_recebimento_backend TIMESTAMP DEFAULT NOW()
);

-- Executa a limpeza sem travas de integridade
TRUNCATE TABLE recicla_missoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE recicla_missoes_evidencias RESTART IDENTITY CASCADE;

-- Injeção do Estado 0 (Abertura da O.S. pela Coordenação da PGRS)
INSERT INTO recicla_missoes (uuid_missao, id_motorista, veiculo_placa, cliente_nome, id_destino, classe_residuo, status_missao, data_criacao, cliente_latitude, cliente_longitude)
VALUES ('$UUID_MISSAO', '$ID_MOTORISTA', 'EIXO-2026', 'Shopping Grand Plaza André', 'CONSOLIDADO-ANDRE', 'CLASSE_II_SECOS', 'DESIGNADA', NOW(), -23.6489, -46.5388);
EOF

echo "📱 [2/7] PORTÃO T1: Autenticação biométrica do condutor no aplicativo agnóstico..."
curl -s -X POST "$API_URL/mobile/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T1_INICIO_MISSAO\",
    \"id_motorista\": \"$ID_MOTORISTA\",
    \"dados_payload\": { \"biometria_aprovada_hardware\": true }
  }"
echo -e "\n"

echo "comunidade 🚛 [3/7] PORTÃO T2: Chegada no Shopping. Registro de Pesagem 1 (Tara)..."
curl -s -X POST "$API_URL/mobile/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T2_BALANCA_VAZIO\",
    \"dados_payload\": { \"peso_1\": 12000 }
  }"
echo -e "\n"

echo "📸 [4/7] PORTÃO T3: Carregamento concluído. Submetendo MTR/NF-e + Mínimo de 2 Fotos EXIF..."
curl -s -X POST "$API_URL/mobile/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T3_LOCAL_COLETA_CARGA\",
    \"dados_payload\": {
      \"peso_2\": 16500,
      \"mtr_numero\": \"MTR-99231-2026\",
      \"nfe_numero\": \"NFE-44021\",
      \"fotos_evidencia\": [
        { \"step\": \"T3_FOTO_LOTE_1\", \"hash_sha256\": \"sha256-img01\", \"latitude\": -23.6489, \"longitude\": -46.5388, \"timestamp\": \"2026-06-13T18:00:00Z\" },
        { \"step\": \"T3_FOTO_LOTE_2\", \"hash_sha256\": \"sha256-img02\", \"latitude\": -23.6488, \"longitude\": -46.5387, \"timestamp\": \"2026-06-13T18:02:00Z\" }
      ]
    }
  }"
echo -e "\n"

echo "🛣️ [5/7] PORTÃO T4: Rota em andamento com GPS ativo de 3 em 3 minutos..."
curl -s -X POST "$API_URL/api/v1/mobile/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T4_TRANSPORTE_RESIDUO\",
    \"dados_payload\": {}
  }"
echo -e "\n"

echo "⚖️ [6/7] PORTÃO T4_CHECK: Portão da Consolidadora André. Pesagem 3 (Entrada) + Varredura de Contrabando..."
curl -s -X POST "$API_URL/mobile/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T4_GATE_CONSOLIDADO_CHECK\",
    \"id_motorista\": \"$ID_MOTORISTA\",
    \"dados_payload\": {
      \"peso_3\": 16500,
      \"tempo_total_parado_segundos\": 120
    }
  }"
echo -e "\n"

echo "🏁 [7/7] PORTÃO T6: Pesagem 4 (Tara Final de Saída) e Emissão do Handshake Temporal..."
curl -s -X POST "$API_URL/mobile/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T6_MISSAO_ENCERRADA\",
    \"dados_payload\": { \"peso_4\": 12000 }
  }"
echo -e "\n"
echo "🎯 Pipeline executado com sucesso."