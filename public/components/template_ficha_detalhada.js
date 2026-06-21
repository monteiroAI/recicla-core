// ## nome/caminho do arquivo: public/components/ficha_consolidadora.js
// ## data e versão: 20 de Junho de 2026 | v1.0.0
// ## objetivo do arquivo: Componente modular reutilizável para renderização da Ficha Detalhe A4 de Entidades no mrvTRUST.
// ## comentarios: Desenvolvido em ES6 Modules para isolar CSS corporativo e permitir customização dinâmica por Vertical.

export function gerarTemplateFicha(ente) {
    // Estilos injetados dinamicamente para não poluir o arquivo principal do Dashboard
    const estilos = `
        <style>
            .ficha-container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                background: #ffffff;
                color: #2d3748;
                font-family: 'Segoe UI', system-ui, Arial, sans-serif;
                font-size: 13px;
                line-height: 1.4;
                padding: 20px;
                box-sizing: border-box;
            }
            .ficha-header {
                border-bottom: 2px solid var(--gov-blue, #2563eb);
                padding-bottom: 10px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .ficha-header h2 {
                font-size: 18px;
                color: var(--gov-blue, #2563eb);
                margin: 0;
                text-transform: uppercase;
                font-weight: 700;
            }
            .selo-trust-badge {
                background: rgba(37, 99, 235, 0.08);
                color: var(--gov-blue, #2563eb);
                border: 1px solid rgba(37, 99, 235, 0.2);
                padding: 4px 8px;
                font-size: 11px;
                font-weight: bold;
                border-radius: 4px;
                text-transform: uppercase;
            }
            .ficha-section { margin-bottom: 15px; }
            .section-title-bar {
                font-size: 11px;
                font-weight: 700;
                color: #4a5568;
                background: #edf2f7;
                padding: 4px 8px;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-radius: 4px;
            }
            .grid-dados-ficha {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                padding: 0 5px;
            }
            .dado-bloco { display: flex; flex-direction: column; }
            .dado-bloco.span-2 { grid-column: span 2; }
            .dado-bloco.span-4 { grid-column: span 4; }
            .dado-label-txt { font-size: 9px; text-transform: uppercase; color: #718096; font-weight: 600; margin-bottom: 2px; }
            .dado-valor-txt { font-size: 13px; font-weight: 500; color: #1a202c; }
            .ficha-table-forense { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .ficha-table-forense th { background: #f7fafc; color: #4a5568; font-size: 10px; text-transform: uppercase; font-weight: 600; text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
            .ficha-table-forense td { padding: 6px 8px; font-size: 12px; border-bottom: 1px solid #edf2f7; color: #2d3748; }
            .badge-equip-item { display: inline-block; background: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 5px; margin-bottom: 5px; font-weight: 500; }
            .badge-equip-item.ausente { background: #fff5f5; color: #742a2a; border: 1px solid #fed7d7; }
        </style>
    `;

    // Converte os arrays de equipamentos e histórico em elementos HTML estruturados
    const listaEquipamentos = ente.equipamentos ? ente.equipamentos.map(eq => {
        const isDisponivel = !eq.startsWith('✗');
        return `<span class="badge-equip-item ${isDisponivel ? '' : 'ausente'}">${eq}</span>`;
    }).join('') : 'Nenhum equipamento cadastrado.';

    const linhasHistorico = ente.historico ? ente.historico.map(h => `
        <tr>
            <td><b>${h.mes}</b></td>
            <td>${h.plasticos}</td>
            <td>${h.papelao}</td>
            <td>${h.metais}</td>
            <td>${h.vidro}</td>
            <td style="color: ${h.status.includes('✓') ? '#2ecc71' : '#f39c12'}; font-weight: bold;">${h.status}</td>
        </tr>
    `).join('') : '<tr><td colspan="6">Sem dados históricos de balanço de massa.</td></tr>';

    return `
        ${estilos}
        <div class="ficha-container">
            <div class="ficha-header">
                <div>
                    <h2>Ficha de Detalhe da Consolidadora</h2>
                    <span style="font-size: 11px; color: #718096;">ID Registro mrvTRUST: ${ente.id}</span>
                </div>
                <div class="selo-trust-badge">mrvTRUST Verified Node</div>
            </div>

            <div class="ficha-section">
                <div class="section-title-bar">1. Identificação Legal e Contato</div>
                <div class="grid-dados-ficha">
                    <div class="dado-bloco span-2">
                        <span class="dado-label-txt">Razão Social</span>
                        <span class="dado-valor-txt">${ente.nome}</span>
                    </div>
                    <div class="dado-bloco span-2">
                        <span class="dado-label-txt">CNPJ</span>
                        <span class="dado-valor-txt">${ente.cnpj}</span>
                    </div>
                    <div class="dado-bloco span-4">
                        <span class="dado-label-txt">Endereço Operacional Homologado</span>
                        <span class="dado-valor-txt">${ente.endereco}</span>
                    </div>
                    <div class="dado-bloco">
                        <span class="dado-label-txt">Telefone</span>
                        <span class="dado-valor-txt">${ente.telefone}</span>
                    </div>
                    <div class="dado-bloco span-2">
                        <span class="dado-label-txt">E-mail de Contato</span>
                        <span class="dado-valor-txt">${ente.email}</span>
                    </div>
                    <div class="dado-bloco">
                        <span class="dado-label-txt">Natureza Jurídica</span>
                        <span class="dado-valor-txt">${ente.natureza}</span>
                    </div>
                </div>
            </div>

            <div class="ficha-section">
                <div class="section-title-bar">2. Governança e Capital Humano</div>
                <div class="grid-dados-ficha">
                    <div class="dado-bloco span-2">
                        <span class="dado-label-txt">Nome do Administrador / Presidente</span>
                        <span class="dado-valor-txt">${ente.administrador}</span>
                    </div>
                    <div class="dado-bloco">
                        <span class="dado-label-txt">Efectivo Feminino</span>
                        <span class="dado-valor-txt">${ente.mulheres} operadoras</span>
                    </div>
                    <div class="dado-bloco">
                        <span class="dado-label-txt">Efectivo Masculino</span>
                        <span class="dado-valor-txt">${ente.homens} operadores</span>
                    </div>
                </div>
            </div>

            <div class="ficha-section">
                <div class="section-title-bar">3. Infraestrutura Operacional e Ativos Principais</div>
                <div style="padding: 5px 5px 0 5px;">
                    ${listaEquipamentos}
                </div>
            </div>

            <div class="ficha-section">
                <div class="section-title-bar">4. Histórico de Comercialização - Matéria-Secunda (Quadrimestre)</div>
                <table class="ficha-table-forense">
                    <thead>
                        <tr>
                            <th>Período</th>
                            <th>Plásticos (T)</th>
                            <th>Papel/Papelão (T)</th>
                            <th>Metais (T)</th>
                            <th>Vidro (T)</th>
                            <th>Status do Manifesto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasHistorico}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}