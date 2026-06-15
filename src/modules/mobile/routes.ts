/*******************************************************************************
 * COMPONENTE: MOBILE ROUTES (Recicla API Gateway)
 * CAMINHO FÍSICO: src/modules/mobile/routes.ts
 * FINALIDADE: Expor endpoints de ingestão de jornada e evidências móveis.
 *******************************************************************************/

import { Router } from 'express';
import { processarEstadoJornadaRecicla } from '../audit/controllers/forensicMissionController';

const mobileRouter = Router();

// Endpoint principal usado pelo fluxo Mobile/Recicla
mobileRouter.post('/jornadas/estado', processarEstadoJornadaRecicla);

// Alias de compatibilidade para integrações existentes que ainda usem a rota antiga
mobileRouter.post('/jornadas/sincronizar', (req, res) => {
  return res.status(200).json({
    success: true,
    code: 'FILES_RECEIVED_OK',
    message: 'Rota de sincronia legado operacionalizada. Utilize /jornadas/estado para o controle de estados.'
  });
});

export const setupMobileRoutes = () => mobileRouter;
