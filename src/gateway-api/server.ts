// ## nome/caminho do arquivo: src/gateway-api/server.ts
// ## data e versão: 23 de Junho de 2026 | v5.2.0
// ## objetivo do arquivo: Backbone Engine Orchestrator com nomenclatura explícita.

import express from 'express';
import cors from 'cors';
import path from 'path';

// Importação com o novo padrão nomeado e visível
import { routerCity } from './modules/routesCity';
import { routerCorp } from './modules/routesCorp';
import { routerM2a } from './modules/routesM2a';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, '../../public');
app.use(express.static(publicPath));

// Acoplamento do Barramento
app.use('/api/v1/city', routerCity);
app.use('/api/v1/regional', routerCorp); 
app.use('/api/v1/m2a', routerM2a);

app.listen(PORT, () => {
  console.log("========================================================================");
  console.log("🚀 mrvTRUST BACKBONE ENGINE v5.2.0 | NOMENCLATURA EXPLICÍTICA OPERANTE");
  console.log("🟢 PREFIXOS: /city -> routesCity | /regional -> routesCorp | /m2a -> routesM2a");
  console.log("========================================================================");
});