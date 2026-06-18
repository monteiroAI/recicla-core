async function getSankeyMetrics() {
  const grandesGeradores = await obterMassaGrandesGeradores();
  const city = await obterMassaVerticalCity();
  const zeladoria = await obterMassaZeladoriaMunicipal();
  const catadoresM2a = await obterMassaCooperativaCatadores();

  const totalInertesEsteira = grandesGeradores.inertes + city.coleta_domiciliar_inertes + zeladoria.varricao_inertes;
  const taxaRecuperacaoCoef = 0.78;
  const totalInertesRecuperadosEsteira = totalInertesEsteira * taxaRecuperacaoCoef;
  const totalRejeitos = totalInertesEsteira * (1 - taxaRecuperacaoCoef);

  const papelaoEsteira = totalInertesRecuperadosEsteira * 0.79;
  const metaisEsteira = totalInertesRecuperadosEsteira * 0.09;
  const aluminioEsteira = totalInertesRecuperadosEsteira * 0.05;
  const pebdEsteira = totalInertesRecuperadosEsteira * 0.03;
  const petEsteira = totalInertesRecuperadosEsteira * 0.04;

  const papelaoConsolidado = papelaoEsteira + catadoresM2a.papelao_direto;
  const aluminioConsolidado = aluminioEsteira + catadoresM2a.aluminio_direto;
  const petConsolidado = petEsteira + catadoresM2a.pet_direto;
  const totalOrganicosCompostados = grandesGeradores.organicos + city.coleta_domiciliar_organicos + zeladoria.podas_organicos;
    
  const mTotal = totalInertesEsteira + catadoresM2a.papelao_direto + catadoresM2a.aluminio_direto + catadoresM2a.pet_direto + totalOrganicosCompostados;

  return {
    schema: "simulation",
    documental_compliance: { mtr_status: "AUDITADO_LOCAL", sefaz_handshake: "READY" },
    estatisticas: {
      massa_total: mTotal,
      taxa_recuperacao: 78,
      taxa_rejeito: 22,
      co2_evitado_total: mTotal * 2.45,
      produtividade_climatica: 0.41
    },
    fluxos: [
      ["Coleta Domiciliar Municipal", "Triagem e Classificação", city.coleta_domiciliar_inertes],
      ["Zeladoria Pública (Varrição)", "Triagem e Classificação", zeladoria.varricao_inertes],
      ["Grandes Geradores", "Triagem e Classificação", grandesGeradores.inertes],
      ["Catadores (via M2a)", "Papelão Ondulado", catadoresM2a.papelao_direto],
      ["Catadores (via M2a)", "Alumínio Premium", catadoresM2a.aluminio_direto],
      ["Catadores (via M2a)", "PET Cristal Premium", catadoresM2a.pet_direto],
      ["Triagem e Classificação", "Papelão Ondulado", papelaoEsteira],
      ["Triagem e Classificação", "Metais Ferrosos", metaisEsteira],
      ["Triagem e Classificação", "Alumínio Premium", aluminioEsteira],
      ["Triagem e Classificação", "PEBD Industrial", pebdEsteira],
      ["Triagem e Classificação", "PET Cristal Premium", petEsteira],
      ["Triagem e Classificação", "Caixa de Rejeitos (Aterro)", totalRejeitos],
      ["Coleta Domiciliar Municipal (Orgânicos)", "Pátio de Compostagem", city.coleta_domiciliar_organicos],
      ["Zeladoria Pública (Podas)", "Pátio de Compostagem", zeladoria.podas_organicos],
      ["Grandes Geradores (Orgânicos)", "Pátio de Compostagem", grandesGeradores.organicos],
      ["Pátio de Compostagem", "Composto Orgânico Concluído", totalOrganicosCompostados]
    ],
    deposito_materia_secunda: [
      { material: "Papelão Ondulado", peso: `${papelaoConsolidado.toFixed(2)} t`, cor: "#3498db" },
      { material: "Metais Ferrosos", peso: `${metaisEsteira.toFixed(2)} t`, cor: "#95a5a6" },
      { material: "Alumínio Premium", peso: `${aluminioConsolidado.toFixed(2)} t`, cor: "#f1c40f" },
      { material: "PEBD Industrial", peso: `${pebdEsteira.toFixed(2)} t`, cor: "#9b59b6" },
      { material: "PET Cristal Premium", peso: `${petConsolidado.toFixed(2)} t`, cor: "#1abc9c" },
      { material: "Composto Orgânico", peso: `${totalOrganicosCompostados.toFixed(2)} t`, cor: "#27ae60" },
      { material: "Caixa de Rejeitos", peso: `${totalRejeitos.toFixed(2)} t`, cor: "#e74c3c", isRejeito: true }
    ],
    
    // PAYLOAD EXPANDIDO PARA DETALHAMENTO FORENSE
    mission_control: [
      { 
        id: "MS-2026-001", 
        gerador: "Shopping Plaza Central", 
        material: "Sólidos Inertes - Classe III", 
        massa: 2.00, 
        status: "CONCLUÍDA", 
        mtr: "MTR-260101",
        os: "OS-88941",
        data: "18/06/2026",
        horario: "10:14:22",
        motorista: "Carlos Silva (ID: 441)",
        veiculo: "Caminhão Poliguindaste - Placa REC-2641",
        percurso: "Rota Expressa Zona Sul -> Pátio Central",
        evidencia_hash: "SHA256: 8f9a2c...b3e1"
      },
      { 
        id: "MS-2026-002", 
        gerador: "Indústria Metalúrgica Alfa", 
        material: "Sólidos Inertes - Classe III", 
        massa: 1.00, 
        status: "CONCLUÍDA", 
        mtr: "MTR-260102",
        os: "OS-88942",
        data: "18/06/2026",
        horario: "11:30:00",
        motorista: "Marcos Souza (ID: 102)",
        veiculo: "Caminhão Roll-On - Placa MAT-9912",
        percurso: "Distrito Industrial -> Pátio Central",
        evidencia_hash: "SHA256: 4a7e1d...c9f2"
      },
      { 
        id: "MS-2026-003", 
        gerador: "Supermercado Nova Esperança", 
        material: "Biomassa Orgânica Úmida", 
        massa: 1.30, 
        status: "CONCLUÍDA", 
        mtr: "MTR-260106",
        os: "OS-88945",
        data: "18/06/2026",
        horario: "08:45:10",
        motorista: "Ana Oliveira (ID: 312)",
        veiculo: "Compactador Urbano - Placa ORG-4451",
        percurso: "Filial Centro -> Pátio Compostagem",
        evidencia_hash: "SHA256: 1c9b3e...a8d4"
      }
    ]
  };
}