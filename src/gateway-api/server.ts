// Alvo dinâmico da API mapeada no server.ts
const API_URL = 'http://localhost:3000/api/v1/metrics/sankey';

async function carregarDadosSankey() {
    try {
        console.log(`[Dashboard] Solicitando métricas ao servidor: ${API_URL}`);
        
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Dashboard] Dados periciais recebidos com sucesso:', data);

        // Validação do Schema Simulation
        if (!data.nodes || data.nodes.length === 0 || !data.links || data.links.length === 0) {
            console.warn('[Dashboard] Atenção: O schema "simulation" retornou nós ou links vazios para a janela móvel.');
            exibirAvisoJanelaVazia();
            return;
        }

        // Chamar a função que injeta os dados no chart (Google Charts, D3, Highcharts, etc.)
        renderizarGraficoSankey(data);

    } catch (error) {
        console.error('[Dashboard] Falha crítica ao consumir a esteira de Analytics:', error);
        exibirStatusErroTela(error.message);
    }
}

// Executar automaticamente ao carregar a página
document.addEventListener('DOMContentLoaded', carregarDadosSankey);