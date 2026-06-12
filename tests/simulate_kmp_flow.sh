#!/bin/bash
# ===============================================================================
# ESTRUTURA PARA ATIVAR: recicla (Ambiente de Testes / Terminal Host)
# CAMINHO FÍSICO: /boot/torre/recicla/tests/simulate_kmp_flow.sh
# CONFIGURAÇÃO: Shell Script nativo Bash - Suite Multicidades e Dashboards
# STATUS: 100% SANEADO E LIVRE DE DUPLICIDADES
# ===============================================================================

API_URL_CORP="http://localhost:3001/api/corp"
API_URL_ANALYTICS="http://localhost:3001/api/analytics"

echo "======================================================================"
echo "🏗️ INICIANDO EMULAÇÃO DA OPERAÇÃO REAL REGIONAL — AMBIENTE MULTICIDADES"
echo "======================================================================"

# ---------------------------------------------------------------------
# 🏙️ CIDADE 1: SANTO ANDRÉ — OPERAÇÃO METALFINO (CLASSE I)
# ---------------------------------------------------------------------
echo -e "\n📍 [SANTO ANDRÉ] ➔ Processando Fluxo da Fábrica Metalfino (Missão: missao-metalfino)"

echo -e "  1️⃣ Handshake Inicial T1 (Aceite da Ordem de Serviço)"
curl -s -X POST "$API_URL_CORP/missions/missao-metalfino/resolution" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-res-sa-001",
    "userId": "usr_driver_monteiro",
    "resolution": "ACCEPTED_AND_READY",
    "gpsCoordinates": { "latitude": -23.6542, "longitude": -46.5312 }
  }' | grep -o '"message":[^,]*'

echo -e "  2️⃣ Teste de Segurança: Tentativa Ilegal de Pular de T1 direto para T3 (Local de Carga)"
curl -s -X POST "$API_URL_CORP/missions/missao-metalfino/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "currentState": "T1_INICIO_MISSAO",
    "nextState": "T3_LOCAL_COLETA_CARGA",
    "evidenceCaptured": true
  }' | grep -o '"error":[^,]*'

echo -e "  3️⃣ Ingestão de Envelope da Balança IoT Bluetooth — Pesagem de Tara Vazio (T2)"
curl -s -X POST "$API_URL_CORP/missions/missao-metalfino/evidences/ev-tara-sa-01" \
  -H "Content-Type: application/json" \
  -d '{
    "voyageId": "viagem-sa-001",
    "step": "T2_BALANCA_VAZIO",
    "weightKg": 14500,
    "evidenceUrl": "https://storage.mrvtrust.com/evidences/tara_sa.jpg",
    "gpsCoordinates": { "latitude": -23.6545, "longitude": -46.5315 },
    "dataSource": "iot_serial_ble",
    "scaleDeviceId": "HW_TOLEDO_ST400_SA",
    "rawScaleString": "ST,GS,14500,KG\\r\\n"
  }' | grep -o '"message":[^,]*'

echo -e "  4️⃣ Transição Legal Sequencial de Estados na Rocha (T1 ➔ T2)"
curl -s -X POST "$API_URL_CORP/missions/missao-metalfino/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "currentState": "T1_INICIO_MISSAO",
    "nextState": "T2_BALANCA_VAZIO",
    "evidenceCaptured": true
  }' | grep -o '"message":[^,]*'


# ---------------------------------------------------------------------
# 🏙️ CIDADE 2: MAUÁ — OPERAÇÃO PETROMAUÁ (CLASSE I PESADO)
# ---------------------------------------------------------------------
echo -e "\n📍 [MAUÁ] ➔ Processando Fluxo do Polo Petroquímico (Missão: missao-petromaua)"

echo -e "  5️⃣ Handshake Inicial T1 (Aceite de Ordem de Serviço de Borra/Solvente)"
curl -s -X POST "$API_URL_CORP/missions/missao-petromaua/resolution" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-res-maua-002",
    "userId": "usr_driver_silva",
    "resolution": "ACCEPTED_AND_READY",
    "gpsCoordinates": { "latitude": -23.6678, "longitude": -46.4614 }
  }' | grep -o '"message":[^,]*'

echo -e "  6️⃣ Ingestão de Envelope da Balança IoT — Pesagem de Tara Vazio Mauá (T2)"
curl -s -X POST "$API_URL_CORP/missions/missao-petromaua/evidences/ev-tara-maua-02" \
  -H "Content-Type: application/json" \
  -d '{
    "voyageId": "viagem-maua-001",
    "step": "T2_BALANCA_VAZIO",
    "weightKg": 18200,
    "evidenceUrl": "https://storage.mrvtrust.com/evidences/tara_maua.jpg",
    "gpsCoordinates": { "latitude": -23.6680, "longitude": -46.4616 },
    "dataSource": "iot_serial_ble",
    "scaleDeviceId": "HW_FILIZOLA_E120_MAUA",
    "rawScaleString": "ST,GS,18200,KG\\r\\n"
  }' | grep -o '"message":[^,]*'

echo -e "  7️⃣ Transição Legal Sequencial de Estados na Rocha (T1 ➔ T2)"
curl -s -X POST "$API_URL_CORP/missions/missao-petromaua/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "currentState": "T1_INICIO_MISSAO",
    "nextState": "T2_BALANCA_VAZIO",
    "evidenceCaptured": true
  }' | grep -o '"message":[^,]*'


# ---------------------------------------------------------------------
# 📊 INSPEÇÃO DOS DASHBOARDS (CAMADA ANALÍTICA)
# ---------------------------------------------------------------------
echo -e "\n======================================================================"
echo "📊 EXECUTANDO VERIFICAÇÃO DE TELEMETRIA DOS DASHBOARDS"
echo "======================================================================"

echo -e "\n🔀 8️⃣ [SANKEY TEST] Extraindo Relacionamentos de Destinação (Matriz de Nós/Links)"
curl -s -X GET "$API_URL_ANALYTICS/sankey-mass-balance"

echo -e "\n🏙️ 9️⃣ [GOVERNANCE TEST] Consultando Painel Macro das Cidades e Balanço do Pool 10k"
curl -s -X GET "$API_URL_ANALYTICS/regional-governance"

echo -e "\n======================================================================"
echo "🏁 FIM DA SUITE ANALÍTICA DE TELEMETRIA COMPLETA DO RECICLA"
echo "======================================================================"