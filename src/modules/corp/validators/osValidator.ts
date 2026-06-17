/**
 * ============================================================================================
 * 📦 PROJECT:   RECICLA - SISTEMA TRILATERAL DE RASTREABILIDADE E LOGÍSTICA REVERSA
 * 📁 CAMINHO:   ~/workspace/torre/recicla/src/modules/corp/validators/osValidator.ts
 * 🏭 MODULE:    CORP / VALIDATORS
 * 🚀 CAPABILITY: ENGINE DE VALIDAÇÃO MATEMÁTICA DE BALANÇAS (ANTI-FRAUDE & AWS-READY)
 * ============================================================================================
 */

export interface IPesagemFluxo {
  peso_entrada: number; // Peso ao chegar no pátio
  peso_saida: number;   // Peso ao sair do pátio
}

export interface IValidacaoMissaoInput {
  codigo_missao: string;
  cenario: 'PATIO_UNICO' | 'MULTI_INSTALACAO';
  compostagem: IPesagemFluxo;
  reciclagem: IPesagemFluxo;
}

export class OsValidator {
  /**
   * Valida a integridade física e matemática de todas as pesagens de uma missão
   * ANTES de permitir a escrita no PostgreSQL ou no Hyperledger Fabric.
   */
  public static validarPesagens(input: IValidacaoMissaoInput): { valido: boolean; erro?: string; massa_organicos_kg: number; massa_secos_kg: number } {
    
    // 1. Apuração atômica da fração Orgânica (Sempre Entrada - Saída da Compostagem)
    const organicos = input.compostagem.peso_entrada - input.compostagem.peso_saida;
    if (organicos < 0) {
      return { valido: false, erro: "💥 Fraude detectada: Peso de saída maior que entrada na Compostagem.", massa_organicos_kg: 0, massa_secos_kg: 0 };
    }

    // 2. Apuração atômica da fração Seca (Sempre Entrada - Saída da Reciclagem)
    const secos = input.reciclagem.peso_entrada - input.reciclagem.peso_saida;
    if (secos < 0) {
      return { valido: false, erro: "💥 Fraude detectada: Peso de saída maior que entrada na Reciclagem.", massa_organicos_kg: 0, massa_secos_kg: 0 };
    }

    // ==============================================================================
    // REGRA FLEXÍVEL PARA CENÁRIO 2: MULTI-INSTALACAO
    // Exige paridade e amarração de tráfego entre a Saída da Instalação A e Entrada da B
    // ==============================================================================
    if (input.cenario === 'MULTI_INSTALACAO') {
      const quebra_transito = input.compostagem.peso_saida - input.reciclagem.peso_entrada;
      
      // Permite uma tolerância física máxima de 1% (ex: perda volátil ou calibração de balança)
      const margem_tolerancia = input.compostagem.peso_saida * 0.01; 

      if (Math.abs(quebra_transito) > margem_tolerancia) {
        return {
          valido: false,
          erro: `🚨 Alerta de Desvio Criptográfico: O caminhão saiu da Compostagem com ${input.compostagem.peso_saida}kg, mas chegou na Reciclagem com ${input.reciclagem.peso_entrada}kg. Divergência fora da margem aceitável!`,
          massa_organicos_kg: organicos,
          massa_secos_kg: secos
        };
      }
    }

    // Se passou por todas as cercas matemáticas, a história é declarada verdadeira
    return {
      valido: true,
      massa_organicos_kg: organicos,
      massa_secos_kg: secos
    };
  }
}