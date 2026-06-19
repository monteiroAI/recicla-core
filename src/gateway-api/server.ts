// ## nome/caminho do arquivo: src/gateway-api/server.ts
// ## data e versão: 19 de Junho de 2026 | v2.4.0
// ## objetivo do arquivo: API Gateway mrvTRUST. Implementa a Grade Padrão do PMGIRS para validação de conformidade de rotas da Concessionária.
// ## comentarios: Dispara quebras automáticas de suficiência forense e impede a emissão do CHF municipal se houver rotas não cumpridas.

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 1. Grade Padrão Contratual (O Norte do Processo - Expectativa do Sistema)
interface AgendamentoContratual {
  rota_numero: string;
  dia_semana: string; // "Terça-Feira", "Segunda-Feira", etc.
  tipo_residuo_esperado: "Resíduos Orgânicos" | "Papelão Ondulado" | "Sólidos Inertes (Secos)";
  concessionaria_responsavel: string;
}

const gradePadroneiadaPMGIRS: AgendamentoContratual[] = [
  { rota_numero: "RT-DOM-001", dia_semana: "Terça-Feira", tipo_residuo_esperado: "Sólidos Inertes (Secos)", concessionaria_responsavel: "Ecolurbe Ambiental" },
  { rota_numero: "RT-DOM-002", dia_semana: "Segunda-Feira", tipo_residuo_esperado: "Sólidos Inertes (Secos)", concessionaria_responsavel: "Ecolurbe Ambiental" },
  { rota_numero: "RT-ZEL-001", dia_semana: "Terça-Feira", tipo_residuo_esperado: "Resíduos Orgânicos", concessionaria_responsavel: "Murban Serviços Urbanos" }
];

// 2. Repositórios de Operação e Auditoria Forense
interface EvidenciaMissao {
  id_missao: string;
  rota_numero: string;
  concessionaria: string;
  tipo_residuo_entregue?: string;
  coleta_dados_gps: any[];
  pesagem_chegada: any;
  descarregamento: any;
  status_envio: "UPLOADED" | "COMMITTED_BLOCKCHAIN";
  data_upload: string;
}

interface NaoConformidade {
  id_alerta: string;
  timestamp: string;
  rota_numero: string;
  descricao: string;
  impacto: string;
}

const repositorioMissoesCity: EvidenciaMissao[] = [];
const quadroNaoConformidades: NaoConformidade[] = [];

// ==========================================
// 🏙️ ENDPOINTS: Validação e Auditoria PMGIRS
// ==========================================

// Inicialização de Missão com validação de quebra de contrato
app.post('/api/v1/citymobile/mission/start', (req, res) => {
  const { rota_numero, concessionaria, id_missao } = req.body;
  
  // Captura automática do dia da semana forense
  const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
  const hojeForense = diasSemana[new Date().getDay()];

  // Batimento contra a Grade Padrão Contratual
  const agendamento = gradePadroneiadaPMGIRS.find(g => m.rota_numero === rota_numero);
  
  if (agendamento && agendamento.dia_semana !== hojeForense) {
    const alertaId = `NC-${Math.floor(Math.random() * 9000) + 1000}`;
    quadroNaoConformidades.push({
      id_alerta: alertaId,
      timestamp: new Date().toISOString(),
      rota_numero,
      descricao: `Desvio de Grade Horária. Rota executada em uma ${hojeForense}, mas o agendamento contratual previa ${agendamento.dia_semana}.`,
      impacto: "Bloqueio preventivo do Certificado Homologado Forense do Município."
    });
  }

  const novaMissao: EvidenciaMissao = {
    id_missao: id_missao || `MS-CITY-${Math.floor(Math.random() * 90000) + 10000}`,
    rota_numero,
    concessionaria,
    coleta_dados_gps: [],
    pesagem_chegada: { peso_bruto: 0, tara: 0, peso_liquido: 0, timestamp: "" },
    descarregamento: { destino_homologado: "", timestamp: "" },
    status_envio: "UPLOADED",
    data_upload: new Date().toISOString()
  };

  repositorioMissoesCity.push(novaMissao);
  res.status(201).json({ status: "MISSION_INITIALIZED", id_missao: novaMissao.id_missao });
});

// Upload e verificação taxonômica do resíduo descarregado
app.post('/api/v1/citymobile/mission/upload-pack', (req, res) => {
  const { id_missao, pesagem, descarregamento } = req.body;
  const missao = repositorioMissoesCity.find(m => m.id_missao === id_missao);

  if (!missao) return res.status(404).json({ error: "Missão não localizada." });

  const agendamento = gradePadroneiadaPMGIRS.find(g => m.rota_numero === missao.rota_numero);

  // Validação Contratual Estrita: O tipo de resíduo entregue bate com o planejado para a rota?
  if (agendamento && agendamento.tipo_residuo_esperado !== descarregamento.tipo_residuo) {
    quadroNaoConformidades.push({
      id_alerta: `NC-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date().toISOString(),
      rota_numero: missao.rota_numero,
      descricao: `Contaminação ou Erro de Fração. Esperava-se [${agendamento.tipo_residuo_esperado}], mas o Concessionário descarregou [${descarregamento.tipo_residuo}].`,
      impacto: "Emissão do CHF suspensa por inconsistência operacional grave."
    });
  }

  missao.pesagem_chegada = pesagem;
  missao.descarregamento = descarregamento;
  missao.status_envio = "COMMITTED_BLOCKCHAIN";

  res.json({ status: "PACK_COMMITTED", nao_conformidades_ativas: quadroNaoConformidades.length });
});

// Endpoint Forense para o Gestor Público auditar o status do CHF Municipal
app.get('/api/v1/governance/pmgirs-compliance', (req, res) => {
  const chfDisponivel = quadroNaoConformidades.length === 0;
  res.json({
    municipio: "Santo André - Região ABC",
    data_auditoria: new Date().toLocaleDateString('pt-BR'),
    status_certificado_pmgirs: chfDisponivel ? "STATUS_HOMOLOGADO_FORENSE" : "EMISSÃO_BLOQUEADA_INCONFORMIDADE",
    total_nao_conformidades: quadroNaoConformidades.length,
    lista_de_quebras: quadroNaoConformidades
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Motor de Conformidade Contratual PMGIRS ativo na porta http://localhost:${PORT}`);
});