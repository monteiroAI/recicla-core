import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

const app = express();
app.use(express.json());

// Definição da porta de escuta do Gateway com fallback
const PORT = process.env.PORT || 3001;

// Configuração do Pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                       
  idleTimeoutMillis: 30000,      
  connectionTimeoutMillis: 2000, 
});

pool.on('error', (err) => {
  console.error('[🚨 CRITICAL DATABASE ERROR] Falha inesperada no pool ocioso do PostgreSQL:', err);
});

// Chaveamento dinâmico automatizado do Schema Isolation
const schemaAtivo = process.env.NODE_ENV === 'simulation' ? 'simulation' : 'production';
console.log(`[RECICLA BACKBONE] Inicializado operando no ecossistema: [${schemaAtivo.toUpperCase()}]`);

/**
 * Motor Orquestrador de Queries com Injeção de search_path ativa por Sessão
 */
const executarQuery = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schemaAtivo}`);
    return await client.query(text, params);
  } catch (error: any) {
    console.error(`[🛢️ DB EXECUTION ERROR] Falha na query no esquema [${schemaAtivo}]:`, error.message);
    throw error;
  } finally {
    client.release();
  }
};

// ====================================================================
// ROTAS DA VERTICAL CORP (Incorporadas nativamente para evitar quebra de import)
// ====================================================================

/**
 * POST /api/corp/os - Registrar Ordem de Serviço
 */
app.post('/api/corp/os', async (req: Request, res: Response) => {
  const { codigo_os, cliente_id, numero_pedido, scheduled_date, residue_class, destinador_id } = req.body;
  try {
    const query = `
      INSERT INTO corp_ordens_servico (codigo_os, cliente_id, numero_pedido, scheduled_date, residue_class, destinador_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const result = await executarQuery(query, [codigo_os, cliente_id, numero_pedido, scheduled_date, residue_class, destinador_id]);
    return res.status(201).json({ success: true, context: schemaAtivo, os: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao registrar O.S. na vertical CORP', details: error.message });
  }
});

/**
 * POST /api/corp/missoes/despachar - Orquestrar Missão e Despacho 1:N
 */
app.post('/api/corp/missoes/despachar', async (req: Request, res: Response) => {
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

    return res.status(201).json({ success: true, context: schemaAtivo, missao_id: missaoId,  viagem: resViagem.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro no despacho logístico na vertical CORP', details: error.message });
  }
});

/**
 * POST /api/corp/viagens/:id/evidencias - Ingestão IoT e Telemetria de Balança
 */
app.post('/api/corp/viagens/:id/evidencias', async (req: Request, res: Response) => {
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
    return res.status(201).json({ success: true, context: schemaAtivo, evidence: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao salvar evidência na vertical CORP', details: error.message });
  }
});

// ====================================================================
// ROTAS COMPARTILHADAS: HUB DE CONSOLIDAÇÃO (Balança Gate e Esteira)
// ====================================================================

app.post('/api/consolidation/gate-checkin', async (req: Request, res: Response) => {
  const { ente_hub_id, vertical_origem, viagem_id, gross_weight_kg, tare_weight_kg } = req.body;
  try {
    const query = `
      INSERT INTO hub_ingressos_brutos (ente_hub_id, vertical_origem, viagem_id, gross_weight_kg, tare_weight_kg)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const result = await executarQuery(query, [ente_hub_id, vertical_origem, viagem_id || null, gross_weight_kg, tare_weight_kg]);
    return res.status(201).json({ success: true, context: schemaAtivo, data: result.rows[0] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro no checkin do Hub', details: error.message });
  }
});

// ====================================================================
// SINAIS DE INTEGRALIDADE E DIAGNÓSTICO
// ====================================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1;');
    return res.json({ status: 'healthy', core: 'recicla-gateway-api', active_schema: schemaAtivo, database: 'connected' });
  } catch (err: any) {
    return res.status(503).json({ status: 'unhealthy', active_schema: schemaAtivo, database: 'disconnected' });
  }
});

// Inicialização do Servidor Central
const server = app.listen(PORT, () => {
  console.log(`[RECICLA API] Backbone ativo e escutando na porta local: ${PORT}`);
});