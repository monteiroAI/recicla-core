/*******************************************************************************
 * ESTRUTURA PARA ATIVAR: recicla (Backend Core Engine)
 * CAMINHO FÍSICO: /boot/torre/recicla/src/gateway-api/server.ts
 * CONFIGURAÇÃO: Nível 4 - Camada de Persistência Física (Banda Simulation)
 * STATUS: PRONTO PARA INTERCONEXÃO REAL
 *******************************************************************************/

import express, { Request, Response } from 'express';
import { Pool } from 'pg'; // Assegure que o Pool de conexão do Postgres está ativo

const app = express();
app.use(express.json());

// Força o escopo de transações para a banda/schema de simulação do banco mrvTRUST
const schemaAtivo = "simulation";

// Função genérica de execução na rocha que você já possui ou está mapeada no core
async function executarQuery(textoQuery: string, parametros: any[]) {
  // Configura o search_path dinamicamente para garantir que estamos na banda de simulação
  const pool = new Pool(); // Conexão com as credenciais do seu recicla-db-1
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
// ENDPOINTS RECONFIGURADOS PARA ALIMENTAR A ROCHA DO BANCO
// ====================================================================

/**
 * 📱 POST /api/corp/missions/:id/resolution (TELA 1 - Handshake)
 */
app.post('/api/corp/missions/:id/resolution', async (req: Request, res: Response) => {
  const missionId = req.params.id;
  const { eventId, userId, resolution, justificationText, gpsCoordinates } = req.body;

  try {
    if (resolution === 'DECLINED_UNAVAILABLE' && (!justificationText || justificationText.trim() === '')) {
      return res.status(400).json({ error: 'Erro Forense: Recusa exige justificativa por escrito.' });
    }

    const statusMapeado = resolution === 'ACCEPTED_AND_READY' ? 'em-andamento' : 'recusada';
    const lat = gpsCoordinates?.latitude || null;
    const lng = gpsCoordinates?.longitude || null;

    // Persistência física na banda simulation
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
      return res.status(404).json({ error: 'Erro: ID de Missão não cadastrado na banda simulation.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Recibo forense gravado com sucesso no PostgreSQL (Banda Simulation)',
      eventId,
      record: resultado.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Falha crítica de I/O no banco', details: error.message });
  }
});

/**
 * 📱 POST /api/corp/missions/:missionId/evidences/:evidenceId (Ingestão IoT)
 */
app.post('/api/corp/missions/:missionId/evidences/:evidenceId', async (req: Request, res: Response) => {
  const { missionId, evidenceId } = req.params;
  const { voyageId, step, weightKg, evidenceUrl, gpsCoordinates, dataSource, scaleDeviceId, rawScaleString } = req.body;

  try {
    if (dataSource === 'iot_serial_ble' && (!scaleDeviceId || !rawScaleString)) {
      return res.status(400).json({ error: 'Fraude abortada: Dados IoT sem assinatura física.' });
    }

    // Escrita física das evidências e strings de hardware na rocha do banco
    const sql = `
      INSERT INTO corp_missoes_evidencias (
        id_evidencia, missao_id, viagem_id, etapa, peso_kg, evidencia_url, 
        latitude, longitude, data_origin, scale_device_id, raw_scale_string, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;

    const resultado = await executarQuery(sql, [
      evidenceId, missionId, voyageId, step, weightKg, evidenceUrl,
      gpsCoordinates?.latitude || null, gpsCoordinates?.longitude || null,
      dataSource, scaleDeviceId, rawScaleString
    ]);

    return res.status(201).json({
      success: true,
      message: 'Envelope IoT injetado fisicamente e validado na banda simulation.',
      storedData: resultado.rows[0]
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao persistir evidência no PostgreSQL', details: error.message });
  }
});