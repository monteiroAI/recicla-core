on2: number): number {
  
  const R = 6371e3; // Raio da Terra em metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Retorna a distância em metros
}

/**
 * Controlador Principal de Transição e Validação de Estado da Jornada PGRS
 */
export const processarEstadoJornadaRecicla = async (req: Request, res: Response) => {
  const { uuid_missao, proximo_estado, dados_payload, id_motorista } = req.body;
  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO ${schemaAtivo};`);
    await client.query('BEGIN');

    // 1. Recupera o registro da missão e o contexto geográfico/operacional do Gerador
    const queryMissao = `SELECT * FROM recicla_missoes WHERE uuid_missao = $1;`;
    const resMissao = await client.query(queryMissao, [uuid_missao]);
    if (resMissao.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: "Missão não localizada no Backend do Recicla." });
    }
    const missao = resMissao.rows[0];

    // 🛑 TRATAMENTO EXCEPCIONAL: Motorista rejeitou a designação da O.S. na origem
    if (proximo_estado === 'REJEITADA') {
      await client.query(
        `UPDATE recicla_missoes 
         SET status_missao = 'REJEITADA', motivo_rejeicao_motorista = $1, elegivel_blockchain = false, status_auditoria = 'REJEITADO_PELO_CONDUTOR' 
         WHERE uuid_missao = $2`,
        [dados_payload.motivo || "Não especificado", uuid_missao]
      );
      await client.query('COMMIT');
      return res.status(200).json({ 
        success: true, 
        message: "Handshake de rejeição computado. O.S. devolvida imediatamente para a Coordenação da PGRS." 
      });
    }

    // 🏗️ MÁQUINA DE ESTADOS FINITOS TRANSACIONAL (HARD LOCK CENTRALIZADO)
    switch (proximo_estado) {

      case 'T1_INICIO_MISSAO': // Motorista aceita a missão e retira o veículo designado
        // 🔒 LOCK BIOMÉTRICO: Exige token de confirmação biológica do hardware para assegurar o Não-Repúdio
        if (!dados_payload.biometria_aprovada_hardware) {
          await client.query('ROLLBACK');
          return res.status(401).json({
            success: false,
            code: "BIOMETRIC_AUTH_REQUIRED",
            error: "VIOLAÇÃO DE DIRETRIZ: Autenticação biométrica nativa do condutor é obrigatória para liberar a frota."
          });
        }
        await client.query(
          `UPDATE recicla_missoes 
           SET status_missao = 'T1_INICIO_MISSAO', biometria_confirmada_origem = true 
           WHERE uuid_missao = $1`, 
          [uuid_missao]
        );
        break;

      case 'T2_BALANCA_VAZIO': // Pesagem 1: Caminhão Vazio chega no Gerador (Aferição de Tara Inicial)
        await client.query(
          `UPDATE recicla_missoes 
           SET status_missao = 'T2_BALANCA_VAZIO', peso_1_tara_gerador = $1 
           WHERE uuid_missao = $2`,
          [dados_payload.peso_1, uuid_missao]
        );
        break;

      case 'T3_LOCAL_COLETA_CARGA': // Mínimo 2 fotos com carimbo espaço-tempo EXIF + Pesagem 2 + NF-e/MTR
        // 🔒 LOCK VISUAL: Valida se o canal móvel burro trouxe o contingente mínimo probatório de imagens
        if (!dados_payload.fotos_evidencia || dados_payload.fotos_evidencia.length < 2) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            success: false, 
            error: "FALHA PERICIAL: Mínimo de 2 fotografias atestando a natureza do lote é mandatório." 
          });
        }

        // Processamento hardcore das imagens enviadas pelo app agnóstico
        for (const foto of dados_payload.fotos_evidencia) {
          
          // 🚨 AUDITORIA GEOGRÁFICA DA IMAGEM: Cruzamento de coordenadas reais do cliente vs. foto
          const distanciaDoGerador = calcularDistanciaGeografica(
            parseFloat(missao.cliente_latitude || 0), parseFloat(missao.cliente_longitude || 0),
            parseFloat(foto.latitude), parseFloat(foto.longitude)
          );

          if (distanciaDoGerador > RAIO_MAXIMO_GERADOR_METROS) {
            await client.query(
              `UPDATE recicla_missoes SET status_missao = 'RETIDA_FRAUDE_VISUAL_LOCAL', elegivel_blockchain = false, status_auditoria = 'FOTO_FORA_DO_GERADOR' WHERE uuid_missao = $1`,
              [uuid_missao]
            );
            await client.query('COMMIT');
            return res.status(403).json({
              success: false,
              code: "FORENSIC_GEO_MISMATCH",
              error: `VETO DE AUDITORIA VISUAL: Foto capturada a ${distanciaDoGerador.toFixed(1)} metros do Gerador. Limite de 200m violado.`
            });
          }

          // 🚨 AUDITORIA CRONOLÓGICA DA IMAGEM: Validação do timestamp com segundos contra a criação da O.S.
          const timeFoto = new Date(foto.timestamp).getTime();
          const timeCriacaoOS = new Date(missao.data_criacao).getTime();
          if (timeFoto > Date.now() || timeFoto < timeCriacaoOS) {
            await client.query(
              `UPDATE recicla_missoes SET status_missao = 'RETIDA_FRAUDE_VISUAL_TEMPO', elegivel_blockchain = false, status_auditoria = 'TIMESTAMP_FOTO_INVALIDO' WHERE uuid_missao = $1`,
              [uuid_missao]
            );
            await client.query('COMMIT');
            return res.status(403).json({
              success: false,
              code: "FORENSIC_TIME_MISMATCH",
              error: "VETO DE AUDITORIA VISUAL: Timestamp embutido na imagem é inconsistente com a janela cronológica ativa da O.S."
            });
          }

          // Metadados periciais aprovados. Persiste na tabela de fé pública visual
          await client.query(
            `INSERT INTO recicla_missoes_evidencias (id_missao, step, hash_sha256, foto_latitude, foto_longitude, foto_timestamp) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [missao.id, foto.step, foto.hash_sha256, foto.latitude, foto.longitude, foto.timestamp]
          );
        }

        // Pesagem 2: Registro de Caminhão Cheio na Saída do Gerador + Atrelamento Fiscal (MTR e NF-e)
        await client.query(
          `UPDATE recicla_missoes 
           SET status_missao = 'T3_LOCAL_COLETA_CARGA', peso_2_bruto_gerador = $1, mtr_numero = $2, nfe_numero = $3 
           WHERE uuid_missao = $4`,
          [dados_payload.peso_2, dados_payload.mtr_numero, dados_payload.nfe_numero, uuid_missao]
        );
        break;

      case 'T4_TRANSPORTE_RESIDUO': // Início do trânsito assistido (GPS ativo coletando lat/long a cada 3 min)
        await client.query(`UPDATE recicla_missoes SET status_missao = 'T4_TRANSPORTE_RESIDUO' WHERE uuid_missao = $1`, [uuid_missao]);
        break;

      case 'T4_GATE_CONSOLIDADO_CHECK': // Pesagem 3: Chegada na Cooperativa/Consolidadora (Auditoria contra Cargas Clandestinas)
        const peso2SaidaGerador = parseFloat(missao.peso_2_bruto_gerador || 0);
        const peso3ChegadaDestino = parseFloat(dados_payload.peso_3 || 0);

        // 🚨 AUDITORIA GRAVIMÉTRICA DE TRÂNSITO: Verifica desvio ou enxerto de material na rodovia
        const deltaMassa = Math.abs(peso2SaidaGerador - peso3ChegadaDestino);
        const limiteAdmissivel = peso2SaidaGerador * MARGEM_EVAPORACAO_MAXIMA;

        if (deltaMassa > limiteAdmissivel) {
          await client.query(
            `UPDATE recicla_missoes SET status_missao = 'RETIDA_FRAUDE_MASSA', elegivel_blockchain = false, status_auditoria = 'DESQUALIFICADA_DELTA_PESO' WHERE uuid_missao = $1`,
            [uuid_missao]
          );
          await client.query('COMMIT');
          return res.status(403).json({
            success: false,
            code: "FRAUD_WEIGHT_DETECTED",
            error: `VETO DE BALANÇA: Divergência de ${deltaMassa} kg identificada na chegada. Excede limite físico de evaporação (${limiteAdmissivel.toFixed(1)} kg). Descarga bloqueada.`
          });
        }

        // 🚨 AUDITORIA DE TELEMETRIA: Verifica se o GPS em segundo plano capturou tempo parado anormal (parada clandestina)
        if (dados_payload.tempo_total_parado_segundos > LIMITE_TEMPO_PARADO_SEGUNDOS) {
          await client.query(
            `UPDATE recicla_missoes SET status_missao = 'RETIDA_FRAUDE_TELEMETRIA', elegivel_blockchain = false, status_auditoria = 'DESQUALIFICADA_STOP_GPS' WHERE uuid_missao = $1`,
            [uuid_missao]
          );
          // Incrementa índice relacional de conduta suspeita associado à ID estável do condutor
          await client.query(
            `UPDATE equipe_motoristas SET ocorrencias_suspeitas = ocorrencias_suspeitas + 1 WHERE id_motorista = $1`, 
            [id_motorista || missao.id_motorista]
          );
          await client.query('COMMIT');
          return res.status(403).json({
            success: false,
            code: "FRAUD_TELEMETRY_STOP",
            error: "VETO DE TELEMETRIA: Janela de tempo parado anormal fora do planejado identificada. Ancoragem na Blockchain revogada."
          });
        }

        // Passando pelas duas barreiras do trânsito, o servidor autoriza a moega a receber a carga Classe II
        await client.query(
          `UPDATE recicla_missoes SET status_missao = 'T5_PROCEDIMENTO_DESCARGA', peso_3_bruto_destino = $1 WHERE uuid_missao = $2`,
          [peso3ChegadaDestino, uuid_missao]
        );
        break;

      case 'T6_MISSAO_ENCERRADA': // Pesagem 4: Saída (Tara Final) da Consolidadora + Injeção de TTL de 48h
        const peso4TaraDestino = parseFloat(dados_payload.peso_4 || 0);
        
        // Finaliza o circuito relacional cravando a conformidade pericial total para processamento na Blockchain
        await client.query(
          `UPDATE recicla_missoes 
           SET status_missao = 'T6_MISSAO_ENCERRADA', peso_4_tara_destino = $1, status_auditoria = 'CONFORMIDADE_TOTAL', biometria_confirmada_destino = true 
           WHERE uuid_missao = $2`,
          [peso4TaraDestino, uuid_missao]
        );
        await client.query('COMMIT');

        // 🟢 HANDSHAKE COESIVO COM RETENÇÃO TEMPORIZADA (CONTA REGRESSIVA)
        // Em vez de forçar a destruição imediata, o servidor retorna as 48h (172800s) regulamentares 
        // para dar visibilidade ao motorista no pátio e mitigar atritos de conferência física instantânea.
        return res.status(200).json({
          success: true,
          code: "FILES_RECEIVED_OK",
          retencao_local_segundos: WINDOW_48H_RETENCAO_SEGUNDOS,
          message: "Circuito de custódia consolidado com Fé Pública. Autorizado congelamento read-only por 48 horas para fins de auditoria interna, seguido de extinção automática de cache."
        });

      default:
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: "Estado operacional desconhecido ou fora da matriz de portões." });
    }

    await client.query('COMMIT');
    return res.status(200).json({ success: true, estado_servidor_atualizado: proximo_estado });

  } catch (error: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};