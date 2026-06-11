import { Router, Request, Response } from 'express';

const consolidationRouter = Router();

export const setupConsolidationModule = (executarQuery: Function) => {

  /**
   * POST /api/consolidation/gate-checkin - Handshake de entrada Bruta
   */
  consolidationRouter.post('/gate-checkin', async (req: Request, res: Response) => {
    const { ente_hub_id, vertical_origem, viagem_id, gross_weight_kg, tare_weight_kg } = req.body;
    try {
      const query = `
        INSERT INTO hub_ingressos_brutos (ente_hub_id, vertical_origem, viagem_id, gross_weight_kg, tare_weight_kg)
        VALUES ($1, $2, $3, $4, $5) RETURNING *;
      `;
      const result = await executarQuery(query, [ente_hub_id, vertical_origem, viagem_id || null, gross_weight_kg, tare_weight_kg]);
      return res.status(201).json({ success: true, message: '[RECICLA HUB] Ingresso bruto registrado no Gate.', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro no checkin de balança do Hub', details: error.message });
    }
  });

  /**
   * POST /api/consolidation/esteira-triagem - Lançamento de classificação Gravimétrica
   */
  consolidationRouter.post('/esteira-triagem', async (req: Request, res: Response) => {
    const { ente_hub_id, material_id, weight_processed_kg, is_rejeito } = req.body;
    try {
      const query = `
        INSERT INTO hub_processamento_esteira (ente_hub_id, material_id, weight_processed_kg, is_rejeito)
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const result = await executarQuery(query, [ente_hub_id, material_id, weight_processed_kg, is_rejeito || false]);
      return res.status(201).json({ success: true, message: '[RECICLA HUB] Classificação de esteira cimentada.', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro no lançamento de esteira', details: error.message });
    }
  });

  /**
   * GET /api/consolidation/:id/mass-balance - Equação de Balanço por Exclusão
   */
  consolidationRouter.get('/:id/mass-balance', async (req: Request, res: Response) => {
    const hubId = req.params.id;
    try {
      const resOrigens = await executarQuery(`
        SELECT vertical_origem, SUM(net_weight_kg) as total_net_mass
        FROM hub_ingressos_brutos WHERE ente_hub_id = $1 GROUP BY vertical_origem;
      `, [hubId]);

      const resProdutos = await executarQuery(`
        SELECT 
          SUM(CASE WHEN is_rejeito = FALSE THEN weight_processed_kg ELSE 0 END) as total_materia_secunda,
          SUM(CASE WHEN is_rejeito = TRUE THEN weight_processed_kg ELSE 0 END) as total_rejeito
        FROM hub_processamento_esteira WHERE ente_hub_id = $1;
      `, [hubId]);

      const resM2a = await executarQuery(`
        SELECT COALESCE(SUM(weight_clean_kg), 0) as total_m2a_clean_mass
        FROM hub_ingestao_m2a WHERE ente_hub_id = $1;
      `, [hubId]);

      const totalMateriaSecunda = parseFloat(resProdutos.rows[0].total_materia_secunda || '0') + parseFloat(resM2a.rows[0].total_m2a_clean_mass || '0');
      const totalRejeito = parseFloat(resProdutos.rows[0].total_rejeito || '0');
      const totalProcessado = totalMateriaSecunda + totalRejeito;
      const percentualRejeito = totalProcessado > 0 ? (totalRejeito / totalProcessado) * 100 : 0;

      return res.json({
        hub_id: hubId,
        context: "mass_balance_audit",
        origin_metrics: resOrigens.rows,
        inventory_balance: {
          materia_secunda_pure_kg: totalMateriaSecunda,
          rejeito_kg: totalRejeito,
          total_processed_kg: totalProcessado,
          rejeito_ratio_percent: parseFloat(percentualRejeito.toFixed(2))
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao processar balanço de massas.', details: error.message });
    }
  });

  return consolidationRouter;
};