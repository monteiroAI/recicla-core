/*******************************************************************************
 * ESTRUTURA PARA ATIVAR: recicla (Backend Core Engine)
 * CAMINHO FÍSICO: /boot/torre/recicla/src/gateway-api/server.ts
 * CONFIGURAÇÃO: Endpoints de Alimentação dos Dashboards (Sankey, Corp, City, Region)
 * STATUS: INTEGRADO E BLINDADO CONTRA ERROS DE I/O
 *******************************************************************************/

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const schemaAtivo = "simulation";
const pool = new Pool();

// Função centralizada com Search Path forçado na banda de simulação
async function executarQuery(textoQuery: string, parametros: any[]) {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schemaAtivo};`);
    return await client.query(textoQuery, parametros);
  } finally {
    client.release();
  }
}

// =============================================================================
// 🔀 ENDPOINT 1: SANKEY BALANÇO DE MASSA (CONSOLIDATION & PÁTIO)
// =============================================================================
/**
 * GET /api/analytics/sankey-mass-balance
 * Fornece a matriz de nós e elos (links) para renderizar o gráfico Sankey.
 * Mapeia o fluxo físico: Gerador ➔ Cooperativa ➔ Tipo de Material/Rejeito
 */
app.get('/api/analytics/sankey-mass-balance', async (req: Request, res: Response) => {
  try {
    const sql = `
      -- Fluxo A: Dos Clientes/Geradores para as Cooperativas
      SELECT 
        cli.nome_fantasia AS source,
        coop.nome_fantasia AS target,
        SUM(pes.peso_bruto_entrada) / 1000.0 AS value
      FROM cons_pesagens_cooperativa pes
      JOIN cons_cooperativas coop ON coop.id = pes.id_cooperativa
      JOIN corp_missoes mis ON mis.id = pes.id_missao_origem
      JOIN corp_ordens_servico os ON os.id = mis.id_ordem_servico
      JOIN corp_contratos con ON con.id = os.id_contrato
      JOIN corp_clientes cli ON cli.id = con.id_cliente
      GROUP BY cli.nome_fantasia, coop.nome_fantasia
      
      UNION ALL
      
      -- Fluxo B: Das Cooperativas de Secos para a Matéria-Secunda Triada
      SELECT 
        coop.nome_fantasia AS source,
        fardos.tipo_material AS target,
        SUM(fardos.peso_liquido_kg) / 1000.0 AS value
      FROM cons_triagem_fardos fardos
      JOIN cons_cooperativas coop ON coop.id = fardos.id_cooperativa
      GROUP BY coop.nome_fantasia, fardos.tipo_material
      
      UNION ALL
      
      -- Fluxo C: Dos Pátios de Orgânicos para o Composto Final Concluído
      SELECT 
        coop.nome_fantasia AS source,
        'Composto Orgânico Estabilizado' AS target,
        SUM(leiras.peso_composto_final_kg) / 1000.0 AS value
      FROM cons_leiras_compostagem leiras
      JOIN cons_cooperativas coop ON coop.id = leiras.id_cooperativa
      WHERE leiras.status_leira = 'CONCLUIDA'
      GROUP BY coop.nome_fantasia
      
      UNION ALL
      
      -- Fluxo D: Destinação de Rejeito não aproveitado para Aterro Sanitário
      SELECT 
        coop.nome_fantasia AS source,
        'Aterro Sanitário Licenciado (Rejeito)' AS target,
        SUM(pes.peso_rejeito_aterro) / 1000.0 AS value
      FROM cons_pesagens_cooperativa pes
      JOIN cons_cooperativas coop ON coop.id = pes.id_cooperativa
      GROUP BY coop.nome_fantasia;
    `;

    const resultado = await executarQuery(sql, []);
    
    return res.status(200).json({
      success: true,
      graph: "Sankey Diagram Payload",
      links: resultado.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao gerar matriz Sankey', details: error.message });
  }
});

// =============================================================================
// 🏢 ENDPOINT 2: DASHBOARD OPERADOR LOGÍSTICO (OPERATOR - VISÃO DE FROTA)
// =============================================================================
/**
 * GET /api/analytics/operator-fleet
 * Exibe a produtividade em tempo real dos motoristas, pesos IoT e alertas de GPS
 */
app.get('/api/analytics/operator-fleet', async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        mis.id AS missao_id,
        mis.codigo_os,
        mis.cliente_corp AS cliente,
        mis.status_operacional AS etapa_atual,
        ev.id_viagem AS viagem,
        ev.data_origin AS motorista,
        ev.scale_device_id AS equipamento_balanca,
        ev.peso_kg AS toneladas_retiradas,
        ev.created_at AS data_hora
      FROM corp_missoes mis
      LEFT JOIN corp_missoes_evidencias ev ON ev.id_missao = mis.id
      ORDER BY ev.created_at DESC;
    `;
    const resultado = await executarQuery(sql, []);
    return res.status(200).json({ success: true, dashboard: "Operator Fleet Vision", records: resultado.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro no dashboard do operador', details: error.message });
  }
});

// =============================================================================
// 🏭 ENDPOINT 3: DASHBOARD CLIENTE GERADOR (CORP GENERATOR - CONFORMIDADE ESG)
// =============================================================================
/**
 * GET /api/analytics/generator-esg/:clienteId
 * Fornece a pegada de descarte, rastreio de MTRs e o CO2 efetivo verificado na indústria
 */
app.get('/api/analytics/generator-esg/:clienteId', async (req: Request, res: Response) => {
  const cliId = req.params.clienteId;
  try {
    const sql = `
      SELECT 
        cli.nome_fantasia AS empresa,
        COUNT(os.id) AS total_ordens_despachadas,
        COALESCE(SUM(fardos.peso_liquido_kg), 0) AS total_massa_destinada_kg,
        COALESCE(SUM(fardos.potencial_co2_evitado_ton), 0) AS pegada_carbono_potencial_ton,
        -- Totalização do Carbono Real Liquidado na Indústria Transformadora
        COALESCE((
          SELECT SUM(liq.co2_efetivamente_evitado_ton)
          FROM ind_liquidacao_mtr liq
          WHERE liq.id_fardo_origem IN (SELECT id_fardo FROM cons_triagem_fardos WHERE id_cooperativa = coop.id)
        ), 0) AS co2_efetivamente_evitado_verificado_ton
      FROM corp_clientes cli
      JOIN corp_contratos con ON con.id_cliente = cli.id
      JOIN corp_ordens_servico os ON os.id_contrato = con.id
      LEFT JOIN cons_cooperativas coop ON coop.id_municipio = cli.id_municipio
      LEFT JOIN cons_triagem_fardos fardos ON fardos.id_cooperativa = coop.id
      WHERE cli.id = $1
      GROUP BY cli.nome_fantasia, coop.id;
    `;
    const resultado = await executarQuery(sql, [cliId]);
    return res.status(200).json({ success: true, dashboard: "corpGenerator ESG Vision", metrics: resultado.rows[0] || {} });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro no dashboard do gerador', details: error.message });
  }
});

// =============================================================================
// 🏙️ ENDPOINT 4: MACRO GESTÃO GOVERNAMENTAL (CITY VISION & REGIONAL POOL)
// =============================================================================
/**
 * GET /api/analytics/regional-governance
 * Alimenta a visão pública das Secretarias Municipais e do Consórcio Intermunicipal do ABC
 * Monitora o Pool de Acumulação Comercial em direção à barreira crítica de 10k toneladas
 */
app.get('/api/analytics/regional-governance', async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        pool.codigo_lote AS codigo_pool,
        pool.regiao_escopo AS consorcio_regional,
        pool.potencial_co2_acumulado_ton AS toneladas_acumuladas_pool,
        pool.status_pool,
        m.nome AS municipio,
        COALESCE(SUM(coop.postos_trabalho), 0) AS postos_trabalho_esg,
        COALESCE(SUM(coop.renda_mensal_estimada), 0) AS renda_comunitaria_reais
      FROM fin_pool_carbono pool
      CROSS JOIN geo_municipios m
      LEFT JOIN cons_cooperativas coop ON coop.id_municipio = m.id
      GROUP BY pool.id_pool, pool.codigo_lote, pool.regiao_escopo, pool.potencial_co2_acumulado_ton, pool.status_pool, m.nome;
    `;
    const resultado = await executarQuery(sql, []);
    return res.status(200).json({ success: true, dashboard: "City and Regional Governance Vision", data: resultado.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro no dashboard de governança regional', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Motores de Analytics Ativados com Sucesso na Porta [${PORT}]`);
});