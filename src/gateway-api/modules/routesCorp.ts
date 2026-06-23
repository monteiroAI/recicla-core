// ## nome/caminho do arquivo: src/gateway-api/modules/routesCorp.ts
// ## objetivo do arquivo: Roteador especializado para a vertical CORP (Cadeia Industrial).
// ## versão / data: v5.3.0 | 23 de Junho de 2026

import { Router, Request, Response } from 'express';
import { db } from '../database';

export const routerCorp = Router();

routerCorp.post('/consolidador/despachar-lote-industrial', async (req: Request, res: Response) => {
  const { id_lote, material_triado, peso_fardo, id_beneficiador, motorista_transf_id, chave_nfe, id_mtr, exif_mtr_saida } = req.body;

  try {
    const diretrizRes = await db.query("SELECT f_potencial FROM (SELECT f_potencial FROM (SELECT fator_evitacao_potencial_tco2e AS f_potencial FROM diretrizes_materia_seconda WHERE material_chave = $1 AND valido_ate IS NULL) AS sub) AS sub2", [material_triado]);

    if (diretrizRes.rows.length === 0) {
      return res.status(400).json({ error: `Material '${material_triado}' não possui diretriz científica homologada no banco.` });
    }

    const factualFator = Number(diretrizRes.rows[0].f_potencial);
    const co2PotencialKg = (peso_fardo / 1000) * factualFator * 1000;

    const queryInsert = "INSERT INTO lotes_transferencia_ultima_milha (id_lote, material, massa_física_kg, co2_evitado_potencial_kg, id_beneficiador_destino, motorista_transferencia_id, status_logistico, chave_nfe_sefaz, id_mtr_mma, exif_mtr_saida_consolidador) VALUES ($1, $2, $3, $4, $5, $6, 'EM_TRANSITO', $7, $8, $9)";
    await db.query(queryInsert, [id_lote, material_triado, peso_fardo, co2PotencialKg, id_beneficiador, motorista_transf_id, chave_nfe, id_mtr, JSON.stringify(exif_mtr_saida)]);

    res.json({ status: "LOTE_EM_TRANSITO_TRANSFERENCIA", id_lote, co2_potencial_kg_calculado: co2PotencialKg });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao despachar lote de transferência", details: error.message });
  }
});

routerCorp.post('/beneficiador/liquidar-mtr', async (req: Request, res: Response) => {
  const { id_lote, status_mtr_mma, exif_shakehand_chegada } = req.body;

  if (status_mtr_mma !== "BAIXADO_TERMINAL") {
    return res.status(400).json({ error: "O Handshake e o MINT requerem a extinção fiscal dada pelo Beneficiador." });
  }

  try {
    const updateLote = "UPDATE lotes_transferencia_ultima_milha SET status_logistico = 'EXTINTO_LIQUIDADO', exif_shakehand_chegada_beneficiador = $1, liquidado_em = CURRENT_TIMESTAMP WHERE id_lote = $2 AND status_logistico = 'EM_TRANSITO' RETURNING co2_evitado_potencial_kg, material";
    const resLote = await db.query(updateLote, [JSON.stringify(exif_shakehand_chegada), id_lote]);

    if (resLote.rows.length === 0) {
      return res.status(400).json({ error: "Lote não localizado ou já extinto." });
    }

    const { co2_evitado_potencial_kg, material } = resLote.rows[0];

    res.json({ status: "MASSA_EXTINTA_TOKENIZADA", id_lote, material_processado: material, co2_equivalente_realizado_kg: co2_evitado_potencial_kg });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao liquidar contrato de custódia", details: error.message });
  }
});