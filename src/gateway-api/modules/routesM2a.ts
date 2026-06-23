// ## nome/caminho do arquivo: src/gateway-api/modules/routesM2a.ts
// ## objetivo do arquivo: Roteador especializado para a vertical M2A (Matéria-Secunda).
// ## versão / data: v5.3.0 | 23 de Junho de 2026

import { Router, Request, Response } from 'express';
import { db } from '../database';

export const routerM2a = Router();

// HANDSHAKE 1: REGISTRO DE COLETA INDICADA VINDA DO CELL DO KEEPER
routerM2a.post('/handshake/domiciliar', async (req: Request, res: Response) => {
  const { id_handshake, id_gerador, id_catador, peso_total, detalhe_materiais, exif_handshake } = req.body;

  try {
    const query = "INSERT INTO handshakes_domiciliares (id_handshake, id_gerador, id_catador, peso_total_kg, detalhe_materiais, exif_handshake, status_confirmacao) VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMADA')";
    await db.query(query, [id_handshake, id_gerador, id_catador, peso_total, JSON.stringify(detalhe_materiais), JSON.stringify(exif_handshake)]);
    res.json({ status: "HANDSHAKE_DOMICILIAR_CONFIRMADO", id_handshake });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao registrar handshake domiciliar", details: error.message });
  }
});

// HANDSHAKE 2: BALANÇA INDUSTRIAL DA COOPERATIVA (GALVANIZAÇÃO DOS FATOS)
routerM2a.post('/handshake/consolidador', async (req: Request, res: Response) => {
  const { id_recepcao, id_catador, id_consolidador, peso_total_vendido, peso_difusa, peso_indicada, detalhe_fracoes, valor_pago, exif_recepcao } = req.body;

  try {
    const query = "INSERT INTO recepcao_catadores_consolidador (id_recepcao, id_catador, id_consolidador, peso_total_vendido_kg, peso_coleta_difusa_kg, peso_coleta_indicada_kg, detalhe_fracoes_pesadas, valor_pago_real, exif_recepcao, status_custodia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'EM_ESTOQUE')";
    await db.query(query, [id_recepcao, id_catador, id_consolidador, peso_total_vendido, peso_difusa, peso_indicada, JSON.stringify(detalhe_fracoes), valor_pago, JSON.stringify(exif_recepcao)]);
    res.json({ status: "CARGA_CONSOLIDADA_KEEPER", id_recepcao, msg: "Fatos galvanizados em balança industrial." });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao registrar recepção na cooperativa", details: error.message });
  }
});