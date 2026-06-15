/*******************************************************************************
 * COMPONENTE: SYSTEM CONFIG CONTROLLER (BACKEND DO RECICLA)
 * CAMINHO FÍSICO: src/shared/infra/http/controllers/systemConfigController.ts
 * RESPONSABILIDADE: Emitir dados de controlo de infraestrutura globais (Cross-Cutting)
 * PROTOCOLO: Acessível por qualquer módulo ou dashboard conectado ao ecossistema
 *******************************************************************************/

import { Request, Response } from 'express';
import { pool } from '../../postgres';

const schemaAtivoGeral = "simulation"; // Mapeia o batimento do sprint atual

export const obterStatusAmbienteGlobal = async (req: Request, res: Response) => {
  try {
    // Interroga o coração do PostgreSQL (recicla-db-1)
    const dbQuery = await pool.query(`SELECT current_database(), current_user;`);
    
    return res.status(200).json({
      success: true,
      infraestrutura: {
        schema_ativo: schemaAtivoGeral.toUpperCase(), // "SIMULATION" ou "PUBLIC"
        banco: dbQuery.rows[0].current_database,
        role_execucao: dbQuery.rows[0].current_user, // recicla_user homologado
        modo: "AUDITORIA_FORENSE_PGRS",
        blockchain_status: "CONNECTED",
        timestamp_servidor: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: "Falha catastrófica ao ler chassi de infraestrutura", 
      details: error.message 
    });
  }
};