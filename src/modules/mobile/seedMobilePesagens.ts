/**
 * ============================================================================================
 * 📦 PROJECT:   RECICLA - SISTEMA TRILATERAL DE RASTREABILIDADE E LOGÍSTICA REVERSA
 * 📁 CAMINHO:   ~/workspace/torre/recicla/src/modules/mobile/seedMobilePesagens.ts
 * 🏭 MODULE:    MOBILE / SIMULATION SEEDER (VERSÃO CONSOLIDADA & COMPILÁVEL)
 * ============================================================================================
 * 📜 DESCRIÇÃO:
 * Simula a jornada física do motorista recolhendo resíduos no Shopping Center Plaza.
 * O script emula o protocolo de múltiplas pesagens em cadeia de custódia, separando
 * a fração Orgânica (Compostagem) e enviando os Secos Misturados para a esteira do CORP.
 *
 * 🔒 DIRETRIZ AWS-READY:
 * Conector de dados e lógica atómica de transação (ACID) blindados contra SQL Injection.
 * ============================================================================================
 */

import { pgPool } from '../../shared/infra/postgres';

// 🏛️ INTERFACES E REGRAS DE VALIDAÇÃO DE BALANÇA NO ESCOPO LOCAL
interface IPesagemFluxo {
  peso_entrada: number; // Peso ao entrar na instalação
  peso_saida: number;   // Peso ao sair da instalação
}

interface IValidacaoMissaoInput {
  codigo_missao: string;
  cenario: 'PATIO_UNICO' | 'MULTI_INSTALACAO';
  compostagem: IPesagemFluxo;
  reciclagem: IPesagemFluxo;
}

class LocalOsValidator {
  /**
   * Validador nativo de pátio: realiza o desbunde matemático das 4 pesagens
   */
  public static validarPesagens(input: IValidacaoMissaoInput) {
    // 1. Apuração da fração Orgânica (Entrada - Saída do Pátio de Compostagem)
    const organicos = input.compostagem.peso_entrada - input.compostagem.peso_saida;
    if (organicos < 0) {
      return { valido: false, erro: "💥 Fraude detectada: Peso de saída maior que entrada na Compostagem.", organicos: 0, secos: 0 };
    }

    // 2. Apuração da fração Seca (Entrada - Saída da Cooperativa de Reciclagem)
    const secos = input.reciclagem.peso_entrada - input.reciclagem.peso_saida;
    if (secos < 0) {
      return { valido: false, erro: "💥 Fraude detectada: Peso de saída maior que entrada na Reciclagem.", organicos: 0, secos: 0 };
    }

    // 3. Validação do Circuito Descentralizado (Multi-Instalação)
    if (input.cenario === 'MULTI_INSTALACAO') {
      // CORRIGIDO: Utiliza peso_entrada que faz parte do contrato da interface IPesagemFluxo
      const quebra_transito = input.compostagem.peso_saida - input.reciclagem.peso_entrada;
      const margem_tolerancia = input.compostagem.peso_saida * 0.01; // Tolerância física de 1%

      if (Math.abs(quebra_transito) > margem_tolerancia) {
        return {
          valido: false,
          erro: `🚨 Alerta de Desvio Criptográfico: O caminhão perdeu carga na estrada! Saída Compostagem: ${input.compostagem.peso_saida}kg vs Entrada Reciclagem: ${input.reciclagem.peso_entrada}kg.`,
          organicos,
          secos
        };
      }
    }

    return { valido: true, organicos, secos };
  }
}

// 🚚 MOTOR DE SIMULAÇÃO PRINCIPAL (JORNADA DO MOTORISTA)
async function simularJornadaMobile() {
  // Abre o canal síncrono com o pool do PostgreSQL alocado no disco de dados
  const client = await pgPool.connect();

  console.log("====================================================================");
  console.log("🚚 DISPARANDO EVENTOS DE BALANÇA DIRETOS VIA MOBILE");
  console.log("====================================================================\n");

  /**
   * PAYLOAD: Cenário Realístico de 4 Pesagens Sucessivas (Shopping Plaza - 4.900 kg)
   * P1 (Entrada Compostagem) = 4900 kg
   * P2 (Saída Compostagem)   = 3370 kg  --> Subtração extrai 1.530 kg de Orgânicos
   * P3 (Entrada Reciclagem)  = 3370 kg  --> Confirmação de integridade em trânsito
   * P4 (Saída Reciclagem)    = 0 kg     --> Caminhão vazio (Tara)
   */
  const payloadShoppingPlaza: IValidacaoMissaoInput = {
    codigo_missao: 'MIS-SHOP-03',
    cenario: 'MULTI_INSTALACAO',
    compostagem: { peso_entrada: 4900, peso_saida: 3370 },
    reciclagem: { peso_entrada: 3370, peso_saida: 0 }
  };

  try {
    // Inicia transação atómica para blindagem de concorrência na AWS
    await client.query('BEGIN');

    console.log(`🔍 [MOBILE] Auditando balanças locais para a missão: ${payloadShoppingPlaza.codigo_missao}`);
    const auditoria = LocalOsValidator.validarPesagens(payloadShoppingPlaza);

    if (!auditoria.valido) {
      throw new Error(auditoria.erro);
    }

    console.log("🟢 [VALIDADOR]: Paridade matemática homologada com sucesso!");
    console.log(`   └─ Orgânicos: ${auditoria.organicos} kg -> Destino: Pátio de Compostagem`);
    console.log(`   └─ Secos Brutos: ${auditoria.secos} kg -> Destino: Galpão de Triagem\n`);

    // REGISTRO 1: Salva o manifesto dos orgânicos (Considerado triado na origem)
    const queryOrganico = `
      INSERT INTO movimentacoes_pacio (empresa_origem, codigo_missao, material, sub_tipo, peso_kg, status_triagem, data_registro)
      VALUES ('Shopping Center Plaza', $1, 'Orgânicos', 'Compostáveis', $2, 'Concluido_Compostagem', NOW())
    `;
    await client.query(queryOrganico, [payloadShoppingPlaza.codigo_missao, auditoria.organicos]);

    // REGISTRO 2: Salva o bloco bruto de secos (Massa de entrada que alimentará o dashboard do CORP)
    const querySecos = `
      INSERT INTO movimentacoes_pacio (empresa_origem, codigo_missao, material, sub_tipo, peso_kg, status_triagem, data_registro)
      VALUES ('Shopping Center Plaza', $1, 'Secos_Misturados', 'Aguardando_Triagem_Esteira', $2, 'Aguardando_Triagem', NOW())
    `;
    await client.query(querySecos, [payloadShoppingPlaza.codigo_missao, auditoria.secos]);

    // Grava fisicamente no banco de dados
    await client.query('COMMIT');
    console.log("🏆 [BINGO] História de pátio consolidada na tabela relacional!");

  } catch (error: any) {
    // Desfaz qualquer inserção parcial se a rede ou a balança falharem
    await client.query('ROLLBACK');
    console.error("\n❌ Falha na simulação do Mobile:", error.message);
  } finally {
    // Devolve a sessão de forma limpa para o pool, evitando fugas de memória
    client.release();
    console.log("\n🔌 Conexão de pátio devolvida ao pool de forma limpa.");
  }
}

// Inicializa a jornada de teste
simularJornadaMobile();