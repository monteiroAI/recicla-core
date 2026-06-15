"use strict";
/*******************************************************************************
 * ECOSSISTEMA DE RASTREABILIDADE LOGÍSTICA RECICLA (BACKEND CORE ENGINE)
 * CAMINHO FÍSICO: /boot/torre/recicla/src/gateway-api/server.ts
 * CONFIGURAÇÃO: Regra Dinâmica do Sankey Horizontal e Janela 26 a 25
 * REQUISITO EXTRA: Acoplamento Cross-Cutting do Roteador de Schema (Camada Shared)
 *******************************************************************************/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
// Importação do barramento global de infraestrutura compartilhada (Shared Infra)
const system_routes_1 = __importDefault(require("../shared/infra/http/routes/system.routes"));
const routes_1 = require("../modules/corp/routes");
const routes_2 = require("../modules/mobile/routes");
const app = (0, express_1.default)();
const pool = new pg_1.Pool();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
/*******************************************************************************
 * 🗺️ BARRAMENTO GLOBAL DE INFRAESTRUTURA (CROSS-CUTTING SHARED)
 * Disponibiliza /api/v1/system/config/status para o indicador visual do HTML
 *******************************************************************************/
app.use('/api/v1', system_routes_1.default);
app.use('/api/v1/corp', (0, routes_1.setupCorpRoutes)(executarQuery));
app.use('/api/v1/mobile', (0, routes_2.setupMobileRoutes)());
app.post('/api/v1/mrvcorp/missions/:missionId/resolution', (req, res) => {
    const { missionId } = req.params;
    console.log(`[Recicla API] Resolution recebido para missionId=${missionId}`, req.body);
    return res.status(201).json({ success: true, missionId, message: 'Resolution endpoint recebido pelo backend Recicla.' });
});
/*******************************************************************************
 * 📊 SEÇÃO DE ANALYTICS AVANÇADO — COOP. ANDRÉ
 *******************************************************************************/
/**
 * Helper para calcular as datas limites do mês de competência (Dia 26 a 25)
 * Se o usuário pedir Ano=2026 e Mês=06 (Junho/2026), a janela será: 26/05/2026 até 25/06/2026
 */
function obterJanelaCompetencia(ano, mes) {
    const dataInicio = new Date(ano, mes - 2, 26, 0, 0, 0);
    const dataFim = new Date(ano, mes - 1, 25, 23, 59, 59);
    return {
        inicio: dataInicio.toISOString().split('T')[0] + ' 00:00:00',
        fim: dataFim.toISOString().split('T')[0] + ' 23:59:59'
    };
}
/**
 * Helper para isolar a execução de queries garantindo a busca no schema simulation
 */
async function executarQuery(sql, params) {
    const client = await pool.connect();
    try {
        await client.query("SET search_path TO simulation;");
        return await client.query(sql, params);
    }
    finally {
        client.release();
    }
}
async function tableExists(tableName) {
    const existenceQuery = `
        SELECT EXISTS(
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'simulation'
              AND table_name = $1
        ) AS exists
    `;
    const result = await executarQuery(existenceQuery, [tableName]);
    return result.rows[0]?.exists === true;
}
/**
 * 🔀 GET /api/analytics/sankey-mass-balance
 * Fornece os nós horizontais obedecendo a regra de bypass e a janela temporal
 */
app.get('/api/analytics/sankey-mass-balance', async (req, res) => {
    const ano = parseInt(req.query.ano) || 2026;
    const mes = parseInt(req.query.mes) || 6; // Junho como padrão de teste
    const { inicio, fim } = obterJanelaCompetencia(ano, mes);
    try {
        const hasCompostTable = await tableExists('cons_leiras_compostagem');
        const queryParts = [
            `
      -- FLUXO 1: Canais de Secos para a TRIAGEM (Exclui Catadores)
      SELECT 
        CASE 
          WHEN pes.origem_material = 'domiciliar_seletiva' THEN 'Coleta Pública Domiciliar'
          WHEN pes.origem_material = 'grande_gerador' THEN 'Grandes Geradores'
          ELSE 'Zeladoria Municipal'
        END AS source,
        'Operação de TRIAGEM (Esteira)' AS target,
        SUM(COALESCE(pes.peso_liquido, pes.peso_entrada - pes.peso_saida)) / 1000.0 AS value
      FROM cons_pesagens_cooperativa pes
      WHERE pes.origem_material <> 'catador_autonomo'
        AND pes.created_at BETWEEN $1 AND $2
      GROUP BY source
            `,
            `
      -- FLUXO 2: BYPASS REAL - Catadores pulam a Triagem e vão direto para o Output de Tipo
      SELECT 
        'Catadores e Catadoras' AS source,
        fardos.tipo_material AS target,
        SUM(fardos.peso_liquido_kg) / 1000.0 AS value
      FROM cons_triagem_fardos fardos
      JOIN cons_pesagens_cooperativa pes ON pes.id_cooperativa = fardos.id_cooperativa
      WHERE pes.origem_material = 'catador_autonomo'
        AND fardos.created_at BETWEEN $1 AND $2
      GROUP BY fardos.tipo_material
            `,
            `
      -- FLUXO 3: Da TRIAGEM para os Outputs Finais de Materiais e Rejeitos
      SELECT 
        'Operação de TRIAGEM (Esteira)' AS source,
        fardos.tipo_material AS target,
        SUM(fardos.peso_liquido_kg) / 1000.0 AS value
      FROM cons_triagem_fardos fardos
      JOIN cons_pesagens_cooperativa pes ON pes.id_cooperativa = fardos.id_cooperativa
      WHERE pes.origem_material <> 'catador_autonomo'
        AND fardos.created_at BETWEEN $1 AND $2
      GROUP BY fardos.tipo_material
            `
        ];
        if (hasCompostTable) {
            queryParts.push(`
      -- FLUXO 4: Canais de Orgânicos para o processo de COMPOSTAGEM
      SELECT 
        CASE 
          WHEN leiras.codigo_leira LIKE '%PROP%' THEN 'Coleta Própria'
          WHEN leiras.codigo_leira LIKE '%ZEL%' THEN 'Zeladoria Municipal (Orgânica)'
          ELSE 'Coleta Pública Domiciliar (Orgânica)'
        END AS source,
        'Processo de Compostagem (Pátio)' AS target,
        SUM(leiras.peso_organicos_acumulado_kg) / 1000.0 AS value
      FROM cons_leiras_compostagem leiras
      WHERE leiras.created_at BETWEEN $1 AND $2
      GROUP BY source
            `);
            queryParts.push(`
      -- FLUXO 5: Da COMPOSTAGEM para o Output Final de Composto Orgânico
      SELECT 
        'Processo de Compostagem (Pátio)' AS source,
        'Composto Orgânico Estabilizado' AS target,
        SUM(leiras.peso_composto_final_kg) / 1000.0 AS value
      FROM cons_leiras_compostagem leiras
      WHERE leiras.status_leira = 'CONCLUIDA'
        AND leiras.updated_at BETWEEN $1 AND $2
      GROUP BY source
            `);
        }
        const sql = queryParts.join('\nUNION ALL\n');
        const resultado = await executarQuery(sql, [inicio, fim]);
        const rows = resultado.rows || [];
        const fluxos = rows.map(r => [r.source || r[0], r.target || r[1], parseFloat(r.value || r[2] || 0)]);
        const total = fluxos.reduce((s, r) => s + (parseFloat(r[2]) || 0), 0);
        const mv = fluxos.reduce((s, r) => s + ((r[0] === 'Grandes Geradores') ? (parseFloat(r[2]) || 0) : 0), 0);
        const me = fluxos.reduce((s, r) => s + ((r[0] === 'Catadores e Catadoras') ? (parseFloat(r[2]) || 0) : 0), 0);
        const ems = total - mv;
        const kpis_fluxo = {
          mv_massa: Number(mv.toFixed(2)),
          mv_co2: Number((mv * 0.25).toFixed(2)),
          ems_massa: Number(ems.toFixed(2)),
          ems_co2: Number((ems * 0.25).toFixed(2))
        };

        return res.status(200).json({ success: true, periodo: { inicio, fim }, fluxos, kpis_fluxo });
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao consolidar regras horizontais do Sankey', details: error.message });
    }
});
/*******************************************************************************
 * BOOTSTRAP INITIALIZER
 *******************************************************************************/
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 [Gateway API Recicla] Escutando e roteando na porta ${PORT}`);
    console.log(`⚙️  Camada Shared incorporada à malha global de controle.`);
});
