"use strict";
/*******************************************************************************
 * COMPONENTE: SYSTEM ROUTES (BARRAMENTO COMPARTILHADO)
 * CAMINHO FÍSICO: src/shared/infra/http/routes/system.routes.ts
 * RESPONSABILIDADE: Expor rotas de infraestrutura agnósticas para os Dashboards
 *******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemConfigController_1 = require("../controllers/systemConfigController");
const systemRouter = (0, express_1.Router)();
// Endpoint agnóstico de handshake do ecossistema
systemRouter.get('/system/config/status', systemConfigController_1.obterStatusAmbienteGlobal);
exports.default = systemRouter;
