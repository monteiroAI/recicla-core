import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Garante o fim do bloqueio de rede

const app = express();
const port = 3001; // Note que o seu script do pacote fuzila a porta 3001, vamos mantê-la!

app.use(bodyParser.json());
app.use(cors());

// Middleware de autenticação (Bypass temporário para auditoria local)
function autenticacaoMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  next();
}

// Rota principal unificada para o D3.js do seu dashboard
app.get('/api/v1/metrics/sankey', autenticacaoMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const metrics = await getSankeyMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter os dados de Sankey' });
  }
});

async function getSankeyMetrics() {
  return {
    schema: "simulation",
    documental_compliance: {
      mtr_status: "EMITIDO_MOCK",
      sefaz_handshake: "BYPASS_ACTIVE"
    },
    fluxos: [
      ["Metalúrgica Alfa", "Triagem Consolidadora", 1.00],
      ["Supermercado Preço Bom", "Triagem Consolidadora", 4.10],
      ["Shopping Center Plaza", "Triagem Consolidadora", 4.90],
      
      ["Triagem Consolidadora", "Compostagem (Orgânicos)", 4.53],
      ["Triagem Consolidadora", "Papelão Ondulado (IPA)", 1.34],
      ["Triagem Consolidadora", "Metais Ferrosos (IPA)", 0.15],
      ["Triagem Consolidadora", "Alumínio Premium (IPA)", 0.08],
      ["Triagem Consolidadora", "PEBD Industrial (IPA)", 0.05],
      ["Triagem Consolidadora", "PET Cristal Premium", 0.31],
      
      ["PET Cristal Premium", "Indústria de Resinas S.A.", 0.31]
    ],
    kpis_fluxo: {
      mv_massa: 10.00,
      mv_co2: 24.50,
      ems_massa: 5.47,
      ems_co2: 18.20
    }
  };
}

app.listen(port, () => {
  console.log(`🚀 Gateway API rodando em ambiente de simulação na porta ${port}`);
});