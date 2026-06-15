"use strict";
/*******************************************************************************
 * COMPONENTE: SYSTEM CONFIG CONTROLLER (BACKEND DO RECICLA)
 * CAMINHO FÍSICO: src/shared/infra/http/controllers/systemConfigController.ts
 * RESPONSABILIDADE: Emitir dados de controlo de infraestrutura globais (Cross-Cutting)
 * PROTOCOLO: Acessível por qualquer módulo ou dashboard conectado ao ecossistema
 *******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterStatusAmbienteGlobal = void 0;
const postgres_1 = require("../../postgres");
const schemaAtivoGeral = "simulation"; // Mapeia o batimento do sprint atual
const obterStatusAmbienteGlobal = async (req, res) => {
    try {
        // Interroga o coração do PostgreSQL (recicla-db-1)
        const dbQuery = await postgres_1.pool.query(`SELECT current_database(), current_user;`);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Falha catastrófica ao ler chassi de infraestrutura",
            details: error.message
        });
    }
};
exports.obterStatusAmbienteGlobal = obterStatusAmbienteGlobal;
