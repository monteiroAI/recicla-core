import { Router, Request, Response } from 'express';

const corpRouter = Router();

export const setupCorpRoutes = (executarQuery: Function) => {
  
  /**
   * POST /api/corp/os - Registrar Ordem de Serviço
   */
  corpRouter.post('/os', async (req: Request, res: Response) => {
    const { codigo_os, cliente_id, numero_pedido, scheduled_date, residue_class, destinador_id } = req.body;
    try {
      const query = `
        INSERT INTO corp_ordens_servico (codigo_os, cliente_id, numero_pedido, scheduled_date, residue_class, destinador_id)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
      `;
      const result = await executarQuery(query, [codigo_os, cliente_id, numero_pedido, scheduled_date, residue_class, destinador_id]);
      return res.status(201).json({ success: true, os: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao registrar O.S. na vertical CORP', details: error.message });
    }
  });

  /**
   * POST /api/corp/missoes/despachar - Orquestrar Missão e Despacho 1:N
   */
  corpRouter.post('/missoes/despachar', async (req: Request, res: Response) => {
    const { os_id, coordenador_id, motorista_id, equipamento_placa } = req.body;
    try {
      const resMissao = await executarQuery(
        `INSERT INTO corp_missoes (os_id, coordenador_id, status) VALUES ($1, $2, 'em-analise') RETURNING id;`,
        [os_id, coordenador_id]
      );
      const missaoId = resMissao.rows[0].id;

      const resViagem = await executarQuery(
        `INSERT INTO corp_missoes_viagens (missao_id, motorista_id, equipamento_placa, sequencia_viagem) VALUES ($1, $2, $3, 1) RETURNING *;`,
        [missaoId, motorista_id, equipamento_placa]
      );

      return res.status(201).json({ success: true, missao_id: missaoId, viagem: resViagem.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro no despacho logístico na vertical CORP', details: error.message });
    }
  });

  /**
   * POST /api/corp/viagens/:id/evidencias - Ingestão IoT e Telemetria de Balança
   */
  corpRouter.post('/viagens/:id/evidencias', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { etapa, peso_kg, evidencia_url, latitude, longitude, data_origin, scale_device_id, raw_scale_string } = req.body;
    try {
      const query = `
        INSERT INTO corp_missoes_evidencias (
          viagem_id, etapa, peso_kg, evidencia_url, latitude, longitude, data_origin, scale_device_id, raw_scale_string
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
      `;
      const result = await executarQuery(query, [
        id, etapa, peso_kg, evidencia_url, latitude, longitude, data_origin || 'manual', scale_device_id, raw_scale_string
      ]);

      if (data_origin === 'iot_serial_ble') {
        console.log(`[⚡ IoT TELEMETRIA - CORP] Carga capturada via hardware na Viagem ID [${id}]: ${peso_kg}kg.`);
      }
      return res.status(201).json({ success: true, evidence: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao salvar evidência na vertical CORP', details: error.message });
    }
  });

  return corpRouter;
};