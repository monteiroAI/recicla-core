"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceEnrollmentController = void 0;
const postgres_1 = require("../../postgres");
/**
 * Controlador de provisionamento "a frio" (Cold Start) do dispositivo móvel.
 * Recebe: enrollment_token, hardware_uuid, usuario_id, biometria_hardware_status.
 *
 * Fluxo:
 * - Abre transação
 * - Verifica token ativo/válido (SELECT ... FOR UPDATE na tabela real)
 * - Realiza UPSERT em `recicla_dispositivos_homologados`
 * - Marca o token como expirado (`expirado = true`)
 */
const deviceEnrollmentController = async (req, res) => {
    const { enrollment_token, hardware_uuid, usuario_id, biometria_hardware_status, vertical_app } = req.body;
    if (!enrollment_token || !hardware_uuid || !usuario_id) {
        return res.status(400).json({ success: false, error: 'Parâmetros obrigatórios ausentes.' });
    }
    const client = await postgres_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1) Verifica e bloqueia o token para evitar race conditions
        const tokenQuery = `
      SELECT token, id_empresa_vinculo, id_operadora_target, expirado
      FROM recicla_tokens_convite
      WHERE token = $1
      FOR UPDATE
    `;
        const tokenRes = await client.query(tokenQuery, [enrollment_token]);
        const tokenRow = tokenRes.rows[0];
        if (!tokenRow) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Token de enrollment não encontrado.' });
        }
        if (tokenRow.expirado) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Token já expirado.' });
        }
        // 2) UPSERT do dispositivo amarrando hardware_uuid à empresa/operadora do convite
        const upsertDevice = `
      INSERT INTO recicla_dispositivos_homologados
        (hardware_uuid, id_usuario_vinculado, id_empresa_vinculo, id_operadora_pgrs, vertical_app, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (hardware_uuid) DO UPDATE
      SET id_usuario_vinculado = $2,
          id_empresa_vinculo = $3,
          id_operadora_pgrs = $4,
          updated_at = NOW()
      RETURNING hardware_uuid, id_usuario_vinculado, id_empresa_vinculo, id_operadora_pgrs, vertical_app;
    `;
        const upsertValues = [
            hardware_uuid,
            usuario_id,
            tokenRow.id_empresa_vinculo || null,
            tokenRow.id_operadora_target || null,
            vertical_app || null,
        ];
        const upsertRes = await client.query(upsertDevice, upsertValues);
        // 3) Queimar o token (marcar expirado = true)
        const expireTokenQuery = `UPDATE recicla_tokens_convite SET expirado = true WHERE token = $1`;
        await client.query(expireTokenQuery, [enrollment_token]);
        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Device enrolled successfully',
            device: upsertRes.rows[0],
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ success: false, error: error.message });
    }
    finally {
        client.release();
    }
};
exports.deviceEnrollmentController = deviceEnrollmentController;
