"use strict";
/*******************************************************************************
 * MÓDULO: CORP / LOGÍSTICA DE GRANDES GERADORES
 * CAMINHO FÍSICO: /boot/torre/recicla/src/modules/corp/validators/osValidator.ts
 * RESPONSABILIDADE: Validador de Incompatibilidade de Destinação Ambiental
 * STATUS: REGRA AMBIENTAL ESTREITA BLINDADA
 *******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarIncompatibilidadeClasse = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool();
const validarIncompatibilidadeClasse = async (req, res, next) => {
    const { id_destino, classe_residuo } = req.body;
    try {
        // 1. Verifica se o destino cadastrado na O.S. possui a licença operacional de Consolidador/Cooperativa
        const queryDestino = `
      SELECT tipo_licenca 
      FROM instituicoes_destinos 
      WHERE id = $1;
    `;
        const resDestino = await pool.query(queryDestino, [id_destino]);
        const tipoLicenca = resDestino.rows[0]?.tipo_licenca;
        // 2. Trava de Segurança Crítica Ambiental
        if (tipoLicenca === 'CONSOLIDADOR_COOPERATIVA' && classe_residuo === 'CLASSE_I') {
            return res.status(400).json({
                success: false,
                error: "BLOQUEIO DE COMPLIANCE: Incompatibilidade Crítica de Destinação.",
                details: "Instalações de triagem e compostagem da Cooperativa não possuem licença para receber Resíduos Perigosos (Classe I). Emissão de O.S. abortada pelo RECICLA."
            });
        }
        // Se for Classe II (Recicláveis Secos ou Orgânicos), o fluxo prossegue para a O.S.
        next();
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.validarIncompatibilidadeClasse = validarIncompatibilidadeClasse;
