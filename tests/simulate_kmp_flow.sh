#!/bin/bash
# ===============================================================================
# CAMINHO FÍSICO: tests/simulate_kmp_flow.sh
# CONFIGURAÇÃO: Autenticação via Usuário Real do Contêiner (recicla_user)
# DIRETRIZ: Garantir injeção limpa para execução da Jornada do Herói
# ===============================================================================

API_URL="http://localhost:3000/api/v1/mobile"
UUID_MISSAO="jornada-gplaza-forensic-2026"
ID_MOTORISTA="MOT-MONTEIRO-01"

# 🔑 CREDENCIAIS HISTÓRICAS EXTRAÍDAS DO DOCKER INSPECT
DB_USER="recicla_user"
DB_NAME="recicla"

echo "🧹 [1/7] Expurgando tabelas e preparando o pátio com o usuário legítimo ($DB_USER)..."
docker exec -i recicla-db-1 psql -U $DB_USER -d $DB_NAME <<EOF
SET search_path TO simulation;

-- Ajustes de esquema para a simulação física de pesagem biunívoca
ALTER TABLE IF EXISTS cons_pesagens_cooperativa
  ADD COLUMN IF NOT EXISTS peso_entrada NUMERIC,
  ADD COLUMN IF NOT EXISTS peso_saida NUMERIC,
  ADD COLUMN IF NOT EXISTS peso_liquido NUMERIC,
  ADD COLUMN IF NOT EXISTS vertical_classificacao VARCHAR(50);

ALTER TABLE IF EXISTS corp_missoes
  ADD COLUMN IF NOT EXISTS status_validacao VARCHAR(50);

-- Garante a existência de tabelas de recepção real do processo CORP
CREATE TABLE IF NOT EXISTS corp_clientes (
    id VARCHAR(50) PRIMARY KEY,
    id_operador VARCHAR(50),
    id_municipio VARCHAR(50),
    nome_fantasia VARCHAR(150) NOT NULL,
    classe_residuo_predominante VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS corp_contratos (
    id VARCHAR(50) PRIMARY KEY,
    id_cliente VARCHAR(50) REFERENCES corp_clientes(id),
    coletas_semanais INTEGER NOT NULL,
    descricao_operacao TEXT
);

CREATE TABLE IF NOT EXISTS corp_ordens_servico (
    id VARCHAR(50) PRIMARY KEY,
    id_contrato VARCHAR(50) REFERENCES corp_contratos(id),
    codigo_so VARCHAR(50) NOT NULL,
    tipo_residuo VARCHAR(150) NOT NULL,
    status_so VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS corp_missoes (
    id VARCHAR(50) PRIMARY KEY,
    id_ordem_servico VARCHAR(50) REFERENCES corp_ordens_servico(id),
    codigo_os VARCHAR(50) NOT NULL,
    cliente_corp VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_operacional VARCHAR(50) NOT NULL,
    status_validacao VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cons_cooperativas (
    id VARCHAR(50) PRIMARY KEY,
    id_municipio VARCHAR(50),
    nome_fantasia VARCHAR(150) NOT NULL,
    tipo_operador VARCHAR(50) NOT NULL,
    postos_trabalho INTEGER NOT NULL
);

-- Limpeza seletiva do cenário de simulação de recepção
TRUNCATE TABLE corp_missoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE corp_ordens_servico RESTART IDENTITY CASCADE;
TRUNCATE TABLE corp_contratos RESTART IDENTITY CASCADE;
TRUNCATE TABLE corp_clientes RESTART IDENTITY CASCADE;
TRUNCATE TABLE cons_pesagens_cooperativa RESTART IDENTITY CASCADE;
TRUNCATE TABLE cons_cooperativas RESTART IDENTITY CASCADE;

-- Cria cliente Classe II e contrato/ordem de serviço associados
INSERT INTO corp_clientes (id, id_operador, id_municipio, nome_fantasia, classe_residuo_predominante)
VALUES ('CLIENTE_TESTE_CLASSE_II', NULL, NULL, 'Cliente Teste Classe II', 'CLASSE_II')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corp_contratos (id, id_cliente, coletas_semanais, descricao_operacao)
VALUES ('CONTRATO_TESTE_CLASSE_II', 'CLIENTE_TESTE_CLASSE_II', 1, 'Contrato teste Classe II')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corp_ordens_servico (id, id_contrato, codigo_so, tipo_residuo, status_so)
VALUES ('OS_TESTE_CLASSE_II', 'CONTRATO_TESTE_CLASSE_II', 'OS-CLASSE-II-001', 'CLASSE_II', 'ABERTA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corp_missoes (id, id_ordem_servico, codigo_os, cliente_corp, status, status_operacional, created_at, updated_at)
VALUES ('MISSAO_TESTE_CLASSE_II_1', 'OS_TESTE_CLASSE_II', 'OS-CLASSE-II-001', 'CLIENTE_TESTE_CLASSE_II', 'EM_TRANSITO', 'AGUARDANDO_DESCARGA', '2026-06-05 09:00:00', '2026-06-05 09:00:00'),
       ('MISSAO_TESTE_CLASSE_II_2', 'OS_TESTE_CLASSE_II', 'OS-CLASSE-II-001', 'CLIENTE_TESTE_CLASSE_II', 'EM_TRANSITO', 'AGUARDANDO_DESCARGA', '2026-06-05 09:30:00', '2026-06-05 09:30:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cons_cooperativas (id, id_municipio, nome_fantasia, tipo_operador, postos_trabalho)
VALUES ('COOP_TESTE_CLASSE_II', NULL, 'Cooperativa Teste Classe II', 'COOPERATIVA', 5)
ON CONFLICT (id) DO NOTHING;

-- Simulação física de pesagem biunívoca na recepção do pátio
INSERT INTO cons_pesagens_cooperativa (id_registro, id_cooperativa, id_missao_origem, origem_material, peso_bruto_entrada, peso_entrada, peso_saida, peso_liquido, vertical_classificacao, peso_rejeito_aterro, created_at)
VALUES
  ('PESAGEM_TESTE_450', 'COOP_TESTE_CLASSE_II', 'MISSAO_TESTE_CLASSE_II_1', 'grande_gerador', 12450, 12450, 12000, 450, 'GRANDES_GERADORES', 0, '2026-06-05 12:00:00'),
  ('PESAGEM_TESTE_320', 'COOP_TESTE_CLASSE_II', 'MISSAO_TESTE_CLASSE_II_2', 'domiciliar_seletiva', 3200, 3200, 2880, 320, 'COLETA_PUBLICA', 0, '2026-06-05 13:00:00')
ON CONFLICT (id_registro) DO NOTHING;

-- Consistência do MTR/Manifesto para confirmar a conferência de pátio
UPDATE corp_missoes
SET status_validacao = 'CONSOLIDADO_CORP', status_operacional = 'CONSOLIDADO_CORP', status = 'VALIDADO'
WHERE id IN ('MISSAO_TESTE_CLASSE_II_1', 'MISSAO_TESTE_CLASSE_II_2');

-- Preserva o fluxo mobile existente usado pelo simulador de jornada
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

TRUNCATE TABLE recicla_missoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE recicla_missoes_evidencias RESTART IDENTITY CASCADE;

INSERT INTO recicla_missoes (uuid_missao, id_motorista, veiculo_placa, cliente_nome, id_destino, classe_residuo, status_missao, data_criacao, cliente_latitude, cliente_longitude)
VALUES ('$UUID_MISSAO', '$ID_MOTORISTA', 'EIXO-2026', 'Shopping Grand Plaza André', 'CONSOLIDADO-ANDRE', 'CLASSE_II_SECOS', 'DESIGNADA', '2026-06-05 09:00:00', -23.6489, -46.5388);
EOF

echo "📱 [2/7] PORTÃO T1: Autenticação biométrica do condutor no aplicativo agnóstico..."
curl -s -X POST "$API_URL/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T1_INICIO_MISSAO\",
    \"id_motorista\": \"$ID_MOTORISTA\",
    \"dados_payload\": { \"biometria_aprovada_hardware\": true }
  }"
echo -e "\n"

echo "comunidade 🚛 [3/7] PORTÃO T2: Chegada no Shopping. Registro de Pesagem 1 (Tara)..."
curl -s -X POST "$API_URL/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T2_BALANCA_VAZIO\",
    \"dados_payload\": { \"peso_1\": 12000 }
  }"
echo -e "\n"

echo "📸 [4/7] PORTÃO T3: Carregamento concluído. Submetendo MTR/NF-e + Mínimo de 2 Fotos EXIF..."
curl -s -X POST "$API_URL/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T3_LOCAL_COLETA_CARGA\",
    \"dados_payload\": {
      \"peso_2\": 16500,
      \"mtr_numero\": \"MTR-99231-2026\",
      \"nfe_numero\": \"NFE-44021\",
      \"fotos_evidencia\": [
        { \"step\": \"T3_FOTO_LOTE_1\", \"hash_sha256\": \"sha256-img01\", \"latitude\": -23.6489, \"longitude\": -46.5388, \"timestamp\": \"2026-06-05T14:00:00Z\" },
        { \"step\": \"T3_FOTO_LOTE_2\", \"hash_sha256\": \"sha256-img02\", \"latitude\": -23.6488, \"longitude\": -46.5387, \"timestamp\": \"2026-06-05T14:02:00Z\" }
      ]
    }
  }"
echo -e "\n"

echo "🛣️ [5/7] PORTÃO T4: Rota em andamento com GPS ativo de 3 em 3 minutos..."
curl -s -X POST "$API_URL/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T4_TRANSPORTE_RESIDUO\",
    \"dados_payload\": {}
  }"
echo -e "\n"

echo "⚖️ [6/7] PORTÃO T4_CHECK: Portão da Consolidadora André. Pesagem 3 (Entrada) + Varredura de Contrabando..."
curl -s -X POST "$API_URL/jornadas/estado" \
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
curl -s -X POST "$API_URL/jornadas/estado" \
  -H "Content-Type: application/json" \
  -d "{
    \"uuid_missao\": \"$UUID_MISSAO\",
    \"proximo_estado\": \"T6_MISSAO_ENCERRADA\",
    \"dados_payload\": { \"peso_4\": 12000 }
  }"
echo -e "\n"
echo "🎯 Pipeline executado com sucesso."