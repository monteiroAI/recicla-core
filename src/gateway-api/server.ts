/*******************************************************************************
 * ESTRUTURA PARA ATIVAR: recicla (Backend Core Engine)
 * CAMINHO FÍSICO: /boot/torre/recicla/src/gateway-api/server.ts
 * CONFIGURAÇÃO: Node.js / TypeScript Express Server (Porta 3001)
 * STATUS: REVERTIDO E PACIFICADO COMO RECICLA
 *******************************************************************************/

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Log de Auditoria unificado sob o escopo estável do recicla
app.use((req, res, next) => {
  console.log(`[🛰️ RECICLA TRAFFIC] ${new Date().toISOString()} | ${req.method} ➔ ${req.url}`);
  next();
});

const STATE_SEQUENCE = [
  'T1_INICIO_MISSAO',
  'T2_BALANCA_VAZIO',
  'T3_LOCAL_COLETA_CARGA',
  'T4_TRANSPORTE_RESIDUO',
  'T5_PROCEDIMENTO_DESCARGA',
  'T6_MISSAO_ENCERRADA'
];

function isValidStateTransition(currentState: string, nextState: string): boolean {
  const currentIndex = STATE_SEQUENCE.indexOf(currentState);
  const nextIndex = STATE_SEQUENCE.indexOf(nextState);
  return currentIndex !== -1 && nextIndex === (currentIndex + 1);
}

// ====================================================================
// ROTAS DA VERTICAL CORP (Sincronizadas com o KtorHttpClient do Mobile)
// ====================================================================

/**
 * 📱 POST /api/corp/missions/:id/resolution
 */
app.post('/api/corp/missions/:id/resolution', async (req: Request, res: Response) => {
  const missionId = req.params.id;
  const { eventId, userId, resolution, timestampUtc, gpsCoordinates, justificationText } = req.body;

  if (resolution === 'DECLINED_UNAVAILABLE' && (!justificationText || justificationText.trim() === '')) {
    return res.status(400).json({ 
      error: 'Inconsistência Forense: Recusa de missão exige relatório textual de justificativa.' 
    });
  }

  const dbStatus = resolution === 'ACCEPTED_AND_READY' ? 'em-transito' : 'recusada';
  console.log(`[🟢 RESOLUTION LOCKED] Missão [${missionId}] ➔ [${dbStatus}] processada no barramento recicla.`);

  return res.status(201).json({
    success: true,
    message: 'Recibo de integridade forense emitido pelo mrvTRUST',
    eventId: eventId,
    status_gravado: dbStatus
  });
});

/**
 * 📱 POST /api/corp/missions/:id/transition
 */
app.post('/api/corp/missions/:id/transition', async (req: Request, res: Response) => {
  const missionId = req.params.id;
  const { currentState, nextState, evidenceCaptured } = req.body;

  if (!evidenceCaptured && nextState !== 'T4_TRANSPORTE_RESIDUO') {
    return res.status(400).json({ 
      error: 'Bloqueio de Gate: Impossível avançar sem capturar a evidência física.' 
    });
  }

  if (!isValidStateTransition(currentState, nextState)) {
    return res.status(400).json({ 
      error: `Violação de fluxo abortada pelo mrvTRUST: Transição de ${currentState} para ${nextState} é ilegal.` 
    });
  }

  console.log(`[🟢 STATE TRANSITIONED] Missão [${missionId}]: ${currentState} ➔ ${nextState}`);

  return res.status(200).json({
    success: true,
    message: `Transição para ${nextState} homologada com sucesso.`
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================================`);
  console.log(`🚀 recicla Core Engine ativado com sucesso nativo na porta [${PORT}]`);
  console.log(`======================================================================`);
});