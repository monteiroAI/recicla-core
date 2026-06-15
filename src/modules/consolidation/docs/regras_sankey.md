# 🔀 Regras de Negócio e Arquitetura do Diagrama de Sankey

## 1. Classificação de Canais de Ingestão (Origens)
Agrupamento estrito no bloco à esquerda para evitar saturação visual.

### 1.1 Canal Matéria-Secunda (Recicláveis Secos)
* **`Catadores e Catadoras`**: Material pré-segregado. **Sofre BYPASS (pula a Triagem Central)** e conecta direto ao Output de materiais.
* **`Coleta Pública Domiciliar`**: Encaminhado estritamente para a **Triagem Central**.
* **`Zeladoria Municipal`**: Encaminhado estritamente para a **Triagem Central**.
* **`Grandes Geradores`**: Encaminhado estritamente para a **Triagem Central**.

### 1.2 Canal Composto-Orgânico (Resíduos Orgânicos)
* **`Coleta Própria`** / **`Coleta Pública (Orgânica)`** / **`Zeladoria (Orgânica)`**: Encaminhados para o nó central **Compostagem (Pátio)**.

## 2. Topologia Horizontal do Fluxo (Esquerda para Direita)
* **Nível Secos:** [Canais Ingestão] ➔ (Bypass Catadores / Triagem Esteira) ➔ [Outputs: Metal, Plásticos, Papel/Papelão, Vidro, Rejeitos]
* **Nível Orgânicos:** [Canais Ingestão] ➔ (Processo Compostagem) ➔ [Output: Composto Orgânico]

## 3. Regra Temporal e Governança Dinâmica (Janela de Competência)
* **Mês de Competência:** Inicia-se de forma descalada no **dia 26** do mês M-1 e encerra-se no **dia 25** do mês M.
* **Comportamento do Sankey:** O gráfico sofre um *hard reset* contábil na virada da janela. Ele é estritamente mensal e dinâmico.
* **Comportamento dos Cards (KPIs):** Mantêm o acumulado métrico anual **YTD (Year-To-Date)** e calculam o indicador de **Potencial CO₂ Evitado** acoplado a cada massa de material físico sob custódia.