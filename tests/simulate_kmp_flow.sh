#!/bin/bash
# ===============================================================================
# ESTRUTURA PARA ATIVAR: recicla (Ambiente de Testes / Terminal Host)
# CAMINHO FÍSICO: /boot/torre/recicla/tests/simulate_kmp_flow.sh
# CONFIGURAÇÃO: Shell Script executável nativo do Bash
# STATUS: CORRIGIDO E APONTANDO PARA RECICLA
# ===============================================================================

API_URL="http://localhost:3001/api/corp"
MISSION_ID="uuid-missao-2026-b2b"

echo "======================================================================"
echo "🚀 INICIANDO EMULAÇÃO FORENSE DE FLUXO KMP VIA TERMINAL"
echo "======================================================================"

echo -e "\n1️⃣ Simulando TELA 1: Envio de MissionResolutionEnvelope (Aceite da OS)"
curl -X POST "$API_URL/missions/$MISSION_ID/resolution" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_998877_test",
    "missionId": "'"$MISSION_ID"'",
    "userId": "usr_driver_monteiro",
    "resolution": "ACCEPTED_AND_READY",
    "timestampUtc": "2026-06-11T16:20:00Z",
    "gpsCoordinates": { "latitude": -23.55052, "longitude": -46.633308 }
  }'

echo -e "\n\n2️⃣ Simulando Validação de Hard Lock: Tentativa Ilegal de Pular de T1 para T3"
curl -X POST "$API_URL/missions/$MISSION_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "currentState": "T1_INICIO_MISSAO",
    "nextState": "T3_LOCAL_COLETA_CARGA",
    "evidenceCaptured": true
  }'

echo -e "\n\n3️⃣ Simulando Avanço Legal Sequencial: Transição Homologada de T1 para T2"
curl -X POST "$API_URL/missions/$MISSION_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "currentState": "T1_INICIO_MISSAO",
    "nextState": "T2_BALANCA_VAZIO",
    "evidenceCaptured": true
  }'

echo -e "\n\n======================================================================"
echo "🏁 FIM DA SIMULAÇÃO DE GATES PROBÁTORIOS"
echo "======================================================================"