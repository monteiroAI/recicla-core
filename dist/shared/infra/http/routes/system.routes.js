"use strict";
/*******************************************************************************
 * COMPONENTE: SYSTEM ROUTES (BARRAMENTO COMPARTILHADO)
 * CAMINHO FÍSICO: src/shared/infra/http/routes/system.routes.ts
 * RESPONSABILIDADE: Expor rotas de infraestrutura agnósticas para os Dashboards
 *******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemConfigController_1 = require("../controllers/systemConfigController");
const deviceEnrollmentController_1 = require("../controllers/deviceEnrollmentController");
const driverAuditoryController_1 = require("../controllers/driverAuditoryController");
const systemRouter = (0, express_1.Router)();
// Endpoint agnóstico de handshake do ecossistema
systemRouter.get('/system/config/status', systemConfigController_1.obterStatusAmbienteGlobal);
systemRouter.post('/system/device/enroll', deviceEnrollmentController_1.deviceEnrollmentController);
systemRouter.get('/system/driver/missions', driverAuditoryController_1.driverAuditoryController);
exports.default = systemRouter;
