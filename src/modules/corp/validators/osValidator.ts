/*******************************************************************************
 * MÓDULO: CORP / LOGÍSTICA DE GRANDES GERADORES
 * CAMINHO FÍSICO: /boot/torre/recicla/src/modules/corp/validators/osValidator.ts
 * RESPONSABILIDADE: Validador de Incompatibilidade de Destinação Ambiental
 * STATUS: REGRA AMBIENTAL ESTREITA BLINDADA
 *******************************************************************************/

import { Request, Response, NextFunction } from 'express';
import { pool } from '../../../shared/infra/postgres';

export const validarIncompatibilidadeClasse = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};