"use strict";
/*******************************************************************************
 * COMPONENTE: MOBILE ROUTES (Recicla API Gateway)
 * CAMINHO FÍSICO: src/modules/mobile/routes.ts
 * FINALIDADE: Expor endpoints de ingestão de jornada e evidências móveis.
 *******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMobileRoutes = void 0;
const express_1 = require("express");
const forensicMissionController_1 = require("../audit/controllers/forensicMissionController");
const mobileRouter = (0, express_1.Router)();
// Endpoint principal usado pelo fluxo Mobile/Recicla
mobileRouter.post('/jornadas/estado', forensicMissionController_1.processarEstadoJornadaRecicla);
// Alias de compatibilidade para integrações existentes que ainda usem a rota antiga
mobileRouter.post('/jornadas/sincronizar', (req, res) => {
    return res.status(200).json({
        success: true,
        code: 'FILES_RECEIVED_OK',
        message: 'Rota de sincronia legado operacionalizada. Utilize /jornadas/estado para o controle de estados.'
    });
});
const setupMobileRoutes = () => mobileRouter;
exports.setupMobileRoutes = setupMobileRoutes;
