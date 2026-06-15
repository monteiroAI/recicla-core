import { Request, Response } from 'express';
import { pool } from '../../postgres';

/**
 * Controlador de Auditoria Trilateral do Motorista.
 * Ontologia: Usuário -> Vínculo (Empresa/Operadora) -> Função (Missão)
 *
 * Recebe `driver_id` via query param e retorna:
 * - Perfil contextualizado do usuário (vínculo ativo com empresa/operadora)
 * - Listagem de todas as missões executadas nesse contexto de vínculo
 */
export const driverAuditoryController = async (req: Request, res: Response) => {
  const { driver_id } = req.query;

  if (!driver_id) {
    return res.status(400).json({ success: false, error: 'Parâmetro driver_id é obrigatório.' });
  }

  const client = await pool.connect();
  try {
    // 1) Recupera o dispositivo vinculado ao motorista e identifica o vínculo contextual ativo
    const driverProfileQuery = `
      SELECT 
        hardware_uuid,
        id_usuario_vinculado,
        id_empresa_vinculo,
        id_operadora_pgrs,
        vertical_app,
        created_at,
        updated_at
      FROM recicla_dispositivos_homologados
      WHERE id_usuario_vinculado = $1
      LIMIT 1
    `;
    const driverProfileRes = await client.query(driverProfileQuery, [driver_id]);
    const driverProfile = driverProfileRes.rows[0];

    if (!driverProfile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Motorista/Dispositivo não encontrado no catálogo de homologação.' 
      });
    }

    // 2) Recupera todas as missões executadas nesse contexto de vínculo (empresa + operadora)
    //    INNER JOIN garante que apenas missões pertencentes a essa empresa/operadora sejam retornadas
    const missionsQuery = `
      SELECT 
        m.id_ordem_servico,
        m.uuid_missao,
        m.status_missao,
        m.id_empresa_vinculo,
        m.id_operadora_pgrs,
        m.peso_1_tara_gerador,
        m.peso_2_coleta_cheia,
        m.peso_3_destino_entrada,
        m.peso_4_saida_final,
        m.biometria_confirmada_origem,
        m.created_at,
        m.updated_at
      FROM corp_missoes m
      WHERE m.id_empresa_vinculo = $1
        AND m.id_operadora_pgrs = $2
      ORDER BY m.created_at DESC
    `;
    const missionsRes = await client.query(missionsQuery, [
      driverProfile.id_empresa_vinculo,
      driverProfile.id_operadora_pgrs,
    ]);

    return res.status(200).json({
      success: true,
      driverProfile: {
        id_usuario_vinculado: driverProfile.id_usuario_vinculado,
        hardware_uuid: driverProfile.hardware_uuid,
        id_empresa_vinculo: driverProfile.id_empresa_vinculo,
        id_operadora_pgrs: driverProfile.id_operadora_pgrs,
        vertical_app: driverProfile.vertical_app,
        enrolled_at: driverProfile.created_at,
      },
      missions: missionsRes.rows,
      total_missions: missionsRes.rows.length,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao recuperar auditoria trilateral do motorista',
      details: error.message 
    });
  } finally {
    client.release();
  }
};
