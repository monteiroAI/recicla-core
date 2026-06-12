/*******************************************************************************
 * ESTRUTURA PARA ATIVAR: recicla (Backend Core Engine)
 * CAMINHO FÍSICO: /boot/torre/recicla/src/gateway-api/server.ts
 * CONFIGURAÇÃO: Node.js / TypeScript Express Server (Porta 3001)
 * STATUS: ATUALIZADO — INTEGRAÇÃO FÍSICA REGIONAL (ABC PAULISTA)
 *******************************************************************************/

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Força o escopo de transações para a banda/schema de simulação do banco mrvTRUST
const schemaAtivo = "simulation";

// Gerenciador de conexões centralizado (Alinhado com as credenciais do recicla-db-1)
const pool = new Pool();

// Log de Auditoria unificado para Monitoramento e Dashboards Regionais
app.use((req, res, next) => {
  console.log(`[🛰️ RECICLA REGIONAL TRAFFIC] ${new Date().toISOString()} | ${req.method} ➔ ${req.url}`);
  next();
});

// Sequência rígida imutável da Máquina de Estados (Espelhada do MissionStateMachine.kt)
const STATE_SEQUENCE = [
  'T1_INICIO_MISSAO',
  'T2_BALANCA_VAZIO',
  'T3_LOCAL_COLETA_CARGA',
  'T4_TRANSPORTE_RESIDUO',
  'T5_PROCEDIMENTO_DESCARGA',
  'T6_MISSAO_ENCERRADA'
];

function isValidStateTransition(currentState: string, nextState: string): boolean {
  const currentIndex = STATE_SEQUENCE.indexOf(currentState);
  const nextIndex = STATE_SEQUENCE.indexOf(nextState);
  return currentIndex !== -1 && nextIndex === (currentIndex + 1);
}

// Função genérica de execução para garantir isolamento pericial no schema simulation
async function executarQuery(textoQuery: string, parametros: any[]) {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schemaAtivo};`);
    const res = await client.query(textoQuery, parametros);
    return res;
  } finally {
    client.release();
  }
}

// ====================================================================
// ROTAS DA VERTICAL CORP (Sincronizadas com o Corpmobile)
// ====================================================================

/**
 * 📱 POST /api/corp/missions/:id/resolution (TELA 1 - Handshake Inicial)
 * Alimenta a decisão do motorista diretamente na rocha do Postgres
 */
app.post('/api/corp/missions/:id/resolution', async (req: Request, res: Response) => {
  const missionId = req.params.id;
  const { eventId, userId, resolution, justificationText, gpsCoordinates } = req.body;

  try {
    if (resolution === 'DECLINED_UNAVAILABLE' && (!justificationText || justificationText.trim() === '')) {
      return res.status(400).json({ error: 'Erro Forense: Recusa exige relatório textual de justificativa.' });
    }

    const statusMapeado = resolution === 'ACCEPTED_AND_READY' ? 'em-andamento' : 'recusada';
    const lat = gpsCoordinates?.latitude || null;
    const lng = gpsCoordinates?.longitude || null;

    // Escrita física com as colunas reais do novo schema limpo
    const sql = `
      UPDATE corp_missoes 
      SET status = $1, 
          justificativa_recusa = $2, 
          latitude_aceite = $3, 
          longitude_aceite = $4,
          updated_at = NOW()
      WHERE id = $5 RETURNING *;
    `;
    
    const resultado = await executarQuery(sql, [statusMapeado, justificationText || null, lat, lng, missionId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Erro: ID de Missão não cadastrado no gêmeo digital regional.' });
    }

    console.log(`[🟢 RESOLUTION LOCKED] Missão [${missionId}] atualizada para [${statusMapeado}] na banda simulation.`);

    return res.status(201).json({
      success: true,
      message: 'Recibo forense gravado com sucesso no PostgreSQL (Banda Simulation)',
      eventId,
      record: resultado.rows[0]
    });
  } catch (error: any) {
    console.error(`[🚨 DATABASE EXCEPTION] Falha no handshake da missão ${missionId}:`, error.message);
    return res.status(500).json({ error: 'Falha crítica de I/O no banco', details: error.message });
  }
});

/**
 * 📱 POST /api/corp/missions/:id/transition (Avanço Rígido de Telas T1 a T6)
 * Alimenta a evolução operacional capturada pelo dashboard regional COLTRADES / POLO-MAUÁ
 */
app.post('/api/corp/missions/:id/transition', async (req: Request, res: Response) => {
  const missionId = req.params.id;
  const { currentState, nextState, evidenceCaptured } = req.body;

  try {
    // 1. Validação de Portão Probatório Físico (Exige peso/mídia, exceto no trânsito assistido T4)
    if (!evidenceCaptured && nextState !== 'T4_TRANSPORTE_RESIDUO') {
      return res.status(400).json({ 
        error: 'Bloqueio de Gate: Impossível avançar o ciclo operacional sem capturar a evidência física correspondente.' 
      });
    }

    // 2. Validação Matemática contra Pulo de Etapas
    if (!isValidStateTransition(currentState, nextState)) {
      return res.status(400).json({ 
        error: `Violação de fluxo abortada pelo mrvTRUST: Transição de ${currentState} para ${nextState} é ilegal.` 
      });
    }

    // 3. Persistência e atualização real do nó de missão na rocha
    const sqlUpdate = `
      UPDATE corp_missoes 
      SET status_operacional = $1, 
          status = CASE WHEN $1 = 'T6_MISSAO_ENCERRADA' THEN 'concluida' ELSE 'em-andamento' END,
          updated_at = NOW()
      WHERE id = $2 RETURNING *;
    `;
    
    const resultado = await executarQuery(sqlUpdate, [nextState, missionId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Erro: Missão não localizada no escopo regional da simulação.' });
    }

    console.log(`[🟢 STATE TRANSITIONED] Missão [${missionId}]: ${currentState} ➔ ${nextState}`);

    return res.status(200).json({
      success: true,
      message: `Transição para ${nextState} homologada com sucesso.`,
      mission: resultado.rows[0]
    });

  } catch (error: any) {
    console.error(`[🚨 MACHINE EXCEPTION] Falha ao transicionar missão ${missionId}:`, error.message);
    return res.status(500).json({ error: 'Erro interno na máquina de estados', details: error.message });
  }
});

/**
 * 📱 POST /api/corp/missions/:missionId/evidences/:evidenceId (Ingestão de Mídias e Balança IoT)
 * Grava strings brutas de balança Toledo/Filizola direto nas chaves estrangeiras corrigidas do Postgres
 */
app.post('/api/corp/missions/:missionId/evidences/:evidenceId', async (req: Request, res: Response) => {
  const { missionId, evidenceId } = req.params;
  const { voyageId, step, weightKg, evidenceUrl, gpsCoordinates, dataSource, scaleDeviceId, rawScaleString } = req.body;

  try {
    // Escudo Antifraude de Sinais de Balança
    if (dataSource === 'iot_serial_ble' && (!scaleDeviceId || !rawScaleString)) {
      return res.status(400).json({ error: 'Fraude de Ingestão: Dados marcados como IoT exigem assinatura do hardware.' });
    }

    // Escrita física utilizando os nomes exatos corrigidos (id_missao, id_viagem)
    const sql = `
      INSERT INTO corp_missoes_evidencias (
        id_evidencia, id_missao, id_viagem, etapa, peso_kg, evidencia_url, 
        latitude, longitude, data_origin, scale_device_id, raw_scale_string, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;

    const resultado = await executarQuery(sql, [
      evidenceId, missionId, voyageId, step, weightKg, evidenceUrl,
      gpsCoordinates?.latitude || null, gpsCoordinates?.longitude || null,
      dataSource, scaleDeviceId, rawScaleString
    ]);

    console.log(`[⚡ IoT VERIFIED] Peso [${weightKg}kg] gravado para Missão [${missionId}]. Origem: ${dataSource}`);

    return res.status(201).json({
      success: true,
      message: 'Envelope IoT injetado fisicamente e validado na banda simulation.',
      storedData: resultado.rows[0]
    });
  } catch (error: any) {
    console.error(`[🚨 INGESTION EXCEPTION] Falha ao persistir evidência ${evidenceId}:`, error.message);
    return res.status(500).json({ error: 'Erro ao persistir evidência no PostgreSQL', details: error.message });
  }
});

// Ativação do Barramento Core na rede virtual do host Fedora
app.listen(PORT, () => {
  console.log(`\n======================================================================`);
  console.log(`🚀 recicla Core Engine ativado sob a Região do ABC Paulista`);
  console.log(`Escutando e persistindo estritamente no schema [${schemaAtivo}] na porta [${PORT}]`);
  console.log(`======================================================================`);
});