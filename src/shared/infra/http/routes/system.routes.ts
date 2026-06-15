/*******************************************************************************
 * COMPONENTE: SYSTEM ROUTES (BARRAMENTO COMPARTILHADO)
 * CAMINHO FÍSICO: src/shared/infra/http/routes/system.routes.ts
 * RESPONSABILIDADE: Expor rotas de infraestrutura agnósticas para os Dashboards
 *******************************************************************************/

import { Router } from 'express';
import { obterStatusAmbienteGlobal } from '../controllers/systemConfigController';
import { deviceEnrollmentController } from '../controllers/deviceEnrollmentController';
import { driverAuditoryController } from '../controllers/driverAuditoryController';

const systemRouter = Router();

// Endpoint agnóstico de handshake do ecossistema
systemRouter.get('/system/config/status', obterStatusAmbienteGlobal);
systemRouter.post('/system/device/enroll', deviceEnrollmentController);
systemRouter.get('/system/driver/missions', driverAuditoryController);

export default systemRouter;