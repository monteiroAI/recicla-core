# 🗂️ recycle Core — Quadro Geral de Backlog e Próximos Passos
... (Conteúdo cronológico acima incorporado com sucesso) ...
# 🗂️ recycle Core — Quadro Geral de Backlog e Próximos Passos

Este documento gerencia o estado da arte do desenvolvimento do motor `recycle`. Nenhuma tarefa se perde. O progresso é cumulativo, temporal e imutável.

---

## 🏃‍♂️ EM EXECUÇÃO (Foco Atual / Engatilhados)

### 📊 ITEM 01: Simetria de Documentação Viva das Verticais
* **Data de Geração:** 11/06/2026 (11:30h)
* **Status:** 🟢 100% CONCLUÍDO (Entregue em 11/06/2026 - 12:10h)
* **Ação Executada:** Mudança de `regras_negocio.md` para `city_business_rules.md` na pasta `src/modules/city/docs/`.
* **Resultado:** Chão 100% simétrico e em inglês técnico (`corp_business_rules.md` e `city_business_rules.md`).

### 🏢 ITEM 02: Adaptação das Rotas do Servidor (`server.ts`) para o Fluxo B2B
* **Data de Geração:** 11/06/2026 (12:00h)
* **Status:** 🟡 ENGATILHADO (Pronto para Codificar)
* **Objetivo:** Ajustar e expandir os contratos das rotas do Express para aceitar o encadeamento rigoroso exposto nas regras de negócio da vertical `corp`: `Service Order` ➔ `Mission` ➔ `Voyage`.
* **Próximo Passo Físico:** Abrir `src/gateway-api/server.ts` e refatorar as rotas `/api/corp/*`.

### 🧪 ITEM 03: Teste de Carga e Ingestão Física via `curl`
* **Data de Geração:** 10/06/2026 (18:15h)
* **Status:** ⚪ PENDENTE (Aguardando Item 02)
* **Objetivo:** Disparar os comandos de terminal simulando o hardware IoT enviando dados de balança rodoviária, GPS e o UUID das Missões para validar as restrições e os logs do Express.

---

## 🗓️ BACKLOG PRIORIZADO (Próximas Sprints)

### 🏢 Vertical `corp` (Grandes Geradores / Prioridade Madura B2B)
* **Data de Geração:** 11/06/2026 (12:35h)
* [ ] Modelar no banco o encadeamento relacional estrito das chaves estrangeiras entre tabelas corporativas.
* [ ] Integrar no core a escuta assíncrona para validação de XMLs fiscais e canhotos digitais da SEFAZ/SINIR.
* [ ] Desenhar os contratos de interface do `corpMobile` para aceites de Missão pelo motorista.

### 🏛️ Vertical `city` (Governança Pública)
* **Data de Geração:** 11/06/2026 (11:15h)
* [ ] Desenhar o modelo da tabela de mapeamento de cercas geográficas (`Geofencing`).
* [ ] Escrever o algoritmo analítico de Medição por Exclusão para flagrar o *by-pass* (desvio de recicláveis/orgânicos para Aterro Sanitário).
* [ ] Mapear os contratos dos Dashboards macro municipais (`City Overall Dashboard`).

### 🔄 Vertical `keeper` (Inclusão e Catadores)
* **Data de Geração:** 11/06/2026 (10:50h)
* [ ] Criar o arquivo de documentação viva `keeper_business_rules.md`.
* [ ] Mapear a esteira de micro-coleta difusa e validação de peso por câmeras/OCR móvel.
* [ ] Desenhar a lógica do barramento de liquidação financeira e repasse via Pix direto para o Catador.

### 📦 Módulo `consolidation` (O Hub Transversal)
* **Data de Geração:** 10/06/2026 (16:30h)
* [ ] Estruturar a equação matemática unificada que cruza os dados do Gate Check-in com as esteiras de triagem das cooperativas.