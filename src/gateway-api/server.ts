/*******************************************************************************
 * ECOSSISTEMA DE RASTREABILIDADE LOGÍSTICA RECICLA (BACKEND CORE ENGINE)
 * CAMINHO FÍSICO: /boot/torre/recicla/src/gateway-api/server.ts
 * CONFIGURAÇÃO: Regra Dinâmica do Sankey Horizontal e Janela 26 a 25
 * REQUISITO EXTRA: Acoplamento Cross-Cutting do Roteador de Schema (Camada Shared)
 *******************************************************************************/

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

// Importação do barramento global de infraestrutura compartilhada (Shared Infra)
import systemRouter from '../shared/infra/http/routes/system.routes';

const app = express();
const pool = new Pool();

app.use(cors());
app.use(express.json());

/*******************************************************************************
 * 🗺️ BARRAMENTO GLOBAL DE INFRAESTRUTURA (CROSS-CUTTING SHARED)
 * Disponibiliza /api/v1/system/config/status para o indicador visual do HTML
 *******************************************************************************/
app.use('/api/v1', systemRouter);


/*******************************************************************************
 * 📊 SEÇÃO DE ANALYTICS AVANÇADO — COOP. ANDRÉ
 *******************************************************************************/

/**
 * Helper para calcular as datas limites do mês de competência (Dia 26 a 25)
 * Se o usuário pedir Ano=2026 e Mês=06 (Junho/2026), a janela será: 26/05/2026 até 25/06/2026
 */
function obterJanelaCompetencia(ano: number, mes: number) {
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
async function executarQuery(sql: string, params: any[]) {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO simulation;");
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

/**
 * 🔀 GET /api/analytics/sankey-mass-balance
 * Fornece os nós horizontais obedecendo a regra de bypass e a janela temporal
 */
app.get('/api/analytics/sankey-mass-balance', async (req: Request, res: Response) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  const mes = parseInt(req.query.mes as string) || 6; // Junho como padrão de teste
  const { inicio, fim } = obterJanelaCompetencia(ano, mes);

  try {
    const sql = `
      -- FLUXO 1: Canais de Secos para a TRIAGEM (Exclui Catadores)
      SELECT 
        CASE 
          WHEN pes.origem_material = 'domiciliar_seletiva' THEN 'Coleta Pública Domiciliar'
          WHEN pes.origem_material = 'grande_gerador' THEN 'Grandes Geradores'
          ELSE 'Zeladoria Municipal'
        END AS source,
        'Operação de TRIAGEM (Esteira)' AS target,
        SUM(pes.peso_bruto_entrada) / 1000.0 AS value
      FROM cons_pesagens_cooperativa pes
      WHERE pes.origem_material <> 'catador_autonomo'
        AND pes.created_at BETWEEN $1 AND $2
      GROUP BY source
      
      UNION ALL
      
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
      
      UNION ALL
      
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
      
      UNION ALL
      
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
      
      UNION ALL
      
      -- FLUXO 5: Da COMPOSTAGEM para o Output Final de Composto Orgânico
      SELECT 
        'Processo de Compostagem (Pátio)' AS source,
        'Composto Orgânico Estabilizado' AS target,
        SUM(leiras.peso_composto_final_kg) / 1000.0 AS value
      FROM cons_leiras_compostagem leiras
      WHERE leiras.status_leira = 'CONCLUIDA'
        AND leiras.updated_at BETWEEN $1 AND $2
      GROUP BY source;
    `;

    const resultado = await executarQuery(sql, [inicio, fim]);
    return res.status(200).json({ success: true, periodo: { inicio, fim }, links: resultado.rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao consolidar regras horizontais do Sankey', details: error.message });
  }
});

/*******************************************************************************
 * BOOTSTRAP INITIALIZER
 *******************************************************************************/
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 [Gateway API Recicla] Escutando e roteando na porta ${PORT}`);
  console.log(`⚙️  Camada Shared incorporada à malha global de controle.`);
});