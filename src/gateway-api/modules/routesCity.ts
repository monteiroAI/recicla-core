// ## nome/caminho do arquivo: src/gateway-api/modules/routesCity.ts
// ## objetivo do arquivo: Rotas de balança pública, guarita e Zero Metrológico (CITY).
// ## versão / data: v5.3.0 | 23 de Junho de 2026

import { Router, Request, Response } from 'express';
import { db } from '../database';

export const routerCity = Router();

// DISPACHO: MARCHA FORENSE (GUARITA DE SAÍDA)
routerCity.post('/mission/dispatch', async (req: Request, res: Response) => {
  const { 
    id_missao, ordem_servico, vertical_origem, municipio_id, rota_id, 
    equipamento_id, motorista_id, odometro_inicial_km, peso_tara_medido, 
    delta_combustivel, checklist_marcha, exif_marcha 
  } = req.body;

  if (!checklist_marcha?.checklist_tanque_cheio || !checklist_marcha?.checklist_chorume_vazio || !checklist_marcha?.checklist_cabine_vazia) {
    return res.status(400).json({ status: "RETIDO_AUDITORIA", message: "mrvTRUST Bloqueou: Travas físicas de guarita violadas!" });
  }

  try {
    const query = "INSERT INTO missoes_envelopes (id_missao, ordem_servico, vertical_origem, municipio_id, rota_id, equipamento_id, motorista_id, status_blockchain, km_inicial, peso_tara_base_kg, delta_combustivel_kg, exif_marcha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
    const valores = [id_missao, ordem_servico, vertical_origem, municipio_id, rota_id, equipamento_id, motorista_id, 'EM_ROTA', odometro_inicial_km, peso_tara_medido, delta_combustivel || 0, JSON.stringify(exif_marcha)];
    await db.query(query, valores);
    res.json({ status: "ENVELOPE_EM_ROTA", id_missao });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao registrar marcha no PostgreSQL", details: error.message });
  }
});

// REFEÇÃO TERMINAL: BALANÇA INDUSTRIAL E EXTRAÇÃO DA ZELADORIA (OBP CÓRREGOS)
routerCity.post('/mission/:id_missao/close-weigh-expandido', async (req: Request, res: Response) => {
  const { id_missao } = req.params;
  const { peso_bruto_chegada, volume_chorume_drenado, odometro_final_km, exif_pesagem_final, massa_m2a_recuperada_kg, detalhe_fracoes_recuperadas } = req.body;

  try {
    const missaoRes = await db.query('SELECT * FROM missoes_envelopes WHERE id_missao = $1', [id_missao]);
    if (missaoRes.rows.length === 0) return res.status(404).json({ error: "Missão não localizada." });
    
    const missao = missaoRes.rows[0];
    const tempoMinutos = (Date.now() - new Date(missao.criado_em).getTime()) / 60000;
    const deltaKm = odometro_final_km - missao.km_inicial;
    const velocidadeMedia = deltaKm / (tempoMinutos / 60);

    if (deltaKm > 0 && velocidadeMedia > 110) {
      await db.query("UPDATE missoes_envelopes SET status_blockchain = 'RETIDO_AUDITORIA' WHERE id_missao = $1", [id_missao]);
      return res.status(400).json({ status: "RETIDO_AUDITORIA", error: "mrvTRUST: Velocidade de trajeto incompatível com a física urbana." });
    }

    // Zero Metrológico
    const srcTara = Number(missao.peso_tara_base_kg);
    const srcDeltaComb = Number(missao.delta_combustivel_kg);
    const taraDinamica = srcTara + srcDeltaComb + Number(volume_chorume_drenado || 0);
    const massaLiquidaTotal = peso_bruto_chegada - taraDinamica;
    const massaRejeitoDestinado = massaLiquidaTotal - (massa_m2a_recuperada_kg || 0);

    let statusFinal = "CONCLUIDO_LASTREADO";
    if (missao.vertical_origem === "CITY_ZELADORIA" && (massa_m2a_recuperada_kg || 0) > 0) {
      statusFinal = "ZELADORIA_M2A_RECUPERADA";
    }

    const updateQuery = "UPDATE missoes_envelopes SET peso_bruto_chegada_kg = $1, volume_chorume_drenado_kg = $2, km_final = $3, massa_liquida_real_kg = $4, status_blockchain = $5, exif_pesagem_final = $6, massa_m2a_recuperada_kg = $7, detalhe_fracoes_recuperadas = $8, massa_rejeito_extinto_kg = $9, atualizado_em = CURRENT_TIMESTAMP WHERE id_missao = $10";
    
    await db.query(updateQuery, [peso_bruto_chegada, volume_chorume_drenado || 0, odometro_final_km, massaLiquidaTotal, statusFinal, JSON.stringify(exif_pesagem_final), massa_m2a_recuperada_kg || 0, JSON.stringify(detalhe_fracoes_recuperadas || {}), massaRejeitoDestinado, id_missao]);

    res.json({ status: "SUCESSO_LASTREADO", id_missao, massa_total_capturada_kg: massaLiquidaTotal, materia_secunda_salva_kg: massa_m2a_recuperada_kg || 0 });
  } catch (error: any) {
    res.status(500).json({ error: "Erro no encerramento terminal de balança", details: error.message });
  }
});

// LEITURA REGIONAL PARA AGREGAR NO DASHBOARD DO CONSÓRCIO / COMITÊ DE BACIA
routerCity.get('/missions', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM missoes_envelopes ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});