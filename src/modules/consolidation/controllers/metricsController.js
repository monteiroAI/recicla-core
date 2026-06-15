"use strict";
/*******************************************************************************
 * MÓDULO ENCAPSULADO: CONSOLIDATION
 * CAMINHO FÍSICO: /boot/torre/recicla/src/modules/consolidation/controllers/metricsController.ts
 * RESPONSABILIDADE: Oráculo de Massa Agnóstico (Lê Ingestão CORP e Saídas Reais)
 * STATUS: CORE REALOCADO E MODULARIZADO
 *******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSankeyMetrics = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool(); // Conexão direta com o banco relacional
const schemaAtivo = "simulation";
const getSankeyMetrics = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${schemaAtivo};`);
        // Ingestão CORP (Grandes Geradores B2B)
        const queryEntradasCorp = `
      SELECT 
        'Grandes Geradores' AS source,
        'Operação de TRIAGEM (Esteira)' AS target,
        COALESCE(SUM(ev.peso_kg) / 1000.0, 0) AS value
      FROM corp_missoes mis
      JOIN corp_missoes_evidencias ev ON ev.id_missao = mis.id
      WHERE ev.step = 'T3_LOCAL_COLETA_CARGA'
      GROUP BY source;
    `;
        // Saídas Reais da Pesagem de Fardos
        const querySaidasReais = `
      SELECT 
        'Operação de TRIAGEM (Esteira)' AS source,
        CASE 
          WHEN fardos.tipo_material = 'METAL' THEN 'Metal (Cobre/Alumínio)'
          WHEN fardos.tipo_material = 'PLASTICO' THEN 'Plásticos (PET/PP)'
          WHEN fardos.tipo_material = 'PAPELAO' THEN 'Papel / Papelão'
          WHEN fardos.tipo_material = 'VIDRO' THEN 'Vidro'
          ELSE 'Aterro Sanitário Licenciado (Rejeito)'
        END AS target,
        COALESCE(SUM(fardos.peso_liquido_kg) / 1000.0, 0) AS value
      FROM cons_triagem_fardos fardos
      GROUP BY fardos.tipo_material;
    `;
        const resEntradas = await client.query(queryEntradasCorp);
        const resSaidas = await client.query(querySaidasReais);
        const fluxosSankey = [];
        let totalMetais = 0;
        let totalPlasticos = 0;
        let totalMassa = 0;
        resEntradas.rows.forEach(row => {
            if (parseFloat(row.value) > 0) {
                fluxosSankey.push([row.source, row.target, parseFloat(row.value)]);
                totalMassa += parseFloat(row.value);
            }
        });
        resSaidas.rows.forEach(row => {
            if (parseFloat(row.value) > 0) {
                fluxosSankey.push([row.source, row.target, parseFloat(row.value)]);
                if (row.target.includes('Metal'))
                    totalMetais += parseFloat(row.value);
                if (row.target.includes('Plásticos'))
                    totalPlasticos += parseFloat(row.value);
            }
        });
        const totalTriado = totalMetais + totalPlasticos;
        const taxaRejeitoReal = totalMassa > 0 ? ((totalMassa - totalTriado) / totalMassa) * 100 : 0;
        return res.status(200).json({
            success: true,
            fluxos: fluxosSankey,
            resumo: {
                metais: totalMetais,
                plasticos: totalPlasticos,
                catadores: 0.00,
                rejeito: taxaRejeitoReal,
                total: totalMassa
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
    finally {
        client.release();
    }
};
exports.getSankeyMetrics = getSankeyMetrics;
